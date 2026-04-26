import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { InputWithUnit } from "./InputWithUnit";
import { Badge } from "./ui/badge";
import { Plus, X, ChevronDown, ChevronUp, Home } from "lucide-react";
import type { ChildLifeCostRange } from "../types";

interface ChildLifeCostInputProps {
  useDetailedSettings: boolean;
  simpleLiving: string;
  simpleEvents: string;
  ageRanges: ChildLifeCostRange[];
  onUseDetailedSettingsChange: (value: boolean) => void;
  onSimpleLivingChange: (value: string) => void;
  onSimpleEventsChange: (value: string) => void;
  onAgeRangesChange: (ranges: ChildLifeCostRange[]) => void;
}

/**
 * 子どもの日常生活関連費を、簡易入力または年齢範囲別の詳細入力で管理する。
 *
 * FigmaMake v5の改善案を、保存可能なフォーム値として扱えるようにしたコンポーネント。
 */
export function ChildLifeCostInput({
  useDetailedSettings,
  simpleLiving,
  simpleEvents,
  ageRanges,
  onUseDetailedSettingsChange,
  onSimpleLivingChange,
  onSimpleEventsChange,
  onAgeRangesChange
}: ChildLifeCostInputProps) {
  const addAgeRange = () => {
    onAgeRangesChange([
      ...ageRanges,
      {
        id: Date.now().toString(),
        startAge: "0",
        endAge: "22",
        annualLiving: "0",
        annualEvents: "0"
      }
    ]);
  };

  const removeAgeRange = (id: string) => {
    onAgeRangesChange(ageRanges.filter((range) => range.id !== id));
  };

  const updateAgeRange = (id: string, field: keyof ChildLifeCostRange, value: string) => {
    onAgeRangesChange(ageRanges.map((range) =>
      range.id === id ? { ...range, [field]: value } : range
    ));
  };

  const totalCost = useDetailedSettings
    ? ageRanges.reduce((total, range) => {
        const years = Math.max(0, (parseInt(range.endAge) || 0) - (parseInt(range.startAge) || 0) + 1);
        return total + ((parseInt(range.annualLiving) || 0) + (parseInt(range.annualEvents) || 0)) * years;
      }, 0)
    : ((parseInt(simpleLiving) || 0) + (parseInt(simpleEvents) || 0)) * 22;

  return (
    <div className="space-y-4">
      <div className="bg-secondary-soft/30 p-4 rounded-lg">
        <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <Home className="w-4 h-4" />
          日常生活関連（年額）
        </h4>

        {!useDetailedSettings ? (
          <div className="space-y-3">
            <InputWithUnit
              label="生活費増加分"
              unit="円"
              value={simpleLiving}
              onChange={onSimpleLivingChange}
              helpText="食費、衣服、医療など（0〜22歳の年平均）"
            />
            <InputWithUnit
              label="イベント・レジャー"
              unit="円"
              value={simpleEvents}
              onChange={onSimpleEventsChange}
              helpText="誕生日、旅行など（0〜22歳の年平均）"
            />
            <div className="pt-3 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onUseDetailedSettingsChange(true)}
                className="w-full"
              >
                <ChevronDown className="w-4 h-4 mr-2" />
                年齢範囲ごとに詳細設定
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-muted-foreground">
                年齢範囲ごとに異なる生活費を設定できます
              </p>
              <Button variant="ghost" size="sm" onClick={() => onUseDetailedSettingsChange(false)}>
                <ChevronUp className="w-4 h-4 mr-2" />
                標準設定に戻す
              </Button>
            </div>

            <div className="space-y-3">
              {ageRanges.map((range, index) => (
                <Card key={range.id} className="p-3 bg-background border-primary/20">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="outline" className="text-xs">範囲 {index + 1}</Badge>
                    {ageRanges.length > 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeAgeRange(range.id)}
                        className="h-6 w-6 p-0"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <InputWithUnit
                      label="開始年齢"
                      unit="歳"
                      value={range.startAge}
                      onChange={(value) => updateAgeRange(range.id, "startAge", value)}
                      placeholder="0"
                    />
                    <InputWithUnit
                      label="終了年齢"
                      unit="歳"
                      value={range.endAge}
                      onChange={(value) => updateAgeRange(range.id, "endAge", value)}
                      placeholder="5"
                    />
                    <InputWithUnit
                      label="年間生活費"
                      unit="円"
                      value={range.annualLiving}
                      onChange={(value) => updateAgeRange(range.id, "annualLiving", value)}
                      placeholder="300000"
                    />
                    <InputWithUnit
                      label="年間イベント費"
                      unit="円"
                      value={range.annualEvents}
                      onChange={(value) => updateAgeRange(range.id, "annualEvents", value)}
                      placeholder="100000"
                    />
                  </div>
                </Card>
              ))}
            </div>

            <Button variant="outline" onClick={addAgeRange} size="sm" className="w-full">
              <Plus className="w-4 h-4 mr-2" />
              年齢範囲を追加
            </Button>
          </div>
        )}

        <div className="mt-4 pt-3 border-t">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">日常生活費 総額（22年間）</span>
            <span className="font-bold text-primary">
              {Math.floor(totalCost / 10000).toLocaleString()}万円
            </span>
          </div>
        </div>
      </div>

      <div className="p-3 bg-secondary-soft/50 border border-secondary/20 rounded-lg text-xs text-muted-foreground">
        <strong>年齢範囲の目安:</strong> 乳幼児期（0-5歳）、小学生（6-12歳）、中高生（13-18歳）、大学生（19-22歳）で費用が変わりやすいです。
      </div>
    </div>
  );
}
