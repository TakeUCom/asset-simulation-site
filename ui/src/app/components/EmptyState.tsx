import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { FileQuestion, PlusCircle, AlertCircle } from "lucide-react";

interface EmptyStateProps {
  type: "no-scenarios" | "no-comparison" | "error";
  onAction?: () => void;
  actionLabel?: string;
}

/**
 * データが存在しない状態を案内する共通コンポーネント。
 *
 * シナリオ未作成や比較対象不足など、ユーザーが次に取るべき行動を明示するために使う。
 */
export function EmptyState({ type, onAction, actionLabel }: EmptyStateProps) {
  const config = {
    "no-scenarios": {
      icon: FileQuestion,
      title: "シナリオがありません",
      message: "新しいシナリオを作成して、ライフプランシミュレーションを始めましょう。",
      iconColor: "text-muted-foreground",
      bgColor: "bg-muted/20"
    },
    "no-comparison": {
      icon: AlertCircle,
      title: "比較するシナリオが不足しています",
      message: "比較するには2件以上のシナリオを選択してください。",
      iconColor: "text-warning",
      bgColor: "bg-warning-soft"
    },
    error: {
      icon: AlertCircle,
      title: "エラーが発生しました",
      message: "データの読み込みに失敗しました。もう一度お試しください。",
      iconColor: "text-destructive",
      bgColor: "bg-destructive-soft"
    }
  };

  const { icon: Icon, title, message, iconColor, bgColor } = config[type];

  return (
    <Card className={`p-12 text-center ${bgColor}`}>
      <div className="flex flex-col items-center max-w-md mx-auto">
        <div className={`w-16 h-16 rounded-full bg-background flex items-center justify-center mb-4`}>
          <Icon className={`w-8 h-8 ${iconColor}`} />
        </div>
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <p className="text-sm text-muted-foreground mb-6">{message}</p>
        {onAction && actionLabel && (
          <Button onClick={onAction}>
            <PlusCircle className="w-4 h-4 mr-2" />
            {actionLabel}
          </Button>
        )}
      </div>
    </Card>
  );
}
