import { describe, expect, it } from "vitest";
import { createDefaultScenarioInputs } from "./scenario";
import {
  calculateEducationCostByYear,
  calculateLifeEventCostByYear,
  calculateSimulation,
  calculateYearlyRows
} from "./simulation";
import type { Profile } from "../types";

/**
 * テスト用に、余計な条件を外したシンプルなシナリオを作る。
 *
 * 期待値を手計算しやすくするため、必要な項目だけを上書きして使う。
 */
function createBaseInputs() {
  const inputs = createDefaultScenarioInputs();
  return {
    ...inputs,
    basic: {
      ...inputs.basic,
      userAge: "35",
      spouseAge: "0",
      childrenCount: "0",
      ageDifference: "3"
    },
    household: {
      ...inputs.household,
      userIncome: "6000000",
      spouseIncome: "0",
      userBonus: "0",
      spouseBonus: "0",
      livingExpenses: "250000",
      housingCost: "0",
      fixedCosts: "0",
      monthlySavings: "0",
      annualIncomes: []
    },
    childCost: {
      ...inputs.childCost,
      child1Living: "0",
      child1Events: "0",
      child2LivingRate: "0",
      child2EventsRate: "0",
      child1UseDetailedLifeCosts: false,
      child2UseDetailedLifeCosts: false
    },
    lifeEvents: [],
    investment: {
      ...inputs.investment,
      investmentMode: "fixed" as const,
      fixedAmount: "50000",
      expectedReturn: "0"
    },
    yearAdjustments: []
  };
}

describe("calculateYearlyRows", () => {
  it("新規シナリオ初期値は、保存済みプロフィールの年齢と収入を引き継ぐ", () => {
    // 共通プロフィールを変えたあとに新規作成したシナリオが、
    // その年齢・年収を初期入力へ反映できていることを確認する。
    const profile: Profile = {
      userName: "テスト本人",
      userAge: "41",
      spouseName: "テスト配偶者",
      spouseAge: "39",
      hasSpouse: "yes",
      currentChildren: "1",
      child1Name: "長女",
      child1Age: "5",
      child2Name: "",
      child2Age: "",
      userIncome: "7200000",
      spouseIncome: "1800000",
      userBonus: "800000",
      spouseBonus: "200000"
    };

    const inputs = createDefaultScenarioInputs(profile);

    expect(inputs.profileSnapshot).toEqual(profile);
    expect(inputs.basic.userAge).toBe("41");
    expect(inputs.basic.spouseAge).toBe("39");
    expect(inputs.household.userIncome).toBe("7200000");
    expect(inputs.household.spouseIncome).toBe("1800000");
    expect(inputs.household.userBonus).toBe("800000");
    expect(inputs.household.spouseBonus).toBe("200000");
  });

  it("余剰がある年は、余剰 = 手取り収入 - 支出 になり、投資と貯蓄へ正しく配分される", () => {
    // 年収600万円、手取り率80%なら手取りは480万円。
    // 月25万円の支出なので年300万円、年間余剰は180万円になる。
    // 固定投資5万円/月 = 年60万円なので、残り120万円が現金貯蓄へ回る想定。
    const rows = calculateYearlyRows(createBaseInputs());
    const firstYear = rows[0];

    expect(firstYear.takeHomeIncome).toBe(4_800_000);
    expect(firstYear.totalIncome).toBe(4_800_000);
    expect(firstYear.totalExpense).toBe(3_000_000);
    expect(firstYear.surplusBeforeInvestment).toBe(1_800_000);
    expect(firstYear.investmentAmount).toBe(600_000);
    expect(firstYear.savingsAmount).toBe(1_200_000);
    expect(firstYear.withdrawalAmount).toBe(0);
    expect(firstYear.totalAsset).toBe(1_800_000);
    expect(firstYear.totalAssetWithoutInvestment).toBe(1_800_000);
  });

  it("赤字年は投資を停止し、足りない分だけ現金残高の取り崩しとして扱う", () => {
    // 手取り240万円に対して年300万円支出だと年間60万円の赤字。
    // 固定投資設定があっても、赤字年に追加投資しないことを確認する。
    const inputs = createBaseInputs();
    inputs.household.userIncome = "3000000";

    const rows = calculateYearlyRows(inputs);
    const firstYear = rows[0];

    expect(firstYear.takeHomeIncome).toBe(2_400_000);
    expect(firstYear.surplusBeforeInvestment).toBe(-600_000);
    expect(firstYear.investmentAmount).toBe(0);
    expect(firstYear.savingsAmount).toBe(0);
    expect(firstYear.withdrawalAmount).toBe(600_000);
    expect(firstYear.cashBalance).toBe(-600_000);
    expect(firstYear.totalAssetWithoutInvestment).toBe(-600_000);
    expect(firstYear.isDeficit).toBe(true);
  });

  it("割合投資モードでは、その年の余剰に対する指定割合だけを投資へ回す", () => {
    // 年間余剰180万円の50%を投資するので、投資90万円・現金貯蓄90万円になる想定。
    const inputs = createBaseInputs();
    inputs.investment.investmentMode = "percentage";
    inputs.investment.percentage = "50";

    const firstYear = calculateYearlyRows(inputs)[0];

    expect(firstYear.surplusBeforeInvestment).toBe(1_800_000);
    expect(firstYear.investmentAmount).toBe(900_000);
    expect(firstYear.savingsAmount).toBe(900_000);
    expect(firstYear.targetInvestmentAmount).toBe(900_000);
  });

  it("単年収入と複数年収入は有効年だけ加算され、年次調整の増減も同じ収入欄へ反映される", () => {
    // 2026年:
    // 継続収入 10万円 + 単年収入 20万円 + 年次調整追加 5万円 - 収入減少 2万円 = 33万円
    // 2027年:
    // 継続収入 10万円のみ
    const inputs = createBaseInputs();
    inputs.household.annualIncomes = [
      {
        id: "income-recurring",
        year: "2026",
        name: "配当金",
        category: "dividend",
        amount: "100000",
        duration: "2",
        durationType: "multiple",
        memo: ""
      },
      {
        id: "income-single",
        year: "2026",
        name: "還付金",
        category: "tax-refund",
        amount: "200000",
        duration: "1",
        durationType: "single",
        memo: ""
      }
    ];
    inputs.yearAdjustments = [
      {
        year: 2026,
        userIncome: inputs.household.userIncome,
        spouseIncome: inputs.household.spouseIncome,
        userBonus: inputs.household.userBonus,
        spouseBonus: inputs.household.spouseBonus,
        additionalIncome: "50000",
        incomeReduction: "20000",
        baseExpense: "",
        memo: "一時調整"
      }
    ];

    const rows = calculateYearlyRows(inputs);

    expect(rows[0].annualIncome).toBe(330_000);
    expect(rows[0].totalIncome).toBe(5_130_000);
    expect(rows[1].annualIncome).toBe(100_000);
    expect(rows[2].annualIncome).toBe(0);
  });

  it("想定利回りがある場合、投資残高は前年残高に利回りを掛けてから当年積立を加える", () => {
    // 固定投資60万円/年、年利5%なら
    // 1年目: 60万円
    // 2年目: 60万円 × 1.05 + 60万円 = 123万円
    const inputs = createBaseInputs();
    inputs.investment.expectedReturn = "5";

    const rows = calculateYearlyRows(inputs);

    expect(rows[0].investmentBalance).toBe(600_000);
    expect(rows[1].investmentBalance).toBe(1_230_000);
  });
});

describe("calculateLifeEventCostByYear", () => {
  it("ローン払いイベントは開始年に頭金+初回年返済、その後は年返済のみを配賦する", () => {
    // 借入200万円、5年、金利0%なら年返済は40万円。
    // 開始年は頭金50万円 + 40万円 = 90万円、翌年以降は40万円になる。
    const inputs = createBaseInputs();
    inputs.lifeEvents = [
      {
        id: "loan-1",
        year: "2030",
        name: "車買い替え",
        category: "car",
        amount: "2500000",
        isRequired: true,
        paymentType: "loan",
        loanDownPayment: "500000",
        loanAmount: "2000000",
        loanYears: "5",
        loanRate: "0",
        loanStartYear: "2030",
        memo: ""
      }
    ];

    const firstYear = calculateLifeEventCostByYear(inputs, 2030);
    const secondYear = calculateLifeEventCostByYear(inputs, 2031);
    const afterLoan = calculateLifeEventCostByYear(inputs, 2035);

    expect(firstYear.amount).toBe(900_000);
    expect(secondYear.amount).toBe(400_000);
    expect(afterLoan.amount).toBe(0);
  });

  it("同じ年に一括払いとローン払いが重なった場合は合算され、内訳も保持される", () => {
    // 2030年に旅行30万円と車ローン90万円が同時発生するケース。
    const inputs = createBaseInputs();
    inputs.lifeEvents = [
      {
        id: "travel",
        year: "2030",
        name: "家族旅行",
        category: "travel",
        amount: "300000",
        isRequired: false,
        paymentType: "lump",
        memo: ""
      },
      {
        id: "loan-1",
        year: "2030",
        name: "車買い替え",
        category: "car",
        amount: "2500000",
        isRequired: true,
        paymentType: "loan",
        loanDownPayment: "500000",
        loanAmount: "2000000",
        loanYears: "5",
        loanRate: "0",
        loanStartYear: "2030",
        memo: ""
      }
    ];

    const result = calculateLifeEventCostByYear(inputs, 2030);

    expect(result.amount).toBe(1_200_000);
    expect(result.details).toEqual([
      { name: "家族旅行", amount: 300_000 },
      { name: "車買い替え", amount: 900_000 }
    ]);
  });
});

describe("calculateEducationCostByYear", () => {
  it("現在いる第1子の年齢を基準に、教育費の発生タイミングが前倒しされる", () => {
    // 現在5歳の第1子がいる場合、基準年の翌年には6歳となり、
    // 小学校+塾の金額が反映されることを確認する。
    const inputs = createBaseInputs();
    inputs.basic.childrenCount = "1";
    inputs.profileSnapshot = {
      ...inputs.profileSnapshot!,
      currentChildren: "1",
      child1Age: "5"
    };

    const baseYearCost = calculateEducationCostByYear(inputs.childCost, 2026, inputs);
    const nextYearCost = calculateEducationCostByYear(inputs.childCost, 2027, inputs);

    expect(baseYearCost.childCosts).toEqual([158_000]);
    expect(nextYearCost.childCosts).toEqual([532_000]);
  });

  it("子どもの年齢に応じて学校区分が切り替わり、年齢差のある第2子も別年齢で反映される", () => {
    // 生活費・イベント費は0にし、教育費パターンだけで確認する。
    // 2026年は第1子0歳なので保育費15.8万円のみ。
    // 2032年は第1子6歳で小学校+塾=53.2万円、第2子3歳で保育費15.8万円、合計69万円。
    const inputs = createBaseInputs();
    inputs.basic.childrenCount = "2";
    inputs.basic.ageDifference = "3";

    const firstYear = calculateEducationCostByYear(inputs.childCost, 2026, inputs);
    const elementaryYear = calculateEducationCostByYear(inputs.childCost, 2032, inputs);

    expect(firstYear.total).toBe(158_000);
    expect(firstYear.childCosts).toEqual([158_000, 0]);
    expect(elementaryYear.total).toBe(690_000);
    expect(elementaryYear.childCosts).toEqual([532_000, 158_000]);
  });

  it("現在いる第2子の年齢が入力されている場合は、年齢差推定より個別年齢を優先する", () => {
    // 第1子5歳・第2子1歳なら、基準年翌年はそれぞれ6歳・2歳となる。
    // 第2子は推定の3歳ではなく、個別入力の2歳として保育費が反映されることを確認する。
    const inputs = createBaseInputs();
    inputs.basic.childrenCount = "2";
    inputs.basic.ageDifference = "3";
    inputs.profileSnapshot = {
      ...inputs.profileSnapshot!,
      currentChildren: "2",
      child1Age: "5",
      child2Age: "1"
    };

    const nextYearCost = calculateEducationCostByYear(inputs.childCost, 2027, inputs);

    expect(nextYearCost.childCosts).toEqual([532_000, 158_000]);
  });

  it("年齢範囲別の詳細生活費を使う場合は、該当レンジの生活費・イベント費が教育費に上乗せされる", () => {
    // 6歳時点で詳細レンジ 40万円 + 15万円 が使われ、
    // 小学校35.2万円 + 塾18万円と合算されて108.2万円になる想定。
    const inputs = createBaseInputs();
    inputs.basic.childrenCount = "1";
    inputs.childCost.child1UseDetailedLifeCosts = true;

    const result = calculateEducationCostByYear(inputs.childCost, 2032, inputs);

    expect(result.total).toBe(1_082_000);
    expect(result.childCosts).toEqual([1_082_000]);
  });

  it("第2子は共有率を使った生活費で計算され、将来の出生年までは0円のままになる", () => {
    // 第2子は第1子生活費60万円の50%で30万円、
    // イベント費12万円の50%で6万円となり、教育費15.8万円が加算される想定。
    const inputs = createBaseInputs();
    inputs.basic.childrenCount = "2";
    inputs.basic.ageDifference = "3";
    inputs.childCost.child1Living = "600000";
    inputs.childCost.child1Events = "120000";
    inputs.childCost.child2LivingRate = "50";
    inputs.childCost.child2EventsRate = "50";

    const beforeBirth = calculateEducationCostByYear(inputs.childCost, 2027, inputs);
    const secondChildAgeZero = calculateEducationCostByYear(inputs.childCost, 2029, inputs);

    expect(beforeBirth.childCosts).toEqual([878_000, 0]);
    expect(secondChildAgeZero.childCosts).toEqual([878_000, 518_000]);
  });
});

describe("calculateSimulation", () => {
  it("KPIは年次明細と同じ数値を参照し、最終資産と赤字年数が整合する", () => {
    // まず余剰ありケースで、KPIの最終資産が最終年の年末残高と一致することを確認する。
    const safeResult = calculateSimulation(createBaseInputs());
    const safeFinalRow = safeResult.yearlyRows[safeResult.yearlyRows.length - 1];

    expect(safeResult.kpi.finalAsset).toBe(safeFinalRow.totalAsset);
    expect(safeResult.kpi.deficitYears).toBe(0);

    // 次に赤字ケースで、赤字年数が全期間分カウントされ review 判定になることを確認する。
    const deficitInputs = createBaseInputs();
    deficitInputs.household.userIncome = "3000000";
    const deficitResult = calculateSimulation(deficitInputs);

    expect(deficitResult.kpi.deficitYears).toBe(deficitResult.yearlyRows.length);
    expect(deficitResult.kpi.status).toBe("review");
    expect(deficitResult.kpi.finalAsset).toBe(deficitResult.yearlyRows[deficitResult.yearlyRows.length - 1].totalAsset);
  });

  it("赤字はないが余剰が薄いケースは attention 判定になる", () => {
    // 手取り312万円、支出300万円なら年間余剰は12万円。
    // 赤字ではないが、初年度支出300万円の10%未満なので attention になる想定。
    const inputs = createBaseInputs();
    inputs.household.userIncome = "3900000";

    const result = calculateSimulation(inputs);

    expect(result.kpi.deficitYears).toBe(0);
    expect(result.kpi.minimumAnnualSurplus).toBe(120_000);
    expect(result.kpi.status).toBe("attention");
  });

  it("教育費ピーク年とピーク額は年次明細の最大値と一致する", () => {
    // 子ども2人・3歳差のケースでは、教育費ピーク行がKPIへそのまま反映されることを確認する。
    const inputs = createBaseInputs();
    inputs.basic.childrenCount = "2";
    inputs.basic.ageDifference = "3";

    const result = calculateSimulation(inputs);
    const peakRow = result.yearlyRows.reduce((best, row) =>
      row.educationCost > best.educationCost ? row : best
    , result.yearlyRows[0]);

    expect(result.kpi.educationPeakYear).toBe(peakRow.year);
    expect(result.kpi.educationPeakAmount).toBe(peakRow.educationCost);
  });
});
