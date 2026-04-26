import { useState } from "react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { InputWithUnit } from "./InputWithUnit";
import { IncomeInputWithTakeHome } from "./IncomeInputWithTakeHome";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Label } from "./ui/label";
import { Separator } from "./ui/separator";
import { ChevronRight, User, Users, Wallet } from "lucide-react";
import { DEFAULT_PROFILE } from "../config/defaults";
import type { Profile } from "../types";

interface ProfileSetupProps {
  initialProfile?: Profile | null;
  onComplete: (profile: Profile) => void;
}

/**
 * 全シナリオで共通利用するプロフィールを設定する画面。
 *
 * 本人・配偶者・現在の子ども・基本収入を保存し、シナリオごとに毎回入力しなくてよい固定前提を作る。
 */
export function ProfileSetup({ initialProfile, onComplete }: ProfileSetupProps) {
  const profileDefaults = initialProfile ?? DEFAULT_PROFILE;
  const [userName, setUserName] = useState(profileDefaults.userName);
  const [userAge, setUserAge] = useState(profileDefaults.userAge);
  const [spouseName, setSpouseName] = useState(profileDefaults.spouseName);
  const [spouseAge, setSpouseAge] = useState(profileDefaults.spouseAge);
  const [hasSpouse, setHasSpouse] = useState(profileDefaults.hasSpouse);
  const [currentChildren, setCurrentChildren] = useState(profileDefaults.currentChildren);
  const [child1Name, setChild1Name] = useState(profileDefaults.child1Name);
  const [child1Age, setChild1Age] = useState(profileDefaults.child1Age);
  const [child2Name, setChild2Name] = useState(profileDefaults.child2Name);
  const [child2Age, setChild2Age] = useState(profileDefaults.child2Age);

  // 年収情報を追加
  const [userIncome, setUserIncome] = useState(profileDefaults.userIncome);
  const [spouseIncome, setSpouseIncome] = useState(profileDefaults.spouseIncome);
  const [userBonus, setUserBonus] = useState(profileDefaults.userBonus);
  const [spouseBonus, setSpouseBonus] = useState(profileDefaults.spouseBonus);

  const handleComplete = () => {
    onComplete({
      userName,
      userAge,
      spouseName,
      spouseAge,
      hasSpouse,
      currentChildren,
      child1Name,
      child1Age,
      child2Name,
      child2Age,
      userIncome,
      spouseIncome,
      userBonus,
      spouseBonus
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">プロフィール設定</h1>
          <p className="text-muted-foreground">
            家族構成と基本情報を設定します。新規シナリオ作成時は、この内容を初期値として取り込みます。
          </p>
        </div>

        <div className="space-y-6">
          <Card className="p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">あなたの情報</h2>
                <p className="text-sm text-muted-foreground">本人の基本情報</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <InputWithUnit
                label="お名前（任意）"
                type="text"
                value={userName}
                onChange={setUserName}
                placeholder="太郎"
                helpText="シミュレーション結果で表示されます"
              />
              <InputWithUnit
                label="現在の年齢"
                unit="歳"
                value={userAge}
                onChange={setUserAge}
                placeholder="35"
                required
              />
            </div>
          </Card>

          <Card className="p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-full bg-secondary/20 flex items-center justify-center">
                <Users className="w-6 h-6 text-secondary" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">配偶者の情報</h2>
                <p className="text-sm text-muted-foreground">配偶者がいる場合は入力してください</p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <Label>配偶者の有無</Label>
                <Select value={hasSpouse} onValueChange={setHasSpouse}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yes">配偶者あり</SelectItem>
                    <SelectItem value="no">配偶者なし（単身）</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {hasSpouse === "yes" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                  <InputWithUnit
                    label="配偶者のお名前（任意）"
                    type="text"
                    value={spouseName}
                    onChange={setSpouseName}
                    placeholder="花子"
                  />
                  <InputWithUnit
                    label="配偶者の年齢"
                    unit="歳"
                    value={spouseAge}
                    onChange={setSpouseAge}
                    placeholder="33"
                    required
                  />
                </div>
              )}
            </div>
          </Card>

          <Card className="p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Wallet className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">収入情報</h2>
                <p className="text-sm text-muted-foreground">
                  世帯の基本的な収入を入力してください（全シナリオ共通）
                </p>
              </div>
            </div>

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
          </Card>

          <Card className="p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-full bg-accent-blue/10 flex items-center justify-center">
                <Users className="w-6 h-6 text-accent-blue" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">お子様の情報</h2>
                <p className="text-sm text-muted-foreground">現在いるお子様の情報を入力してください</p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <Label>現在のお子様の人数</Label>
                <Select value={currentChildren} onValueChange={setCurrentChildren}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">0人（これから予定）</SelectItem>
                    <SelectItem value="1">1人</SelectItem>
                    <SelectItem value="2">2人</SelectItem>
                    <SelectItem value="3">3人</SelectItem>
                    <SelectItem value="4">4人以上</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  将来の子どもの人数は、シナリオごとに設定できます
                </p>
              </div>

              {parseInt(currentChildren) >= 1 && (
                <div className="pt-4 border-t space-y-4">
                  <h4 className="font-semibold text-sm">第1子の情報</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <InputWithUnit
                      label="お名前（任意）"
                      type="text"
                      value={child1Name}
                      onChange={setChild1Name}
                      placeholder="例: 太郎"
                    />
                    <InputWithUnit
                      label="現在の年齢"
                      unit="歳"
                      value={child1Age}
                      onChange={setChild1Age}
                      placeholder="5"
                    />
                  </div>
                </div>
              )}

              {parseInt(currentChildren) >= 2 && (
                <div className="pt-4 border-t space-y-4">
                  <h4 className="font-semibold text-sm">第2子の情報</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <InputWithUnit
                      label="お名前（任意）"
                      type="text"
                      value={child2Name}
                      onChange={setChild2Name}
                      placeholder="例: 花子"
                    />
                    <InputWithUnit
                      label="現在の年齢"
                      unit="歳"
                      value={child2Age}
                      onChange={setChild2Age}
                      placeholder="3"
                    />
                  </div>
                </div>
              )}
            </div>
          </Card>

          <Card className="p-6 bg-primary-soft/50 border border-primary/20">
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              💡 共通プロフィールとシナリオの違い
            </h4>
            <div className="space-y-3 text-sm text-foreground">
              <div className="flex gap-3">
                <div className="w-1.5 bg-primary rounded-full flex-shrink-0" />
                <div>
                  <p className="font-semibold mb-1">共通プロフィール（固定情報）</p>
                  <p className="text-xs text-muted-foreground">
                    現在の家族構成、年齢、基本年収など、新規シナリオ作成時の初期値になる情報です。
                    既存シナリオには自動反映されず、作成時点の前提として保存されます。
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-1.5 bg-accent-blue rounded-full flex-shrink-0" />
                <div>
                  <p className="font-semibold mb-1">シナリオ（比較したい差分）</p>
                  <p className="text-xs text-muted-foreground">
                    将来の子どもの人数、教育費前提、投資配分など、「もしこうだったら」を試すための変数です。
                    複数のシナリオを作成して比較することで、最適なライフプランを見つけられます。
                  </p>
                </div>
              </div>
              <div className="pt-2 border-t">
                <p className="text-xs text-muted-foreground">
                  <strong>例:</strong> 「子ども2人・投資あり」「子ども3人・投資なし」など、
                  同じ家族前提（プロフィール）で条件を変えたシナリオを比較できます
                </p>
              </div>
            </div>
          </Card>

          <div className="flex justify-end pt-4">
            <Button onClick={handleComplete} size="lg">
              プロフィール設定を完了
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
