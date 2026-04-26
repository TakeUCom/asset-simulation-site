import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { KPICard } from "./KPICard";
import { StatusBadge } from "./StatusBadge";
import { Alert, AlertDescription } from "./ui/alert";
import { YearlySimulationTable } from "./YearlySimulationTable";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";
import {
  TrendingUp,
  AlertTriangle,
  Edit,
  Copy,
  Save,
  GraduationCap,
  PiggyBank
} from "lucide-react";
import type { SimulationResult, YearAdjustment } from "../types";

interface ResultsScreenProps {
  result: SimulationResult;
  yearAdjustments: YearAdjustment[];
  onEdit: () => void;
  onDuplicate: () => void;
  onSave: () => void;
  onYearAdjustmentSave: (adjustment: YearAdjustment) => void;
}


/**
 * シミュレーション結果を表示する画面。
 *
 * 総合判定、KPI、資産推移、教育費推移、年次明細をまとめて表示し、
 * 保存ボタンから現在のシナリオサマリーをlocalStorageへ保存する。
 */
export function ResultsScreen({
  result,
  yearAdjustments,
  onEdit,
  onDuplicate,
  onSave,
  onYearAdjustmentSave
}: ResultsScreenProps) {
  const { kpi, assetChartData, educationChartData, yearlyRows } = result;
  const finalAge = yearlyRows[yearlyRows.length - 1]?.userAge ?? 0;
  const kpiVariant = kpi.status === "safe" ? "success" : kpi.status === "attention" ? "warning" : "danger";

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold">シミュレーション結果</h1>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={onEdit}>
                <Edit className="w-4 h-4 mr-2" />
                条件を編集
              </Button>
              <Button variant="outline" size="sm" onClick={onDuplicate}>
                <Copy className="w-4 h-4 mr-2" />
                複製
              </Button>
              <Button variant="outline" size="sm" onClick={onSave}>
                <Save className="w-4 h-4 mr-2" />
                保存
              </Button>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          {/* 結論: 総合判定 */}
          <Card className="p-8 bg-gradient-to-br from-primary-soft to-white border-2 border-primary/20">
            <div className="mb-6">
              <StatusBadge status={kpi.status} />
              <h2 className="text-3xl font-bold mt-4 mb-3">
                {kpi.headline}
              </h2>
            </div>

            {/* 理由: なぜこの結論なのか */}
            <div className="space-y-4 mb-6">
              <div className="flex gap-3">
                <div className="w-1.5 bg-warning rounded-full flex-shrink-0" />
                <div>
                  <h3 className="font-semibold mb-1">注意が必要な時期</h3>
                  <p className="text-sm text-muted-foreground">
                    {kpi.insights[0]}
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-1.5 bg-success rounded-full flex-shrink-0" />
                <div>
                  <h3 className="font-semibold mb-1">長期的な見通し</h3>
                  <p className="text-sm text-muted-foreground">
                    {kpi.insights[1]}
                  </p>
                </div>
              </div>
            </div>

            {/* 改善提案 */}
            <div className="bg-white p-5 rounded-lg border border-primary/20">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                改善の余地
              </h3>
              <ul className="space-y-2 text-sm text-foreground">
                <li className="flex gap-2">
                  <span className="text-primary">•</span>
                  <span>{kpi.insights[2]}</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-primary">•</span>
                  <span>赤字年数: {kpi.deficitYears}年、資産取り崩し年数: {kpi.drawdownYears}年</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-primary">•</span>
                  <span>不安がある場合は、固定費・イベント支出・投資額を調整して再計算してください</span>
                </li>
              </ul>
            </div>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <KPICard
              label={`最終資産残高（${finalAge}歳時）`}
              value={Math.floor(kpi.finalAsset / 10000).toLocaleString()}
              unit="万円"
              description="投資ケース"
              variant={kpiVariant}
              icon={<TrendingUp className="w-5 h-5" />}
            />
            <KPICard
              label="投資による増加額"
              value={`${kpi.investmentGain >= 0 ? "+" : ""}${Math.floor(kpi.investmentGain / 10000).toLocaleString()}`}
              unit="万円"
              description="貯蓄のみとの差"
              variant="success"
              icon={<PiggyBank className="w-5 h-5" />}
            />
            <KPICard
              label="教育費ピーク年"
              value={String(kpi.educationPeakYear)}
              unit="年"
              description={`年間${Math.floor(kpi.educationPeakAmount / 10000).toLocaleString()}万円`}
              variant="warning"
              icon={<GraduationCap className="w-5 h-5" />}
            />
            <KPICard
              label="最小年間余剰"
              value={Math.floor(kpi.minimumAnnualSurplus / 10000).toLocaleString()}
              unit="万円"
              description="投資前の年間余剰"
              variant="attention"
              icon={<AlertTriangle className="w-5 h-5" />}
            />
          </div>

          <Alert className="bg-warning-soft border-warning">
            <AlertTriangle className="h-5 w-5 text-warning" />
            <AlertDescription className="text-foreground ml-2">
              <strong>重要なポイント:</strong> 教育費ピークは{kpi.educationPeakYear}年です。
              この年の子ども関連費は年間{kpi.educationPeakAmount.toLocaleString()}円となるため、現金余力を確認してください。
            </AlertDescription>
          </Alert>

          <Alert className="bg-primary-soft/40 border-primary/30">
            <PiggyBank className="h-5 w-5 text-primary" />
            <AlertDescription className="text-foreground ml-2">
              <strong>貯蓄額の見方:</strong> 年次表の「貯蓄額」は、各年の余剰から投資額を差し引いた実績値です。
              家計画面で入力した「毎月の現金貯蓄目標」は参考値であり、この資産推移へ直接加算していません。
            </AlertDescription>
          </Alert>

          <Card className="p-6">
            <h3 className="text-xl font-semibold mb-6">資産推移グラフ</h3>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={assetChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#D7E0E4" />
                <XAxis
                  dataKey="year"
                  stroke="#4E5B61"
                  tick={{ fill: "#4E5B61" }}
                />
                <YAxis
                  stroke="#4E5B61"
                  tick={{ fill: "#4E5B61" }}
                  tickFormatter={(value) => `${Math.floor(value / 10000)}万`}
                />
                <Tooltip
                  formatter={(value: number) => `${value.toLocaleString()}円`}
                  contentStyle={{
                    backgroundColor: "#FFFFFF",
                    border: "1px solid #D7E0E4",
                    borderRadius: "8px"
                  }}
                />
                <Legend />
                <Line
                  key="withInvestment"
                  type="monotone"
                  dataKey="withInvestment"
                  stroke="#5B8DEF"
                  strokeWidth={3}
                  name="投資あり"
                  dot={{ fill: "#5B8DEF", r: 5 }}
                />
                <Line
                  key="withoutInvestment"
                  type="monotone"
                  dataKey="withoutInvestment"
                  stroke="#2F7D6B"
                  strokeWidth={3}
                  name="貯蓄のみ"
                  dot={{ fill: "#2F7D6B", r: 5 }}
                  strokeDasharray="5 5"
                />
              </LineChart>
            </ResponsiveContainer>
            <p className="text-sm text-muted-foreground mt-4">
              投資ケースは貯蓄のみケースと比較して、最終年で約{Math.floor(kpi.investmentGain / 10000).toLocaleString()}万円の差があります。
            </p>
          </Card>

          <Card className="p-6">
            <h3 className="text-xl font-semibold mb-6">教育費推移</h3>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={educationChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#D7E0E4" />
                <XAxis dataKey="year" stroke="#4E5B61" tick={{ fill: "#4E5B61" }} />
                <YAxis
                  stroke="#4E5B61"
                  tick={{ fill: "#4E5B61" }}
                  tickFormatter={(value) => `${Math.floor(value / 10000)}万`}
                />
                <Tooltip
                  formatter={(value: number) => `${value.toLocaleString()}円`}
                  contentStyle={{
                    backgroundColor: "#FFFFFF",
                    border: "1px solid #D7E0E4",
                    borderRadius: "8px"
                  }}
                />
                <Legend />
                <Bar key="child1" dataKey="child1" stackId="a" fill="#E9856E" name="第1子" />
                <Bar key="child2" dataKey="child2" stackId="a" fill="#F3B664" name="第2子" />
                <Bar key="child3" dataKey="child3" stackId="a" fill="#5B8DEF" name="第3子" />
                <Bar key="child4" dataKey="child4" stackId="a" fill="#2F7D6B" name="第4子" />
              </BarChart>
            </ResponsiveContainer>
            <p className="text-sm text-muted-foreground mt-4">
              {kpi.educationPeakYear}年に子ども関連費が年間{Math.floor(kpi.educationPeakAmount / 10000).toLocaleString()}万円でピークとなります。
            </p>
          </Card>

          <YearlySimulationTable
            rows={yearlyRows}
            adjustments={yearAdjustments}
            onYearAdjustmentSave={onYearAdjustmentSave}
          />

          <div className="flex justify-center gap-4 pt-6">
            <Button size="lg" onClick={onEdit}>
              <Edit className="w-4 h-4 mr-2" />
              条件を変更して再計算
            </Button>
            <Button size="lg" variant="outline" onClick={onDuplicate}>
              <Copy className="w-4 h-4 mr-2" />
              このシナリオを複製
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
