import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { StepIndicator } from "./StepIndicator";
import { LifeEventInput } from "./LifeEventInput";
import { ChevronRight, ChevronLeft, Calendar } from "lucide-react";
import { useState } from "react";
import type { LifeEvent } from "../types";

const steps = [
  { label: "基本情報", completed: true },
  { label: "家計", completed: true },
  { label: "子ども費用", completed: true },
  { label: "ライフイベント", completed: false },
  { label: "余剰配分", completed: false },
  { label: "結果", completed: false }
];

interface LifeEventFormProps {
  initialData: LifeEvent[];
  onNext: (events: LifeEvent[]) => void;
  onBack: (events: LifeEvent[]) => void;
}

/**
 * 年ごとの大きな支出イベントを入力するステップ画面。
 *
 * 結婚式、車購入、旅行など、通常の生活費とは別に発生する一時的な支出をシミュレーションへ反映する。
 */
export function LifeEventForm({ initialData, onNext, onBack }: LifeEventFormProps) {
  const [events, setEvents] = useState(initialData);

  /**
   * 入力されたライフイベントを親コンポーネントへ保存して次ステップへ進む。
   */
  const handleNext = () => {
    onNext(events);
  };

  /**
   * 戻る操作でも入力途中のイベント一覧を親へ保存する。
   */
  const handleBack = () => {
    onBack(events);
  };
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-6">ライフプランシミュレーション</h1>
          <div className="hidden md:block">
            <StepIndicator steps={steps} currentStep={3} />
          </div>
          <div className="md:hidden mt-4">
            <StepIndicator steps={steps} currentStep={3} compact />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card className="p-8">
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-full bg-accent-coral/10 flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-accent-coral" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-semibold">ライフイベント支出</h2>
                    <p className="text-sm text-muted-foreground">
                      将来発生する大きな支出を登録します
                    </p>
                  </div>
                </div>
              </div>

              <LifeEventInput events={events} onChange={setEvents} />

              <div className="flex justify-between mt-8">
                <Button variant="outline" onClick={handleBack}>
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  戻る
                </Button>
                <Button onClick={handleNext}>
                  次へ
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </Card>
          </div>

          <div className="lg:col-span-1">
            <div className="sticky top-8 space-y-4">
              <Card className="p-4 bg-accent-coral/10 border border-accent-coral/30">
                <h4 className="font-semibold mb-2 text-sm">💡 ライフイベントについて</h4>
                <div className="space-y-2 text-xs text-muted-foreground">
                  <p>
                    車の購入、リフォーム、結婚式など、通常の生活費とは別に発生する大きな支出を登録します。
                  </p>
                  <p>
                    「必須」にチェックを入れたイベントは確実に発生するものとして計算され、
                    チェックなしは任意イベントとして扱われます。
                  </p>
                  <p>
                    結果画面の年次表から、後で追加・編集することもできます。
                  </p>
                </div>
              </Card>

              <Card className="p-4 bg-primary-soft/30 border border-primary/20">
                <h4 className="font-semibold mb-2 text-sm">よくあるライフイベント</h4>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• 車の買い替え: 200〜500万円</li>
                  <li>• リフォーム: 100〜1,000万円</li>
                  <li>• 結婚式: 100〜300万円</li>
                  <li>• 引っ越し: 50〜200万円</li>
                  <li>• 家具・家電買い替え: 50〜100万円</li>
                </ul>
              </Card>

              <div className="p-4 bg-card rounded-xl border">
                <p className="text-sm font-medium mb-2">次のステップ</p>
                <p className="text-xs text-muted-foreground">
                  余剰資金の配分（貯蓄・投資）を設定します
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
