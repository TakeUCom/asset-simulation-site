import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { InputWithUnit } from "./InputWithUnit";
import { Label } from "./ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Separator } from "./ui/separator";
import { Badge } from "./ui/badge";
import { Save, X, TrendingDown, TrendingUp, User } from "lucide-react";
import type { YearAdjustment, YearlySimulationRow } from "../types";

interface YearEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  yearData: YearlySimulationRow | null;
  adjustment?: YearAdjustment;
  onSave: (adjustment: YearAdjustment) => void;
}

/**
 * 年次シミュレーション上で、特定年の収入・支出を一時調整するモーダル。
 *
 * 育休、時短、転職、休職など、単年または特定年だけ条件が変わるケースを扱う。
 */
export function YearEditModal({ isOpen, onClose, yearData, adjustment, onSave }: YearEditModalProps) {
  const [userIncome, setUserIncome] = useState("");
  const [spouseIncome, setSpouseIncome] = useState("");
  const [userBonus, setUserBonus] = useState("");
  const [spouseBonus, setSpouseBonus] = useState("");
  const [additionalIncome, setAdditionalIncome] = useState("");
  const [incomeReduction, setIncomeReduction] = useState("");
  const [baseExpense, setBaseExpense] = useState("");
  const [memo, setMemo] = useState("");

  useEffect(() => {
    if (!yearData) return;

    // モーダル初期値は年次計算で実際に使った値をそのまま復元し、
    // 仮の60/40配分のような推測値を入れないようにする。
    setUserIncome(adjustment?.userIncome || yearData.userIncome.toString());
    setSpouseIncome(adjustment?.spouseIncome || yearData.spouseIncome.toString());
    setUserBonus(adjustment?.userBonus || yearData.userBonus.toString());
    setSpouseBonus(adjustment?.spouseBonus || yearData.spouseBonus.toString());
    setAdditionalIncome(adjustment?.additionalIncome || "0");
    setIncomeReduction(adjustment?.incomeReduction || "0");
    setBaseExpense(adjustment?.baseExpense || yearData.baseExpense.toString());
    setMemo(adjustment?.memo || "");
  }, [adjustment, yearData]);

  if (!yearData) return null;

  // モーダル内サマリーも、年次計算と同じ式で「額面収入 + 一時調整」を表示する。
  const adjustedGrossIncome =
    (parseInt(userIncome) || 0) +
    (parseInt(spouseIncome) || 0) +
    (parseInt(userBonus) || 0) +
    (parseInt(spouseBonus) || 0) +
    (parseInt(additionalIncome) || 0) -
    (parseInt(incomeReduction) || 0);
  const incomeDifference = adjustedGrossIncome - yearData.grossIncome;

  const handleSave = () => {
    onSave({
      year: yearData.year,
      userIncome,
      spouseIncome,
      userBonus,
      spouseBonus,
      additionalIncome,
      incomeReduction,
      baseExpense,
      memo
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            {yearData.year}年（{yearData.userAge}歳）の条件を調整
          </DialogTitle>
          <DialogDescription>
            この年だけの収入や支出を変更できます。保存するとすぐに年次シミュレーションへ反映されます。
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="income" className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="income">収入調整</TabsTrigger>
            <TabsTrigger value="expense">支出調整</TabsTrigger>
          </TabsList>

          <TabsContent value="income" className="space-y-6 mt-4">
            <div className="p-4 bg-muted/30 rounded-lg">
              <h4 className="text-sm font-semibold mb-2">現在の額面収入</h4>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-primary">{yearData.grossIncome.toLocaleString()}</span>
                <span className="text-sm text-muted-foreground">円/年</span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-primary" />
                <h4 className="font-semibold">本人の収入</h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InputWithUnit label="年収（額面）" unit="円" value={userIncome} onChange={setUserIncome} />
                <InputWithUnit label="ボーナス（年間）" unit="円" value={userBonus} onChange={setUserBonus} />
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <h4 className="font-semibold">配偶者の収入</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InputWithUnit label="年収（額面）" unit="円" value={spouseIncome} onChange={setSpouseIncome} />
                <InputWithUnit label="ボーナス（年間）" unit="円" value={spouseBonus} onChange={setSpouseBonus} />
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <h4 className="font-semibold">一時的な収入変動</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-success" />
                    <Label>追加収入</Label>
                  </div>
                  <InputWithUnit label="" unit="円" value={additionalIncome} onChange={setAdditionalIncome} />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <TrendingDown className="w-4 h-4 text-destructive" />
                    <Label>収入減少</Label>
                  </div>
                  <InputWithUnit label="" unit="円" value={incomeReduction} onChange={setIncomeReduction} />
                </div>
              </div>
            </div>

            <div className={`p-4 rounded-lg ${incomeDifference >= 0 ? "bg-success-soft border border-success/30" : "bg-destructive-soft border border-destructive/30"}`}>
              <h4 className="text-sm font-semibold mb-2">調整後の額面収入</h4>
              <div className="flex items-baseline gap-3">
                <span className={`text-3xl font-bold ${incomeDifference >= 0 ? "text-success" : "text-destructive"}`}>
                  {adjustedGrossIncome.toLocaleString()}
                </span>
                <span className="text-sm text-muted-foreground">円</span>
                <Badge variant="outline">
                  {incomeDifference >= 0 ? "+" : ""}{incomeDifference.toLocaleString()}円
                </Badge>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="expense" className="space-y-6 mt-4">
            <div className="p-4 bg-muted/30 rounded-lg">
              <h4 className="text-sm font-semibold mb-2">現在の基本支出</h4>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-primary">{yearData.baseExpense.toLocaleString()}</span>
                <span className="text-sm text-muted-foreground">円/年</span>
              </div>
            </div>
            <InputWithUnit
              label="基本支出（年間）"
              unit="円"
              value={baseExpense}
              onChange={setBaseExpense}
              helpText="生活費、住居費、固定費の合計。教育費やライフイベント費は別計算です。"
            />
          </TabsContent>
        </Tabs>

        <div className="space-y-2">
          <Label>メモ（任意）</Label>
          <textarea
            value={memo}
            onChange={(event) => setMemo(event.target.value)}
            className="w-full px-3 py-2 border border-border rounded-md bg-input-background text-sm min-h-[60px]"
            placeholder="例: 育休のため配偶者の収入が半減"
          />
        </div>

        <div className="flex gap-3 justify-end pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            <X className="w-4 h-4 mr-2" />
            キャンセル
          </Button>
          <Button onClick={handleSave}>
            <Save className="w-4 h-4 mr-2" />
            保存して再計算
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
