# 資産推移・教育費推移・KPI判定ロジック設計

## 1. 目的

結果画面の固定サンプル値を、保存済みシナリオの入力値から算出される値へ置き換える。

ただし、初期実装では税制・社会保険・教育費統計を厳密に再現するよりも、ユーザーが入力したシナリオ条件を一貫したルールで反映し、比較可能な結果を出すことを優先する。

## 2. PdM観点の基本方針

このプロダクトでユーザーが知りたいことは、厳密な税額そのものではなく、以下の意思決定材料である。

- 子どもの人数や年齢差によって、どの年に家計が苦しくなるか
- 教育費ピークがいつ・いくらになるか
- 投資を継続した場合と貯蓄中心の場合で、最終資産がどう変わるか
- 赤字年や資産取り崩しリスクがあるか
- 複数シナリオを比較したとき、どのプランが安全か

そのため、MVPの計算ロジックは「正確な税務計算」ではなく「同じルールで比較できるシミュレーション」を重視する。

## 3. 入力として利用するデータ

現在の`ScenarioInputs`から利用できる項目は以下。

- `basic`: シナリオ名、本人年齢、配偶者年齢、将来の子ども人数、子どもの年齢差
- `household`: 額面年収、ボーナス、生活費、住居費、固定費、毎月の現金貯蓄、年次追加収入
- `childCost`: 子どもごとの進学パターン、教育費、塾代、生活費、イベント費、第2子費用の共有率
- `lifeEvents`: 発生年、イベント名、金額、必須/任意
- `investment`: 固定額投資または余剰割合投資、想定利回り

不足しているが今後追加したい項目。

- 現在資産
- 子どもごとの現在年齢または誕生年
- 年収の成長率
- 生活費のインフレ率
- 投資開始済み残高
- 退職年齢や退職金

MVPでは不足項目にデフォルト仮定を置く。

## 4. 年次シミュレーションの基本式

1年ごとに、以下の順で計算する。

```text
年次手取り収入
= estimateTakeHome(本人年収 + 本人ボーナス)
 + estimateTakeHome(配偶者年収 + 配偶者ボーナス)

年次追加収入
= その年に該当する還付金、配当、補助金などの合計

基本生活支出
= (生活費 + 住居費 + 固定費) * 12

教育・子ども費
= その年の各子どもの教育費 + 生活費増加分 + イベント費

ライフイベント支出
= その年に発生する必須イベント金額

投資前余剰
= 年次手取り収入 + 年次追加収入
 - 基本生活支出
 - 教育・子ども費
 - ライフイベント支出

投資額
= 固定額方式: min(固定投資額 * 12, 投資前余剰)  ※赤字許容する場合は別フラグ化
= 割合方式: max(0, 投資前余剰 * 投資割合)

現金貯蓄額
= max(0, 投資前余剰 - 投資額)

年間収支
= 投資前余剰

年末現金残高
= 前年現金残高 + 現金貯蓄額 + min(0, 投資前余剰 - 投資額)

年末投資残高
= 前年投資残高 * (1 + 想定利回り) + 投資額

年末総資産
= 年末現金残高 + 年末投資残高
```

## 5. 子ども・教育費の年次配分ロジック

### 5.1 子どもの年齢モデル

MVPでは、現行入力の「将来の子ども人数」と「年齢差」から仮想的な子ども年齢を作る。

- 第1子はシミュレーション開始年に0歳として扱う
- 第2子以降は、`ageDifference`年後に誕生するものとして扱う
- 第3子以降は同じ年齢差で順次誕生するものとして扱う

例: 子ども3人、年齢差3歳の場合。

- 第1子: 2026年に0歳
- 第2子: 2029年に0歳
- 第3子: 2032年に0歳

既に子どもがいるケースは、将来的にプロフィールの子ども年齢を優先して補正する。

### 5.2 年齢別の教育費

子どもの年齢から、該当する費目を選ぶ。

- 0-5歳: `preschool`
- 6-11歳: `elementary`
- 12-14歳: `juniorHigh`
- 15-17歳: `highSchool`
- 18-21歳: `university`
- 6-17歳: `cram`を追加
- 0-21歳: `living`と`events`を追加

第2子以降の生活費・イベント費は、共有率を反映する。

```text
第2子以降の生活費 = 第1子生活費 * child2LivingRate / 100
第2子以降のイベント費 = 第1子イベント費 * child2EventsRate / 100
```

## 6. 投資・貯蓄ロジック

投資額の扱いは、ユーザーが以前指摘していた通り、余剰資金との整合性を重視する。

### 固定額投資

- 毎年、`fixedAmount * 12`を投資予定額とする
- 投資前余剰が足りない場合は、MVPでは投資額を余剰内に丸める
- 将来的には「不足しても投資継続」「不足時は投資停止」「不足時は投資減額」を選べるようにする

### 割合投資

- `投資前余剰 * percentage / 100`を投資額とする
- 余剰がマイナスの場合、投資額は0円とする
- 残りの余剰は現金貯蓄に回す

## 7. KPI定義

結果画面で表示すべきKPIは以下。

### 最終資産残高

```text
最終年の年末総資産
```

ユーザーにとって最も分かりやすい最終結果。

### 投資による増加額

```text
投資ありケースの最終資産 - 貯蓄のみケースの最終資産
```

同じ年次キャッシュフローで、投資額をすべて現金貯蓄にした比較ケースを内部的に作る。

### 教育費ピーク年

```text
教育・子ども費が最大となる年
```

複数年同額の場合は、最初の年をピーク年として表示する。

### 教育費ピーク金額

```text
max(年次教育・子ども費)
```

教育費だけでなく、子ども生活費・イベント費も含めた「子ども関連費ピーク」として扱うのがプロダクト意図に合う。

### 最小年間余剰

```text
min(投資前余剰)
```

投資判断前の家計体力を見るため、投資後ではなく投資前の余剰を見る。

### 赤字年数

```text
投資前余剰 < 0 の年数
```

家計そのものが赤字になる年を検出する。

### 資産取り崩し年数

```text
年末現金残高 < 前年現金残高 の年数
```

投資を続けることで現金を取り崩す年を検出する。赤字年とは別KPIにする。

## 8. 総合判定ロジック

`safe`、`attention`、`review`の3段階で判定する。

### safe

以下をすべて満たす。

- 赤字年数が0
- 最終資産残高が0円以上
- 最小年間余剰が0円以上
- 資産取り崩し年が全体の20%未満

### attention

以下のいずれかに該当する。

- 赤字年数は0だが、最小年間余剰が年間生活費3か月分未満
- 教育費ピーク年に投資額の減額が必要
- 資産取り崩し年が全体の20%以上
- 最終資産はプラスだが、途中で現金残高が大きく下がる

### review

以下のいずれかに該当する。

- 赤字年が1年以上ある
- 最終資産残高がマイナス
- 教育費ピーク年に投資前余剰がマイナス
- 現金残高がマイナスになる

## 9. 結果画面に渡すデータ構造案

```ts
type YearlySimulationRow = {
  year: number;
  userAge: number;
  spouseAge?: number;
  grossIncome: number;
  takeHomeIncome: number;
  annualIncome: number;
  baseExpense: number;
  educationCost: number;
  lifeEventCost: number;
  investmentAmount: number;
  savingsAmount: number;
  surplusBeforeInvestment: number;
  cashBalance: number;
  investmentBalance: number;
  totalAsset: number;
  isDeficit: boolean;
  eventNames: string[];
};

type SimulationKpi = {
  finalAsset: number;
  investmentGain: number;
  educationPeakYear: number;
  educationPeakAmount: number;
  minimumAnnualSurplus: number;
  deficitYears: number;
  drawdownYears: number;
  status: "safe" | "attention" | "review";
  headline: string;
  insights: string[];
};

type SimulationResult = {
  yearlyRows: YearlySimulationRow[];
  assetChartData: Array<{
    year: number;
    withInvestment: number;
    withoutInvestment: number;
    age: number;
  }>;
  educationChartData: Array<{
    year: number;
    total: number;
    [childKey: string]: number;
  }>;
  kpi: SimulationKpi;
};
```

## 10. Tech Lead観点の実装可能性

現行コードの`ScenarioInputs`から、MVP版のロジックは実装可能。

実装先は以下が自然。

- `ui/src/app/lib/simulation.ts`
  - `calculateSimulation(inputs: ScenarioInputs): SimulationResult`
  - `calculateYearlyRows(inputs: ScenarioInputs): YearlySimulationRow[]`
  - `calculateEducationCostByYear(...)`
  - `calculateAnnualIncomeByYear(...)`
  - `calculateLifeEventCostByYear(...)`
  - `calculateKpi(yearlyRows): SimulationKpi`

既存関数の再利用も可能。

- `estimateTakeHome`
- `parseAmount`
- `calculateInvestmentAllocation`
- `calculateSharedCost`

ただし、以下は追加設計が必要。

- 現在資産の入力欄がないため、初期現金残高は0円またはデフォルト値になる
- 第3子以降の教育費入力欄がないため、第2子の前提を流用する必要がある
- 年収成長率がないため、初期実装では年収一定にする
- 任意ライフイベントを計算に含めるかどうかの切替が必要

## 11. 実装ステップ案

### Step 1: 純粋関数として計算エンジンを追加

UIに触らず、`ScenarioInputs`から`SimulationResult`を返す関数を作る。

### Step 2: ResultsScreenをprops化

固定の`assetData`、`educationData`、KPI文言をやめ、`SimulationResult`を受け取る。

### Step 3: Appで結果を算出

結果画面表示時に、現在の`draftInputs`から`calculateSimulation(draftInputs)`を呼ぶ。

### Step 4: シナリオ保存時に結果サマリーへ反映

保存時の`finalAsset`、`educationPeak`、`status`を`SimulationResult.kpi`から作る。

### Step 5: ComparisonScreenを保存済み結果ベースに変更

保存済みシナリオの`inputs`から再計算し、比較表示する。

## 12. 受け入れ基準

- 同じ入力条件なら、リロード後も同じ結果が表示される
- 子どもの人数を変えると、教育費ピークと最終資産が変わる
- 投資方式を固定額/割合で変えると、投資額と最終資産が変わる
- ライフイベントを追加すると、該当年の年次収支が悪化する
- 年次追加収入を追加すると、該当年の年次収支が改善する
- 赤字年がある場合、結果画面の判定が`review`になる
- 教育費ピーク年と金額が、年次表・グラフ・KPIで一致する
