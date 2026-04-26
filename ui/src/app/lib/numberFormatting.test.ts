import { describe, expect, it } from "vitest";
import { formatNumericInput, sanitizeNumericInput } from "./numberFormatting";

describe("sanitizeNumericInput", () => {
  it("カンマ付き文字列から計算用の数字だけを取り出す", () => {
    // 入力欄では 1,234,567 のような表示を許容するため、
    // 内部保存時にはカンマを取り除いて素の数字文字列へ戻す。
    expect(sanitizeNumericInput("1,234,567")).toBe("1234567");
  });

  it("空白や円記号など、数字以外の文字は除去する", () => {
    expect(sanitizeNumericInput(" 12,345円 ")).toBe("12345");
  });
});

describe("formatNumericInput", () => {
  it("数字文字列を3桁カンマ区切りで表示する", () => {
    expect(formatNumericInput("1234567")).toBe("1,234,567");
  });

  it("空文字はそのまま返し、入力途中の削除を邪魔しない", () => {
    expect(formatNumericInput("")).toBe("");
  });
});
