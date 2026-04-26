import { Card } from "./ui/card";

interface KPICardProps {
  label: string;
  value: string | number;
  unit?: string;
  description?: string;
  variant?: "default" | "success" | "warning" | "danger";
  icon?: React.ReactNode;
}

/**
 * 結果画面の主要KPIを表示するカード。
 *
 * 最終資産、教育費ピーク、最小余剰など、ユーザーが最初に確認すべき数値を強調する。
 */
export function KPICard({ label, value, unit, description, variant = "default", icon }: KPICardProps) {
  const variantStyles = {
    default: "border-border",
    success: "border-success bg-success-soft/30",
    warning: "border-warning bg-warning-soft/30",
    danger: "border-destructive bg-destructive-soft/30"
  };

  const labelColors = {
    default: "text-muted-foreground",
    success: "text-success",
    warning: "text-warning",
    danger: "text-destructive"
  };

  return (
    <Card className={`p-6 ${variantStyles[variant]}`}>
      <div className="flex items-start justify-between mb-2">
        <p className={`text-sm font-medium ${labelColors[variant]}`}>{label}</p>
        {icon && <div className={labelColors[variant]}>{icon}</div>}
      </div>
      <div className="flex items-baseline gap-1">
        <p className="text-3xl font-bold text-foreground">{value}</p>
        {unit && <span className="text-lg text-muted-foreground">{unit}</span>}
      </div>
      {description && <p className="mt-2 text-sm text-muted-foreground">{description}</p>}
    </Card>
  );
}
