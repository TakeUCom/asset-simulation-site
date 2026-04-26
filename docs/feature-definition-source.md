# 機能定義書（ソースコード逆算版）

最終更新: 2026-04-26  
対象実装: `C:\git\asset-simulation-site\ui\src\app`

## 1. 目的

本書は、現行ソースコードから逆算した機能定義書です。  
要件ベースではなく、**現在の実装が提供している機能・処理・制約** を明文化しています。

## 2. システム概要

本システムは、家族構成・家計・子ども費用・ライフイベント・投資条件を入力し、  
将来の年次収支と資産推移を可視化するライフプランシミュレーションWebアプリです。

実装方式:
- フロントエンド単体構成
- API未接続
- 永続化は `localStorage`
- 結果計算はフロント内の純関数で実行

主要計算入口:
- [calculateSimulation](C:/git/asset-simulation-site/ui/src/app/lib/simulation.ts:1)

## 3. 機能一覧

| 機能ID | 機能名 | 概要 |
|---|---|---|
| F-01 | 共通プロフィール管理 | 全シナリオ共通の家族・収入前提を保存 |
| F-02 | シナリオ作成・編集 | シナリオ差分条件を入力し、保存前のドラフトを保持 |
| F-03 | シナリオ一覧管理 | 保存済みシナリオの閲覧、複製、比較対象選択 |
| F-04 | 年次追加収入管理 | 還付金・配当金など単年/複数年収入を登録 |
| F-05 | 子ども費用設定 | 教育費、生活費、イベント費を子ども別に登録 |
| F-06 | ライフイベント管理 | 一括/ローンの大型支出を登録 |
| F-07 | 投資配分設定 | 固定額投資/余剰割合投資を設定 |
| F-08 | 年次シミュレーション計算 | 25年分の収支・投資・資産推移を計算 |
| F-09 | KPI算出 | 最終資産、教育費ピーク、最小余剰、判定を算出 |
| F-10 | 年次調整 | 特定年の収入/支出を単年で上書き |
| F-11 | シナリオ保存・再現 | 入力済み条件とサマリーを保存し再編集可能にする |
| F-12 | シナリオ比較 | 保存済みシナリオを再計算し比較表示 |

## 4. 機能定義

### F-01 共通プロフィール管理

対象実装:
- [ProfileSetup.tsx](C:/git/asset-simulation-site/ui/src/app/components/ProfileSetup.tsx:1)
- [storage.ts](C:/git/asset-simulation-site/ui/src/app/lib/storage.ts:1)

機能概要:
- 本人、配偶者、現在の子ども、基本収入を共通前提として保持
- 初回起動時はプロフィール未登録ならプロフィール画面を表示
- 保存後は全シナリオで共通利用

入出力:
- 入力: `Profile`
- 保存: `lifeplan.profile`
- 出力: シナリオ作成時の参照情報

制約:
- 現在の子ども情報は第1子のみ個別入力

### F-02 シナリオ作成・編集

対象実装:
- [App.tsx](C:/git/asset-simulation-site/ui/src/app/App.tsx:1)
- [scenario.ts](C:/git/asset-simulation-site/ui/src/app/lib/scenario.ts:1)

機能概要:
- 新規シナリオのドラフト生成
- 保存済みシナリオの再編集
- 各ステップ入力を `ScenarioInputs` に集約

入力データ構造:
- `basic`
- `household`
- `childCost`
- `lifeEvents`
- `investment`
- `yearAdjustments`

制約:
- ドラフトはメモリ上に保持し、保存時にのみ `ScenarioSummary` を生成

### F-03 シナリオ一覧管理

対象実装:
- [ScenarioList.tsx](C:/git/asset-simulation-site/ui/src/app/components/ScenarioList.tsx:1)

機能概要:
- 保存済みシナリオカードの一覧表示
- 編集
- 複製
- 比較対象選択
- テンプレート選択モーダル

仕様:
- 比較対象は最大3件
- 2件以上選択で比較画面に遷移
- 複製時は名前に `_コピー` を付与

### F-04 年次追加収入管理

対象実装:
- [AnnualIncomeInput.tsx](C:/git/asset-simulation-site/ui/src/app/components/AnnualIncomeInput.tsx:1)
- [simulation.ts](C:/git/asset-simulation-site/ui/src/app/lib/simulation.ts:1)

機能概要:
- 単年または複数年で発生する追加収入を管理
- 年次シミュレーション時に対象年のみ収入へ加算

対応カテゴリ:
- 住宅ローン減税
- 確定申告還付
- 節税効果
- 配当金
- 補助金/給付金
- その他

計算仕様:
- `single`: 開始年のみ反映
- `multiple`: 開始年から継続年数分反映

### F-05 子ども費用設定

対象実装:
- [ChildCostForm.tsx](C:/git/asset-simulation-site/ui/src/app/components/ChildCostForm.tsx:1)
- [ChildLifeCostInput.tsx](C:/git/asset-simulation-site/ui/src/app/components/ChildLifeCostInput.tsx:1)
- [calculations.ts](C:/git/asset-simulation-site/ui/src/app/lib/calculations.ts:1)
- [simulation.ts](C:/git/asset-simulation-site/ui/src/app/lib/simulation.ts:1)

機能概要:
- 第1子、第2子の教育費を年額で設定
- 日常生活費は標準設定または年齢範囲別で設定
- 第2子の日常費は第1子比の共有率で圧縮計算

進学パターン:
- すべて公立中心
- 公立中心 + 私立大学
- 高校から私立
- 幼少期から私立

計算仕様:
- 教育費は年齢帯ごとに学校区分を切り替え
- 第1子は基準年に0歳開始
- 第2子以降は `ageDifference` をもとに出生年をずらす

制約:
- 実装上は最大4人分まで結果グラフに出力
- 入力UIは第1子・第2子中心

### F-06 ライフイベント管理

対象実装:
- [LifeEventInput.tsx](C:/git/asset-simulation-site/ui/src/app/components/LifeEventInput.tsx:1)
- [simulation.ts](C:/git/asset-simulation-site/ui/src/app/lib/simulation.ts:1)

機能概要:
- 将来の大型支出イベントを複数登録
- 一括払いとローン払いに対応
- 年次表でイベント内訳表示

ローン計算仕様:
- 開始年に `頭金 + 年返済額`
- 2年目以降は `年返済額`
- 年返済額は元利均等返済の概算

### F-07 投資配分設定

対象実装:
- [InvestmentForm.tsx](C:/git/asset-simulation-site/ui/src/app/components/InvestmentForm.tsx:1)
- [calculations.ts](C:/git/asset-simulation-site/ui/src/app/lib/calculations.ts:1)
- [simulation.ts](C:/git/asset-simulation-site/ui/src/app/lib/simulation.ts:1)

機能概要:
- 投資方式を選択
- 想定利回りを設定
- 現在余剰ベースの簡易試算と、結果画面での年次計算を提供

投資方式:
- `fixed`: 毎月固定額
- `percentage`: 余剰の割合

計算仕様:
- 結果画面では年間余剰の範囲内でのみ投資実行
- 赤字年は投資額を0円に制限

制約:
- 入力画面の現在余剰表示は固定設定値 `currentMonthlySurplus` を利用

### F-08 年次シミュレーション計算

対象実装:
- [simulation.ts](C:/git/asset-simulation-site/ui/src/app/lib/simulation.ts:1)

機能概要:
- 25年分の年次シミュレーションを生成
- 収入、支出、投資、現金残高、投資残高、総資産を計算

年次計算順序:
1. 手取り収入と追加収入を確定
2. 基本支出、教育費、ライフイベント費を合算
3. 年間余剰を算出
4. 年間余剰の範囲内で投資額を確定
5. 残額を貯蓄、マイナス分を取り崩しとして反映
6. 現金残高と投資残高を更新

主要出力:
- `YearlySimulationRow[]`
- `assetChartData`
- `educationChartData`

### F-09 KPI算出

対象実装:
- [simulation.ts](C:/git/asset-simulation-site/ui/src/app/lib/simulation.ts:1)

算出項目:
- 最終資産残高
- 投資による増加額
- 教育費ピーク年
- 教育費ピーク額
- 最小年間余剰
- 赤字年数
- 取り崩し年数
- 総合判定
- 見出し文
- インサイト文

判定ロジック:
- `review`: 赤字年あり、最終資産マイナス、または現金残高マイナス
- `attention`: 余剰が薄い、または取り崩し年が一定以上
- `safe`: 上記以外

### F-10 年次調整

対象実装:
- [YearEditModal.tsx](C:/git/asset-simulation-site/ui/src/app/components/YearEditModal.tsx:1)
- [simulation.ts](C:/git/asset-simulation-site/ui/src/app/lib/simulation.ts:1)

機能概要:
- 特定年のみ収入・支出を補正
- 保存後、結果画面を即時再計算

補正対象:
- 本人年収
- 配偶者年収
- 本人ボーナス
- 配偶者ボーナス
- 追加収入
- 収入減少
- 基本支出
- メモ

### F-11 シナリオ保存・再現

対象実装:
- [storage.ts](C:/git/asset-simulation-site/ui/src/app/lib/storage.ts:1)
- [scenario.ts](C:/git/asset-simulation-site/ui/src/app/lib/scenario.ts:1)

機能概要:
- 入力済みシナリオ条件を保存
- 保存時にシミュレーションサマリーを生成
- 再度開いたときに入力内容を復元

保存内容:
- `ScenarioInputs`
- サマリー項目
  - 最終資産
  - 教育費ピーク
  - 判定
  - 赤字有無

### F-12 シナリオ比較

対象実装:
- [ComparisonScreen.tsx](C:/git/asset-simulation-site/ui/src/app/components/ComparisonScreen.tsx:1)

機能概要:
- 選択した保存済みシナリオを再計算して比較
- 総合推奨、教育費軽負担、安全性重視を表示

比較ロジック:
- 総合推奨: `status` 優先、同率なら `finalAsset` で比較
- 教育費軽負担: 教育費ピーク額が最小
- 安全性重視: 赤字年数、次に取り崩し年数が最小

制約:
- 入力値を持つ保存済みシナリオのみ比較対象
- 最大3件まで

## 5. 非機能仕様

保存:
- ブラウザ `localStorage`
- API未使用

表示:
- 重い画面である `ResultsScreen` と `ComparisonScreen` は遅延読み込み

テスト:
- 計算ロジックの単体テストあり
- `npm test` で実行

ビルド:
- `vite build`

## 6. 既知の制約・今後の論点

現行実装ベースでの制約:
- 初期資産の入力なし
- `monthlySavings` は本シミュレーション計算へ未反映
- 投資設定画面の余剰表示は固定値ベース
- プロフィールの子ども詳細は第1子まで
- 教育費入力UIは第1子/第2子中心、結果描画は最大4人分

今後の拡張候補:
- 初期資産、既存投資残高の入力
- 投資設定画面の余剰を実計算連動に変更
- 子ども3人目以降の入力UI強化
- シナリオ共有/エクスポート
