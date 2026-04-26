import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { StatusBadge } from "./StatusBadge";
import { Badge } from "./ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";
import { Star, Users, TrendingUp, GraduationCap, ChevronLeft } from "lucide-react";
import type { ScenarioSummary } from "../types";
import { calculateSimulation } from "../lib/simulation";

interface ComparisonScreenProps {
  scenarios: ScenarioSummary[];
  onBack: () => void;
}

const CHART_COLORS = ["#2F7D6B", "#5B8DEF", "#E9856E"];

/**
 * 複数シナリオの結果を比較する画面。
 *
 * 比較画面だけ固定サンプル値を使うと整合性が崩れるため、
 * 保存済みシナリオの入力値からその場で再計算した結果のみを表示する。
 */
export function ComparisonScreen({ scenarios, onBack }: ComparisonScreenProps) {
  const comparableScenarios = scenarios.filter((scenario) => scenario.inputs).slice(0, 3);
  const results = comparableScenarios.map((scenario) => ({
    scenario,
    result: calculateSimulation(scenario.inputs!)
  }));

  const recommendedScenario = results.reduce<typeof results[number] | null>((best, current) => {
    if (!best) return current;

    const statusScore = { safe: 3, attention: 2, review: 1 };
    const currentScore = statusScore[current.result.kpi.status];
    const bestScore = statusScore[best.result.kpi.status];
    if (currentScore !== bestScore) return currentScore > bestScore ? current : best;
    return current.result.kpi.finalAsset > best.result.kpi.finalAsset ? current : best;
  }, null);

  const comparisonData = buildComparisonChartData(results);
  const educationPeakScenario = results.reduce<typeof results[number] | null>((best, current) => {
    if (!best) return current;
    return current.result.kpi.educationPeakAmount < best.result.kpi.educationPeakAmount ? current : best;
  }, null);
  const safestScenario = results.reduce<typeof results[number] | null>((best, current) => {
    if (!best) return current;
    if (current.result.kpi.deficitYears !== best.result.kpi.deficitYears) {
      return current.result.kpi.deficitYears < best.result.kpi.deficitYears ? current : best;
    }
    return current.result.kpi.drawdownYears < best.result.kpi.drawdownYears ? current : best;
  }, null);
  const recommendationReason = recommendedScenario
    ? buildRecommendationReason(results, recommendedScenario.scenario.id)
    : "";

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <Button variant="ghost" onClick={onBack} className="mb-4">
            <ChevronLeft className="w-4 h-4 mr-2" />
            シナリオ一覧に戻る
          </Button>
          <h1 className="text-3xl font-bold">シナリオ比較</h1>
          <p className="text-muted-foreground mt-2">
            保存済みシナリオを同じ計算ロジックで再計算し、主要指標を比較しています
          </p>
        </div>

        {results.length < 2 ? (
          <Card className="p-8">
            <p className="text-sm text-muted-foreground">
              比較するには、入力値が保存されたシナリオを2件以上選択してください。
            </p>
          </Card>
        ) : (
          <div className="space-y-8">
            <Card className="p-8 bg-gradient-to-br from-primary-soft to-white border-2 border-primary/20">
              <div className="mb-6">
                <h2 className="text-2xl font-bold mb-4">比較サマリー</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-5 rounded-lg border-2 border-primary">
                  <div className="flex items-center gap-2 mb-3">
                    <Star className="w-5 h-5 text-primary" />
                    <h3 className="font-semibold">総合推奨</h3>
                  </div>
                  <p className="text-2xl font-bold text-primary mb-2">
                    {recommendedScenario?.scenario.name ?? "-"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {recommendationReason || "判定と最終資産のバランスが最も良いシナリオです。"}
                  </p>
                </div>

                <div className="bg-white p-5 rounded-lg border">
                  <div className="flex items-center gap-2 mb-3">
                    <GraduationCap className="w-5 h-5 text-accent-coral" />
                    <h3 className="font-semibold">教育費負担が軽い</h3>
                  </div>
                  <p className="text-2xl font-bold text-foreground mb-2">
                    {educationPeakScenario?.scenario.name ?? "-"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    教育費ピーク額が最も低いシナリオです。
                  </p>
                </div>

                <div className="bg-white p-5 rounded-lg border">
                  <div className="flex items-center gap-2 mb-3">
                    <Users className="w-5 h-5 text-accent-blue" />
                    <h3 className="font-semibold">安全性を重視</h3>
                  </div>
                  <p className="text-2xl font-bold text-foreground mb-2">
                    {safestScenario?.scenario.name ?? "-"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    赤字年・取り崩し年が最も少ないシナリオです。
                  </p>
                </div>
              </div>

              {recommendedScenario && (
                <div className="mt-6 p-4 bg-white rounded-lg border">
                  <p className="text-sm text-foreground">
                    <strong>総合的な推奨:</strong>
                    <strong className="text-primary">「{recommendedScenario.scenario.name}」</strong>
                    は判定が
                    <strong> {recommendedScenario.result.kpi.status} </strong>
                    で、最終資産は
                    <strong> {Math.floor(recommendedScenario.result.kpi.finalAsset / 10000).toLocaleString()}万円</strong>
                    です。{recommendationReason}
                  </p>
                </div>
              )}
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {results.map(({ scenario, result }, index) => (
                <Card
                  key={scenario.id}
                  className={`p-6 relative ${
                    recommendedScenario?.scenario.id === scenario.id ? "border-2 border-primary shadow-lg" : ""
                  }`}
                >
                  {recommendedScenario?.scenario.id === scenario.id && (
                    <Badge className="absolute top-4 right-4 bg-primary text-primary-foreground">
                      <Star className="w-3 h-3 mr-1" />
                      推奨
                    </Badge>
                  )}
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold mb-2">{scenario.name}</h3>
                    <StatusBadge status={result.kpi.status} />
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between py-2 border-b">
                      <span className="text-sm text-muted-foreground flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        子どもの人数
                      </span>
                      <span className="font-semibold">{scenario.children}人</span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b">
                      <span className="text-sm text-muted-foreground flex items-center gap-2">
                        <TrendingUp className="w-4 h-4" />
                        投資
                      </span>
                      <span className="font-semibold">{scenario.investment ? "あり" : "なし"}</span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b">
                      <span className="text-sm text-muted-foreground">最終資産</span>
                      <span className="font-bold" style={{ color: CHART_COLORS[index] }}>
                        {Math.floor(result.kpi.finalAsset / 10000).toLocaleString()}万円
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b">
                      <span className="text-sm text-muted-foreground flex items-center gap-2">
                        <GraduationCap className="w-4 h-4" />
                        教育費ピーク
                      </span>
                      <span className="font-semibold">
                        {Math.floor(result.kpi.educationPeakAmount / 10000).toLocaleString()}万円
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b">
                      <span className="text-sm text-muted-foreground">最小年間余剰</span>
                      <span className="font-semibold">
                        {Math.floor(result.kpi.minimumAnnualSurplus / 10000).toLocaleString()}万円
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-2">
                      <span className="text-sm text-muted-foreground">赤字年数</span>
                      <span className="font-semibold">{result.kpi.deficitYears}年</span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            <Card className="p-6">
              <h3 className="text-xl font-semibold mb-6">資産推移比較</h3>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={comparisonData}>
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
                  {results.map(({ scenario }, index) => (
                    <Line
                      key={scenario.id}
                      type="monotone"
                      dataKey={`scenario_${scenario.id}`}
                      stroke={CHART_COLORS[index]}
                      strokeWidth={3}
                      name={scenario.name}
                      dot={{ fill: CHART_COLORS[index], r: 4 }}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
              <p className="text-sm text-muted-foreground mt-4">
                すべて同じ計算ロジックで再計算した年末資産残高を比較しています。
              </p>
            </Card>

            <Card className="p-6">
              <h3 className="text-xl font-semibold mb-6">主要指標比較表</h3>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>指標</TableHead>
                      {results.map(({ scenario }) => (
                        <TableHead key={scenario.id} className="text-center">
                          {scenario.name}
                          {recommendedScenario?.scenario.id === scenario.id && (
                            <Badge variant="outline" className="ml-2 text-xs">
                              推奨
                            </Badge>
                          )}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-medium">最終資産残高</TableCell>
                      {results.map(({ scenario, result }) => (
                        <TableCell key={scenario.id} className="text-center">
                          {Math.floor(result.kpi.finalAsset / 10000).toLocaleString()}万円
                        </TableCell>
                      ))}
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">教育費ピーク年</TableCell>
                      {results.map(({ scenario, result }) => (
                        <TableCell key={scenario.id} className="text-center">
                          {result.kpi.educationPeakYear}年
                        </TableCell>
                      ))}
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">教育費ピーク額</TableCell>
                      {results.map(({ scenario, result }) => (
                        <TableCell key={scenario.id} className="text-center">
                          {Math.floor(result.kpi.educationPeakAmount / 10000).toLocaleString()}万円
                        </TableCell>
                      ))}
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">最小年間余剰</TableCell>
                      {results.map(({ scenario, result }) => (
                        <TableCell key={scenario.id} className="text-center">
                          {Math.floor(result.kpi.minimumAnnualSurplus / 10000).toLocaleString()}万円
                        </TableCell>
                      ))}
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">赤字年数</TableCell>
                      {results.map(({ scenario, result }) => (
                        <TableCell key={scenario.id} className="text-center">
                          {result.kpi.deficitYears}年
                        </TableCell>
                      ))}
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">総合評価</TableCell>
                      {results.map(({ scenario, result }) => (
                        <TableCell key={scenario.id} className="text-center">
                          <StatusBadge status={result.kpi.status} />
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * 比較グラフ用に、各年の資産残高を1つの配列へまとめる。
 */
function buildComparisonChartData(
  results: Array<{ scenario: ScenarioSummary; result: ReturnType<typeof calculateSimulation> }>
) {
  const baseRows = results[0]?.result.assetChartData ?? [];
  return baseRows.map((row, index) => {
    const datum: Record<string, number> = { year: row.year };
    results.forEach(({ scenario, result }) => {
      datum[`scenario_${scenario.id}`] = result.assetChartData[index]?.withInvestment ?? 0;
    });
    return datum;
  });
}

/**
 * 総合推奨シナリオについて、ユーザー向けの短い推奨理由を生成する。
 */
function buildRecommendationReason(
  results: Array<{ scenario: ScenarioSummary; result: ReturnType<typeof calculateSimulation> }>,
  scenarioId: number
) {
  const target = results.find((item) => item.scenario.id === scenarioId);
  if (!target) return "";

  const sortedByAsset = [...results].sort((a, b) => b.result.kpi.finalAsset - a.result.kpi.finalAsset);
  const assetRank = sortedByAsset.findIndex((item) => item.scenario.id === scenarioId) + 1;
  const noDeficit = target.result.kpi.deficitYears === 0;

  if (noDeficit && assetRank === 1) {
    return "赤字年がなく、最終資産も最も大きいため推奨しています。";
  }

  if (noDeficit) {
    return `赤字年がなく、安全性が高い一方で、最終資産は${assetRank}位です。`;
  }

  return `判定のバランスを優先した結果で、最終資産は${assetRank}位です。`;
}
