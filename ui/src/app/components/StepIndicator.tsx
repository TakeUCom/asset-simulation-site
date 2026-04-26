import { Check } from "lucide-react";

interface Step {
  label: string;
  completed: boolean;
}

interface StepIndicatorProps {
  steps: Step[];
  currentStep: number;
  compact?: boolean;
}

/**
 * 入力フローの現在位置を示すステップインジケーター。
 *
 * PCでは詳細表示、モバイルではcompact表示に切り替え、長い入力フローでも迷いにくくする。
 */
export function StepIndicator({ steps, currentStep, compact = false }: StepIndicatorProps) {
  if (compact) {
    // モバイル用の簡略版
    return (
      <div className="w-full">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-foreground">
            ステップ {currentStep + 1} / {steps.length}
          </span>
          <span className="text-xs text-muted-foreground">{steps[currentStep].label}</span>
        </div>
        <div className="w-full bg-muted rounded-full h-2">
          <div
            className="bg-primary h-2 rounded-full transition-all"
            style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full hidden md:block">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <div key={index} className="flex flex-col items-center flex-1">
            <div className="flex items-center w-full">
              {index > 0 && (
                <div
                  className={`flex-1 h-0.5 ${
                    index <= currentStep ? "bg-primary" : "bg-border"
                  }`}
                />
              )}
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-full border-2 font-medium transition-colors ${
                  step.completed
                    ? "bg-primary border-primary text-primary-foreground"
                    : index === currentStep
                    ? "bg-white border-primary text-primary"
                    : "bg-white border-border text-muted-foreground"
                }`}
              >
                {step.completed ? <Check className="w-5 h-5" /> : index + 1}
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`flex-1 h-0.5 ${
                    index < currentStep ? "bg-primary" : "bg-border"
                  }`}
                />
              )}
            </div>
            <p
              className={`mt-2 text-xs font-medium text-center ${
                index <= currentStep ? "text-foreground" : "text-muted-foreground"
              }`}
            >
              {step.label}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
