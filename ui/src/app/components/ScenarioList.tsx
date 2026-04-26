import { useState } from "react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { StatusBadge } from "./StatusBadge";
import { Badge } from "./ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { Checkbox } from "./ui/checkbox";
import { EmptyState } from "./EmptyState";
import {
  PlusCircle,
  Users,
  TrendingUp,
  Calendar,
  Edit,
  Copy,
  BarChart3,
  Sparkles
} from "lucide-react";
import { SIMULATION_SETTINGS } from "../config/defaults";
import { SCENARIO_TEMPLATES } from "../config/referenceData";
import type { Profile, ScenarioSummary } from "../types";

interface ScenarioListProps {
  scenarios: ScenarioSummary[];
  profile: Profile | null;
  onCreateNew: () => void;
  onCreateFromTemplate: (template: (typeof SCENARIO_TEMPLATES)[number]) => void;
  onEdit: (id: number) => void;
  onCompare: (ids: number[]) => void;
  onEditProfile: () => void;
  onDuplicate: (id: number) => void;
}

/**
 * 保存済みシナリオを一覧表示する画面。
 *
 * 新規作成、編集、複製、比較対象選択の起点となる。
 * APIなしMVPでは、親コンポーネントから渡されたlocalStorage由来のシナリオ一覧を表示する。
 */
export function ScenarioList({
  scenarios,
  profile,
  onCreateNew,
  onCreateFromTemplate,
  onEdit,
  onCompare,
  onEditProfile,
  onDuplicate
}: ScenarioListProps) {
  const [selectedScenarios, setSelectedScenarios] = useState<number[]>([]);
  const [showNewScenarioModal, setShowNewScenarioModal] = useState(false);

  const hasScenarios = scenarios.length > 0;
  const profileText = profile
    ? `${profile.userName || "本人"}さん（${profile.userAge}歳）${
        profile.hasSpouse === "yes" ? `・${profile.spouseName || "配偶者"}さん（${profile.spouseAge}歳）` : ""
      }`
    : "プロフィール未設定";

  const handleSelectScenario = (id: number) => {
    const targetScenario = scenarios.find((scenario) => scenario.id === id);
    if (!targetScenario?.inputs) return;

    if (selectedScenarios.includes(id)) {
      setSelectedScenarios(selectedScenarios.filter((s) => s !== id));
    } else {
      if (selectedScenarios.length < SIMULATION_SETTINGS.compareMaxScenarios) {
        setSelectedScenarios([...selectedScenarios, id]);
      }
    }
  };

  const handleCompare = () => {
    if (selectedScenarios.length >= 2) {
      onCompare(selectedScenarios);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">シナリオ一覧</h1>
              <p className="text-muted-foreground">
                保存済みのライフプランシナリオを管理できます
              </p>
            </div>
            <Card className="p-4 bg-muted/30">
              <p className="text-xs text-muted-foreground mb-1">共通プロフィール</p>
              <p className="text-sm font-medium">{profileText}</p>
              <Button variant="ghost" size="sm" className="mt-2 h-7 text-xs" onClick={onEditProfile}>
                編集
              </Button>
            </Card>
          </div>
        </div>

        <div className="mb-6 flex items-center gap-4">
          <Button onClick={() => setShowNewScenarioModal(true)} size="lg">
            <PlusCircle className="w-5 h-5 mr-2" />
            新規シナリオ作成
          </Button>
          <Button
            variant="outline"
            onClick={handleCompare}
            disabled={selectedScenarios.length < 2}
            size="lg"
          >
            <BarChart3 className="w-5 h-5 mr-2" />
            比較する ({selectedScenarios.length}/{SIMULATION_SETTINGS.compareMaxScenarios})
          </Button>
        </div>

        {!hasScenarios ? (
          <EmptyState
            type="no-scenarios"
            onAction={() => setShowNewScenarioModal(true)}
            actionLabel="最初のシナリオを作成"
          />
        ) : (
          <>
            {selectedScenarios.length > 0 && selectedScenarios.length < 2 && (
              <div className="mb-6 p-4 bg-secondary-soft border border-secondary/30 rounded-lg">
                <p className="text-sm text-foreground">
                  💡 比較するには、あと{2 - selectedScenarios.length}
                  件のシナリオを選択してください（最大3件まで）
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {scenarios.map((scenario) => {
            const canCompare = Boolean(scenario.inputs);

            return (
            <Card
              key={scenario.id}
              className={`p-6 hover:shadow-lg transition-shadow ${
                selectedScenarios.includes(scenario.id)
                  ? "border-2 border-primary bg-primary-soft/20"
                  : ""
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-3 flex-1">
                  <Checkbox
                    checked={selectedScenarios.includes(scenario.id)}
                    onCheckedChange={() => handleSelectScenario(scenario.id)}
                    disabled={
                      !canCompare ||
                      !selectedScenarios.includes(scenario.id) &&
                      selectedScenarios.length >= SIMULATION_SETTINGS.compareMaxScenarios
                    }
                  />
                  <div className="flex-1">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-semibold">{scenario.name}</h3>
                      <StatusBadge status={scenario.status} />
                      {!canCompare && (
                        <Badge variant="secondary">比較不可</Badge>
                      )}
                    </div>
                    {!canCompare && (
                      <p className="text-xs text-muted-foreground">
                        旧データのため比較用の詳細条件が不足しています。再保存すると比較対象にできます。
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    子どもの人数
                  </span>
                  <span className="font-semibold">{scenario.children}人</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    投資
                  </span>
                  <Badge variant={scenario.investment ? "default" : "secondary"}>
                    {scenario.investment ? "あり" : "なし"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">最終資産残高</span>
                  <span className="font-bold text-accent-blue">
                    {Math.floor(scenario.finalAsset / 10000).toLocaleString()}万円
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">教育費ピーク</span>
                  <span className="font-semibold">
                    {Math.floor(scenario.educationPeak / 10000).toLocaleString()}万円/年
                  </span>
                </div>
                {scenario.hasDeficit && (
                  <div className="p-2 bg-destructive-soft rounded text-xs text-destructive font-medium">
                    ⚠️ 赤字年あり
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4 pb-4 border-b">
                <Calendar className="w-3 h-3" />
                <span>作成: {scenario.createdAt}</span>
                <span>•</span>
                <span>更新: {scenario.updatedAt}</span>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => onEdit(scenario.id)} className="flex-1">
                  <Edit className="w-4 h-4 mr-2" />
                  編集
                </Button>
                <Button variant="outline" size="sm" className="flex-1" onClick={() => onDuplicate(scenario.id)}>
                  <Copy className="w-4 h-4 mr-2" />
                  複製
                </Button>
              </div>
            </Card>
          );
          })}
            </div>
          </>
        )}

        <Dialog open={showNewScenarioModal} onOpenChange={setShowNewScenarioModal}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl">ライフプランシミュレーションを始める</DialogTitle>
              <DialogDescription>
                初めての方はテンプレートから始めると、スムーズに入力を進められます
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6 py-4">
              <div className="bg-primary-soft/50 p-4 rounded-lg border border-primary/20">
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  おすすめテンプレート
                </h4>
                <p className="text-sm text-muted-foreground mb-4">
                  家族構成に合わせた標準的な値が入力済みです。後から自由に変更できます。
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {SCENARIO_TEMPLATES.map((template, index) => (
                    <Card
                      key={index}
                      className="p-4 hover:border-primary hover:shadow-md cursor-pointer transition-all bg-white"
                      onClick={() => {
                        setShowNewScenarioModal(false);
                        onCreateFromTemplate(template);
                      }}
                    >
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-semibold text-sm">{template.name}</h4>
                          <Badge variant="outline" className="text-xs shrink-0">
                            {template.children}人
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{template.desc}</p>
                        <div className="pt-2 border-t">
                          <p className="text-xs text-muted-foreground">59歳時点の想定資産</p>
                          <p className="text-sm font-bold text-accent-blue">{template.finalAsset}</p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-semibold mb-3">カスタム作成</h4>
                <Card
                  className="p-4 hover:border-border hover:bg-muted/30 cursor-pointer transition-all"
                  onClick={() => {
                    setShowNewScenarioModal(false);
                    onCreateNew();
                  }}
                >
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                      <PlusCircle className="w-5 h-5 text-foreground" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">ゼロから作成</h3>
                      <p className="text-sm text-muted-foreground">
                        すべての項目を手動で入力します。詳細にカスタマイズしたい場合に最適です。
                      </p>
                    </div>
                  </div>
                </Card>
              </div>

              <div className="bg-secondary-soft/50 p-4 rounded-lg border border-secondary/20">
                <p className="text-sm text-foreground">
                  <strong>💡 ヒント:</strong>{" "}
                  テンプレートから始めても、各ステップで自由に値を変更できます。
                  まずは気軽に試して、将来の見通しを確認してみましょう。
                </p>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
