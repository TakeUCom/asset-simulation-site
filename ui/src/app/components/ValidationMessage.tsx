import { AlertCircle, CheckCircle, Info } from "lucide-react";

interface ValidationMessageProps {
  type: "error" | "success" | "info";
  message: string;
  className?: string;
}

/**
 * 入力値に対する補足・警告・エラーを表示する共通メッセージ。
 *
 * シミュレーション条件の不自然さや不足項目を、画面内で分かりやすく伝えるために使う。
 */
export function ValidationMessage({ type, message, className = "" }: ValidationMessageProps) {
  const config = {
    error: {
      icon: AlertCircle,
      color: "text-destructive",
      bgColor: "bg-destructive-soft"
    },
    success: {
      icon: CheckCircle,
      color: "text-success",
      bgColor: "bg-success-soft"
    },
    info: {
      icon: Info,
      color: "text-accent-blue",
      bgColor: "bg-accent-blue/10"
    }
  };

  const { icon: Icon, color, bgColor } = config[type];

  return (
    <div className={`flex items-start gap-2 p-3 rounded-lg ${bgColor} ${className}`}>
      <Icon className={`w-4 h-4 ${color} flex-shrink-0 mt-0.5`} />
      <p className={`text-sm ${color}`}>{message}</p>
    </div>
  );
}
