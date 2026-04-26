import { useState } from "react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { InputWithUnit } from "./InputWithUnit";
import { SummaryCard } from "./SummaryCard";
import { StepIndicator } from "./StepIndicator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Label } from "./ui/label";
import { ChevronRight, ChevronLeft } from "lucide-react";

const steps = [
  { label: "基本情報", completed: true },
  { label: "家計", completed: true },
  { label: "教育費", completed: false },
  { label: "投資", completed: false },
  { label: "結果", completed: false }
];

interface EducationFormProps {
  onNext: () => void;
  onBack: () => void;
}

/**
 * 教育費に特化した入力ステップ。
 *
 * 現在のメインフローではChildCostFormに役割を統合しつつあるが、
 * 教育費のみを分けて入力するUI案として利用できる。
 */
export function EducationForm({ onNext, onBack }: EducationFormProps) {
  const [child1Pattern, setChild1Pattern] = useState("public");
  const [child1Elementary, setChild1Elementary] = useState("300000");
  const [child1JuniorHigh, setChild1JuniorHigh] = useState("400000");
  const [child1HighSchool, setChild1HighSchool] = useState("450000");
  const [child1University, setChild1University] = useState("1000000");
  const [child1Cram, setChild1Cram] = useState("200000");

  const [child2Pattern, setChild2Pattern] = useState("public");
  const [child2Elementary, setChild2Elementary] = useState("300000");
  const [child2JuniorHigh, setChild2JuniorHigh] = useState("400000");
  const [child2HighSchool, setChild2HighSchool] = useState("450000");
  const [child2University, setChild2University] = useState("1000000");
  const [child2Cram, setChild2Cram] = useState("200000");

  const totalChild1 =
    parseInt(child1Elementary) +
    parseInt(child1JuniorHigh) +
    parseInt(child1HighSchool) +
    parseInt(child1University) * 4 +
    parseInt(child1Cram) * 12;

  const totalChild2 =
    parseInt(child2Elementary) +
    parseInt(child2JuniorHigh) +
    parseInt(child2HighSchool) +
    parseInt(child2University) * 4 +
    parseInt(child2Cram) * 12;

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
              <h2 className="text-2xl font-semibold mb-6">教育費設定</h2>
              <p className="text-sm text-muted-foreground mb-6">
                お子様ごとの進学前提と教育費を設定してください。年齢別の費用を入力することで、ピーク時期を把握できます。
              </p>

              <Tabs defaultValue="child1" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="child1">第1子</TabsTrigger>
                  <TabsTrigger value="child2">第2子</TabsTrigger>
                </TabsList>

                <TabsContent value="child1" className="space-y-6 mt-6">
                  <div className="space-y-2">
                    <Label>進学パターン</Label>
                    <Select value={child1Pattern} onValueChange={setChild1Pattern}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="public">すべて公立</SelectItem>
                        <SelectItem value="mixed">公立 + 私立大学</SelectItem>
                        <SelectItem value="private-high">私立高校 + 私立大学</SelectItem>
                        <SelectItem value="private-all">すべて私立</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-4">
                    <InputWithUnit
                      label="小学校（年額）"
                      unit="円"
                      value={child1Elementary}
                      onChange={setChild1Elementary}
                      placeholder="300000"
                      helpText="6年間の平均年額"
                    />
                    <InputWithUnit
                      label="中学校（年額）"
                      unit="円"
                      value={child1JuniorHigh}
                      onChange={setChild1JuniorHigh}
                      placeholder="400000"
                      helpText="3年間の平均年額"
                    />
                    <InputWithUnit
                      label="高校（年額）"
                      unit="円"
                      value={child1HighSchool}
                      onChange={setChild1HighSchool}
                      placeholder="450000"
                      helpText="3年間の平均年額"
                    />
                    <InputWithUnit
                      label="大学（年額）"
                      unit="円"
                      value={child1University}
                      onChange={setChild1University}
                      placeholder="1000000"
                      helpText="4年間の平均年額"
                    />
                    <InputWithUnit
                      label="塾・習い事（年額）"
                      unit="円"
                      value={child1Cram}
                      onChange={setChild1Cram}
                      placeholder="200000"
                      helpText="小学校から高校までの平均年額"
                    />
                  </div>

                  <div className="bg-accent-coral/10 border border-accent-coral/30 p-4 rounded-lg">
                    <p className="text-sm font-medium text-foreground mb-1">教育費総額（概算）</p>
                    <p className="text-2xl font-bold text-accent-coral">
                      {totalChild1.toLocaleString()}円
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      小学校〜大学卒業までの合計
                    </p>
                  </div>
                </TabsContent>

                <TabsContent value="child2" className="space-y-6 mt-6">
                  <div className="space-y-2">
                    <Label>進学パターン</Label>
                    <Select value={child2Pattern} onValueChange={setChild2Pattern}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="public">すべて公立</SelectItem>
                        <SelectItem value="mixed">公立 + 私立大学</SelectItem>
                        <SelectItem value="private-high">私立高校 + 私立大学</SelectItem>
                        <SelectItem value="private-all">すべて私立</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-4">
                    <InputWithUnit
                      label="小学校（年額）"
                      unit="円"
                      value={child2Elementary}
                      onChange={setChild2Elementary}
                      placeholder="300000"
                      helpText="6年間の平均年額"
                    />
                    <InputWithUnit
                      label="中学校（年額）"
                      unit="円"
                      value={child2JuniorHigh}
                      onChange={setChild2JuniorHigh}
                      placeholder="400000"
                      helpText="3年間の平均年額"
                    />
                    <InputWithUnit
                      label="高校（年額）"
                      unit="円"
                      value={child2HighSchool}
                      onChange={setChild2HighSchool}
                      placeholder="450000"
                      helpText="3年間の平均年額"
                    />
                    <InputWithUnit
                      label="大学（年額）"
                      unit="円"
                      value={child2University}
                      onChange={setChild2University}
                      placeholder="1000000"
                      helpText="4年間の平均年額"
                    />
                    <InputWithUnit
                      label="塾・習い事（年額）"
                      unit="円"
                      value={child2Cram}
                      onChange={setChild2Cram}
                      placeholder="200000"
                      helpText="小学校から高校までの平均年額"
                    />
                  </div>

                  <div className="bg-accent-coral/10 border border-accent-coral/30 p-4 rounded-lg">
                    <p className="text-sm font-medium text-foreground mb-1">教育費総額（概算）</p>
                    <p className="text-2xl font-bold text-accent-coral">
                      {totalChild2.toLocaleString()}円
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      小学校〜大学卒業までの合計
                    </p>
                  </div>
                </TabsContent>
              </Tabs>

              <div className="flex justify-between mt-8">
                <Button variant="outline" onClick={onBack}>
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  戻る
                </Button>
                <Button onClick={onNext}>
                  次へ
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </Card>
          </div>

          <div className="lg:col-span-1">
            <div className="sticky top-8 space-y-4">
              <SummaryCard
                title="教育費サマリー"
                items={[
                  {
                    label: "第1子 総額",
                    value: Math.floor(totalChild1 / 10000).toLocaleString(),
                    unit: "万円"
                  },
                  {
                    label: "第2子 総額",
                    value: Math.floor(totalChild2 / 10000).toLocaleString(),
                    unit: "万円"
                  },
                  {
                    label: "合計",
                    value: Math.floor((totalChild1 + totalChild2) / 10000).toLocaleString(),
                    unit: "万円"
                  }
                ]}
              />
              <Card className="p-4 bg-accent-coral/10 border border-accent-coral/30">
                <h4 className="font-semibold mb-2 text-sm">💡 教育費の影響</h4>
                <div className="space-y-2 text-sm text-foreground">
                  <p>
                    教育費総額は約<strong>{Math.floor((totalChild1 + totalChild2) / 10000)}万円</strong>です
                  </p>
                  <p className="text-xs text-muted-foreground">
                    大学進学時期が重なると、年間240〜360万円の負担が発生します。
                    結果画面でピーク時期の家計余剰を確認しましょう。
                  </p>
                  {parseInt(child1University) >= 1500000 && (
                    <p className="text-xs text-warning mt-2">
                      私立大学の場合、4年間で約600〜800万円が必要になります
                    </p>
                  )}
                </div>
              </Card>
              <div className="p-4 bg-card rounded-xl border">
                <p className="text-sm font-medium mb-2">次のステップ</p>
                <p className="text-xs text-muted-foreground">
                  投資の条件を設定します
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
