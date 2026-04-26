import { Card } from "./ui/card";
import { AlertCircle, CheckCircle, Info, TrendingUp } from "lucide-react";

interface InsightCardProps {
  title: string;
  message: string;
  type?: "info" | "success" | "warning" | "insight";
  className?: string;
}

/**
 * シミュレーション結果や入力画面で補足インサイトを表示するカード。
 *
 * 注意、成功、情報などのトーンを切り替え、ユーザーに次の判断材料を提示する。
 */
export function InsightCard({ title, message, type = "info", className = "" }: InsightCardProps) {
  const config = {
    info: {
      icon: Info,
      bgColor: "bg-accent-blue/10",
      borderColor: "border-accent-blue/30",
      iconColor: "text-accent-blue",
      textColor: "text-foreground"
    },
    success: {
      icon: CheckCircle,
      bgColor: "bg-success-soft",
      borderColor: "border-success/30",
      iconColor: "text-success",
      textColor: "text-foreground"
    },
    warning: {
      icon: AlertCircle,
      bgColor: "bg-warning-soft",
      borderColor: "border-warning/30",
      iconColor: "text-warning",
      textColor: "text-foreground"
    },
    insight: {
      icon: TrendingUp,
      bgColor: "bg-primary-soft",
      borderColor: "border-primary/30",
      iconColor: "text-primary",
      textColor: "text-foreground"
    }
  };

  const { icon: Icon, bgColor, borderColor, iconColor, textColor } = config[type];

  return (
    <Card className={`p-4 ${bgColor} border ${borderColor} ${className}`}>
      <div className="flex gap-3">
        <Icon className={`w-5 h-5 ${iconColor} flex-shrink-0 mt-0.5`} />
        <div className="flex-1">
          <h4 className={`font-semibold mb-1 ${textColor}`}>{title}</h4>
          <p className={`text-sm ${textColor}`}>{message}</p>
        </div>
      </div>
    </Card>
  );
}
