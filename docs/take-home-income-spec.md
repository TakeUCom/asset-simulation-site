# 手取り計算仕様書

## 1. 概要

本仕様は、ライフプランシミュレーションで利用する「額面年収から手取り年収を概算するロジック」を定義する。

対象は以下の簡易モデルとする。

- 日本居住者
- 独身
- 扶養親族なし
- 会社の社会保険加入あり
- 給与所得のみ
- 副業所得なし
- 各種控除は考慮しない

本仕様は、家計入力画面の概算手取り表示、年次シミュレーションの可処分所得計算、余剰資金計算の基礎に使う。

## 2. 目的

- これまでの「年収帯ごとの固定手取り率」より、説明可能性の高いロジックへ置き換える
- 結果画面、家計入力画面、年次シミュレーションで同じ手取り前提を使う
- 将来的な拡張に備えて、税率や固定額を差し替え可能にする

## 3. 入力項目

| 項目 | 型 | 必須 | 説明 |
| --- | --- | --- | --- |
| `annualGrossIncome` | number | ○ | 額面年収（賞与込み年額） |
| `socialInsuranceRate` | number | △ | 社会保険料率。未指定時 `0.145` |
| `residentTaxRate` | number | △ | 住民税率。未指定時 `0.10` |
| `residentTaxFixedAmount` | number | △ | 住民税均等割。未指定時 `5,000` |

## 4. 出力項目

| 項目 | 説明 |
| --- | --- |
| `salaryIncomeDeduction` | 給与所得控除額 |
| `employmentIncome` | 給与所得 |
| `socialInsurance` | 社会保険料 |
| `taxableIncome` | 課税所得 |
| `incomeTax` | 所得税 |
| `residentTax` | 住民税 |
| `netIncome` | 手取り年収 |
| `netMonthly` | 月平均手取り |

## 5. 計算フロー

```text
額面年収
↓
給与所得控除
↓
給与所得
↓
社会保険料
↓
課税所得
↓
所得税
↓
住民税
↓
手取り年収
↓
月平均手取り
```

## 6. 計算ロジック

### 6.1 社会保険料

```text
socialInsurance = annualGrossIncome × socialInsuranceRate
```

標準値:

```text
socialInsuranceRate = 0.145
```

実装上は円単位の整数にそろえるため、小数が出た場合は切り捨てる。

### 6.2 給与所得控除

| 額面年収 | 給与所得控除額 |
| ---: | ---: |
| 1,625,000円以下 | 550,000円 |
| 1,800,000円以下 | 年収 × 40% - 100,000円 |
| 3,600,000円以下 | 年収 × 30% + 80,000円 |
| 6,600,000円以下 | 年収 × 20% + 440,000円 |
| 8,500,000円以下 | 年収 × 10% + 1,100,000円 |
| 8,500,000円超 | 1,950,000円 |

### 6.3 給与所得

```text
employmentIncome = annualGrossIncome - salaryIncomeDeduction
```

0円未満の場合は0円とする。

### 6.4 課税所得

```text
taxableIncome = employmentIncome - socialInsurance
```

本MVPでは基礎控除や扶養控除などは加味しない。
0円未満の場合は0円とする。

### 6.5 所得税

超過累進課税を用いる。

| 課税所得 | 税率 | 控除額 |
| ---: | ---: | ---: |
| 1,950,000円以下 | 5% | 0円 |
| 3,300,000円以下 | 10% | 97,500円 |
| 6,950,000円以下 | 20% | 427,500円 |
| 9,000,000円以下 | 23% | 636,000円 |
| 18,000,000円以下 | 33% | 1,536,000円 |
| 40,000,000円以下 | 40% | 2,796,000円 |
| 40,000,000円超 | 45% | 4,796,000円 |

### 6.6 住民税

```text
residentTax = taxableIncome × residentTaxRate + residentTaxFixedAmount
```

標準値:

```text
residentTaxRate = 0.10
residentTaxFixedAmount = 5,000
```

### 6.7 手取り年収

```text
netIncome = annualGrossIncome - socialInsurance - incomeTax - residentTax
```

### 6.8 月平均手取り

```text
netMonthly = netIncome / 12
```

実装上は円単位の整数にそろえるため、月平均は切り捨てる。

## 7. サンプル

入力:

```text
annualGrossIncome = 10,000,000
socialInsuranceRate = 0.145
residentTaxRate = 0.10
residentTaxFixedAmount = 5,000
```

結果:

```text
salaryIncomeDeduction = 1,950,000
employmentIncome = 8,050,000
socialInsurance = 1,450,000
taxableIncome = 6,600,000
incomeTax = 892,500
residentTax = 665,000
netIncome = 6,992,500
netMonthly = 582,708
```

## 8. プロダクト上の扱い

- 本ロジックは「概算」であり、実給与明細との一致を保証しない
- ただし、家計入力、年次シミュレーション、比較画面で同じ関数を使う
- そのため、画面ごとに数字がぶれないことを優先する

## 9. 非対応項目

現時点では以下を考慮しない。

- 基礎控除
- 配偶者控除
- 扶養控除
- 住宅ローン控除
- iDeCo
- 生命保険料控除
- 医療費控除
- 介護保険料
- 地域別健康保険料率
- 標準報酬月額
- 復興特別所得税

## 10. 将来拡張

将来的には以下を拡張候補とする。

- 扶養人数を受けた控除反映
- 配偶者あり前提の簡易モデル切替
- 年齢に応じた介護保険料の反映
- 地域別住民税・保険料率の差分
- 賞与回数や月給配分の考慮
