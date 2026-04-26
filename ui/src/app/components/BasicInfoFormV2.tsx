import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { InputWithUnit } from "./InputWithUnit";
import { SummaryCard } from "./SummaryCard";
import { StepIndicator } from "./StepIndicator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
import { ChevronLeft, ChevronRight, Sparkles, Users } from "lucide-react";
import type { CommonProfile, ScenarioConfig } from "../App";

const steps = [
  { label: "基本情報", completed: false },
  { label: "家計", completed: false },
  { label: "子ども費用", completed: false },
  { label: "投資", completed: false },
  { label: "結果", completed: false }
];

interface BasicInfoFormV2Props {
  commonProfile: CommonProfile;
  scenarioConfig: ScenarioConfig;
  onChange: (config: ScenarioConfig) => void;
  onNext: () => void;
  onBack?: () => void;
}

/**
 * 基本情報入力画面のV2案。
 *
 * 現在のルート画面では未使用だが、より詳細なシナリオ入力へ拡張するための候補として残している。
 */
export function BasicInfoFormV2({
  commonProfile,
  scenarioConfig,
  onChange,
  onNext,
  onBack
}: BasicInfoFormV2Props) {
  const childrenCount = parseInt(scenarioConfig.childrenCount || "0", 10);

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-8 space-y-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-medium text-primary">Step 1</p>
              <h1 className="text-3xl font-bold">シナリオの前提を決める</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                年齢や年収は共通プロフィールとして固定し、この画面ではシナリオ差分だけを設定します。
              </p>
            </div>
            <Badge variant="secondary" className="w-fit bg-secondary-soft text-foreground">
              比較しやすい情報設計
            </Badge>
          </div>
          <StepIndicator steps={steps} currentStep={0} />
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Card className="p-8">
              <div className="mb-8 grid gap-4 rounded-2xl border border-primary/15 bg-primary-soft/50 p-5 md:grid-cols-[1fr_auto] md:items-center">
                <div>
                  <div className="mb-2 flex items-center gap-2 text-foreground">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <p className="text-sm font-semibold">今回の方針</p>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    シナリオごとに変えるのは子どもの人数や年齢差などに絞り、固定情報は共通プロフィールで管理します。
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="bg-white">子ども人数</Badge>
                  <Badge variant="outline" className="bg-white">年齢差</Badge>
                  <Badge variant="outline" className="bg-white">投資配分</Badge>
                </div>
              </div>

              <div className="space-y-6">
                <div className="rounded-2xl border border-border/70 p-5">
                  <InputWithUnit
                    label="シナリオ名"
                    type="text"
                    value={scenarioConfig.scenarioName}
                    onChange={(value) => onChange({ ...scenarioConfig, scenarioName: value })}
                    placeholder="例: 子ども2人_投資あり"
                    helpText="一覧で見たときに違いが分かる名前にします。"
                  />
                </div>

                <div className="rounded-2xl border border-border/70 p-5">
                  <div className="mb-4 flex items-center gap-2">
                    <Users className="h-4 w-4 text-primary" />
                    <h3 className="text-base font-semibold">共通プロフィールを参照</h3>
                  </div>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div className="rounded-xl border bg-muted/30 p-4">
                      <p className="text-xs text-muted-foreground">年齢</p>
                      <p className="mt-1 font-semibold text-foreground">
                        {commonProfile.userAge}歳 / {commonProfile.spouseAge}歳
                      </p>
                    </div>
                    <div className="rounded-xl border bg-muted/30 p-4">
                      <p className="text-xs text-muted-foreground">本人年収</p>
                      <p className="mt-1 font-semibold text-foreground">
                        {Math.floor(Number(commonProfile.userIncome || 0) / 10000).toLocaleString()}万円
                      </p>
                    </div>
                    <div className="rounded-xl border bg-muted/30 p-4">
                      <p className="text-xs text-muted-foreground">配偶者年収</p>
                      <p className="mt-1 font-semibold text-foreground">
                        {Math.floor(Number(commonProfile.spouseIncome || 0) / 10000).toLocaleString()}万円
                      </p>
                    </div>
                  </div>
                  <p className="mt-3 text-xs text-muted-foreground">
                    共通プロフィールは一覧画面から編集できます。ここではシナリオ差分に集中できるようにしています。
                  </p>
                </div>

                <div className="rounded-2xl border border-border/70 p-5">
                  <div className="space-y-2">
                    <Label>子どもの人数</Label>
                    <Select
                      value={scenarioConfig.childrenCount}
                      onValueChange={(value) => onChange({ ...scenarioConfig, childrenCount: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="選択してください" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">0人</SelectItem>
                        <SelectItem value="1">1人</SelectItem>
                        <SelectItem value="2">2人</SelectItem>
                        <SelectItem value="3">3人</SelectItem>
                        <SelectItem value="4">4人以上</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      人数に応じて、次の画面で表示する子ども費用の入力ブロック数が変わります。
                    </p>
                  </div>

                  {childrenCount >= 2 && (
                    <div className="mt-5">
                      <InputWithUnit
                        label="第1子と第2子の年齢差"
                        unit="歳"
                        value={scenarioConfig.ageDifference}
                        onChange={(value) => onChange({ ...scenarioConfig, ageDifference: value })}
                        placeholder="3"
                        helpText="教育費ピークの重なり方を見るための目安として使います。"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-8 flex justify-between">
                {onBack && (
                  <Button variant="outline" onClick={onBack}>
                    <ChevronLeft className="mr-2 h-4 w-4" />
                    戻る
                  </Button>
                )}
                <Button onClick={onNext} className="ml-auto">
                  次へ
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </Card>
          </div>

          <div className="lg:col-span-1">
            <div className="sticky top-8 space-y-4">
              <Card className="border-primary/20 bg-primary-soft/30 p-5">
                <p className="text-sm font-medium text-foreground">ここで決めること</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  固定情報とシナリオ差分を分けることで、子ども人数ごとの比較がしやすくなります。
                </p>
              </Card>
              <SummaryCard
                title="今回の設定"
                items={[
                  { label: "本人年齢", value: commonProfile.userAge, unit: "歳" },
                  { label: "配偶者年齢", value: commonProfile.spouseAge, unit: "歳" },
                  { label: "子どもの人数", value: scenarioConfig.childrenCount, unit: "人" },
                  ...(childrenCount >= 2
                    ? [{ label: "年齢差", value: scenarioConfig.ageDifference, unit: "歳" }]
                    : [])
                ]}
              />
              <div className="rounded-xl border bg-card p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">進行状況</p>
                  <p className="text-sm font-medium text-foreground">1 / 5</p>
                </div>
                <div className="mt-3 h-2 w-full rounded-full bg-muted">
                  <div className="h-2 rounded-full bg-primary" style={{ width: "20%" }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
