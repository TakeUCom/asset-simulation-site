import { Badge } from "./ui/badge";
import { CheckCircle2, AlertCircle, AlertTriangle } from "lucide-react";

interface StatusBadgeProps {
  status: "safe" | "attention" | "review";
  text?: string;
}

/**
 * シナリオや結果の安全度を示すステータスバッジ。
 *
 * safe / attention / review の3段階を色とアイコンで表現し、結果の読み取りを補助する。
 */
export function StatusBadge({ status, text }: StatusBadgeProps) {
  const config = {
    safe: {
      variant: "default" as const,
      icon: CheckCircle2,
      defaultText: "安全",
      className: "bg-success-soft text-success border-success"
    },
    attention: {
      variant: "secondary" as const,
      icon: AlertTriangle,
      defaultText: "注意",
      className: "bg-warning-soft text-warning border-warning"
    },
    review: {
      variant: "destructive" as const,
      icon: AlertCircle,
      defaultText: "要見直し",
      className: "bg-destructive-soft text-destructive border-destructive"
    }
  };

  const { icon: Icon, defaultText, className } = config[status];
  const displayText = text || defaultText;

  return (
    <Badge className={`flex items-center gap-1.5 px-3 py-1.5 ${className}`}>
      <Icon className="w-4 h-4" />
      <span>{displayText}</span>
    </Badge>
  );
}
