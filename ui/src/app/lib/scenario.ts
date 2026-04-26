import { DEFAULT_CHILD_COSTS, DEFAULT_INVESTMENT, DEFAULT_PROFILE } from "../config/defaults";
import { SCENARIO_TEMPLATES } from "../config/referenceData";
import type { Profile, ScenarioInputs, ScenarioStatus, ScenarioSummary } from "../types";
import { parseAmount } from "./calculations";
import { calculateSimulation } from "./simulation";

/**
 * 新規シナリオ作成時に使う入力値の初期状態を作る。
 *
 * APIなしMVPでは、各フォームの入力値をこのオブジェクトに集約してlocalStorageへ保存する。
 */
export function createDefaultScenarioInputs(profile?: Profile | null): ScenarioInputs {
  const profileDefaults = profile ?? DEFAULT_PROFILE;

  return {
    profileSnapshot: { ...profileDefaults },
    basic: {
      scenarioName: "子ども2人_投資あり",
      userAge: profileDefaults.userAge,
      spouseAge: profileDefaults.spouseAge,
      childrenCount: "2",
      ageDifference: "3"
    },
    household: {
      userIncome: profileDefaults.userIncome,
      spouseIncome: profileDefaults.spouseIncome,
      userBonus: profileDefaults.userBonus,
      spouseBonus: profileDefaults.spouseBonus,
      livingExpenses: "250000",
      housingCost: "100000",
      fixedCosts: "50000",
      monthlySavings: "80000",
      annualIncomes: [
        {
          id: "1",
          year: "2027",
          name: "住宅ローン減税",
          category: "housing-tax-credit",
          amount: "300000",
          duration: "13",
          durationType: "multiple",
          memo: ""
        }
      ]
    },
    childCost: {
      child1Pattern: DEFAULT_CHILD_COSTS.child1Pattern,
      child1Preschool: "",
      child1Elementary: "",
      child1JuniorHigh: "",
      child1HighSchool: "",
      child1University: "",
      child1Cram: "",
      child1Living: DEFAULT_CHILD_COSTS.child1Living,
      child1Events: DEFAULT_CHILD_COSTS.child1Events,
      child1UseDetailedLifeCosts: false,
      child1LifeCostRanges: [
        { id: "1", startAge: "0", endAge: "5", annualLiving: "300000", annualEvents: "100000" },
        { id: "2", startAge: "6", endAge: "12", annualLiving: "400000", annualEvents: "150000" },
        { id: "3", startAge: "13", endAge: "18", annualLiving: "600000", annualEvents: "150000" },
        { id: "4", startAge: "19", endAge: "22", annualLiving: "800000", annualEvents: "100000" }
      ],
      child2Pattern: DEFAULT_CHILD_COSTS.child2Pattern,
      child2Preschool: "",
      child2Elementary: "",
      child2JuniorHigh: "",
      child2HighSchool: "",
      child2University: "",
      child2Cram: "",
      child2LivingRate: DEFAULT_CHILD_COSTS.child2LivingRate,
      child2EventsRate: DEFAULT_CHILD_COSTS.child2EventsRate,
      child2UseDetailedLifeCosts: false,
      child2LifeCostRanges: [
        { id: "1", startAge: "0", endAge: "5", annualLiving: "180000", annualEvents: "50000" },
        { id: "2", startAge: "6", endAge: "12", annualLiving: "240000", annualEvents: "75000" },
        { id: "3", startAge: "13", endAge: "18", annualLiving: "360000", annualEvents: "75000" },
        { id: "4", startAge: "19", endAge: "22", annualLiving: "480000", annualEvents: "50000" }
      ]
    },
    lifeEvents: [
      {
        id: "1",
        year: "2030",
        name: "車買い替え",
        category: "car",
        amount: "2500000",
        isRequired: true,
        paymentType: "loan",
        loanDownPayment: "500000",
        loanAmount: "2000000",
        loanYears: "5",
        loanRate: "2.5",
        loanStartYear: "2030",
        memo: "現在の車が10年目"
      },
      {
        id: "2",
        year: "2035",
        name: "リフォーム",
        category: "renovation",
        amount: "1500000",
        isRequired: false,
        paymentType: "lump",
        memo: "状況次第で検討"
      }
    ],
    investment: {
      investmentMode: DEFAULT_INVESTMENT.mode,
      fixedAmount: DEFAULT_INVESTMENT.fixedAmount,
      percentage: DEFAULT_INVESTMENT.percentage,
      expectedReturn: DEFAULT_INVESTMENT.expectedReturn
    },
    yearAdjustments: []
  };
}

/**
 * テンプレート選択内容から新規シナリオ入力値を生成する。
 *
 * テンプレート未反映のまま新規作成するとユーザー期待とずれるため、
 * 少なくとも子ども人数・シナリオ名・投資有無は初期状態へ反映する。
 */
export function createScenarioInputsFromTemplate(
  template: (typeof SCENARIO_TEMPLATES)[number],
  profile?: Profile | null
): ScenarioInputs {
  const defaultInputs = createDefaultScenarioInputs(profile);
  const hasInvestment = template.investment;

  return {
    ...defaultInputs,
    basic: {
      ...defaultInputs.basic,
      scenarioName: template.name,
      childrenCount: String(template.children)
    },
    investment: {
      ...defaultInputs.investment,
      investmentMode: "fixed",
      fixedAmount: hasInvestment ? DEFAULT_INVESTMENT.fixedAmount : "0",
      percentage: hasInvestment ? DEFAULT_INVESTMENT.percentage : "0"
    }
  };
}

/**
 * 入力条件から一覧表示用のシナリオサマリーを作る。
 *
 * 年次シミュレーション結果から、保存・一覧表示・比較に必要な主要指標を作る。
 */
export function createScenarioSummaryFromInputs(
  inputs: ScenarioInputs,
  existing?: ScenarioSummary
): ScenarioSummary {
  const now = new Date().toISOString().slice(0, 10);
  const simulation = calculateSimulation(inputs);
  const children = parseAmount(inputs.basic.childrenCount);
  const hasInvestment = inputs.investment.investmentMode === "fixed"
    ? parseAmount(inputs.investment.fixedAmount) > 0
    : parseAmount(inputs.investment.percentage) > 0;
  const educationPeak = simulation.kpi.educationPeakAmount;
  const finalAsset = simulation.kpi.finalAsset;
  const status: ScenarioStatus = simulation.kpi.status;

  return {
    version: 2,
    id: existing?.id ?? Date.now(),
    name: inputs.basic.scenarioName || existing?.name || `保存済みシナリオ_${now}`,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
    children,
    investment: hasInvestment,
    finalAsset,
    educationPeak,
    status,
    // 一覧の赤字表示も、実際のシミュレーション結果と一致させる。
    hasDeficit: simulation.kpi.deficitYears > 0,
    inputs
  };
}
