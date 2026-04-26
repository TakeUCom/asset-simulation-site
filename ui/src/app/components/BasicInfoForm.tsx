import { useState } from "react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { InputWithUnit } from "./InputWithUnit";
import { SummaryCard } from "./SummaryCard";
import { StepIndicator } from "./StepIndicator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Label } from "./ui/label";
import { ChevronRight, ChevronLeft } from "lucide-react";
import type { BasicInfoInput, Profile } from "../types";

const steps = [
  { label: "基本情報", completed: false },
  { label: "家計", completed: false },
  { label: "子ども費用", completed: false },
  { label: "ライフイベント", completed: false },
  { label: "余剰配分", completed: false },
  { label: "結果", completed: false }
];

interface BasicInfoFormProps {
  initialData: BasicInfoInput;
  profileSnapshot: Profile | null;
  onNext: (data: BasicInfoInput) => void;
  onBack?: (data: BasicInfoInput) => void;
  onEditProfile?: (data: BasicInfoInput) => void;
}

/**
 * シナリオごとの基本情報を入力するステップ画面。
 *
 * 共通プロフィールではなく、「今回比較したいシナリオ名」や「将来の子ども人数」など
 * シナリオ固有の前提を入力する入口として使う。
 */
export function BasicInfoForm({ initialData, profileSnapshot, onNext, onBack, onEditProfile }: BasicInfoFormProps) {
  const minimumChildrenCount = Math.min(4, Number.parseInt(profileSnapshot?.currentChildren ?? "0", 10) || 0);
  const normalizedInitialChildrenCount = String(
    Math.max(Number.parseInt(initialData.childrenCount || "0", 10) || 0, minimumChildrenCount)
  );

  const [scenarioName, setScenarioName] = useState(initialData.scenarioName);
  const [userAge, setUserAge] = useState(initialData.userAge);
  const [spouseAge, setSpouseAge] = useState(initialData.spouseAge);
  const [childrenCount, setChildrenCount] = useState(normalizedInitialChildrenCount);
  const [ageDifference, setAgeDifference] = useState(initialData.ageDifference);

  /**
   * 現在の入力内容を親コンポーネントへ渡して次ステップへ進む。
   */
  const handleNext = () => {
    onNext({
      scenarioName,
      userAge,
      spouseAge,
      childrenCount,
      ageDifference
    });
  };

  /**
   * 戻る操作でも入力途中の内容を親へ反映し、一覧へ戻っても再編集できるようにする。
   */
  const handleBack = () => {
    onBack?.({
      scenarioName,
      userAge,
      spouseAge,
      childrenCount,
      ageDifference
    });
  };

  /**
   * プロフィール編集へ遷移する前に、入力途中のシナリオ条件を親へ退避する。
   *
   * プロフィール編集画面から戻ったあとも、シナリオ名や子ども人数の変更が消えないようにする。
   */
  const handleEditProfile = () => {
    onEditProfile?.({
      scenarioName,
      userAge,
      spouseAge,
      childrenCount,
      ageDifference
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-6">ライフプランシミュレーション</h1>
          <StepIndicator steps={steps} currentStep={0} />
          <div className="md:hidden mt-4">
            <StepIndicator steps={steps} currentStep={0} compact />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card className="p-8">
              <h2 className="text-2xl font-semibold mb-6">シナリオ設定</h2>
              <p className="text-sm text-muted-foreground mb-6">
                このシナリオで試算したい条件を設定してください。プロフィールの内容は、このシナリオ作成時点の前提として取り込まれています。
              </p>

              <div className="space-y-6">
                <div className="bg-muted/30 p-4 rounded-lg border">
                  <h4 className="text-sm font-semibold mb-3">取り込み済みプロフィール</h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-muted-foreground text-xs">本人</p>
                      <p className="font-medium">{profileSnapshot?.userName || "本人"}さん（{profileSnapshot?.userAge || userAge}歳）</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">配偶者</p>
                      <p className="font-medium">
                        {profileSnapshot?.hasSpouse === "no" ? "なし" : `${profileSnapshot?.spouseName || "配偶者"}さん（${profileSnapshot?.spouseAge || spouseAge}歳）`}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">現在の子ども</p>
                      <p className="font-medium">{profileSnapshot?.currentChildren ?? "0"}人</p>
                    </div>
                  </div>
                  <p className="mt-3 text-xs text-muted-foreground">
                    既存シナリオにはプロフィール変更が自動反映されません。変更後の前提で試算したい場合は、新しくシナリオを作成してください。
                  </p>
                  <Button variant="ghost" size="sm" className="mt-3 h-8 text-xs" onClick={handleEditProfile}>
                    プロフィールを編集
                  </Button>
                </div>

                <div className="border-t pt-6">
                  <h4 className="font-semibold mb-4">シナリオ固有の条件</h4>

                  <div className="space-y-6">
                    <InputWithUnit
                      label="シナリオ名"
                      type="text"
                      value={scenarioName}
                      onChange={setScenarioName}
                      placeholder="例: 子ども2人_投資あり"
                      helpText="このシナリオを識別するための名前"
                    />

                    <div className="space-y-2">
                      <Label>将来の子どもの人数（想定）</Label>
                      <Select value={childrenCount} onValueChange={setChildrenCount}>
                        <SelectTrigger>
                          <SelectValue placeholder="選択してください" />
                        </SelectTrigger>
                        <SelectContent>
                          {minimumChildrenCount <= 0 && <SelectItem value="0">0人（子どもを持たない）</SelectItem>}
                          {minimumChildrenCount <= 1 && <SelectItem value="1">1人</SelectItem>}
                          {minimumChildrenCount <= 2 && <SelectItem value="2">2人</SelectItem>}
                          {minimumChildrenCount <= 3 && <SelectItem value="3">3人</SelectItem>}
                          <SelectItem value="4">4人以上</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        このシナリオで試算したい子どもの人数を選択してください
                      </p>
                      {minimumChildrenCount > 0 && (
                        <p className="text-xs text-warning">
                          現在のお子さまが{minimumChildrenCount}人いるため、それ未満の人数は選択できません。
                        </p>
                      )}
                    </div>

                    {parseInt(childrenCount) >= 2 && (
                      <InputWithUnit
                        label="第1子と第2子の年齢差"
                        unit="歳"
                        value={ageDifference}
                        onChange={setAgeDifference}
                        placeholder="3"
                        helpText="教育費のピーク時期を把握するために使用します"
                      />
                    )}
                  </div>
                </div>

                <div className="border-t pt-6">
                  <div className="bg-secondary-soft/50 p-4 rounded-lg border border-secondary/20">
                    <h4 className="font-semibold mb-2 text-sm">💡 シナリオの考え方</h4>
                    <p className="text-xs text-foreground">
                      シナリオは「もしこの条件だったら、将来どうなるか」を試算するためのものです。
                      同じ家族構成のもとで、子どもの人数や投資条件を変えて比較することで、最適なライフプランを見つけられます。
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-between mt-8">
                {onBack && (
                  <Button variant="outline" onClick={handleBack}>
                    <ChevronLeft className="w-4 h-4 mr-2" />
                    戻る
                  </Button>
                )}
                <Button onClick={handleNext} className="ml-auto">
                  次へ
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </Card>
          </div>

          <div className="lg:col-span-1">
            <div className="sticky top-8 space-y-4">
              <SummaryCard
                title="このシナリオの条件"
                items={[
                  { label: "シナリオ名", value: scenarioName.substring(0, 15) + (scenarioName.length > 15 ? "..." : ""), unit: "" },
                  { label: "将来の子ども", value: childrenCount, unit: "人" },
                  ...(parseInt(childrenCount) >= 2
                    ? [{ label: "年齢差", value: ageDifference, unit: "歳" }]
                    : [])
                ]}
              />
              <Card className="p-4 bg-primary-soft/50 border border-primary/20">
                <h4 className="font-semibold mb-2 text-sm">💡 この設定の影響</h4>
                <div className="space-y-2 text-sm text-foreground">
                  {parseInt(childrenCount) === 0 && (
                    <p>教育費がかからないため、投資や老後資金に多く回せます</p>
                  )}
                  {parseInt(childrenCount) === 1 && (
                    <p>教育費負担が比較的軽く、バランスの良い資産形成が可能です</p>
                  )}
                  {parseInt(childrenCount) === 2 && (
                    <>
                      <p>教育費のピークが{parseInt(ageDifference) > 4 ? "分散" : "重なる"}可能性があります</p>
                      <p className="text-xs text-muted-foreground">
                        年齢差が{ageDifference}歳の場合、大学進学時期が{parseInt(ageDifference) > 4 ? "ずれる" : "近い"}ため、
                        {parseInt(ageDifference) > 4 ? "長期間の負担" : "一時的に負担が集中"}します
                      </p>
                    </>
                  )}
                  {parseInt(childrenCount) >= 3 && (
                    <p className="text-warning">教育費負担が大きくなります。慎重な計画が必要です</p>
                  )}
                </div>
              </Card>
              <div className="p-4 bg-card rounded-xl border">
                <p className="text-sm font-medium mb-2">次のステップ</p>
                <p className="text-xs text-muted-foreground">
                  家計の収入と支出を入力します
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
