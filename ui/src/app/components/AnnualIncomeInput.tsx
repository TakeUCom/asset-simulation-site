import { useState } from "react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { InputWithUnit } from "./InputWithUnit";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
import { Plus, X, ChevronDown, ChevronUp } from "lucide-react";
import { ANNUAL_INCOME_CATEGORIES } from "../config/referenceData";
import type { AnnualIncome } from "../types";

interface AnnualIncomeInputProps {
  incomes: AnnualIncome[];
  onChange: (incomes: AnnualIncome[]) => void;
}

/**
 * 年次で発生する追加収入・還付金を入力する折りたたみフォーム。
 *
 * 住宅ローン減税、確定申告還付、配当金など、毎月の給与とは別に年単位で発生する収入を管理する。
 * 現時点ではこのコンポーネント内で状態を保持しているため、将来的にはシナリオ状態へリフトアップする。
 */
export function AnnualIncomeInput({ incomes, onChange }: AnnualIncomeInputProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  /**
   * 追加収入の入力行を1件追加する。
   *
   * 新規行は単年・その他カテゴリを初期値にして、ユーザーが内容を編集できるようにする。
   */
  const addIncome = () => {
    const newIncome: AnnualIncome = {
      id: Date.now().toString(),
      year: "2026",
      name: "",
      category: "other",
      amount: "",
      duration: "1",
      durationType: "single",
      memo: ""
    };
    onChange([...incomes, newIncome]);
  };

  /**
   * 指定した追加収入行を削除する。
   */
  const removeIncome = (id: string) => {
    onChange(incomes.filter(income => income.id !== id));
  };

  /**
   * 指定した追加収入行の任意フィールドを更新する。
   *
   * 入力フォームからの変更を1箇所で扱い、行単位の状態更新を分かりやすくする。
   */
  const updateIncome = (id: string, field: keyof AnnualIncome, value: string) => {
    onChange(incomes.map(income =>
      income.id === id ? { ...income, [field]: value } : income
    ));
  };

  /**
   * 指定年に発生する追加収入の合計額を算出する。
   *
   * 単年の収入は開始年のみ、複数年の収入は開始年から継続年数分だけ対象に含める。
   */
  const getTotalYearlyIncome = (year: number) => {
    return incomes
      .filter(income => {
        const startYear = parseInt(income.year);
        if (income.durationType === "single") {
          return startYear === year;
        } else {
          const endYear = startYear + parseInt(income.duration) - 1;
          return year >= startYear && year <= endYear;
        }
      })
      .reduce((sum, income) => sum + (parseInt(income.amount) || 0), 0);
  };

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 bg-muted/30 hover:bg-muted/50 transition-colors flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <div className="text-left">
            <h4 className="font-semibold text-sm">年次追加収入・還付（任意）</h4>
            <p className="text-xs text-muted-foreground mt-1">
              住宅ローン減税、還付金、配当金など、年単位で発生する収入
            </p>
          </div>
          {incomes.length > 0 && (
            <Badge variant="outline" className="bg-primary-soft text-primary border-primary/30">
              {incomes.length}件
            </Badge>
          )}
        </div>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-muted-foreground" />
        ) : (
          <ChevronDown className="w-5 h-5 text-muted-foreground" />
        )}
      </button>

      {isExpanded && (
        <div className="p-4 space-y-4">
          {incomes.length === 0 ? (
            <div className="text-center py-6 text-sm text-muted-foreground">
              年次で発生する追加収入はまだ登録されていません
            </div>
          ) : (
            <div className="space-y-4">
              {incomes.map((income) => (
                <Card key={income.id} className="p-4 bg-primary-soft/20 border-primary/20">
                  <div className="flex items-start justify-between mb-3">
                    <h5 className="font-semibold text-sm">
                      {income.name || "未入力"}
                    </h5>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeIncome(income.id)}
                      className="h-7 w-7 p-0"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>名称</Label>
                      <input
                        type="text"
                        value={income.name}
                        onChange={(e) => updateIncome(income.id, "name", e.target.value)}
                        className="w-full px-3 py-2 border border-border rounded-md bg-input-background"
                        placeholder="例: 住宅ローン減税"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>種別</Label>
                      <Select
                        value={income.category}
                        onValueChange={(v) => updateIncome(income.id, "category", v)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ANNUAL_INCOME_CATEGORIES.map((cat) => (
                            <SelectItem key={cat.value} value={cat.value}>
                              {cat.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <InputWithUnit
                      label="開始年"
                      unit="年"
                      value={income.year}
                      onChange={(v) => updateIncome(income.id, "year", v)}
                      placeholder="2027"
                    />

                    <div className="space-y-2">
                      <Label>継続</Label>
                      <Select
                        value={income.durationType}
                        onValueChange={(v) => updateIncome(income.id, "durationType", v as "single" | "multiple")}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="single">単年のみ</SelectItem>
                          <SelectItem value="multiple">複数年</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {income.durationType === "multiple" && (
                      <InputWithUnit
                        label="継続年数"
                        unit="年間"
                        value={income.duration}
                        onChange={(v) => updateIncome(income.id, "duration", v)}
                        placeholder="13"
                        helpText={`${income.year}年〜${parseInt(income.year) + parseInt(income.duration || "1") - 1}年`}
                      />
                    )}

                    <InputWithUnit
                      label="年間金額"
                      unit="円"
                      value={income.amount}
                      onChange={(v) => updateIncome(income.id, "amount", v)}
                      placeholder="300000"
                    />

                    <div className="space-y-2 md:col-span-2">
                      <Label>メモ（任意）</Label>
                      <input
                        type="text"
                        value={income.memo}
                        onChange={(e) => updateIncome(income.id, "memo", e.target.value)}
                        className="w-full px-3 py-2 border border-border rounded-md bg-input-background text-sm"
                        placeholder="備考やメモ"
                      />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

          <Button variant="outline" onClick={addIncome} className="w-full">
            <Plus className="w-4 h-4 mr-2" />
            追加収入を追加
          </Button>

          {incomes.length > 0 && (
            <div className="mt-4 p-4 bg-muted/30 rounded-lg">
              <h5 className="text-sm font-semibold mb-3">年次追加収入の見込み</h5>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                {[2026, 2027, 2028, 2029].map(year => {
                  const total = getTotalYearlyIncome(year);
                  return (
                    <div key={year}>
                      <p className="text-xs text-muted-foreground">{year}年</p>
                      <p className={`font-semibold ${total > 0 ? 'text-primary' : 'text-muted-foreground'}`}>
                        {total > 0 ? `+${total.toLocaleString()}円` : '-'}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="p-3 bg-secondary-soft/50 border border-secondary/20 rounded-lg text-xs text-muted-foreground">
            💡 <strong>ヒント:</strong> 住宅ローン減税は最大13年間、配当金は毎年継続など、
            実際の受け取りパターンに合わせて設定してください。結果画面の年次表に反映されます。
          </div>
        </div>
      )}
    </div>
  );
}
