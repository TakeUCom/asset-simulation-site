import { CHILD_COST_YEARS } from "../config/defaults";
import { sanitizeNumericInput } from "./numberFormatting";

type ChildCostInput = {
  preschool: number;
  elementary: number;
  juniorHigh: number;
  highSchool: number;
  university: number;
  cram: number;
  living: number;
  events: number;
};

type InvestmentAllocationInput = {
  mode: "fixed" | "percentage";
  monthlySurplus: number;
  fixedAmount: number;
  percentage: number;
};

/**
 * 手取り計算の入力値。
 *
 * MVPでは独身・扶養なし・給与所得のみの簡易モデルを採用し、
 * 必要に応じて住民税率や社会保険料率だけ差し替えられるようにする。
 */
export type NetIncomeCalculationParams = {
  annualGrossIncome: number;
  socialInsuranceRate?: number;
  residentTaxRate?: number;
  residentTaxFixedAmount?: number;
};

/**
 * 額面年収から手取りを概算した際の計算内訳。
 *
 * UIでは最終的に`netIncome`だけ使う場面も多いが、
 * 仕様確認や将来の内訳表示で再利用できるよう一式を返す。
 */
export type NetIncomeBreakdown = {
  salaryIncomeDeduction: number;
  employmentIncome: number;
  socialInsurance: number;
  taxableIncome: number;
  incomeTax: number;
  residentTax: number;
  netIncome: number;
  netMonthly: number;
};

const DEFAULT_SOCIAL_INSURANCE_RATE = 0.145;
const DEFAULT_RESIDENT_TAX_RATE = 0.10;
const DEFAULT_RESIDENT_TAX_FIXED_AMOUNT = 5_000;

/**
 * 税率計算で出た小数を円単位の整数へ正規化する。
 *
 * JavaScriptの浮動小数点誤差で 4505500.999999 のような値が出ると
 * 1円ずれてしまうため、MVPでは四捨五入で安定化する。
 */
function roundCurrency(value: number): number {
  return Math.round(value);
}

/**
 * 入力フォームの金額文字列を計算用の数値へ変換する。
 *
 * 空文字や不正な値は0として扱い、計算中に`NaN`が混ざらないようにする。
 */
export function parseAmount(value: string | number): number {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  return Number.parseInt(sanitizeNumericInput(value), 10) || 0;
}

/**
 * 額面年収から手取り概算の内訳を算出する。
 *
 * 計算順序は仕様書どおり、
 * 1. 給与所得控除
 * 2. 給与所得
 * 3. 社会保険料
 * 4. 課税所得
 * 5. 所得税
 * 6. 住民税
 * 7. 手取り
 * の順で固定する。
 */
export function calculateNetIncomeBreakdown({
  annualGrossIncome,
  socialInsuranceRate = DEFAULT_SOCIAL_INSURANCE_RATE,
  residentTaxRate = DEFAULT_RESIDENT_TAX_RATE,
  residentTaxFixedAmount = DEFAULT_RESIDENT_TAX_FIXED_AMOUNT
}: NetIncomeCalculationParams): NetIncomeBreakdown {
  if (annualGrossIncome <= 0) {
    return {
      salaryIncomeDeduction: 0,
      employmentIncome: 0,
      socialInsurance: 0,
      taxableIncome: 0,
      incomeTax: 0,
      residentTax: 0,
      netIncome: 0,
      netMonthly: 0
    };
  }

  const salaryIncomeDeduction = calculateSalaryIncomeDeduction(annualGrossIncome);
  const employmentIncome = Math.max(annualGrossIncome - salaryIncomeDeduction, 0);
  const socialInsurance = roundCurrency(annualGrossIncome * socialInsuranceRate);
  const taxableIncome = Math.max(employmentIncome - socialInsurance, 0);
  const incomeTax = Math.max(0, roundCurrency(calculateProgressiveIncomeTax(taxableIncome)));
  const residentTax = Math.max(
    0,
    roundCurrency(taxableIncome * residentTaxRate + residentTaxFixedAmount)
  );
  const netIncome = Math.max(
    0,
    roundCurrency(annualGrossIncome - socialInsurance - incomeTax - residentTax)
  );
  const netMonthly = Math.floor(netIncome / 12);

  return {
    salaryIncomeDeduction,
    employmentIncome,
    socialInsurance,
    taxableIncome,
    incomeTax,
    residentTax,
    netIncome,
    netMonthly
  };
}

/**
 * UI各所で使う手取り年収のショートカット関数。
 *
 * 画面側の呼び出しは従来どおり単純な数値を返しつつ、
 * 実際の計算本体は`calculateNetIncomeBreakdown`へ集約する。
 */
export function estimateTakeHome(grossIncome: number): number {
  return calculateNetIncomeBreakdown({ annualGrossIncome: grossIncome }).netIncome;
}

/**
 * 額面年収から給与所得控除額を算出する。
 *
 * 独身・一般会社員向けの簡易モデルとして、現行の給与所得控除テーブルを採用する。
 */
export function calculateSalaryIncomeDeduction(annualGrossIncome: number): number {
  if (annualGrossIncome <= 0) return 0;
  if (annualGrossIncome <= 1_625_000) return 550_000;
  if (annualGrossIncome <= 1_800_000) return roundCurrency(annualGrossIncome * 0.40 - 100_000);
  if (annualGrossIncome <= 3_600_000) return roundCurrency(annualGrossIncome * 0.30 + 80_000);
  if (annualGrossIncome <= 6_600_000) return roundCurrency(annualGrossIncome * 0.20 + 440_000);
  if (annualGrossIncome <= 8_500_000) return roundCurrency(annualGrossIncome * 0.10 + 1_100_000);
  return 1_950_000;
}

/**
 * 超過累進課税で所得税額を算出する。
 *
 * ここでは復興特別所得税などの追加要素は含めず、
 * 仕様書で指定された税率・控除額テーブルのみを使う。
 */
export function calculateProgressiveIncomeTax(taxableIncome: number): number {
  if (taxableIncome <= 0) return 0;
  if (taxableIncome <= 1_950_000) return taxableIncome * 0.05;
  if (taxableIncome <= 3_300_000) return taxableIncome * 0.10 - 97_500;
  if (taxableIncome <= 6_950_000) return taxableIncome * 0.20 - 427_500;
  if (taxableIncome <= 9_000_000) return taxableIncome * 0.23 - 636_000;
  if (taxableIncome <= 18_000_000) return taxableIncome * 0.33 - 1_536_000;
  if (taxableIncome <= 40_000_000) return taxableIncome * 0.40 - 2_796_000;
  return taxableIncome * 0.45 - 4_796_000;
}

/**
 * 子ども1人あたりの総費用を算出する。
 *
 * 各費目は年額入力で受け取り、`CHILD_COST_YEARS`の年数を掛けて
 * 0歳から大学卒業までの概算総額に変換する。
 */
export function calculateChildCostTotal(input: ChildCostInput): number {
  return (
    input.preschool * CHILD_COST_YEARS.preschool +
    input.elementary * CHILD_COST_YEARS.elementary +
    input.juniorHigh * CHILD_COST_YEARS.juniorHigh +
    input.highSchool * CHILD_COST_YEARS.highSchool +
    input.university * CHILD_COST_YEARS.university +
    input.cram * CHILD_COST_YEARS.cram +
    input.living * CHILD_COST_YEARS.living +
    input.events * CHILD_COST_YEARS.events
  );
}

/**
 * 第2子以降の共有可能な費用を割合で圧縮して算出する。
 *
 * 例: 第1子の生活費増加分が60万円、ratePercentが60なら36万円を返す。
 */
export function calculateSharedCost(baseAmount: number, ratePercent: number): number {
  return Math.floor(baseAmount * ratePercent / 100);
}

/**
 * 月次余剰を投資額と貯蓄額へ配分する。
 *
 * 固定額投資の場合は指定金額を投資し、割合投資の場合は月次余剰に対する割合で投資額を決める。
 * 余剰を超えた固定額投資も検知し、警告表示に使えるようにする。
 */
export function calculateInvestmentAllocation({
  mode,
  monthlySurplus,
  fixedAmount,
  percentage
}: InvestmentAllocationInput) {
  const monthlyInvestment = mode === "fixed"
    ? fixedAmount
    : Math.floor(monthlySurplus * percentage / 100);
  const monthlySavings = Math.max(0, monthlySurplus - monthlyInvestment);

  return {
    monthlyInvestment,
    monthlySavings,
    annualInvestment: monthlyInvestment * 12,
    annualSavings: monthlySavings * 12,
    isOverSurplus: monthlyInvestment > monthlySurplus
  };
}

/**
 * 年1回の積立額を、指定年数・想定年利で複利運用した将来価値に変換する。
 *
 * 想定利回りが0以下の場合は単純な積立合計として扱う。
 */
export function calculateFutureValueOfAnnualContribution(
  annualContribution: number,
  annualReturnRate: number,
  years: number
): number {
  if (years <= 0 || annualContribution <= 0) return 0;
  if (annualReturnRate <= 0) return annualContribution * years;

  const rate = annualReturnRate / 100;
  return Math.floor(annualContribution * ((Math.pow(1 + rate, years) - 1) / rate));
}
