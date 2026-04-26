import { describe, expect, it } from "vitest";
import {
  calculateNetIncomeBreakdown,
  calculateProgressiveIncomeTax,
  calculateSalaryIncomeDeduction,
  estimateTakeHome
} from "./calculations";

describe("calculateSalaryIncomeDeduction", () => {
  it("給与所得控除は年収帯ごとのテーブルに従って切り替わる", () => {
    // 境界値付近で控除額が仕様どおり切り替わることを確認する。
    expect(calculateSalaryIncomeDeduction(1_625_000)).toBe(550_000);
    expect(calculateSalaryIncomeDeduction(1_800_000)).toBe(620_000);
    expect(calculateSalaryIncomeDeduction(3_600_000)).toBe(1_160_000);
    expect(calculateSalaryIncomeDeduction(6_600_000)).toBe(1_760_000);
    expect(calculateSalaryIncomeDeduction(8_500_000)).toBe(1_950_000);
    expect(calculateSalaryIncomeDeduction(10_000_000)).toBe(1_950_000);
  });
});

describe("calculateProgressiveIncomeTax", () => {
  it("所得税は超過累進課税の税率と控除額で計算される", () => {
    // 課税所得660万円は 20% - 427,500円 の階層に入る。
    expect(calculateProgressiveIncomeTax(6_600_000)).toBe(892_500);
  });
});

describe("calculateNetIncomeBreakdown", () => {
  it("年収1,000万円のサンプル計算が仕様書の期待値と一致する", () => {
    // 仕様書の例:
    // 給与所得控除 195万円
    // 給与所得 805万円
    // 社会保険料 145万円
    // 課税所得 660万円
    // 所得税 892,500円
    // 住民税 665,000円
    // 手取り 6,992,500円
    const result = calculateNetIncomeBreakdown({ annualGrossIncome: 10_000_000 });

    expect(result.salaryIncomeDeduction).toBe(1_950_000);
    expect(result.employmentIncome).toBe(8_050_000);
    expect(result.socialInsurance).toBe(1_450_000);
    expect(result.taxableIncome).toBe(6_600_000);
    expect(result.incomeTax).toBe(892_500);
    expect(result.residentTax).toBe(665_000);
    expect(result.netIncome).toBe(6_992_500);
    expect(result.netMonthly).toBe(582_708);
  });

  it("社会保険料率や住民税率を差し替えると、その条件で手取りが再計算される", () => {
    // MVPでは簡易モデルだが、率の差し替えで将来の地域差・制度差へ備えられることを確認する。
    const result = calculateNetIncomeBreakdown({
      annualGrossIncome: 6_000_000,
      socialInsuranceRate: 0.13,
      residentTaxRate: 0.09,
      residentTaxFixedAmount: 4_000
    });

    expect(result.socialInsurance).toBe(780_000);
    expect(result.taxableIncome).toBe(3_580_000);
    expect(result.incomeTax).toBe(288_500);
    expect(result.residentTax).toBe(326_200);
    expect(result.netIncome).toBe(4_605_300);
  });

  it("年収0円以下はすべて0円で返し、負の金額が混ざらない", () => {
    const result = calculateNetIncomeBreakdown({ annualGrossIncome: 0 });

    expect(result).toEqual({
      salaryIncomeDeduction: 0,
      employmentIncome: 0,
      socialInsurance: 0,
      taxableIncome: 0,
      incomeTax: 0,
      residentTax: 0,
      netIncome: 0,
      netMonthly: 0
    });
  });
});

describe("estimateTakeHome", () => {
  it("ショートカット関数は手取り年収だけを返す", () => {
    // UIの既存呼び出しは `estimateTakeHome` を使うため、
    // 内訳計算関数との差異が出ないことを担保する。
    expect(estimateTakeHome(6_000_000)).toBe(4_505_500);
  });
});
