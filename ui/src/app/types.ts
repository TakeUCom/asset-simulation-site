export type Profile = {
  version?: number;
  userName: string;
  userAge: string;
  spouseName: string;
  spouseAge: string;
  hasSpouse: string;
  currentChildren: string;
  child1Name: string;
  child1Age: string;
  child2Name: string;
  child2Age: string;
  userIncome: string;
  spouseIncome: string;
  userBonus: string;
  spouseBonus: string;
};

export type ScenarioStatus = "safe" | "attention" | "review";

export type BasicInfoInput = {
  scenarioName: string;
  userAge: string;
  spouseAge: string;
  childrenCount: string;
  ageDifference: string;
};

export type AnnualIncome = {
  id: string;
  year: string;
  name: string;
  category: string;
  amount: string;
  duration: string;
  durationType: "single" | "multiple";
  memo: string;
};

export type HouseholdInput = {
  userIncome: string;
  spouseIncome: string;
  userBonus: string;
  spouseBonus: string;
  livingExpenses: string;
  housingCost: string;
  fixedCosts: string;
  monthlySavings: string;
  annualIncomes: AnnualIncome[];
};

export type ChildCostInput = {
  child1Pattern: string;
  child1Preschool: string;
  child1Elementary: string;
  child1JuniorHigh: string;
  child1HighSchool: string;
  child1University: string;
  child1Cram: string;
  child1Living: string;
  child1Events: string;
  child1UseDetailedLifeCosts: boolean;
  child1LifeCostRanges: ChildLifeCostRange[];
  child2Pattern: string;
  child2Preschool: string;
  child2Elementary: string;
  child2JuniorHigh: string;
  child2HighSchool: string;
  child2University: string;
  child2Cram: string;
  child2LivingRate: string;
  child2EventsRate: string;
  child2UseDetailedLifeCosts: boolean;
  child2LifeCostRanges: ChildLifeCostRange[];
};

export type ChildLifeCostRange = {
  id: string;
  startAge: string;
  endAge: string;
  annualLiving: string;
  annualEvents: string;
};

export type LifeEvent = {
  id: string;
  year: string;
  name: string;
  category: string;
  amount: string;
  isRequired: boolean;
  paymentType: "lump" | "loan";
  loanDownPayment?: string;
  loanAmount?: string;
  loanYears?: string;
  loanRate?: string;
  loanStartYear?: string;
  memo: string;
};

export type InvestmentInput = {
  investmentMode: "fixed" | "percentage";
  fixedAmount: string;
  percentage: string;
  expectedReturn: string;
};

export type ScenarioInputs = {
  profileSnapshot?: Profile;
  basic: BasicInfoInput;
  household: HouseholdInput;
  childCost: ChildCostInput;
  lifeEvents: LifeEvent[];
  investment: InvestmentInput;
  yearAdjustments: YearAdjustment[];
};

export type YearAdjustment = {
  year: number;
  userIncome: string;
  spouseIncome: string;
  userBonus: string;
  spouseBonus: string;
  additionalIncome: string;
  incomeReduction: string;
  baseExpense: string;
  memo: string;
};

export type ScenarioSummary = {
  version?: number;
  id: number;
  name: string;
  createdAt: string;
  updatedAt: string;
  children: number;
  investment: boolean;
  finalAsset: number;
  educationPeak: number;
  status: ScenarioStatus;
  hasDeficit: boolean;
  inputs?: ScenarioInputs;
};

export type YearlySimulationRow = {
  year: number;
  userAge: number;
  spouseAge?: number;
  userIncome: number;
  spouseIncome: number;
  userBonus: number;
  spouseBonus: number;
  grossIncome: number;
  takeHomeIncome: number;
  annualIncome: number;
  totalIncome: number;
  baseExpense: number;
  educationCost: number;
  lifeEventCost: number;
  totalExpense: number;
  investmentAmount: number;
  savingsAmount: number;
  withdrawalAmount: number;
  cashBalanceChange: number;
  surplusBeforeInvestment: number;
  cashBalance: number;
  investmentBalance: number;
  totalAsset: number;
  totalAssetWithoutInvestment: number;
  isDeficit: boolean;
  eventNames: string[];
  lifeEventDetails: Array<{ name: string; amount: number }>;
  annualIncomeDetails: Array<{ name: string; amount: number }>;
  targetInvestmentAmount: number;
  isInvestmentReduced: boolean;
  adjustmentMemo?: string;
};

export type AssetChartDatum = {
  year: number;
  withInvestment: number;
  withoutInvestment: number;
  age: number;
};

export type EducationChartDatum = {
  year: number;
  total: number;
  child1: number;
  child2: number;
  child3: number;
  child4: number;
};

export type SimulationKpi = {
  finalAsset: number;
  investmentGain: number;
  educationPeakYear: number;
  educationPeakAmount: number;
  minimumAnnualSurplus: number;
  deficitYears: number;
  drawdownYears: number;
  status: ScenarioStatus;
  headline: string;
  insights: string[];
};

export type SimulationResult = {
  yearlyRows: YearlySimulationRow[];
  assetChartData: AssetChartDatum[];
  educationChartData: EducationChartDatum[];
  kpi: SimulationKpi;
};
