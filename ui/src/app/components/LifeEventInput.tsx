import { useState } from "react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { InputWithUnit } from "./InputWithUnit";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
import { Checkbox } from "./ui/checkbox";
import { Plus, X, Calendar, AlertCircle } from "lucide-react";
import type { LifeEvent } from "../types";

const EVENT_CATEGORIES = [
  { value: "wedding", label: "結婚式" },
  { value: "car", label: "車購入" },
  { value: "moving", label: "引っ越し" },
  { value: "furniture", label: "家具・家電" },
  { value: "travel", label: "旅行" },
  { value: "family-support", label: "親族支援" },
  { value: "birth", label: "出産関連" },
  { value: "renovation", label: "リフォーム" },
  { value: "medical", label: "大型医療費" },
  { value: "other", label: "その他" }
];

interface LifeEventInputProps {
  compact?: boolean;
  events: LifeEvent[];
  onChange: (events: LifeEvent[]) => void;
}

/**
 * ライフイベントの入力行を管理するコンポーネント。
 *
 * 単発または複数年のイベント支出を入力し、年次シミュレーションへ反映するためのデータを作る。
 */
export function LifeEventInput({ compact = false, events, onChange }: LifeEventInputProps) {

  const addEvent = () => {
    const newEvent: LifeEvent = {
      id: Date.now().toString(),
      year: "2026",
      name: "",
      category: "other",
      amount: "",
      isRequired: true,
      paymentType: "lump",
      memo: ""
    };
    onChange([...events, newEvent]);
  };

  const removeEvent = (id: string) => {
    onChange(events.filter(event => event.id !== id));
  };

  const updateEvent = (id: string, field: keyof LifeEvent, value: string | boolean) => {
    onChange(events.map(event =>
      event.id === id ? { ...event, [field]: value } : event
    ));
  };

  const getTotalByYear = () => {
    const yearTotals: Record<string, number> = {};
    events.forEach(event => {
      const year = event.year;
      const amount = parseInt(event.amount) || 0;
      yearTotals[year] = (yearTotals[year] || 0) + amount;
    });
    return yearTotals;
  };

  const yearTotals = getTotalByYear();
  const sortedYears = Object.keys(yearTotals).sort();

  if (compact) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-semibold">ライフイベント支出</h4>
          <Badge variant="outline" className="bg-accent-coral/10 text-accent-coral border-accent-coral/30">
            {events.length}件
          </Badge>
        </div>

        {events.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
            {sortedYears.slice(0, 6).map(year => (
              <div key={year} className="p-2 bg-muted/30 rounded">
                <p className="text-xs text-muted-foreground">{year}年</p>
                <p className="font-semibold text-accent-coral">
                  -{yearTotals[year].toLocaleString()}円
                </p>
              </div>
            ))}
          </div>
        )}

        <Button variant="outline" onClick={addEvent} size="sm" className="w-full">
          <Plus className="w-4 h-4 mr-2" />
          イベントを追加
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">ライフイベント支出</h3>
          <p className="text-sm text-muted-foreground mt-1">
            将来発生する大きな一時支出を登録します
          </p>
        </div>
        <Button onClick={addEvent} variant="outline">
          <Plus className="w-4 h-4 mr-2" />
          追加
        </Button>
      </div>

      {events.length === 0 ? (
        <Card className="p-6 text-center text-sm text-muted-foreground">
          ライフイベント支出はまだ登録されていません
        </Card>
      ) : (
        <div className="space-y-4">
          {events.map((event) => (
            <Card
              key={event.id}
              className={`p-4 border-l-4 ${
                event.isRequired
                  ? "border-l-accent-coral bg-accent-coral/5"
                  : "border-l-muted bg-muted/20"
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-accent-coral" />
                  <h5 className="font-semibold">
                    {event.name || "未入力"}
                  </h5>
                  {event.isRequired && (
                    <Badge variant="outline" className="text-xs bg-accent-coral/20 text-accent-coral border-accent-coral/40">
                      必須
                    </Badge>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeEvent(event.id)}
                  className="h-7 w-7 p-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>イベント名</Label>
                  <input
                    type="text"
                    value={event.name}
                    onChange={(e) => updateEvent(event.id, "name", e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-md bg-input-background"
                    placeholder="例: 車買い替え"
                  />
                </div>

                <div className="space-y-2">
                  <Label>カテゴリ</Label>
                  <Select
                    value={event.category}
                    onValueChange={(v) => updateEvent(event.id, "category", v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {EVENT_CATEGORIES.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <InputWithUnit
                  label="発生年"
                  unit="年"
                  value={event.year}
                  onChange={(v) => updateEvent(event.id, "year", v)}
                  placeholder="2030"
                />

                <InputWithUnit
                  label="総額"
                  unit="円"
                  value={event.amount}
                  onChange={(v) => updateEvent(event.id, "amount", v)}
                  placeholder="2500000"
                />

                <div className="space-y-2 md:col-span-2">
                  <Label>支払い方法</Label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        checked={(event.paymentType ?? "lump") === "lump"}
                        onChange={() => updateEvent(event.id, "paymentType", "lump")}
                      />
                      <span className="text-sm">一括払い</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        checked={event.paymentType === "loan"}
                        onChange={() => updateEvent(event.id, "paymentType", "loan")}
                      />
                      <span className="text-sm">ローン払い</span>
                    </label>
                  </div>
                </div>

                {event.paymentType === "loan" && (
                  <>
                    <div className="md:col-span-2 pt-3 border-t">
                      <h6 className="text-sm font-semibold mb-3 text-primary">ローン詳細</h6>
                    </div>
                    <InputWithUnit
                      label="頭金"
                      unit="円"
                      value={event.loanDownPayment || ""}
                      onChange={(v) => updateEvent(event.id, "loanDownPayment", v)}
                      placeholder="500000"
                    />
                    <InputWithUnit
                      label="借入金額"
                      unit="円"
                      value={event.loanAmount || ""}
                      onChange={(v) => updateEvent(event.id, "loanAmount", v)}
                      placeholder="2000000"
                    />
                    <InputWithUnit
                      label="返済開始年"
                      unit="年"
                      value={event.loanStartYear || event.year}
                      onChange={(v) => updateEvent(event.id, "loanStartYear", v)}
                      placeholder={event.year}
                    />
                    <InputWithUnit
                      label="返済期間"
                      unit="年"
                      value={event.loanYears || ""}
                      onChange={(v) => updateEvent(event.id, "loanYears", v)}
                      placeholder="5"
                    />
                    <InputWithUnit
                      label="年利"
                      unit="%"
                      value={event.loanRate || ""}
                      onChange={(v) => updateEvent(event.id, "loanRate", v)}
                      placeholder="2.5"
                    />
                    <div className="md:col-span-2 p-3 bg-muted/30 rounded-lg text-sm">
                      <p className="text-xs text-muted-foreground mb-1">概算年間返済額</p>
                      <p className="font-semibold text-primary">
                        {(() => {
                          const principal = parseFloat(event.loanAmount || "0");
                          const rate = parseFloat(event.loanRate || "0") / 100;
                          const years = parseFloat(event.loanYears || "1");
                          if (!principal || !years) return "未入力";
                          if (!rate) return `約${Math.floor(principal / years).toLocaleString()}円/年`;
                          const monthlyRate = rate / 12;
                          const months = years * 12;
                          const monthlyPayment = (principal * monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1);
                          return `約${Math.floor(monthlyPayment * 12).toLocaleString()}円/年`;
                        })()}
                      </p>
                    </div>
                  </>
                )}

                <div className="space-y-2 md:col-span-2">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id={`required-${event.id}`}
                      checked={event.isRequired}
                      onCheckedChange={(checked) => updateEvent(event.id, "isRequired", checked as boolean)}
                    />
                    <Label htmlFor={`required-${event.id}`} className="font-normal">
                      必須イベント（確実に発生する）
                    </Label>
                  </div>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label>メモ（任意）</Label>
                  <input
                    type="text"
                    value={event.memo}
                    onChange={(e) => updateEvent(event.id, "memo", e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-md bg-input-background text-sm"
                    placeholder="備考やメモ"
                  />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {events.length > 0 && (
        <div className="mt-4 p-4 bg-muted/30 rounded-lg">
          <h5 className="text-sm font-semibold mb-3">年別支出サマリー</h5>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            {sortedYears.slice(0, 8).map(year => {
              const yearEvents = events.filter(e => e.year === year);
              const hasRequired = yearEvents.some(e => e.isRequired);
              return (
                <div key={year}>
                  <div className="flex items-center gap-1 mb-1">
                    <p className="text-xs text-muted-foreground">{year}年</p>
                    {hasRequired && (
                      <AlertCircle className="w-3 h-3 text-accent-coral" />
                    )}
                  </div>
                  <p className="font-semibold text-accent-coral">
                    -{yearTotals[year].toLocaleString()}円
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="p-3 bg-secondary-soft/50 border border-secondary/20 rounded-lg text-xs text-muted-foreground">
        💡 <strong>ヒント:</strong> 結果画面の年次表から、イベント支出を直接追加・編集することもできます。
        必須イベントと任意イベントを分けて管理することで、柔軟なシミュレーションが可能です。
      </div>
    </div>
  );
}
