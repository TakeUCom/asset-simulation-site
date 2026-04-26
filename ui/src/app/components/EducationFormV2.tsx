import { useState } from "react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { InputWithUnit } from "./InputWithUnit";
import { SummaryCard } from "./SummaryCard";
import { StepIndicator } from "./StepIndicator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Label } from "./ui/label";
import { ChevronLeft, ChevronRight } from "lucide-react";

const steps = [
  { label: "基本情報", completed: true },
  { label: "家計", completed: true },
  { label: "子ども費用", completed: false },
  { label: "投資", completed: false },
  { label: "結果", completed: false }
];

type PatternKey = "public" | "mixed" | "private-high" | "private-all";

type ChildCostState = {
  pattern: PatternKey;
  preschool: string;
  elementary: string;
  juniorHigh: string;
  highSchool: string;
  university: string;
  cram: string;
  activity: string;
  livingSupport: string;
};

const presets: Record<PatternKey, Omit<ChildCostState, "pattern">> = {
  public: {
    preschool: "250000",
    elementary: "350000",
    juniorHigh: "540000",
    highSchool: "510000",
    university: "1200000",
    cram: "250000",
    activity: "120000",
    livingSupport: "360000"
  },
  mixed: {
    preschool: "400000",
    elementary: "750000",
    juniorHigh: "700000",
    highSchool: "1000000",
    university: "1400000",
    cram: "320000",
    activity: "150000",
    livingSupport: "420000"
  },
  "private-high": {
    preschool: "300000",
    elementary: "350000",
    juniorHigh: "550000",
    highSchool: "1050000",
    university: "1400000",
    cram: "280000",
    activity: "140000",
    livingSupport: "390000"
  },
  "private-all": {
    preschool: "900000",
    elementary: "1700000",
    juniorHigh: "1500000",
    highSchool: "1000000",
    university: "1600000",
    cram: "350000",
    activity: "180000",
    livingSupport: "450000"
  }
};

function makeChildState(pattern: PatternKey): ChildCostState {
  return { pattern, ...presets[pattern] };
}

function parseNumber(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function calculateChildTotal(child: ChildCostState, siblingLivingRate = 100) {
  const educationTotal =
    parseNumber(child.preschool) * 3 +
    parseNumber(child.elementary) * 6 +
    parseNumber(child.juniorHigh) * 3 +
    parseNumber(child.highSchool) * 3 +
    parseNumber(child.university) * 4 +
    parseNumber(child.cram) * 12;
  const familyRelatedTotal =
    (parseNumber(child.activity) * 18 + parseNumber(child.livingSupport) * 18) *
    (siblingLivingRate / 100);

  return Math.floor(educationTotal + familyRelatedTotal);
}

function ChildCostCard({
  title,
  child,
  onPatternChange,
  onFieldChange,
  siblingNote,
  totalCost
}: {
  title: string;
  child: ChildCostState;
  onPatternChange: (pattern: PatternKey) => void;
  onFieldChange: (field: keyof Omit<ChildCostState, "pattern">, value: string) => void;
  siblingNote?: string;
  totalCost: number;
}) {
  return (
    <div className="rounded-2xl border border-border/70 p-5">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold">{title}</h3>
          {siblingNote && <p className="mt-1 text-xs text-muted-foreground">{siblingNote}</p>}
        </div>
        <Button variant="outline" size="sm" onClick={() => onPatternChange(child.pattern)}>
          一般値を再反映
        </Button>
      </div>

      <div className="space-y-5">
        <div className="space-y-2">
          <Label>進学パターン</Label>
          <Select value={child.pattern} onValueChange={(value: PatternKey) => onPatternChange(value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="public">すべて公立中心</SelectItem>
              <SelectItem value="mixed">公立中心 + 私立大学</SelectItem>
              <SelectItem value="private-high">高校から私立中心</SelectItem>
              <SelectItem value="private-all">幼少期から私立中心</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <InputWithUnit label="保育・幼児教育" unit="円/年" value={child.preschool} onChange={(value) => onFieldChange("preschool", value)} />
          <InputWithUnit label="小学校" unit="円/年" value={child.elementary} onChange={(value) => onFieldChange("elementary", value)} />
          <InputWithUnit label="中学校" unit="円/年" value={child.juniorHigh} onChange={(value) => onFieldChange("juniorHigh", value)} />
          <InputWithUnit label="高校" unit="円/年" value={child.highSchool} onChange={(value) => onFieldChange("highSchool", value)} />
          <InputWithUnit label="大学" unit="円/年" value={child.university} onChange={(value) => onFieldChange("university", value)} />
          <InputWithUnit label="塾・受験関連" unit="円/年" value={child.cram} onChange={(value) => onFieldChange("cram", value)} />
          <InputWithUnit label="習い事・イベント" unit="円/年" value={child.activity} onChange={(value) => onFieldChange("activity", value)} />
          <InputWithUnit label="食費・衣服・医療など" unit="円/年" value={child.livingSupport} onChange={(value) => onFieldChange("livingSupport", value)} />
        </div>

        <div className="rounded-2xl border border-accent-coral/30 bg-accent-coral/10 p-4">
          <p className="text-sm font-medium text-foreground">22歳までの概算総額</p>
          <p className="mt-1 text-2xl font-bold text-accent-coral">{totalCost.toLocaleString()}円</p>
        </div>
      </div>
    </div>
  );
}

interface EducationFormV2Props {
  childrenCount: number;
  onNext: () => void;
  onBack: () => void;
}

/**
 * 教育費入力画面のV2案。
 *
 * 子ども人数を受け取り、子どもごとの教育方針をより細かく入力するための拡張候補。
 */
export function EducationFormV2({ childrenCount, onNext, onBack }: EducationFormV2Props) {
  const [child1, setChild1] = useState<ChildCostState>(makeChildState("public"));
  const [child2, setChild2] = useState<ChildCostState>(makeChildState("public"));
  const [secondChildSharedRate, setSecondChildSharedRate] = useState("70");

  const totalChild1 = calculateChildTotal(child1);
  const totalChild2 = calculateChildTotal(child2, parseNumber(secondChildSharedRate));

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-8 space-y-4">
          <div>
            <p className="text-sm font-medium text-primary">Step 3</p>
            <h1 className="text-3xl font-bold">子ども費用をまとめて見る</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              教育費だけでなく、食費や衣服、医療、習い事も含めて子ども関連費として扱います。
            </p>
          </div>
          <StepIndicator steps={steps} currentStep={2} />
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Card className="p-8">
              <div className="mb-6 rounded-2xl border border-primary/15 bg-primary-soft/30 p-5">
                <p className="text-sm font-medium text-foreground">今回の設計意図</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  第1子と第2子をタブではなく並列で比較し、2人目の生活関連費が単純な2倍にならない前提も調整できるようにしています。
                </p>
                {childrenCount >= 2 && (
                  <div className="mt-4 max-w-sm">
                    <InputWithUnit
                      label="第2子の生活関連費の増分率"
                      unit="%"
                      value={secondChildSharedRate}
                      onChange={setSecondChildSharedRate}
                      helpText="食費・衣服・イベント費などの増え方を調整します。"
                    />
                  </div>
                )}
              </div>

              <div className={`grid grid-cols-1 gap-6 ${childrenCount >= 2 ? "xl:grid-cols-2" : ""}`}>
                <ChildCostCard
                  title="第1子"
                  child={child1}
                  onPatternChange={(pattern) => setChild1(makeChildState(pattern))}
                  onFieldChange={(field, value) => setChild1({ ...child1, [field]: value })}
                  totalCost={totalChild1}
                />
                {childrenCount >= 2 && (
                  <ChildCostCard
                    title="第2子"
                    child={child2}
                    onPatternChange={(pattern) => setChild2(makeChildState(pattern))}
                    onFieldChange={(field, value) => setChild2({ ...child2, [field]: value })}
                    siblingNote={`生活関連費は第1子の ${secondChildSharedRate}% を目安に反映しています。`}
                    totalCost={totalChild2}
                  />
                )}
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
              <Card className="border-accent-coral/20 bg-accent-coral/10 p-5">
                <p className="text-sm font-medium text-foreground">一般的な数値を初期値に反映</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  進学パターンを選ぶと、一般的な費用を初期値として反映し、そのあと個別に上書きできる想定です。
                </p>
              </Card>
              <SummaryCard
                title="子ども費用サマリー"
                items={[
                  { label: "第1子の総額", value: totalChild1.toLocaleString(), unit: "円" },
                  ...(childrenCount >= 2
                    ? [{ label: "第2子の総額", value: totalChild2.toLocaleString(), unit: "円" }]
                    : []),
                  {
                    label: "合計",
                    value: (totalChild1 + (childrenCount >= 2 ? totalChild2 : 0)).toLocaleString(),
                    unit: "円"
                  }
                ]}
              />
              <div className="rounded-xl border bg-card p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">進行状況</p>
                  <p className="text-sm font-medium text-foreground">3 / 5</p>
                </div>
                <div className="mt-3 h-2 w-full rounded-full bg-muted">
                  <div className="h-2 rounded-full bg-primary" style={{ width: "60%" }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
