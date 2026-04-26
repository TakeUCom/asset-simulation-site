import { CHILD_COST_YEARS, SIMULATION_SETTINGS } from "../config/defaults";

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
 * 入力フォームの金額文字列を計算用の数値へ変換する。
 *
 * 空文字や不正な値は0として扱い、計算中に`NaN`が混ざらないようにする。
 */
export function parseAmount(value: string | number): number {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  return Number.parseInt(value, 10) || 0;
}

/**
 * 額面年収から概算手取り額を算出する。
 *
 * 現時点では税制・社会保険料を厳密計算せず、年収帯ごとの簡易レートを使う。
 * 将来的に精緻化する場合は、この関数を差し替えることで画面側の修正を抑えられる。
 */
export function estimateTakeHome(grossIncome: number): number {
  if (grossIncome <= 0) return 0;

  const band = SIMULATION_SETTINGS.takeHomeRateBands.find(
    ({ minIncome }) => grossIncome >= minIncome
  );

  return Math.floor(grossIncome * (band?.rate ?? 0.8));
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
