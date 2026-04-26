/**
 * 数値入力欄へ入った文字列から、計算用の素の数字文字列を取り出す。
 *
 * カンマや全角カンマ、空白などを除去し、数値として扱わない文字は落とす。
 * 現在のフォーム仕様では整数入力のみを想定するため、数字以外は保持しない。
 */
export function sanitizeNumericInput(value: string): string {
  return value.replace(/[^\d]/g, "");
}

/**
 * 数値文字列を、表示用の3桁カンマ区切りへ整形する。
 *
 * 入力途中の空文字はそのまま返し、内部状態の素の文字列を壊さない。
 */
export function formatNumericInput(value: string | number | undefined): string {
  if (value === undefined || value === null) return "";
  const raw = typeof value === "number" ? String(value) : sanitizeNumericInput(value);
  if (!raw) return "";

  return raw.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}
