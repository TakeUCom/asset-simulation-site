import { Fragment, useState } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Tabs, TabsList, TabsTrigger } from "./ui/tabs";
import { Badge } from "./ui/badge";
import { ChevronDown, ChevronRight, ChevronUp, Edit2, PiggyBank, TrendingUp, Wallet } from "lucide-react";
import type { YearAdjustment, YearlySimulationRow } from "../types";
import { YearEditModal } from "./YearEditModal";

interface YearlySimulationTableProps {
  rows: YearlySimulationRow[];
  adjustments: YearAdjustment[];
  onYearAdjustmentSave: (adjustment: YearAdjustment) => void;
}

/**
 * 年次シミュレーションの明細テーブル。
 *
 * FigmaMake v5の改善案を反映し、余剰・投資・貯蓄を強調しながら、
 * 行展開で収支内訳を確認し、年ごとの条件調整もできるようにする。
 */
export function YearlySimulationTable({
  rows,
  adjustments,
  onYearAdjustmentSave
}: YearlySimulationTableProps) {
  const [yearRange, setYearRange] = useState<"10" | "20" | "25">("20");
  const [isExpanded, setIsExpanded] = useState(true);
  const [expandedYears, setExpandedYears] = useState<Set<number>>(new Set());
  const [editingYear, setEditingYear] = useState<number | null>(null);

  const displayData = rows.slice(0, parseInt(yearRange));
  const editingYearData = editingYear ? rows.find((row) => row.year === editingYear) ?? null : null;
  const editingAdjustment = editingYear
    ? adjustments.find((adjustment) => adjustment.year === editingYear)
    : undefined;

  const toggleYearExpansion = (year: number) => {
    const next = new Set(expandedYears);
    if (next.has(year)) {
      next.delete(year);
    } else {
      next.add(year);
    }
    setExpandedYears(next);
  };

  return (
    <>
      <YearEditModal
        isOpen={editingYear !== null}
        onClose={() => setEditingYear(null)}
        yearData={editingYearData}
        adjustment={editingAdjustment}
        onSave={onYearAdjustmentSave}
      />

      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-semibold mb-1">年次シミュレーション詳細</h3>
            <p className="text-sm text-muted-foreground">
              年ごとの収支と資産推移を確認・調整できます。行をクリックすると内訳を確認できます。
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => setIsExpanded(!isExpanded)}>
            {isExpanded ? (
              <>
                <ChevronUp className="w-4 h-4 mr-2" />
                折りたたむ
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4 mr-2" />
                展開する
              </>
            )}
          </Button>
        </div>

        {isExpanded && (
          <>
            <Tabs value={yearRange} onValueChange={(value) => setYearRange(value as "10" | "20" | "25")} className="mb-4">
              <TabsList>
                <TabsTrigger value="10">10年間</TabsTrigger>
                <TabsTrigger value="20">20年間</TabsTrigger>
                <TabsTrigger value="25">25年間</TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="border rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1500px]">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-3 py-3 text-left text-sm font-semibold w-12"></th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">年</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">年齢</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold bg-warning-soft/30">年間余剰</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold bg-primary/10">投資額</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold bg-accent-blue/10">貯蓄額</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold">手取り収入</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold bg-primary-soft/20">追加収入</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold">基本支出</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold">子ども関連費</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold bg-accent-coral/10">イベント</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold bg-success-soft">年末残高</th>
                      <th className="px-4 py-3 text-center text-sm font-semibold">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayData.map((row) => {
                      const isRowExpanded = expandedYears.has(row.year);
                      const hasDetails =
                        row.lifeEventDetails.length > 0 ||
                        row.annualIncomeDetails.length > 0 ||
                        row.isInvestmentReduced ||
                        Boolean(row.adjustmentMemo);

                      return (
                        <Fragment key={row.year}>
                          <tr
                            className={`border-t hover:bg-muted/20 transition-colors cursor-pointer ${
                              row.isDeficit ? "bg-destructive-soft/30" : ""
                            } ${isRowExpanded ? "bg-muted/20" : ""}`}
                            onClick={() => toggleYearExpansion(row.year)}
                          >
                            <td className="px-3 py-3">
                              {hasDetails ? (
                                isRowExpanded ? (
                                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                                ) : (
                                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                                )
                              ) : null}
                            </td>
                            <td className="px-4 py-3 font-medium">
                              <div className="flex items-center gap-2">
                                {row.year}
                                {row.adjustmentMemo && (
                                  <Badge variant="outline" className="text-[10px]">調整</Badge>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm">{row.userAge}歳</td>
                            <td className={`px-4 py-3 text-right text-sm font-semibold bg-warning-soft/20 ${
                              row.isDeficit ? "text-destructive" : "text-success"
                            }`}>
                              {row.surplusBeforeInvestment >= 0 ? "+" : ""}{row.surplusBeforeInvestment.toLocaleString()}円
                            </td>
                            <td className="px-4 py-3 text-right text-sm bg-primary/5">
                              <div className="flex flex-col items-end">
                                <span className="text-primary font-medium">{row.investmentAmount.toLocaleString()}円</span>
                                {row.isInvestmentReduced && <span className="text-[10px] text-warning mt-0.5">目標未達</span>}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-right text-sm bg-accent-blue/5">
                              <span className="text-accent-blue font-medium">{row.savingsAmount.toLocaleString()}円</span>
                            </td>
                            <td className="px-4 py-3 text-right text-sm">{row.takeHomeIncome.toLocaleString()}円</td>
                            <td className="px-4 py-3 text-right text-sm bg-primary-soft/10">
                              {row.annualIncome !== 0 ? (
                                <span className="text-primary font-medium">
                                  {row.annualIncome >= 0 ? "+" : ""}{row.annualIncome.toLocaleString()}円
                                </span>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-right text-sm">{row.baseExpense.toLocaleString()}円</td>
                            <td className="px-4 py-3 text-right text-sm">
                              {row.educationCost > 0 ? (
                                <span className="text-accent-coral font-medium">{row.educationCost.toLocaleString()}円</span>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-right text-sm bg-accent-coral/5">
                              {row.lifeEventCost > 0 ? (
                                <span className="text-accent-coral font-medium">-{row.lifeEventCost.toLocaleString()}円</span>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-right text-sm font-bold text-success bg-success-soft/30">
                              {row.totalAsset.toLocaleString()}円
                            </td>
                            <td className="px-4 py-3 text-center" onClick={(event) => event.stopPropagation()}>
                              <Button variant="ghost" size="sm" className="h-7" onClick={() => setEditingYear(row.year)}>
                                <Edit2 className="w-3 h-3" />
                              </Button>
                            </td>
                          </tr>

                          {isRowExpanded && (
                            <tr className="border-t bg-muted/10">
                              <td colSpan={13} className="px-6 py-4">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                  <Card className="p-4 bg-background border-primary/20">
                                    <h5 className="text-sm font-semibold mb-3 flex items-center gap-2">
                                      <Wallet className="w-4 h-4 text-primary" />
                                      収入内訳
                                    </h5>
                                    <div className="space-y-2 text-sm">
                                      <div className="flex justify-between">
                                        <span className="text-muted-foreground">手取り収入</span>
                                        <span className="font-medium">{row.takeHomeIncome.toLocaleString()}円</span>
                                      </div>
                                      {row.annualIncomeDetails.map((income, index) => (
                                        <div key={`${income.name}-${index}`} className="flex justify-between">
                                          <span className="text-muted-foreground text-xs">{income.name}</span>
                                          <span className="font-medium text-primary text-xs">
                                            {income.amount >= 0 ? "+" : ""}{income.amount.toLocaleString()}円
                                          </span>
                                        </div>
                                      ))}
                                      <div className="flex justify-between pt-2 border-t">
                                        <span className="text-muted-foreground font-medium">収入合計</span>
                                        <span className="font-semibold">{row.totalIncome.toLocaleString()}円</span>
                                      </div>
                                    </div>
                                  </Card>

                                  <Card className="p-4 bg-background border-accent-coral/20">
                                    <h5 className="text-sm font-semibold mb-3">支出内訳</h5>
                                    <div className="space-y-2 text-sm">
                                      <div className="flex justify-between">
                                        <span className="text-muted-foreground">基本支出</span>
                                        <span className="font-medium">{row.baseExpense.toLocaleString()}円</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-muted-foreground">子ども関連費</span>
                                        <span className="font-medium text-accent-coral">{row.educationCost.toLocaleString()}円</span>
                                      </div>
                                      {row.lifeEventDetails.map((event, index) => (
                                        <div key={`${event.name}-${index}`} className="flex justify-between">
                                          <span className="text-muted-foreground text-xs">{event.name}</span>
                                          <span className="font-medium text-accent-coral text-xs">{event.amount.toLocaleString()}円</span>
                                        </div>
                                      ))}
                                      <div className="flex justify-between pt-2 border-t">
                                        <span className="text-muted-foreground font-medium">支出合計</span>
                                        <span className="font-semibold">{row.totalExpense.toLocaleString()}円</span>
                                      </div>
                                    </div>
                                  </Card>

                                  <Card className="p-4 bg-background border-success/20">
                                    <h5 className="text-sm font-semibold mb-3">余剰資金配分</h5>
                                    <div className="space-y-3 text-sm">
                                      <div className="flex justify-between">
                                        <span className="text-muted-foreground">年間余剰</span>
                                        <span className={`font-bold ${row.isDeficit ? "text-destructive" : "text-success"}`}>
                                          {row.surplusBeforeInvestment >= 0 ? "+" : ""}{row.surplusBeforeInvestment.toLocaleString()}円
                                        </span>
                                      </div>
                                      <div className="grid grid-cols-2 gap-2">
                                        <div className="flex items-center gap-1">
                                          <TrendingUp className="w-3 h-3 text-primary" />
                                          <span className="text-xs">投資: {row.investmentAmount.toLocaleString()}円</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                          <PiggyBank className="w-3 h-3 text-accent-blue" />
                                          <span className="text-xs">貯蓄: {row.savingsAmount.toLocaleString()}円</span>
                                        </div>
                                      </div>
                                      {row.withdrawalAmount > 0 && (
                                        <div className="p-2 bg-destructive-soft border border-destructive/20 rounded text-xs">
                                          現金取り崩し: {row.withdrawalAmount.toLocaleString()}円
                                        </div>
                                      )}
                                      {row.isInvestmentReduced && (
                                        <div className="p-2 bg-warning-soft border border-warning/30 rounded text-xs">
                                          投資目標額: {row.targetInvestmentAmount.toLocaleString()}円（余剰不足のため減額）
                                        </div>
                                      )}
                                      {row.adjustmentMemo && (
                                        <div className="p-2 bg-muted/40 rounded text-xs">
                                          メモ: {row.adjustmentMemo}
                                        </div>
                                      )}
                                    </div>
                                  </Card>
                                </div>
                              </td>
                            </tr>
                          )}
                        </Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-4 p-4 bg-muted/30 rounded-lg text-sm">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">表示期間</p>
                  <p className="font-semibold">
                    {displayData[0]?.year}年 〜 {displayData[displayData.length - 1]?.year}年（{yearRange}年間）
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">赤字年</p>
                  <p className={`font-semibold ${displayData.some((row) => row.isDeficit) ? "text-destructive" : "text-success"}`}>
                    {displayData.filter((row) => row.isDeficit).length}年
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">最終年の年末残高</p>
                  <p className="font-bold text-success">
                    {displayData[displayData.length - 1]?.totalAsset.toLocaleString()}円
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </Card>
    </>
  );
}
