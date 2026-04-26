import { useState, useEffect } from "react";
import { Card } from "./ui/card";
import { InputWithUnit } from "./InputWithUnit";
import { Info } from "lucide-react";
import { estimateTakeHome } from "../lib/calculations";

interface IncomeInputWithTakeHomeProps {
  userIncome: string;
  spouseIncome: string;
  userBonus: string;
  spouseBonus: string;
  onUserIncomeChange: (value: string) => void;
  onSpouseIncomeChange: (value: string) => void;
  onUserBonusChange: (value: string) => void;
  onSpouseBonusChange: (value: string) => void;
}

/**
 * 額面年収・ボーナスから概算手取りを表示する入力コンポーネント。
 *
 * 手取り計算は`estimateTakeHome`に委譲し、本人・配偶者・世帯合算の見通しを同じ画面で確認できるようにする。
 */
export function IncomeInputWithTakeHome({
  userIncome,
  spouseIncome,
  userBonus,
  spouseBonus,
  onUserIncomeChange,
  onSpouseIncomeChange,
  onUserBonusChange,
  onSpouseBonusChange
}: IncomeInputWithTakeHomeProps) {
  const userIncomeNum = parseInt(userIncome) || 0;
  const spouseIncomeNum = parseInt(spouseIncome) || 0;
  const userBonusNum = parseInt(userBonus) || 0;
  const spouseBonusNum = parseInt(spouseBonus) || 0;

  const userTakeHome = estimateTakeHome(userIncomeNum + userBonusNum);
  const spouseTakeHome = estimateTakeHome(spouseIncomeNum + spouseBonusNum);
  const totalIncome = userIncomeNum + spouseIncomeNum + userBonusNum + spouseBonusNum;
  const totalTakeHome = userTakeHome + spouseTakeHome;
  const monthlyTakeHome = Math.floor(totalTakeHome / 12);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <InputWithUnit
            label="本人の年収（額面）"
            unit="円"
            value={userIncome}
            onChange={onUserIncomeChange}
            placeholder="6000000"
          />
          <InputWithUnit
            label="本人のボーナス（年額・額面）"
            unit="円"
            value={userBonus}
            onChange={onUserBonusChange}
            placeholder="1200000"
          />
          {userIncomeNum > 0 && (
            <div className="p-3 bg-muted/50 rounded-lg border">
              <p className="text-xs text-muted-foreground mb-1">概算手取り</p>
              <p className="text-lg font-bold text-foreground">
                {userTakeHome.toLocaleString()}円
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                月額: 約{Math.floor(userTakeHome / 12).toLocaleString()}円
              </p>
            </div>
          )}
        </div>
        <div className="space-y-4">
          <InputWithUnit
            label="配偶者の年収（額面）"
            unit="円"
            value={spouseIncome}
            onChange={onSpouseIncomeChange}
            placeholder="3000000"
          />
          <InputWithUnit
            label="配偶者のボーナス（年額・額面）"
            unit="円"
            value={spouseBonus}
            onChange={onSpouseBonusChange}
            placeholder="600000"
          />
          {spouseIncomeNum > 0 && (
            <div className="p-3 bg-muted/50 rounded-lg border">
              <p className="text-xs text-muted-foreground mb-1">概算手取り</p>
              <p className="text-lg font-bold text-foreground">
                {spouseTakeHome.toLocaleString()}円
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                月額: 約{Math.floor(spouseTakeHome / 12).toLocaleString()}円
              </p>
            </div>
          )}
        </div>
      </div>

      <Card className="p-5 bg-gradient-to-br from-primary-soft to-white border-2 border-primary/20">
        <h4 className="font-semibold mb-4 flex items-center gap-2">
          <Info className="w-5 h-5 text-primary" />
          世帯の可処分所得（概算）
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-muted-foreground mb-1">世帯年収（額面）</p>
            <p className="text-xl font-bold text-foreground">
              {totalIncome.toLocaleString()}円
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">世帯手取り（概算）</p>
            <p className="text-xl font-bold text-primary">
              {totalTakeHome.toLocaleString()}円
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">月額手取り（目安）</p>
            <p className="text-xl font-bold text-accent-blue">
              {monthlyTakeHome.toLocaleString()}円
            </p>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t">
          <p className="text-xs text-muted-foreground">
            ⚠️ 手取り額は概算です。独身・扶養なし・給与所得のみの簡易モデルとして、
            給与所得控除、社会保険料、所得税、住民税を使って計算しています。
            控除や自治体差分は反映していないため、実際の金額とは異なる場合があります。
          </p>
        </div>
      </Card>
    </div>
  );
}
