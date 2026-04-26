import { useState, useEffect, useRef } from "react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { InputWithUnit } from "./InputWithUnit";
import { SummaryCard } from "./SummaryCard";
import { StepIndicator } from "./StepIndicator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Label } from "./ui/label";
import { Separator } from "./ui/separator";
import { ChevronRight, ChevronLeft, Users, BookOpen, Home } from "lucide-react";
import { DEFAULT_CHILD_COSTS } from "../config/defaults";
import { EDUCATION_PATTERNS } from "../config/referenceData";
import { calculateChildCostTotal, calculateSharedCost, parseAmount } from "../lib/calculations";
import type { ChildCostInput } from "../types";
import { ChildLifeCostInput } from "./ChildLifeCostInput";

const steps = [
  { label: "基本情報", completed: true },
  { label: "家計", completed: true },
  { label: "子ども費用", completed: false },
  { label: "ライフイベント", completed: false },
  { label: "余剰配分", completed: false },
  { label: "結果", completed: false }
];

interface ChildCostFormProps {
  initialData: ChildCostInput;
  childrenCount: number;
  onNext: (data: ChildCostInput) => void;
  onBack: (data: ChildCostInput) => void;
}

/**
 * 子どもにかかる費用を入力するステップ画面。
 *
 * 教育費だけでなく生活費・イベント費も含めて、子ども人数による家計影響を見積もる。
 * 第2子は共有できる費用がある前提で、第1子比の増加率から費用を算出する。
 */
export function ChildCostForm({ initialData, childrenCount, onNext, onBack }: ChildCostFormProps) {
  // 第1子
  const [child1Pattern, setChild1Pattern] = useState<keyof typeof EDUCATION_PATTERNS>(initialData.child1Pattern as keyof typeof EDUCATION_PATTERNS);
  const [child1Preschool, setChild1Preschool] = useState(initialData.child1Preschool);
  const [child1Elementary, setChild1Elementary] = useState(initialData.child1Elementary);
  const [child1JuniorHigh, setChild1JuniorHigh] = useState(initialData.child1JuniorHigh);
  const [child1HighSchool, setChild1HighSchool] = useState(initialData.child1HighSchool);
  const [child1University, setChild1University] = useState(initialData.child1University);
  const [child1Cram, setChild1Cram] = useState(initialData.child1Cram);
  const [child1Living, setChild1Living] = useState(initialData.child1Living || DEFAULT_CHILD_COSTS.child1Living); // 年間生活費
  const [child1Events, setChild1Events] = useState(initialData.child1Events || DEFAULT_CHILD_COSTS.child1Events); // 年間イベント費
  const [child1UseDetailedLifeCosts, setChild1UseDetailedLifeCosts] = useState(initialData.child1UseDetailedLifeCosts ?? false);
  const [child1LifeCostRanges, setChild1LifeCostRanges] = useState(initialData.child1LifeCostRanges ?? []);

  // 第2子
  const [child2Pattern, setChild2Pattern] = useState<keyof typeof EDUCATION_PATTERNS>(initialData.child2Pattern as keyof typeof EDUCATION_PATTERNS);
  const [child2Preschool, setChild2Preschool] = useState(initialData.child2Preschool);
  const [child2Elementary, setChild2Elementary] = useState(initialData.child2Elementary);
  const [child2JuniorHigh, setChild2JuniorHigh] = useState(initialData.child2JuniorHigh);
  const [child2HighSchool, setChild2HighSchool] = useState(initialData.child2HighSchool);
  const [child2University, setChild2University] = useState(initialData.child2University);
  const [child2Cram, setChild2Cram] = useState(initialData.child2Cram);
  const [child2LivingRate, setChild2LivingRate] = useState(initialData.child2LivingRate || DEFAULT_CHILD_COSTS.child2LivingRate); // 第1子比での増加率（%）
  const [child2EventsRate, setChild2EventsRate] = useState(initialData.child2EventsRate || DEFAULT_CHILD_COSTS.child2EventsRate); // 第1子比での増加率（%）
  const [child2UseDetailedLifeCosts, setChild2UseDetailedLifeCosts] = useState(initialData.child2UseDetailedLifeCosts ?? false);
  const [child2LifeCostRanges, setChild2LifeCostRanges] = useState(initialData.child2LifeCostRanges ?? []);
  const shouldKeepInitialChild1Costs = useRef(Boolean(
    initialData.child1Preschool ||
    initialData.child1Elementary ||
    initialData.child1JuniorHigh ||
    initialData.child1HighSchool ||
    initialData.child1University ||
    initialData.child1Cram
  ));
  const shouldKeepInitialChild2Costs = useRef(Boolean(
    initialData.child2Preschool ||
    initialData.child2Elementary ||
    initialData.child2JuniorHigh ||
    initialData.child2HighSchool ||
    initialData.child2University ||
    initialData.child2Cram
  ));

  // 第1子のパターン選択時に初期値を反映
  useEffect(() => {
    if (shouldKeepInitialChild1Costs.current) {
      shouldKeepInitialChild1Costs.current = false;
      return;
    }
    const pattern = EDUCATION_PATTERNS[child1Pattern];
    setChild1Preschool(pattern.preschool.toString());
    setChild1Elementary(pattern.elementary.toString());
    setChild1JuniorHigh(pattern.juniorHigh.toString());
    setChild1HighSchool(pattern.highSchool.toString());
    setChild1University(pattern.university.toString());
    setChild1Cram(pattern.cram.toString());
  }, [child1Pattern]);

  // 第2子のパターン選択時に初期値を反映
  useEffect(() => {
    if (shouldKeepInitialChild2Costs.current) {
      shouldKeepInitialChild2Costs.current = false;
      return;
    }
    const pattern = EDUCATION_PATTERNS[child2Pattern];
    setChild2Preschool(pattern.preschool.toString());
    setChild2Elementary(pattern.elementary.toString());
    setChild2JuniorHigh(pattern.juniorHigh.toString());
    setChild2HighSchool(pattern.highSchool.toString());
    setChild2University(pattern.university.toString());
    setChild2Cram(pattern.cram.toString());
  }, [child2Pattern]);

  const child1Total = calculateChildCostTotal({
    preschool: parseAmount(child1Preschool),
    elementary: parseAmount(child1Elementary),
    juniorHigh: parseAmount(child1JuniorHigh),
    highSchool: parseAmount(child1HighSchool),
    university: parseAmount(child1University),
    cram: parseAmount(child1Cram),
    living: parseAmount(child1Living),
    events: parseAmount(child1Events)
  });

  const child2LivingCost = calculateSharedCost(parseAmount(child1Living), parseAmount(child2LivingRate));
  const child2EventsCost = calculateSharedCost(parseAmount(child1Events), parseAmount(child2EventsRate));

  const child2Total = calculateChildCostTotal({
    preschool: parseAmount(child2Preschool),
    elementary: parseAmount(child2Elementary),
    juniorHigh: parseAmount(child2JuniorHigh),
    highSchool: parseAmount(child2HighSchool),
    university: parseAmount(child2University),
    cram: parseAmount(child2Cram),
    living: child2LivingCost,
    events: child2EventsCost
  });

  const normalizedChildrenCount = Math.max(0, Math.min(childrenCount, 4));

  /**
   * 子ども費用の入力値を親コンポーネントへ保存して次ステップへ進む。
   */
  const buildChildCostData = (): ChildCostInput => ({
      child1Pattern,
      child1Preschool,
      child1Elementary,
      child1JuniorHigh,
      child1HighSchool,
      child1University,
      child1Cram,
      child1Living,
      child1Events,
      child1UseDetailedLifeCosts,
      child1LifeCostRanges,
      child2Pattern,
      child2Preschool,
      child2Elementary,
      child2JuniorHigh,
      child2HighSchool,
      child2University,
      child2Cram,
      child2LivingRate,
      child2EventsRate,
      child2UseDetailedLifeCosts,
      child2LifeCostRanges
    });

  /**
   * 次へ進む際に現在の入力内容を保存する。
   */
  const handleNext = () => {
    onNext(buildChildCostData());
  };

  /**
   * 戻る操作でも入力途中の内容を親へ保存する。
   */
  const handleBack = () => {
    onBack(buildChildCostData());
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-6">ライフプランシミュレーション</h1>
          <StepIndicator steps={steps} currentStep={2} />
          <div className="md:hidden mt-4">
            <StepIndicator steps={steps} currentStep={2} compact />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card className="p-8">
              <h2 className="text-2xl font-semibold mb-2">子ども費用設定</h2>
              <p className="text-sm text-muted-foreground mb-6">
                教育費だけでなく、生活費やイベント費なども含めた子ども関連費全体を設定します
              </p>

              {normalizedChildrenCount === 0 ? (
                <Card className="p-6 bg-muted/20 border-dashed">
                  <p className="text-sm text-muted-foreground">
                    このシナリオでは子ども人数が 0 人のため、子ども費用の入力は不要です。
                    必要になったら前の画面で人数を変更してください。
                  </p>
                </Card>
              ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* 第1子 */}
                <div className="space-y-6">
                  <div className="flex items-center gap-2 pb-3 border-b-2 border-primary">
                    <Users className="w-5 h-5 text-primary" />
                    <h3 className="text-lg font-semibold">第1子</h3>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>進学パターン</Label>
                      <Select
                        value={child1Pattern}
                        onValueChange={(v) => setChild1Pattern(v as keyof typeof EDUCATION_PATTERNS)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(EDUCATION_PATTERNS).map(([key, pattern]) => (
                            <SelectItem key={key} value={key}>
                              {pattern.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        一般的な費用の初期値が反映されます
                      </p>
                    </div>

                    <div className="bg-muted/30 p-4 rounded-lg">
                      <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                        <BookOpen className="w-4 h-4" />
                        学校・進学関連（年額）
                      </h4>
                      <div className="space-y-3">
                        <InputWithUnit
                          label="保育・幼児教育"
                          unit="円"
                          value={child1Preschool}
                          onChange={setChild1Preschool}
                        />
                        <InputWithUnit
                          label="小学校"
                          unit="円"
                          value={child1Elementary}
                          onChange={setChild1Elementary}
                        />
                        <InputWithUnit
                          label="中学校"
                          unit="円"
                          value={child1JuniorHigh}
                          onChange={setChild1JuniorHigh}
                        />
                        <InputWithUnit
                          label="高校"
                          unit="円"
                          value={child1HighSchool}
                          onChange={setChild1HighSchool}
                        />
                        <InputWithUnit
                          label="大学"
                          unit="円"
                          value={child1University}
                          onChange={setChild1University}
                        />
                        <InputWithUnit
                          label="塾・習い事"
                          unit="円"
                          value={child1Cram}
                          onChange={setChild1Cram}
                          helpText="小〜高校の平均年額"
                        />
                      </div>
                    </div>

                    <ChildLifeCostInput
                      useDetailedSettings={child1UseDetailedLifeCosts}
                      simpleLiving={child1Living}
                      simpleEvents={child1Events}
                      ageRanges={child1LifeCostRanges}
                      onUseDetailedSettingsChange={setChild1UseDetailedLifeCosts}
                      onSimpleLivingChange={setChild1Living}
                      onSimpleEventsChange={setChild1Events}
                      onAgeRangesChange={setChild1LifeCostRanges}
                    />
                  </div>
                </div>

                {/* 第2子 */}
                {normalizedChildrenCount >= 2 && (
                <div className="space-y-6">
                  <div className="flex items-center gap-2 pb-3 border-b-2 border-accent-blue">
                    <Users className="w-5 h-5 text-accent-blue" />
                    <h3 className="text-lg font-semibold">
                      {normalizedChildrenCount >= 3 ? "第2子以降の共通設定" : "第2子"}
                    </h3>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>進学パターン</Label>
                      <Select
                        value={child2Pattern}
                        onValueChange={(v) => setChild2Pattern(v as keyof typeof EDUCATION_PATTERNS)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(EDUCATION_PATTERNS).map(([key, pattern]) => (
                            <SelectItem key={key} value={key}>
                              {pattern.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        一般的な費用の初期値が反映されます
                      </p>
                    </div>

                    <div className="bg-muted/30 p-4 rounded-lg">
                      <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                        <BookOpen className="w-4 h-4" />
                        学校・進学関連（年額）
                      </h4>
                      <div className="space-y-3">
                        <InputWithUnit
                          label="保育・幼児教育"
                          unit="円"
                          value={child2Preschool}
                          onChange={setChild2Preschool}
                        />
                        <InputWithUnit
                          label="小学校"
                          unit="円"
                          value={child2Elementary}
                          onChange={setChild2Elementary}
                        />
                        <InputWithUnit
                          label="中学校"
                          unit="円"
                          value={child2JuniorHigh}
                          onChange={setChild2JuniorHigh}
                        />
                        <InputWithUnit
                          label="高校"
                          unit="円"
                          value={child2HighSchool}
                          onChange={setChild2HighSchool}
                        />
                        <InputWithUnit
                          label="大学"
                          unit="円"
                          value={child2University}
                          onChange={setChild2University}
                        />
                        <InputWithUnit
                          label="塾・習い事"
                          unit="円"
                          value={child2Cram}
                          onChange={setChild2Cram}
                          helpText="小〜高校の平均年額"
                        />
                      </div>
                    </div>

                    <div className="bg-secondary-soft/30 p-4 rounded-lg">
                      <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                        <Home className="w-4 h-4" />
                        日常生活関連（第1子比）
                      </h4>
                      <div className="space-y-3">
                        <InputWithUnit
                          label="生活費増加率"
                          unit="%"
                          value={child2LivingRate}
                          onChange={setChild2LivingRate}
                          helpText={`第1子の${child2LivingRate}%（約${child2LivingCost.toLocaleString()}円/年）`}
                        />
                        <InputWithUnit
                          label="イベント費増加率"
                          unit="%"
                          value={child2EventsRate}
                          onChange={setChild2EventsRate}
                          helpText={`第1子の${child2EventsRate}%（約${child2EventsCost.toLocaleString()}円/年）`}
                        />
                        <p className="text-xs text-muted-foreground pt-2">
                          💡 第2子以降は共有できる部分があるため、生活費やイベント費は第1子より少なく見積もれます
                        </p>
                      </div>
                    </div>
                    <ChildLifeCostInput
                      useDetailedSettings={child2UseDetailedLifeCosts}
                      simpleLiving={child2LivingCost.toString()}
                      simpleEvents={child2EventsCost.toString()}
                      ageRanges={child2LifeCostRanges}
                      onUseDetailedSettingsChange={setChild2UseDetailedLifeCosts}
                      onSimpleLivingChange={() => undefined}
                      onSimpleEventsChange={() => undefined}
                      onAgeRangesChange={setChild2LifeCostRanges}
                    />
                  </div>
                </div>
                )}
              </div>
              )}

              {normalizedChildrenCount >= 3 && (
                <Card className="mt-6 p-4 bg-primary-soft/20 border border-primary/20">
                  <h4 className="font-semibold mb-2 text-sm">第3子・第4子の扱い</h4>
                  <p className="text-xs text-muted-foreground">
                    現在の実装では、第3子以降の教育費・生活費は「第2子以降の共通設定」を適用して計算します。
                    人数に応じて結果計算には反映されます。
                  </p>
                </Card>
              )}

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
                title="子ども費用合計"
                items={[
                  {
                    label: "第1子 総額",
                    value: Math.floor(child1Total / 10000).toLocaleString(),
                    unit: "万円"
                  },
                  ...(normalizedChildrenCount >= 2 ? [{
                    label: "第2子 総額",
                    value: Math.floor(child2Total / 10000).toLocaleString(),
                    unit: "万円"
                  }] : []),
                  ...(normalizedChildrenCount >= 3 ? [{
                    label: "第3子以降/人",
                    value: Math.floor(child2Total / 10000).toLocaleString(),
                    unit: "万円"
                  }] : []),
                  {
                    label: "合計",
                    value: Math.floor((
                      child1Total +
                      Math.max(0, normalizedChildrenCount - 1) * child2Total
                    ) / 10000).toLocaleString(),
                    unit: "万円"
                  }
                ]}
              />
              <Card className="p-4 bg-accent-coral/10 border border-accent-coral/30">
                <h4 className="font-semibold mb-2 text-sm">💡 子ども費用について</h4>
                <div className="space-y-2 text-sm text-foreground">
                  <p className="text-xs text-muted-foreground">
                    教育費だけでなく、日常の生活費増加分やイベント費も含めた総額です。
                    0歳〜22歳（大学卒業）までの合計を試算しています。
                  </p>
                </div>
              </Card>
              <div className="p-4 bg-card rounded-xl border">
                <p className="text-sm font-medium mb-2">次のステップ</p>
                <p className="text-xs text-muted-foreground">
                  余剰資金の貯蓄・投資配分を設定します
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
