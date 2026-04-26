import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { InputWithUnit } from "./InputWithUnit";
import { SummaryCard } from "./SummaryCard";
import { StepIndicator } from "./StepIndicator";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { CommonProfile, HouseholdConfig } from "../App";

const steps = [
  { label: "基本情報", completed: true },
  { label: "家計", completed: false },
  { label: "子ども費用", completed: false },
  { label: "投資", completed: false },
  { label: "結果", completed: false }
];

interface HouseholdFormV2Props {
  commonProfile: CommonProfile;
  householdConfig: HouseholdConfig;
  onChange: (config: HouseholdConfig) => void;
  onNext: () => void;
  onBack: () => void;
}

function parseNumber(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function estimateTakeHome(gross: number) {
  return Math.floor(gross * 0.78);
}

/**
 * 家計入力画面のV2案。
 *
 * 現行画面よりも詳細な収支入力・可処分所得の扱いへ拡張するための候補として残している。
 */
export function HouseholdFormV2({
  commonProfile,
  householdConfig,
  onChange,
  onNext,
  onBack
}: HouseholdFormV2Props) {
  const grossIncome =
    parseNumber(commonProfile.userIncome) +
    parseNumber(commonProfile.spouseIncome) +
    parseNumber(commonProfile.userBonus) +
    parseNumber(commonProfile.spouseBonus);
  const takeHome =
    estimateTakeHome(parseNumber(commonProfile.userIncome) + parseNumber(commonProfile.userBonus)) +
    estimateTakeHome(parseNumber(commonProfile.spouseIncome) + parseNumber(commonProfile.spouseBonus));
  const monthlyExpenses =
    parseNumber(householdConfig.livingExpenses) +
    parseNumber(householdConfig.housingCost) +
    parseNumber(householdConfig.fixedCosts);
  const monthlyDisposable = Math.floor(takeHome / 12) - monthlyExpenses;
  const futureBudget = parseNumber(householdConfig.futureBudget);
  const monthlyBuffer = monthlyDisposable - futureBudget;

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-8 space-y-4">
          <div>
            <p className="text-sm font-medium text-primary">Step 2</p>
            <h1 className="text-3xl font-bold">家計の余剰資金を見える化する</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              年収から概算手取りを出し、固定支出を引いたあとに毎月どれだけ将来資金へ回せるかを確認します。
            </p>
          </div>
          <StepIndicator steps={steps} currentStep={1} />
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Card className="p-8">
              <div className="space-y-8">
                <div className="rounded-2xl border border-border/70 p-5">
                  <h3 className="mb-4 text-lg font-semibold">共通プロフィールから読み込む収入</h3>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="rounded-2xl border bg-muted/30 p-4">
                      <p className="text-xs text-muted-foreground">本人</p>
                      <p className="mt-1 font-semibold text-foreground">
                        年収 {Math.floor(parseNumber(commonProfile.userIncome) / 10000).toLocaleString()}万円
                      </p>
                      <p className="text-sm text-muted-foreground">
                        概算手取り {Math.floor(estimateTakeHome(parseNumber(commonProfile.userIncome)) / 10000).toLocaleString()}万円 / 年
                      </p>
                    </div>
                    <div className="rounded-2xl border bg-muted/30 p-4">
                      <p className="text-xs text-muted-foreground">配偶者</p>
                      <p className="mt-1 font-semibold text-foreground">
                        年収 {Math.floor(parseNumber(commonProfile.spouseIncome) / 10000).toLocaleString()}万円
                      </p>
                      <p className="text-sm text-muted-foreground">
                        概算手取り {Math.floor(estimateTakeHome(parseNumber(commonProfile.spouseIncome)) / 10000).toLocaleString()}万円 / 年
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 rounded-2xl border border-primary/15 bg-primary-soft/40 p-4">
                    <p className="text-xs text-muted-foreground">世帯の概算手取り</p>
                    <p className="mt-1 text-xl font-semibold text-foreground">
                      {Math.floor(takeHome / 10000).toLocaleString()}万円 / 年
                    </p>
                    <p className="text-sm text-muted-foreground">
                      ボーナス込みで月あたり {Math.floor(takeHome / 12).toLocaleString()}円 を前提に計算します。
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl border border-border/70 p-5">
                  <h3 className="mb-4 text-lg font-semibold">毎月の固定支出</h3>
                  <div className="space-y-4">
                    <InputWithUnit
                      label="生活費"
                      unit="円"
                      value={householdConfig.livingExpenses}
                      onChange={(value) => onChange({ ...householdConfig, livingExpenses: value })}
                      helpText="食費、日用品、通信費など毎月ベースの支出をまとめます。"
                    />
                    <InputWithUnit
                      label="住居費"
                      unit="円"
                      value={householdConfig.housingCost}
                      onChange={(value) => onChange({ ...householdConfig, housingCost: value })}
                      helpText="家賃やローン返済、管理費などを入れます。"
                    />
                    <InputWithUnit
                      label="その他固定費"
                      unit="円"
                      value={householdConfig.fixedCosts}
                      onChange={(value) => onChange({ ...householdConfig, fixedCosts: value })}
                      helpText="保険、サブスク、車関連など毎月固定で出る費用です。"
                    />
                  </div>
                </div>

                <div className="rounded-2xl border border-border/70 p-5">
                  <h3 className="mb-4 text-lg font-semibold">将来資金に回す余剰資金</h3>
                  <InputWithUnit
                    label="毎月の余剰資金"
                    unit="円"
                    value={householdConfig.futureBudget}
                    onChange={(value) => onChange({ ...householdConfig, futureBudget: value })}
                    helpText="次の画面で、この金額を貯蓄と投資にどう配分するか決めます。"
                  />
                  <div className="mt-4 rounded-2xl border border-secondary/20 bg-secondary-soft/50 p-4">
                    <p className="text-sm font-medium text-foreground">見せたい考え方</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      まず家計で残る余剰資金を出し、その範囲で貯蓄と投資を配分する流れにしています。
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl border bg-muted/50 p-6">
                  <h4 className="mb-3 font-semibold">毎月の家計サマリー</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">世帯年収</p>
                      <p className="text-lg font-semibold">{grossIncome.toLocaleString()}円</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">概算月手取り</p>
                      <p className="text-lg font-semibold">{Math.floor(takeHome / 12).toLocaleString()}円</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">毎月の固定支出</p>
                      <p className="text-lg font-semibold">{monthlyExpenses.toLocaleString()}円</p>
                    </div>
                    <div>
                      <p className={`text-muted-foreground`}>毎月の余剰資金</p>
                      <p className={`text-lg font-semibold ${monthlyDisposable >= 0 ? "text-success" : "text-destructive"}`}>
                        {monthlyDisposable.toLocaleString()}円
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">将来資金へ回す額</p>
                      <p className="text-lg font-semibold">{futureBudget.toLocaleString()}円</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">残りバッファ</p>
                      <p className={`text-lg font-semibold ${monthlyBuffer >= 0 ? "text-success" : "text-destructive"}`}>
                        {monthlyBuffer.toLocaleString()}円
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex justify-between">
                <Button variant="outline" onClick={onBack}>
                  <ChevronLeft className="mr-2 h-4 w-4" />
                  戻る
                </Button>
                <Button onClick={onNext}>
                  次へ
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </Card>
          </div>

          <div className="lg:col-span-1">
            <div className="sticky top-8 space-y-4">
              <Card className="border-secondary/25 bg-secondary-soft/70 p-5">
                <p className="text-sm font-medium text-foreground">判断しやすくした点</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  年収入力から概算手取りを見せ、そこから余剰資金がどれくらい生まれるかがすぐ分かる構成にしています。
                </p>
              </Card>
              <SummaryCard
                title="家計サマリー"
                items={[
                  { label: "世帯年収", value: Math.floor(grossIncome / 10000).toLocaleString(), unit: "万円" },
                  { label: "概算手取り", value: Math.floor(takeHome / 10000).toLocaleString(), unit: "万円" },
                  { label: "毎月の余剰資金", value: monthlyDisposable.toLocaleString(), unit: "円" },
                  { label: "将来資金へ回す額", value: futureBudget.toLocaleString(), unit: "円" }
                ]}
              />
              <div className="rounded-xl border bg-card p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">進行状況</p>
                  <p className="text-sm font-medium text-foreground">2 / 5</p>
                </div>
                <div className="mt-3 h-2 w-full rounded-full bg-muted">
                  <div className="h-2 rounded-full bg-primary" style={{ width: "40%" }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
