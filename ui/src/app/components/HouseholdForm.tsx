import { useState } from "react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { InputWithUnit } from "./InputWithUnit";
import { SummaryCard } from "./SummaryCard";
import { StepIndicator } from "./StepIndicator";
import { IncomeInputWithTakeHome } from "./IncomeInputWithTakeHome";
import { AnnualIncomeInput } from "./AnnualIncomeInput";
import { Separator } from "./ui/separator";
import { ChevronRight, ChevronLeft } from "lucide-react";
import type { HouseholdInput } from "../types";
import { estimateTakeHome, parseAmount } from "../lib/calculations";

const steps = [
  { label: "基本情報", completed: true },
  { label: "家計", completed: false },
  { label: "子ども費用", completed: false },
  { label: "ライフイベント", completed: false },
  { label: "余剰配分", completed: false },
  { label: "結果", completed: false }
];

interface HouseholdFormProps {
  initialData: HouseholdInput;
  onNext: (data: HouseholdInput) => void;
  onBack: (data: HouseholdInput) => void;
}

/**
 * 家計の収入・支出を入力するステップ画面。
 *
 * 月次収支や固定費/変動費を把握し、後続の投資・貯蓄配分で使う余剰資金の土台を作る。
 */
export function HouseholdForm({ initialData, onNext, onBack }: HouseholdFormProps) {
  const [userIncome, setUserIncome] = useState(initialData.userIncome);
  const [spouseIncome, setSpouseIncome] = useState(initialData.spouseIncome);
  const [userBonus, setUserBonus] = useState(initialData.userBonus);
  const [spouseBonus, setSpouseBonus] = useState(initialData.spouseBonus);
  const [livingExpenses, setLivingExpenses] = useState(initialData.livingExpenses);
  const [housingCost, setHousingCost] = useState(initialData.housingCost);
  const [fixedCosts, setFixedCosts] = useState(initialData.fixedCosts);
  const [monthlySavings, setMonthlySavings] = useState(initialData.monthlySavings);
  const [annualIncomes, setAnnualIncomes] = useState(initialData.annualIncomes);

  /**
   * 現在の家計入力を親コンポーネントへ保存して次ステップへ進む。
   */
  const handleNext = () => {
    onNext({
      userIncome,
      spouseIncome,
      userBonus,
      spouseBonus,
      livingExpenses,
      housingCost,
      fixedCosts,
      monthlySavings,
      annualIncomes
    });
  };

  /**
   * 戻る操作でも入力途中の家計情報を親へ保存する。
   */
  const handleBack = () => {
    onBack({
      userIncome,
      spouseIncome,
      userBonus,
      spouseBonus,
      livingExpenses,
      housingCost,
      fixedCosts,
      monthlySavings,
      annualIncomes
    });
  };

  const totalIncome = parseAmount(userIncome) + parseAmount(spouseIncome);
  const totalBonus = parseAmount(userBonus) + parseAmount(spouseBonus);
  const totalGrossIncome = totalIncome + totalBonus;
  const totalTakeHome =
    estimateTakeHome(parseAmount(userIncome) + parseAmount(userBonus)) +
    estimateTakeHome(parseAmount(spouseIncome) + parseAmount(spouseBonus));
  const monthlyTakeHome = Math.floor(totalTakeHome / 12);

  const monthlyExpenses =
    parseAmount(livingExpenses) + parseAmount(housingCost) + parseAmount(fixedCosts);
  const monthlySavingsTarget = parseAmount(monthlySavings);

  // 余剰は「手取り - 基本支出」で計算し、現金貯蓄目標はその余剰の配分先として別表示にする。
  const monthlySurplusBeforeSavings = monthlyTakeHome - monthlyExpenses;
  const monthlyRemainingAfterSavings = monthlySurplusBeforeSavings - monthlySavingsTarget;
  const yearlySurplus = monthlySurplusBeforeSavings * 12;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-6">ライフプランシミュレーション</h1>
          <StepIndicator steps={steps} currentStep={1} />
          <div className="md:hidden mt-4">
            <StepIndicator steps={steps} currentStep={1} compact />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card className="p-8">
              <h2 className="text-2xl font-semibold mb-6">家計情報</h2>
              <p className="text-sm text-muted-foreground mb-6">
                現在の収入と支出を入力してください。年次収支の基礎となる重要な情報です。
              </p>

              <div className="space-y-8">
                <div>
                  <h3 className="text-lg font-semibold mb-4">収入</h3>
                  <IncomeInputWithTakeHome
                    userIncome={userIncome}
                    spouseIncome={spouseIncome}
                    userBonus={userBonus}
                    spouseBonus={spouseBonus}
                    onUserIncomeChange={setUserIncome}
                    onSpouseIncomeChange={setSpouseIncome}
                    onUserBonusChange={setUserBonus}
                    onSpouseBonusChange={setSpouseBonus}
                  />
                </div>

                <Separator />

                <AnnualIncomeInput incomes={annualIncomes} onChange={setAnnualIncomes} />

                <Separator />

                <div>
                  <h3 className="text-lg font-semibold mb-4">支出</h3>
                  <div className="space-y-4">
                    <InputWithUnit
                      label="毎月の生活費"
                      unit="円"
                      value={livingExpenses}
                      onChange={setLivingExpenses}
                      placeholder="250000"
                      helpText="食費、日用品、光熱費など"
                    />
                    <InputWithUnit
                      label="毎月の住居費"
                      unit="円"
                      value={housingCost}
                      onChange={setHousingCost}
                      placeholder="100000"
                      helpText="家賃またはローン返済額"
                    />
                    <InputWithUnit
                      label="毎月の固定費"
                      unit="円"
                      value={fixedCosts}
                      onChange={setFixedCosts}
                      placeholder="50000"
                      helpText="通信費、保険料、サブスクなど"
                    />
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="text-lg font-semibold mb-4">貯蓄</h3>
                  <InputWithUnit
                    label="毎月の現金貯蓄目標"
                    unit="円"
                    value={monthlySavings}
                    onChange={setMonthlySavings}
                    placeholder="80000"
                    helpText="投資を除く現金貯蓄の目標額です。年次シミュレーションでは主に目標値として表示します"
                  />
                </div>

                <div className="bg-muted/50 p-6 rounded-lg">
                  <h4 className="font-semibold mb-3">月次収支サマリー（手取りベース）</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">月収（額面平均）</p>
                      <p className="text-lg font-semibold">
                        {Math.floor(totalGrossIncome / 12).toLocaleString()}円
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">月収（手取り概算）</p>
                      <p className="text-lg font-semibold text-primary">
                        {monthlyTakeHome.toLocaleString()}円
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">月支出</p>
                      <p className="text-lg font-semibold">
                        {monthlyExpenses.toLocaleString()}円
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">月次余剰（貯蓄前）</p>
                      <p
                        className={`text-lg font-semibold ${
                          monthlySurplusBeforeSavings >= 0 ? "text-success" : "text-destructive"
                        }`}
                      >
                        {monthlySurplusBeforeSavings.toLocaleString()}円
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">貯蓄目標後の残額</p>
                      <p
                        className={`text-lg font-semibold ${
                          monthlyRemainingAfterSavings >= 0 ? "text-primary" : "text-warning"
                        }`}
                      >
                        {monthlyRemainingAfterSavings.toLocaleString()}円
                      </p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-muted-foreground">年間余剰（概算）</p>
                      <p
                        className={`text-2xl font-bold ${
                          yearlySurplus >= 0 ? "text-success" : "text-destructive"
                        }`}
                      >
                        {yearlySurplus.toLocaleString()}円
                      </p>
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
                  次へ
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </Card>
          </div>

          <div className="lg:col-span-1">
            <div className="sticky top-8 space-y-4">
              <SummaryCard
                title="収支サマリー"
                items={[
                  {
                    label: "世帯年収（額面）",
                    value: Math.floor(totalGrossIncome / 10000).toLocaleString(),
                    unit: "万円"
                  },
                  {
                    label: "手取り概算（年）",
                    value: Math.floor(totalTakeHome / 10000).toLocaleString(),
                    unit: "万円"
                  },
                  {
                    label: "手取り概算（月）",
                    value: monthlyTakeHome.toLocaleString(),
                    unit: "円"
                  },
                  {
                    label: "月支出",
                    value: monthlyExpenses.toLocaleString(),
                    unit: "円"
                  },
                  {
                    label: "月次余剰（貯蓄前）",
                    value: monthlySurplusBeforeSavings.toLocaleString(),
                    unit: "円"
                  },
                  {
                    label: "貯蓄目標後の残額",
                    value: monthlyRemainingAfterSavings.toLocaleString(),
                    unit: "円"
                  }
                ]}
              />
              <Card className={`p-4 border ${
                yearlySurplus >= 3000000
                  ? "bg-success-soft border-success/30"
                  : yearlySurplus >= 1500000
                  ? "bg-primary-soft border-primary/30"
                  : "bg-warning-soft border-warning/30"
              }`}>
                <h4 className="font-semibold mb-2 text-sm">💡 家計の見通し</h4>
                <div className="space-y-2 text-sm text-foreground">
                  <p>
                    年間余剰は約<strong>{Math.floor(yearlySurplus / 10000)}万円</strong>です
                  </p>
                  {yearlySurplus >= 3000000 && (
                    <p className="text-xs text-muted-foreground">
                      教育費や投資に十分な余裕があります。将来の資産形成がしやすい状況です。
                    </p>
                  )}
                  {yearlySurplus >= 1500000 && yearlySurplus < 3000000 && (
                    <p className="text-xs text-muted-foreground">
                      標準的な余剰です。教育費ピーク時の影響を確認しましょう。
                    </p>
                  )}
                  {yearlySurplus < 1500000 && yearlySurplus >= 0 && (
                    <p className="text-xs text-warning">
                      余剰が少なめです。教育費が加わると厳しくなる可能性があります。
                    </p>
                  )}
                  {yearlySurplus < 0 && (
                    <p className="text-xs text-destructive">
                      現状で赤字です。支出の見直しが必要です。
                    </p>
                  )}
                  {yearlySurplus >= 0 && monthlyRemainingAfterSavings < 0 && (
                    <p className="text-xs text-warning">
                      現金貯蓄目標が大きいため、投資やイベント費に回せる余力はマイナスです。
                    </p>
                  )}
                </div>
              </Card>
              <div className="p-4 bg-card rounded-xl border">
                <p className="text-sm font-medium mb-2">次のステップ</p>
                <p className="text-xs text-muted-foreground">
                  お子様の教育費を設定します
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
