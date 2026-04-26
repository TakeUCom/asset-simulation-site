import { useMemo, useState } from "react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { InputWithUnit } from "./InputWithUnit";
import { SummaryCard } from "./SummaryCard";
import { StepIndicator } from "./StepIndicator";
import { Separator } from "./ui/separator";
import { Switch } from "./ui/switch";
import { Label } from "./ui/label";
import { ChevronLeft, ChevronRight, TrendingUp } from "lucide-react";

const steps = [
  { label: "基本情報", completed: true },
  { label: "家計", completed: true },
  { label: "子ども費用", completed: true },
  { label: "投資", completed: false },
  { label: "結果", completed: false }
];

interface InvestmentFormV2Props {
  monthlyDisposable: number;
  futureBudget: number;
  onNext: () => void;
  onBack: () => void;
}

/**
 * 投資設定画面のV2案。
 *
 * 現行のInvestmentFormよりも詳細な投資前提やリスク許容度を扱うための拡張候補。
 */
export function InvestmentFormV2({
  monthlyDisposable,
  futureBudget,
  onNext,
  onBack
}: InvestmentFormV2Props) {
  const initialMonthlyInvestment = Math.max(0, Math.min(50000, Math.floor(futureBudget * 0.6)));
  const [monthlyInvestment, setMonthlyInvestment] = useState(String(initialMonthlyInvestment));
  const [annualInvestment, setAnnualInvestment] = useState("200000");
  const [expectedReturn, setExpectedReturn] = useState("5");
  const [compareSavings, setCompareSavings] = useState(true);

  const monthlyInvestmentValue = Number(monthlyInvestment || 0);
  const annualInvestmentValue = Number(annualInvestment || 0);
  const monthlySavings = Math.max(0, futureBudget - monthlyInvestmentValue);
  const totalAnnualInvestment = monthlyInvestmentValue * 12 + annualInvestmentValue;

  const { estimatedIn20Years, savingsIn20Years, difference } = useMemo(() => {
    const rate = Number(expectedReturn || 0) / 100;
    const growth =
      rate > 0
        ? Math.floor(totalAnnualInvestment * ((Math.pow(1 + rate, 20) - 1) / rate))
        : totalAnnualInvestment * 20;
    const savings = totalAnnualInvestment * 20;
    return {
      estimatedIn20Years: growth,
      savingsIn20Years: savings,
      difference: growth - savings
    };
  }, [expectedReturn, totalAnnualInvestment]);

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-8 space-y-4">
          <div>
            <p className="text-sm font-medium text-primary">Step 4</p>
            <h1 className="text-3xl font-bold">余剰資金を貯蓄と投資に分ける</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              毎月の余剰資金の中から投資額を決め、残りを貯蓄として積み上げる流れが分かるようにしています。
            </p>
          </div>
          <StepIndicator steps={steps} currentStep={3} />
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Card className="p-8">
              <div className="mb-8 flex items-center gap-3">
                <TrendingUp className="h-8 w-8 text-accent-blue" />
                <div>
                  <h2 className="text-2xl font-semibold">余剰資金の配分</h2>
                  <p className="text-sm text-muted-foreground">
                    投資は余剰資金の一部として扱い、家計に無理がない前提を保ちながら配分できる見せ方にしています。
                  </p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="rounded-lg border border-accent-blue/30 bg-accent-blue/10 p-4">
                  <p className="text-sm text-foreground">
                    ここでは「毎月の余剰資金」の中から、いくらを投資に回し、残りを貯蓄として残すかを決めます。
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div className="rounded-2xl border bg-muted/40 p-4">
                    <p className="text-xs text-muted-foreground">毎月の余剰資金</p>
                    <p className="mt-1 text-lg font-semibold text-foreground">
                      {monthlyDisposable.toLocaleString()}円
                    </p>
                  </div>
                  <div className="rounded-2xl border bg-muted/40 p-4">
                    <p className="text-xs text-muted-foreground">将来資金に回す額</p>
                    <p className="mt-1 text-lg font-semibold text-foreground">
                      {futureBudget.toLocaleString()}円
                    </p>
                  </div>
                  <div className="rounded-2xl border bg-muted/40 p-4">
                    <p className="text-xs text-muted-foreground">残りバッファ</p>
                    <p className="mt-1 text-lg font-semibold text-foreground">
                      {Math.max(0, monthlyDisposable - futureBudget).toLocaleString()}円
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <InputWithUnit
                    label="毎月の投資額"
                    unit="円"
                    value={monthlyInvestment}
                    onChange={setMonthlyInvestment}
                    helpText="将来資金に回す額の中から投資へ配分する金額です。"
                  />
                  <InputWithUnit
                    label="年1回の追加投資"
                    unit="円"
                    value={annualInvestment}
                    onChange={setAnnualInvestment}
                    helpText="ボーナスから追加で投資する想定があれば入力します。"
                  />
                </div>

                <div className="rounded-2xl border border-secondary/20 bg-secondary-soft/60 p-5">
                  <p className="text-sm font-medium text-foreground">余剰資金の配分イメージ</p>
                  <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="rounded-xl border bg-white/80 p-4">
                      <p className="text-xs text-muted-foreground">毎月の貯蓄額</p>
                      <p className="mt-1 text-xl font-semibold text-foreground">
                        {monthlySavings.toLocaleString()}円
                      </p>
                      <p className="text-xs text-muted-foreground">
                        将来資金から投資額を引いた残りです。
                      </p>
                    </div>
                    <div className="rounded-xl border bg-white/80 p-4">
                      <p className="text-xs text-muted-foreground">毎月の投資額</p>
                      <p className="mt-1 text-xl font-semibold text-accent-blue">
                        {monthlyInvestmentValue.toLocaleString()}円
                      </p>
                      <p className="text-xs text-muted-foreground">
                        余剰資金の中から配分しています。
                      </p>
                    </div>
                  </div>
                </div>

                <InputWithUnit
                  label="想定利回り"
                  unit="%"
                  value={expectedReturn}
                  onChange={setExpectedReturn}
                  helpText="あくまで試算用の前提です。結果を保証するものではありません。"
                />

                <Separator />

                <div className="flex items-center justify-between rounded-lg bg-muted/50 p-4">
                  <div>
                    <Label htmlFor="compare-savings" className="text-base">
                      貯蓄だけのケースと比較する
                    </Label>
                    <p className="mt-1 text-sm text-muted-foreground">
                      投資をしない場合との差分を結果画面で比較しやすくします。
                    </p>
                  </div>
                  <Switch id="compare-savings" checked={compareSavings} onCheckedChange={setCompareSavings} />
                </div>

                <div className="space-y-4 rounded-lg bg-gradient-to-br from-accent-blue/10 to-primary-soft p-6">
                  <h3 className="text-lg font-semibold">投資シミュレーション</h3>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div>
                      <p className="mb-1 text-xs text-muted-foreground">年間の投資元本</p>
                      <p className="text-xl font-bold text-foreground">
                        {totalAnnualInvestment.toLocaleString()}円
                      </p>
                    </div>
                    <div>
                      <p className="mb-1 text-xs text-muted-foreground">20年後の想定残高</p>
                      <p className="text-xl font-bold text-accent-blue">
                        {estimatedIn20Years.toLocaleString()}円
                      </p>
                    </div>
                    <div>
                      <p className="mb-1 text-xs text-muted-foreground">貯蓄との差分</p>
                      <p className={`text-xl font-bold ${difference >= 0 ? "text-success" : "text-destructive"}`}>
                        {difference >= 0 ? "+" : ""}
                        {difference.toLocaleString()}円
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    貯蓄だけなら {savingsIn20Years.toLocaleString()}円 の前提です。
                  </p>
                </div>
              </div>

              <div className="mt-8 flex justify-between">
                <Button variant="outline" onClick={onBack}>
                  <ChevronLeft className="mr-2 h-4 w-4" />
                  戻る
                </Button>
                <Button onClick={onNext} className="bg-gradient-to-r from-primary to-accent-blue">
                  シミュレーション結果へ
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </Card>
          </div>

          <div className="lg:col-span-1">
            <div className="sticky top-8 space-y-4">
              <Card className="border-accent-blue/20 bg-accent-blue/10 p-5">
                <p className="text-sm font-medium text-foreground">ここで伝えたいこと</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  投資額は余剰資金の一部であり、残りが貯蓄になることが一目で分かる構成にしています。
                </p>
              </Card>
              <SummaryCard
                title="投資設定"
                items={[
                  { label: "毎月の投資額", value: monthlyInvestmentValue.toLocaleString(), unit: "円" },
                  { label: "毎月の貯蓄額", value: monthlySavings.toLocaleString(), unit: "円" },
                  { label: "年1回の追加投資", value: annualInvestmentValue.toLocaleString(), unit: "円" },
                  { label: "想定利回り", value: expectedReturn, unit: "%" }
                ]}
              />
              <div className="rounded-xl border bg-card p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">進行状況</p>
                  <p className="text-sm font-medium text-foreground">4 / 5</p>
                </div>
                <div className="mt-3 h-2 w-full rounded-full bg-muted">
                  <div className="h-2 rounded-full bg-primary" style={{ width: "80%" }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
