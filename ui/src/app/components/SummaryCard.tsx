import { Card } from "./ui/card";

interface SummaryItem {
  label: string;
  value: string | number;
  unit?: string;
}

interface SummaryCardProps {
  title: string;
  items: SummaryItem[];
  className?: string;
}

/**
 * 入力中の概算結果をサイドバーに表示するサマリーカード。
 *
 * 子ども費用合計や投資見込みなど、入力変更に応じた重要数値を短く確認できるようにする。
 */
export function SummaryCard({ title, items, className = "" }: SummaryCardProps) {
  return (
    <Card className={`p-6 ${className}`}>
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      <div className="space-y-3">
        {items.map((item, index) => (
          <div key={index} className="flex justify-between items-baseline">
            <span className="text-sm text-muted-foreground">{item.label}</span>
            <div className="flex items-baseline gap-1">
              <span className="text-base font-semibold text-foreground">{item.value}</span>
              {item.unit && <span className="text-xs text-muted-foreground">{item.unit}</span>}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
