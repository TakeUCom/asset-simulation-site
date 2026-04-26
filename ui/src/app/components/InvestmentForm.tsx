import { useState } from "react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { InputWithUnit } from "./InputWithUnit";
import { SummaryCard } from "./SummaryCard";
import { StepIndicator } from "./StepIndicator";
import { Separator } from "./ui/separator";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { ChevronRight, ChevronLeft, PiggyBank, TrendingUp, Wallet, AlertTriangle, Info } from "lucide-react";
import { DEFAULT_INVESTMENT, SIMULATION_SETTINGS } from "../config/defaults";
import {
  calculateFutureValueOfAnnualContribution,
  calculateInvestmentAllocation,
  parseAmount
} from "../lib/calculations";
import type { InvestmentInput } from "../types";

const steps = [
  { label: "基本情報", completed: true },
  { label: "家計", completed: true },
  { label: "子ども費用", completed: true },
  { label: "ライフイベント", completed: true },
  { label: "余剰配分", completed: false },
  { label: "結果", completed: false }
];

interface InvestmentFormProps {
  initialData: InvestmentInput;
  currentMonthlySurplus: number;
  onNext: (data: InvestmentInput) => void;
  onBack: (data: InvestmentInput) => void;
}

/**
 * 余剰資金を貯蓄と投資に配分するステップ画面。
 *
 * 固定額投資と余剰割合投資の2パターンを比較できるようにし、
 * 年ごとの余剰変動に備えた投資ルールを決めるために使う。
 */
export function InvestmentForm({
  initialData,
  currentMonthlySurplus,
  onNext,
  onBack
}: InvestmentFormProps) {
  // 投資設定画面では、家計入力から算出した最新の月次余剰を使って概算配分を表示する。
  const annualSurplusEstimate = currentMonthlySurplus * 12;

  const [investmentMode, setInvestmentMode] = useState<"fixed" | "percentage">(initialData.investmentMode);
  const [fixedAmount, setFixedAmount] = useState(initialData.fixedAmount || DEFAULT_INVESTMENT.fixedAmount);
  const [percentage, setPercentage] = useState(initialData.percentage || DEFAULT_INVESTMENT.percentage);
  const [expectedReturn, setExpectedReturn] = useState(initialData.expectedReturn || DEFAULT_INVESTMENT.expectedReturn);

  // 投資額の計算
  const {
    monthlyInvestment,
    monthlySavings,
    annualInvestment,
    annualSavings,
    isOverSurplus
  } = calculateInvestmentAllocation({
    mode: investmentMode,
    monthlySurplus: currentMonthlySurplus,
    fixedAmount: parseAmount(fixedAmount),
    percentage: parseAmount(percentage)
  });

  const savingsIn20Years = annualSavings * SIMULATION_SETTINGS.projectionYears;
  const investmentIn20Years = calculateFutureValueOfAnnualContribution(
    annualInvestment,
    parseFloat(expectedReturn) || 0,
    SIMULATION_SETTINGS.projectionYears
  );
  const totalIn20Years = savingsIn20Years + investmentIn20Years;

  const savingsPercentage = currentMonthlySurplus > 0
    ? Math.round((monthlySavings / currentMonthlySurplus) * 100)
    : 0;
  const investmentPercentage = currentMonthlySurplus > 0
    ? Math.round((monthlyInvestment / currentMonthlySurplus) * 100)
    : 0;

  /**
   * 投資・貯蓄配分の入力値を親コンポーネントへ保存して結果画面へ進む。
   */
  const handleNext = () => {
    onNext({
      investmentMode,
      fixedAmount,
      percentage,
      expectedReturn
    });
  };

  /**
   * 戻る操作でも入力途中の投資設定を親へ保存する。
   */
  const handleBack = () => {
    onBack({
      investmentMode,
      fixedAmount,
      percentage,
      expectedReturn
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-6">ライフプランシミュレーション</h1>
          <StepIndicator steps={steps} currentStep={4} />
          <div className="md:hidden mt-4">
            <StepIndicator steps={steps} currentStep={4} compact />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card className="p-8">
              <div className="mb-6">
                <h2 className="text-2xl font-semibold mb-2">余剰資金の配分設定</h2>
                <p className="text-sm text-muted-foreground">
                  家計の余剰資金を、貯蓄と投資にどう配分するか設定します
                </p>
              </div>

              <div className="space-y-6">
                {/* 余剰資金の表示 */}
                <div className="bg-primary-soft/50 border border-primary/30 p-6 rounded-lg">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Wallet className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground">現在の月次余剰金額（見込み）</p>
                      <p className="text-3xl font-bold text-primary">{currentMonthlySurplus.toLocaleString()}円</p>
                      <p className="text-xs text-muted-foreground mt-1">年間 {annualSurplusEstimate.toLocaleString()}円</p>
                    </div>
                  </div>
                  <div className="pt-3 border-t border-primary/20">
                    <p className="text-xs text-muted-foreground">
                      💡 余剰金額は年によって変動します（教育費、追加収入、ライフイベントなど）。
                      投資ルールを決めることで、各年の余剰に応じた配分が自動計算されます。
                    </p>
                  </div>
                </div>

                <Separator />

                {/* 投資方式の選択 */}
                <div className="space-y-4">
                  <Label className="text-base">投資額の決め方</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card
                      className={`p-4 cursor-pointer transition-all border-2 ${
                        investmentMode === "fixed"
                          ? "border-primary bg-primary-soft/30"
                          : "border-border hover:border-primary/30"
                      }`}
                      onClick={() => setInvestmentMode("fixed")}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="radio"
                          checked={investmentMode === "fixed"}
                          onChange={() => setInvestmentMode("fixed")}
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <h4 className="font-semibold mb-1">毎月固定額で投資</h4>
                          <p className="text-xs text-muted-foreground">
                            毎月決まった金額を投資します。余剰が少ない年は注意が必要です。
                          </p>
                        </div>
                      </div>
                    </Card>

                    <Card
                      className={`p-4 cursor-pointer transition-all border-2 ${
                        investmentMode === "percentage"
                          ? "border-primary bg-primary-soft/30"
                          : "border-border hover:border-primary/30"
                      }`}
                      onClick={() => setInvestmentMode("percentage")}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="radio"
                          checked={investmentMode === "percentage"}
                          onChange={() => setInvestmentMode("percentage")}
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <h4 className="font-semibold mb-1">余剰の割合で投資</h4>
                          <p className="text-xs text-muted-foreground">
                            余剰金額の一定割合を投資します。年ごとの変動に柔軟に対応できます。
                          </p>
                        </div>
                      </div>
                    </Card>
                  </div>
                </div>

                {/* 投資ルールの入力 */}
                {investmentMode === "fixed" ? (
                  <div className="space-y-4">
                    <div className="bg-primary-soft/30 border border-primary/20 p-5 rounded-lg">
                      <div className="flex items-center gap-2 mb-4">
                        <TrendingUp className="w-5 h-5 text-primary" />
                        <h4 className="font-semibold">投資金額（固定額）</h4>
                      </div>
                      <InputWithUnit
                        label="毎月の投資額"
                        unit="円"
                        value={fixedAmount}
                        onChange={setFixedAmount}
                        helpText={`年間 ${annualInvestment.toLocaleString()}円`}
                      />
                    </div>

                    {isOverSurplus && (
                      <div className="p-4 bg-destructive-soft border border-destructive/30 rounded-lg flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                        <div className="text-sm">
                          <p className="font-semibold text-destructive mb-1">投資額が余剰を超えています</p>
                          <p className="text-xs text-muted-foreground">
                            毎月{monthlyInvestment.toLocaleString()}円の投資は、現在の余剰{currentMonthlySurplus.toLocaleString()}円を超えています。
                            年によっては資産を取り崩す可能性があります。
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="p-4 bg-muted/30 rounded-lg">
                      <div className="flex items-start gap-2 mb-2">
                        <Info className="w-4 h-4 text-muted-foreground mt-0.5" />
                        <p className="text-xs text-muted-foreground">
                          <strong>固定額投資の特徴:</strong> 毎月同じ金額を投資するため計画が立てやすいですが、
                          教育費が高い年など余剰が少ない時期は負担になる可能性があります。
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-primary-soft/30 border border-primary/20 p-5 rounded-lg">
                      <div className="flex items-center gap-2 mb-4">
                        <TrendingUp className="w-5 h-5 text-primary" />
                        <h4 className="font-semibold">投資割合（余剰の％）</h4>
                      </div>
                      <InputWithUnit
                        label="余剰に対する投資割合"
                        unit="%"
                        value={percentage}
                        onChange={setPercentage}
                        helpText={`現在の余剰では月 ${monthlyInvestment.toLocaleString()}円`}
                      />
                    </div>

                    <div className="p-4 bg-muted/30 rounded-lg">
                      <div className="flex items-start gap-2 mb-2">
                        <Info className="w-4 h-4 text-muted-foreground mt-0.5" />
                        <p className="text-xs text-muted-foreground">
                          <strong>割合投資の特徴:</strong> 余剰金額に応じて投資額が変動するため、
                          教育費が高い年は自動的に投資額が減り、余裕がある年は多く投資できます。
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <Separator />

                {/* 配分結果の表示 */}
                <div className="space-y-4">
                  <Label className="text-base">配分の結果（現在の余剰をもとに算出）</Label>

                  {/* 視覚化バー */}
                  <div className="h-14 flex rounded-lg overflow-hidden border-2">
                    <div
                      className="bg-primary flex flex-col items-center justify-center text-white transition-all"
                      style={{ width: `${investmentPercentage}%` }}
                    >
                      {investmentPercentage > 15 && (
                        <>
                          <span className="text-xs font-medium">投資</span>
                          <span className="text-sm font-bold">{investmentPercentage}%</span>
                        </>
                      )}
                    </div>
                    <div
                      className="bg-accent-blue flex flex-col items-center justify-center text-white transition-all"
                      style={{ width: `${savingsPercentage}%` }}
                    >
                      {savingsPercentage > 15 && (
                        <>
                          <span className="text-xs font-medium">貯蓄</span>
                          <span className="text-sm font-bold">{savingsPercentage}%</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* 金額の詳細 */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-primary-soft/30 border border-primary/20 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="w-4 h-4 text-primary" />
                        <p className="text-xs text-muted-foreground">投資（月）</p>
                      </div>
                      <p className="text-2xl font-bold text-primary">
                        {monthlyInvestment.toLocaleString()}<span className="text-sm">円</span>
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        年間 {annualInvestment.toLocaleString()}円
                      </p>
                    </div>

                    <div className="p-4 bg-accent-blue/10 border border-accent-blue/20 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <PiggyBank className="w-4 h-4 text-accent-blue" />
                        <p className="text-xs text-muted-foreground">貯蓄（月）</p>
                      </div>
                      <p className="text-2xl font-bold text-accent-blue">
                        {monthlySavings.toLocaleString()}<span className="text-sm">円</span>
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        年間 {annualSavings.toLocaleString()}円
                      </p>
                    </div>
                  </div>
                </div>

                {/* 想定利回り */}
                <div className="bg-muted/30 p-5 rounded-lg">
                  <InputWithUnit
                    label="投資の想定利回り（年率）"
                    unit="%"
                    value={expectedReturn}
                    onChange={setExpectedReturn}
                    helpText="インデックスファンドの長期平均は4〜7%程度"
                  />
                  <div className="mt-3 p-3 bg-warning-soft border border-warning/30 rounded text-xs text-muted-foreground">
                    ⚠️ 想定利回りは過去の実績を参考にした目安です。将来の運用成果を保証するものではなく、市場変動により元本割れする可能性があります。
                  </div>
                </div>

                <Separator />

                {/* 20年後の合計 */}
                <div className="bg-success-soft/50 border border-success/30 p-6 rounded-lg">
                  <h3 className="font-semibold mb-4">20年後の資産合計</h3>
                  <div className="flex items-baseline gap-2 mb-3">
                    <p className="text-4xl font-bold text-success">{totalIn20Years.toLocaleString()}</p>
                    <p className="text-lg text-muted-foreground">円</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-xs text-muted-foreground">貯蓄分</p>
                      <p className="font-semibold">{savingsIn20Years.toLocaleString()}円</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">投資分（想定）</p>
                      <p className="font-semibold">{investmentIn20Years.toLocaleString()}円</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-between mt-8">
                <Button variant="outline" onClick={handleBack}>
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  戻る
                </Button>
                <Button onClick={handleNext}>
                  シミュレーション実行
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </Card>
          </div>

          <div className="lg:col-span-1">
            <div className="sticky top-8 space-y-4">
              <SummaryCard
                title="20年後の資産見込み"
                items={[
                  {
                    label: "貯蓄分",
                    value: Math.floor(savingsIn20Years / 10000).toLocaleString(),
                    unit: "万円"
                  },
                  {
                    label: "投資分（想定）",
                    value: Math.floor(investmentIn20Years / 10000).toLocaleString(),
                    unit: "万円"
                  },
                  {
                    label: "合計",
                    value: Math.floor(totalIn20Years / 10000).toLocaleString(),
                    unit: "万円"
                  },
                  {
                    label: "想定利回り",
                    value: expectedReturn,
                    unit: "%"
                  }
                ]}
              />

              <Card className="p-4 bg-primary-soft/30 border border-primary/20">
                <h4 className="font-semibold mb-2 text-sm flex items-center gap-2">
                  <Info className="w-4 h-4" />
                  投資方式
                </h4>
                <p className="text-sm font-medium mb-1">
                  {investmentMode === "fixed" ? "毎月固定額" : "余剰の割合"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {investmentMode === "fixed"
                    ? `毎月 ${monthlyInvestment.toLocaleString()}円を投資`
                    : `余剰の ${percentage}% を投資（年ごとに変動）`}
                </p>
              </Card>

              <Card className="p-4 bg-accent-coral/10 border border-accent-coral/30">
                <h4 className="font-semibold mb-2 text-sm">💡 年ごとの変動について</h4>
                <div className="space-y-2 text-xs text-muted-foreground">
                  <p>
                    実際の余剰金額は、教育費、追加収入、ライフイベントなどにより年ごとに変動します。
                  </p>
                  <p>
                    {investmentMode === "fixed"
                      ? "固定額投資の場合、余剰が少ない年は資産取り崩しの可能性があります。"
                      : "割合投資の場合、各年の余剰に応じて投資額が自動調整されます。"}
                  </p>
                </div>
              </Card>

              <div className="p-4 bg-card rounded-xl border">
                <p className="text-sm font-medium mb-2">次のステップ</p>
                <p className="text-xs text-muted-foreground">
                  シミュレーション実行で年次推移を確認できます
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
