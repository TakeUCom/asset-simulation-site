import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { ValidationMessage } from "./ValidationMessage";

interface InputWithUnitProps {
  label: string;
  unit?: string;
  placeholder?: string;
  helpText?: string;
  value?: string | number;
  onChange?: (value: string) => void;
  type?: string;
  error?: string;
  required?: boolean;
}

/**
 * ラベル・単位・補足説明をまとめて扱う共通入力コンポーネント。
 *
 * 金額、年齢、割合など、単位付き入力が多いシミュレーション画面の表記揺れを抑える。
 */
export function InputWithUnit({
  label,
  unit,
  placeholder,
  helpText,
  value,
  onChange,
  type = "number",
  error,
  required = false
}: InputWithUnitProps) {
  return (
    <div className="space-y-2">
      <Label>
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </Label>
      <div className="relative">
        <Input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          className={`${unit ? "pr-16" : ""} ${error ? "border-destructive" : ""}`}
        />
        {unit && (
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
            {unit}
          </span>
        )}
      </div>
      {error && <ValidationMessage type="error" message={error} />}
      {!error && helpText && <p className="text-xs text-muted-foreground">{helpText}</p>}
    </div>
  );
}
