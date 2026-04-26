import { SIMULATION_SETTINGS } from "../config/defaults";
import { EDUCATION_PATTERNS } from "../config/referenceData";
import type {
  ChildCostInput,
  ChildLifeCostRange,
  EducationChartDatum,
  ScenarioInputs,
  ScenarioStatus,
  SimulationKpi,
  SimulationResult,
  YearAdjustment,
  YearlySimulationRow
} from "../types";
import { calculateSharedCost, estimateTakeHome, parseAmount } from "./calculations";

type EducationCostBreakdown = {
  total: number;
  childCosts: number[];
};

type LifeEventBreakdown = {
  amount: number;
  details: Array<{ name: string; amount: number }>;
};

type ResolvedHouseholdIncome = {
  userIncome: number;
  spouseIncome: number;
  userBonus: number;
  spouseBonus: number;
  grossIncome: number;
  takeHomeIncome: number;
};

/**
 * 保存済みシナリオ入力から、結果画面で使う年次推移・グラフ・KPIをまとめて算出する。
 *
 * 画面ごとに別計算を持たせると表示ごとに数値がずれるため、
 * ここを唯一の年次シミュレーション入口として扱う。
 */
export function calculateSimulation(inputs: ScenarioInputs): SimulationResult {
  const yearlyRows = calculateYearlyRows(inputs);
  const assetChartData = yearlyRows.map((row) => ({
    year: row.year,
    withInvestment: row.totalAsset,
    withoutInvestment: row.totalAssetWithoutInvestment,
    age: row.userAge
  }));
  const educationChartData = yearlyRows.map((row) => {
    const breakdown = calculateEducationCostByYear(inputs.childCost, row.year, inputs);
    return {
      year: row.year,
      total: breakdown.total,
      child1: breakdown.childCosts[0] ?? 0,
      child2: breakdown.childCosts[1] ?? 0,
      child3: breakdown.childCosts[2] ?? 0,
      child4: breakdown.childCosts[3] ?? 0
    } satisfies EducationChartDatum;
  });

  return {
    yearlyRows,
    assetChartData,
    educationChartData,
    kpi: calculateKpi(yearlyRows)
  };
}

/**
 * 1年ごとの収入・支出・投資・資産残高を計算する。
 *
 * 計算順序は必ず以下で揃える。
 * 1. その年の手取り収入と追加収入を確定する
 * 2. 基本支出・教育費・ライフイベント費を合算する
 * 3. 余剰資金を求める
 * 4. 余剰の範囲で投資し、残りを現金貯蓄へ回す
 * 5. 年末時点の現金残高・投資残高を更新する
 *
 * この順序を固定することで、年次表・グラフ・KPIで同じ数字を参照できるようにする。
 */
export function calculateYearlyRows(inputs: ScenarioInputs): YearlySimulationRow[] {
  const rows: YearlySimulationRow[] = [];
  const baseYear = SIMULATION_SETTINGS.baseYear;
  const projectionYears = Math.max(SIMULATION_SETTINGS.projectionYears, 25);
  const baseUserAge = parseAmount(inputs.basic.userAge);
  const baseSpouseAge = parseAmount(inputs.basic.spouseAge);
  const annualReturnRate = parseAmount(inputs.investment.expectedReturn) / 100;
  const defaultBaseExpense =
    (parseAmount(inputs.household.livingExpenses) +
      parseAmount(inputs.household.housingCost) +
      parseAmount(inputs.household.fixedCosts)) * 12;

  let cashBalance = 0;
  let investmentBalance = 0;
  let cashOnlyBalance = 0;

  for (let index = 0; index < projectionYears; index++) {
    const year = baseYear + index;
    const adjustment = findYearAdjustment(inputs.yearAdjustments, year);
    const householdIncome = resolveHouseholdIncome(inputs, adjustment);
    const annualIncomeDetails = buildAnnualIncomeDetails(inputs, year, adjustment);
    const annualIncome = annualIncomeDetails.reduce((sum, income) => sum + income.amount, 0);
    const totalIncome = householdIncome.takeHomeIncome + annualIncome;
    const baseExpense = adjustment?.baseExpense ? parseAmount(adjustment.baseExpense) : defaultBaseExpense;
    const educationCost = calculateEducationCostByYear(inputs.childCost, year, inputs).total;
    const { amount: lifeEventCost, details: lifeEventDetails } = calculateLifeEventCostByYear(inputs, year);
    const totalExpense = baseExpense + educationCost + lifeEventCost;

    // 年間余剰は「投資前」のキャッシュフロー。ここが年次表・KPIの共通基準になる。
    const surplusBeforeInvestment = totalIncome - totalExpense;
    const targetInvestmentAmount = calculateAnnualInvestmentAmount(inputs, surplusBeforeInvestment);

    // 投資は余剰の範囲内でのみ実行し、赤字年に追加で投資して数値が破綻しないようにする。
    const investmentAmount = Math.min(Math.max(surplusBeforeInvestment, 0), targetInvestmentAmount);

    // 投資後に現金へ残る分は貯蓄、足りない分は現金残高の取り崩しとして扱う。
    const cashBalanceChange = surplusBeforeInvestment - investmentAmount;
    const savingsAmount = Math.max(cashBalanceChange, 0);
    const withdrawalAmount = Math.max(-cashBalanceChange, 0);

    cashBalance += cashBalanceChange;
    investmentBalance = Math.floor(investmentBalance * (1 + annualReturnRate) + investmentAmount);

    // 比較用の「貯蓄のみケース」でも赤字年はそのまま反映し、投資ケースとの差分を正しく比較する。
    cashOnlyBalance += surplusBeforeInvestment;

    rows.push({
      year,
      userAge: baseUserAge + index,
      spouseAge: baseSpouseAge > 0 ? baseSpouseAge + index : undefined,
      userIncome: householdIncome.userIncome,
      spouseIncome: householdIncome.spouseIncome,
      userBonus: householdIncome.userBonus,
      spouseBonus: householdIncome.spouseBonus,
      grossIncome: householdIncome.grossIncome,
      takeHomeIncome: householdIncome.takeHomeIncome,
      annualIncome,
      totalIncome,
      baseExpense,
      educationCost,
      lifeEventCost,
      totalExpense,
      investmentAmount,
      savingsAmount,
      withdrawalAmount,
      cashBalanceChange,
      surplusBeforeInvestment,
      cashBalance,
      investmentBalance,
      totalAsset: cashBalance + investmentBalance,
      totalAssetWithoutInvestment: cashOnlyBalance,
      isDeficit: surplusBeforeInvestment < 0,
      eventNames: lifeEventDetails.map((event) => event.name),
      lifeEventDetails,
      annualIncomeDetails,
      targetInvestmentAmount,
      isInvestmentReduced: investmentAmount < targetInvestmentAmount,
      adjustmentMemo: adjustment?.memo
    });
  }

  return rows;
}

/**
 * 指定年に適用される年次調整を返す。
 */
function findYearAdjustment(adjustments: YearAdjustment[] | undefined, year: number) {
  return adjustments?.find((item) => item.year === year);
}

/**
 * 年次調整を加味した、その年の世帯年収と手取りを解決する。
 *
 * 年次編集モーダルで入力した値をここへ集約することで、
 * モーダル表示・年次表・結果画面で同じ年収を共有できる。
 */
function resolveHouseholdIncome(inputs: ScenarioInputs, adjustment?: YearAdjustment): ResolvedHouseholdIncome {
  const userIncome = parseAmount(adjustment?.userIncome ?? inputs.household.userIncome);
  const spouseIncome = parseAmount(adjustment?.spouseIncome ?? inputs.household.spouseIncome);
  const userBonus = parseAmount(adjustment?.userBonus ?? inputs.household.userBonus);
  const spouseBonus = parseAmount(adjustment?.spouseBonus ?? inputs.household.spouseBonus);
  const grossIncome = userIncome + spouseIncome + userBonus + spouseBonus;
  const takeHomeIncome =
    estimateTakeHome(userIncome + userBonus) +
    estimateTakeHome(spouseIncome + spouseBonus);

  return {
    userIncome,
    spouseIncome,
    userBonus,
    spouseBonus,
    grossIncome,
    takeHomeIncome
  };
}

/**
 * 指定年に発生する年次追加収入を合計する。
 */
export function calculateAnnualIncomeByYear(inputs: ScenarioInputs, year: number): number {
  return buildAnnualIncomeDetails(inputs, year).reduce((sum, income) => sum + income.amount, 0);
}

/**
 * 指定年に発生する追加収入の内訳を返す。
 *
 * 追加収入と収入減少を同じ配列で扱うことで、画面表示と合計計算を一致させる。
 */
function buildAnnualIncomeDetails(inputs: ScenarioInputs, year: number, adjustment?: YearAdjustment) {
  const details = inputs.household.annualIncomes.flatMap((income) => {
    const startYear = parseAmount(income.year);
    const duration = Math.max(1, parseAmount(income.duration));
    const isActive = income.durationType === "single"
      ? startYear === year
      : year >= startYear && year < startYear + duration;

    return isActive ? [{ name: income.name || "追加収入", amount: parseAmount(income.amount) }] : [];
  });

  const additionalIncome = parseAmount(adjustment?.additionalIncome ?? "0");
  const incomeReduction = parseAmount(adjustment?.incomeReduction ?? "0");
  if (additionalIncome > 0) details.push({ name: "年次調整: 追加収入", amount: additionalIncome });
  if (incomeReduction > 0) details.push({ name: "年次調整: 収入減少", amount: -incomeReduction });

  return details;
}

/**
 * 指定年に発生するライフイベント支出を合計する。
 *
 * 一括払いとローン払いを同じ年次支出へ落とし込み、年次表で内訳も確認できるようにする。
 */
export function calculateLifeEventCostByYear(inputs: ScenarioInputs, year: number): LifeEventBreakdown {
  return inputs.lifeEvents.reduce<LifeEventBreakdown>(
    (result, event) => {
      const amount = calculateLifeEventAmountForYear(event, year);
      if (amount <= 0) return result;
      return {
        amount: result.amount + amount,
        details: event.name ? [...result.details, { name: event.name, amount }] : result.details
      };
    },
    { amount: 0, details: [] }
  );
}

/**
 * 一括払いまたはローン払いのライフイベント金額を、指定年に配賦する。
 *
 * ローンは「頭金 + その年の返済額」を開始年に計上し、2年目以降は返済額のみを計上する。
 */
function calculateLifeEventAmountForYear(event: ScenarioInputs["lifeEvents"][number], year: number): number {
  if ((event.paymentType ?? "lump") === "lump") {
    return parseAmount(event.year) === year ? parseAmount(event.amount) : 0;
  }

  const startYear = parseAmount(event.loanStartYear || event.year);
  const years = Math.max(1, parseAmount(event.loanYears || "1"));
  const endYear = startYear + years - 1;
  const downPayment = parseAmount(event.loanDownPayment || "0");
  const principal = parseAmount(event.loanAmount || event.amount);
  const rate = parseAmount(event.loanRate || "0") / 100;

  if (year < startYear || year > endYear) return 0;

  const annualPayment = rate <= 0
    ? Math.floor(principal / years)
    : calculateAnnualLoanPayment(principal, rate, years);

  return year === startYear ? downPayment + annualPayment : annualPayment;
}

/**
 * 元利均等返済の概算年間返済額を算出する。
 *
 * 月次返済をいったん求め、年換算へ戻すことでローン入力と年次表をつなぐ。
 */
function calculateAnnualLoanPayment(principal: number, annualRate: number, years: number): number {
  const monthlyRate = annualRate / 12;
  const months = years * 12;
  const numerator = principal * monthlyRate * Math.pow(1 + monthlyRate, months);
  const denominator = Math.pow(1 + monthlyRate, months) - 1;
  const monthlyPayment = numerator / denominator;
  return Math.floor(monthlyPayment * 12);
}

/**
 * 指定年の子ども関連費を子ども別に計算する。
 *
 * 第1子は基準年に0歳、第2子以降は年齢差ごとに生まれる前提で年齢を求める。
 */
export function calculateEducationCostByYear(
  childCost: ChildCostInput,
  year: number,
  inputs: ScenarioInputs
): EducationCostBreakdown {
  const childrenCount = Math.min(4, parseAmount(inputs.basic.childrenCount));
  const ageDifference = Math.max(1, parseAmount(inputs.basic.ageDifference) || 3);
  const childCosts = Array.from({ length: childrenCount }, (_, index) => {
    const birthYear = resolveChildBirthYear(inputs, index, ageDifference);
    const age = year - birthYear;
    if (age < 0 || age > 21) return 0;
    return calculateChildAnnualCost(childCost, age, index);
  });

  return {
    total: childCosts.reduce((sum, cost) => sum + cost, 0),
    childCosts
  };
}

/**
 * 指定した子どもの基準年時点の生年を解決する。
 *
 * 既存の子どもがいる場合は、プロフィールで入力された第1子の現在年齢を起点に
 * 年齢差から兄弟姉妹の概算年齢を求める。まだ生まれていない将来の子どもは、
 * 基準年以降に誕生する前提で年齢をマイナスとして扱う。
 */
function resolveChildBirthYear(inputs: ScenarioInputs, childIndex: number, ageDifference: number): number {
  const profileSnapshot = inputs.profileSnapshot;
  const currentChildren = Math.min(4, parseAmount(profileSnapshot?.currentChildren || "0"));
  const firstChildAge = parseAmount(profileSnapshot?.child1Age || "0");
  const secondChildAge = parseAmount(profileSnapshot?.child2Age || "0");

  // 現在子どもがいないケースは、従来どおり基準年から順に生まれる前提を使う。
  if (currentChildren <= 0 || firstChildAge <= 0) {
    return SIMULATION_SETTINGS.baseYear + childIndex * ageDifference;
  }

  if (childIndex === 0) {
    return SIMULATION_SETTINGS.baseYear - firstChildAge;
  }

  if (childIndex === 1 && currentChildren >= 2 && secondChildAge > 0) {
    return SIMULATION_SETTINGS.baseYear - secondChildAge;
  }

  // 現在いる子どもは、個別年齢が未入力なら第1子から年齢差分だけ若い前提で基準年時点の年齢を求める。
  if (childIndex < currentChildren) {
    const childAgeAtBaseYear = Math.max(firstChildAge - childIndex * ageDifference, 0);
    return SIMULATION_SETTINGS.baseYear - childAgeAtBaseYear;
  }

  // 将来予定の子どもは、基準年以降に ageDifference 年ごとに生まれる前提とする。
  return SIMULATION_SETTINGS.baseYear + (childIndex - currentChildren + 1) * ageDifference;
}

/**
 * 子ども1人分の年齢別年間費用を計算する。
 *
 * 学校区分ごとの教育費に、日常生活費・イベント費を加算して年額を作る。
 */
function calculateChildAnnualCost(childCost: ChildCostInput, age: number, childIndex: number): number {
  const isFirstChild = childIndex === 0;
  const patternKey = isFirstChild ? childCost.child1Pattern : childCost.child2Pattern;
  const pattern = EDUCATION_PATTERNS[patternKey as keyof typeof EDUCATION_PATTERNS] ?? EDUCATION_PATTERNS["public-private-univ"];
  const educationValues = isFirstChild
    ? {
        preschool: parseAmount(childCost.child1Preschool) || pattern.preschool,
        elementary: parseAmount(childCost.child1Elementary) || pattern.elementary,
        juniorHigh: parseAmount(childCost.child1JuniorHigh) || pattern.juniorHigh,
        highSchool: parseAmount(childCost.child1HighSchool) || pattern.highSchool,
        university: parseAmount(childCost.child1University) || pattern.university,
        cram: parseAmount(childCost.child1Cram) || pattern.cram
      }
    : {
        preschool: parseAmount(childCost.child2Preschool) || pattern.preschool,
        elementary: parseAmount(childCost.child2Elementary) || pattern.elementary,
        juniorHigh: parseAmount(childCost.child2JuniorHigh) || pattern.juniorHigh,
        highSchool: parseAmount(childCost.child2HighSchool) || pattern.highSchool,
        university: parseAmount(childCost.child2University) || pattern.university,
        cram: parseAmount(childCost.child2Cram) || pattern.cram
      };
  const { living, events } = calculateChildLifeCost(childCost, age, isFirstChild);

  let annualCost = living + events;
  if (age <= 5) annualCost += educationValues.preschool;
  if (age >= 6 && age <= 11) annualCost += educationValues.elementary + educationValues.cram;
  if (age >= 12 && age <= 14) annualCost += educationValues.juniorHigh + educationValues.cram;
  if (age >= 15 && age <= 17) annualCost += educationValues.highSchool + educationValues.cram;
  if (age >= 18 && age <= 21) annualCost += educationValues.university;

  return annualCost;
}

/**
 * 子どもの生活費・イベント費を、簡易設定または年齢範囲別詳細設定から取得する。
 */
function calculateChildLifeCost(childCost: ChildCostInput, age: number, isFirstChild: boolean) {
  if (isFirstChild && childCost.child1UseDetailedLifeCosts) {
    return findLifeCostByAge(
      childCost.child1LifeCostRanges ?? [],
      age,
      parseAmount(childCost.child1Living),
      parseAmount(childCost.child1Events)
    );
  }

  if (!isFirstChild && childCost.child2UseDetailedLifeCosts) {
    return findLifeCostByAge(
      childCost.child2LifeCostRanges ?? [],
      age,
      calculateSharedCost(parseAmount(childCost.child1Living), parseAmount(childCost.child2LivingRate)),
      calculateSharedCost(parseAmount(childCost.child1Events), parseAmount(childCost.child2EventsRate))
    );
  }

  return isFirstChild
    ? { living: parseAmount(childCost.child1Living), events: parseAmount(childCost.child1Events) }
    : {
        living: calculateSharedCost(parseAmount(childCost.child1Living), parseAmount(childCost.child2LivingRate)),
        events: calculateSharedCost(parseAmount(childCost.child1Events), parseAmount(childCost.child2EventsRate))
      };
}

/**
 * 年齢範囲別の生活費設定から、指定年齢に該当する金額を取得する。
 */
function findLifeCostByAge(ranges: ChildLifeCostRange[], age: number, fallbackLiving: number, fallbackEvents: number) {
  const range = ranges.find((item) =>
    age >= parseAmount(item.startAge) && age <= parseAmount(item.endAge)
  );

  return {
    living: range ? parseAmount(range.annualLiving) : fallbackLiving,
    events: range ? parseAmount(range.annualEvents) : fallbackEvents
  };
}

/**
 * 投資設定に応じて、その年の投資目標額を計算する。
 *
 * 固定額投資は設定値をそのまま目標とし、割合投資はその年の余剰に応じて変動させる。
 */
function calculateAnnualInvestmentAmount(inputs: ScenarioInputs, surplusBeforeInvestment: number): number {
  if (inputs.investment.investmentMode === "fixed") {
    return parseAmount(inputs.investment.fixedAmount) * 12;
  }

  return Math.max(0, Math.floor(Math.max(surplusBeforeInvestment, 0) * parseAmount(inputs.investment.percentage) / 100));
}

/**
 * 年次計算結果からKPIと総合判定を算出する。
 */
export function calculateKpi(rows: YearlySimulationRow[]): SimulationKpi {
  const finalRow = rows[rows.length - 1];
  const educationPeakRow = rows.reduce((peak, row) =>
    row.educationCost > peak.educationCost ? row : peak
  , rows[0]);
  const minimumSurplusRow = rows.reduce((min, row) =>
    row.surplusBeforeInvestment < min.surplusBeforeInvestment ? row : min
  , rows[0]);
  const deficitYears = rows.filter((row) => row.isDeficit).length;
  const drawdownYears = rows.filter((row) => row.withdrawalAmount > 0).length;
  const status = judgeStatus(rows, deficitYears, drawdownYears);

  return {
    finalAsset: finalRow.totalAsset,
    investmentGain: finalRow.totalAsset - finalRow.totalAssetWithoutInvestment,
    educationPeakYear: educationPeakRow.year,
    educationPeakAmount: educationPeakRow.educationCost,
    minimumAnnualSurplus: minimumSurplusRow.surplusBeforeInvestment,
    deficitYears,
    drawdownYears,
    status,
    headline: createHeadline(status),
    insights: createInsights(status, educationPeakRow, minimumSurplusRow, finalRow, deficitYears)
  };
}

/**
 * KPIの閾値からsafe / attention / reviewを判定する。
 *
 * 年間赤字・現金マイナスは強い警告とし、余剰の薄い年が多い場合は attention とする。
 */
function judgeStatus(
  rows: YearlySimulationRow[],
  deficitYears: number,
  drawdownYears: number
): ScenarioStatus {
  const finalAsset = rows[rows.length - 1].totalAsset;
  const minimumSurplus = Math.min(...rows.map((row) => row.surplusBeforeInvestment));
  const hasNegativeCash = rows.some((row) => row.cashBalance < 0);
  const firstYearExpense = rows[0]?.baseExpense ?? 0;

  if (deficitYears > 0 || finalAsset < 0 || hasNegativeCash) return "review";
  if (minimumSurplus < firstYearExpense * 0.1 || drawdownYears >= rows.length * 0.2) return "attention";
  return "safe";
}

/**
 * 総合判定に応じた結果見出しを作る。
 */
function createHeadline(status: ScenarioStatus): string {
  if (status === "safe") return "現在の前提では、長期的に安定したライフプランです";
  if (status === "attention") return "実現可能性はありますが、教育費ピーク時の余裕に注意が必要です";
  return "赤字年または資産取り崩しリスクがあるため、条件の見直しが必要です";
}

/**
 * 結果画面に表示する説明文を生成する。
 *
 * 配列の並び順は画面側で意味を持つため、
 * 0: 注意時期、1: 長期見通し、2: 改善提案 の順を必ず維持する。
 */
function createInsights(
  status: ScenarioStatus,
  educationPeakRow: YearlySimulationRow,
  minimumSurplusRow: YearlySimulationRow,
  finalRow: YearlySimulationRow,
  deficitYears: number
): string[] {
  const timingInsight =
    `${educationPeakRow.year}年に子ども関連費が年間${Math.floor(educationPeakRow.educationCost / 10000).toLocaleString()}万円でピークになります。`;
  const longTermInsight =
    `最終年の資産残高は${Math.floor(finalRow.totalAsset / 10000).toLocaleString()}万円の見込みです。`;
  const actionInsight = status === "review"
    ? `赤字年が${deficitYears}年あるため、支出・投資額・ライフイベント時期の見直しが必要です。`
    : `最も余剰が少ない年は${minimumSurplusRow.year}年で、年間余剰は${Math.floor(minimumSurplusRow.surplusBeforeInvestment / 10000).toLocaleString()}万円です。`;

  return [timingInsight, longTermInsight, actionInsight];
}
