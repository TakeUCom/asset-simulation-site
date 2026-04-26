# 固定値の可変化と API / 処理設計メモ

## 1. 目的
現在の UI ソースでは、Figma Make 由来のモック値・初期値・計算ロジックがフロントエンドに固定されています。
今後、実プロダクトとして成立させるために、どの値を API / DB / マスタ / 計算サービスへ移すべきかを整理します。

対象:
- `ui/src/app/App.tsx`
- `ui/src/app/components/ScenarioList.tsx`
- `ui/src/app/components/BasicInfoFormV2.tsx`
- `ui/src/app/components/HouseholdFormV2.tsx`
- `ui/src/app/components/EducationFormV2.tsx`
- `ui/src/app/components/InvestmentFormV2.tsx`
- `ui/src/app/components/ResultsScreen.tsx`
- `ui/src/app/components/ComparisonScreen.tsx`

## 2. 結論
以下は固定文字・固定値のままではなく、API または設定データとして可変化すべきです。

| 分類 | 現状 | あるべき姿 |
|---|---|---|
| 共通プロフィール | `App.tsx` の state 初期値 | `Profile API` から取得/保存 |
| シナリオ一覧 | `ScenarioList.tsx` の `mockScenarios` | `Scenario API` から取得 |
| シナリオ基本条件 | `App.tsx` の `scenarioConfig` | `Scenario API` のドラフト保存 |
| 家計条件 | `App.tsx` の `householdConfig` | `Scenario Household API` で保存 |
| 概算手取り計算 | `gross * 0.78` | `Tax/Income Calculation API` または計算サービス |
| 教育費/子ども費用プリセット | `EducationFormV2.tsx` の `presets` | `Reference API` のマスタ |
| 子ども費用計算 | フロント内 `calculateChildTotal` | `Simulation API` に集約 |
| 第2子増分率 | `70%` 固定初期値 | シナリオ設定として保存 |
| 投資初期値 | `50000`, `200000`, `5%`, `20年` | シナリオ設定 + 計算設定マスタ |
| 投資/貯蓄計算 | フロント内 `useMemo` | `Simulation API` に集約 |
| 結果データ | `ResultsScreen.tsx` の `assetData`, `educationData`, `detailData` | `Simulation Result API` から取得 |
| 比較データ | `ComparisonScreen.tsx` の `scenarios`, `comparisonData` | `Scenario Compare API` から取得 |
| ステータス/推奨判定 | フロント固定 | `Simulation API` の判定結果 |
| 年次イベント/還付 | 未実装または固定なし | `Annual Adjustments API` として保存/計算 |

## 3. 画面別の固定値洗い出し

## 3.1 `App.tsx`

### 固定になっているもの
- `commonProfile`
  - 本人年齢
  - 配偶者年齢
  - 本人年収
  - 配偶者年収
  - 本人ボーナス
  - 配偶者ボーナス
- `scenarioConfig`
  - シナリオ名
  - 子どもの人数
  - 年齢差
- `householdConfig`
  - 生活費
  - 住居費
  - 固定費
  - 将来資金に回す額
- `estimateAnnualTakeHome(gross * 0.78)`

### 必要な API / 処理
- `GET /api/v1/me/profile`
- `PUT /api/v1/me/profile`
- `GET /api/v1/scenarios/{scenarioId}`
- `PATCH /api/v1/scenarios/{scenarioId}`
- `POST /api/v1/calculations/take-home`

### 方針
`App.tsx` は画面遷移と一時 state だけに寄せ、永続化する値は API から取得する。
概算手取りはフロントで `0.78` 固定にせず、将来的に扶養・地域・社会保険前提を反映できる計算 API に寄せる。

## 3.2 `ScenarioList.tsx`

### 固定になっているもの
- `mockScenarios`
  - シナリオ名
  - 作成日/更新日
  - 子ども人数
  - 投資有無
  - 最終資産
  - 教育費ピーク
  - ステータス
  - 赤字有無
- 比較対象の最大数 `3`
- 新規作成テンプレートの一覧
- 共通プロフィールのサマリー計算

### 必要な API / 処理
- `GET /api/v1/scenarios`
- `POST /api/v1/scenarios`
- `POST /api/v1/scenarios/{scenarioId}/duplicate`
- `DELETE /api/v1/scenarios/{scenarioId}`
- `GET /api/v1/reference/scenario-templates`
- `GET /api/v1/reference/simulation-settings`

### 方針
一覧カードに表示する `finalAsset`, `educationPeak`, `hasDeficit`, `status` は、保存済みの最新 simulation result から取得する。
テンプレートはコード固定ではなく、マスタとして持つ。

## 3.3 `BasicInfoFormV2.tsx`

### 固定になっているもの
- 子ども人数の選択肢 `0〜4人以上`
- 年齢差の初期値
- ステップ名
- シナリオ名 placeholder

### 必要な API / 処理
- `GET /api/v1/reference/simulation-settings`
- `PATCH /api/v1/scenarios/{scenarioId}`

### 方針
子ども人数上限やラベルは設定マスタ化する。
入力値はシナリオの基本条件としてドラフト保存する。

## 3.4 `HouseholdFormV2.tsx`

### 固定になっているもの
- 生活費/住居費/固定費/将来資金の初期値
- 概算手取り係数
- 毎月余剰の計算式
- 表示上の費目分類

### 必要な API / 処理
- `PATCH /api/v1/scenarios/{scenarioId}/household`
- `POST /api/v1/calculations/take-home`
- `GET /api/v1/reference/household-categories`

### 方針
家計条件はシナリオ配下に保存する。
費目分類は将来増えるため、固定 label ではなくカテゴリマスタ化する。
概算手取りと年次収入は Simulation Service 側で再計算する。

## 3.5 `EducationFormV2.tsx`

### 固定になっているもの
- `presets`
  - 公立中心
  - 公立中心 + 私立大学
  - 高校から私立中心
  - 幼少期から私立中心
- 各進学パターンの費用
- 保育/小学校/中学校/高校/大学/塾/習い事/生活関連費の年数
  - 保育 3年
  - 小学校 6年
  - 中学校 3年
  - 高校 3年
  - 大学 4年
  - 塾 12年
  - 生活関連費 18年
- 第2子の生活関連費増分率 `70%`
- 子ども費用の合計計算

### 必要な API / 処理
- `GET /api/v1/reference/education-patterns`
- `GET /api/v1/reference/child-cost-categories`
- `PATCH /api/v1/scenarios/{scenarioId}/children`
- `POST /api/v1/scenarios/{scenarioId}/simulate`

### 方針
教育費プリセットは必ず API 化する。
一般値は年度や出典によって更新されるため、フロント固定は避ける。
また、子ども費用の合計計算は UI 表示用の概算に留め、正式な年次反映は Simulation API で行う。

## 3.6 `InvestmentFormV2.tsx`

### 固定になっているもの
- 初期投資額
  - `min(50000, futureBudget * 0.6)`
- 年1回追加投資 `200000`
- 想定利回り `5%`
- 計算期間 `20年`
- 投資成長計算
- 貯蓄との差分計算

### 必要な API / 処理
- `PATCH /api/v1/scenarios/{scenarioId}/investment`
- `GET /api/v1/reference/investment-defaults`
- `POST /api/v1/scenarios/{scenarioId}/simulate`

### 方針
投資は固定金額と割合指定の両方を扱えるモデルにする。
投資成長計算はフロント固定にせず、年次の余剰金額、イベント支出、還付収入を反映できる Simulation API に寄せる。

## 3.7 `ResultsScreen.tsx`

### 固定になっているもの
- `assetData`
- `educationData`
- `detailData`
- KPI の数値
- 総合コメント
- 重要な気づき
- アラート内容
- グラフ凡例

### 必要な API / 処理
- `POST /api/v1/scenarios/{scenarioId}/simulate`
- `GET /api/v1/scenarios/{scenarioId}/simulation-results/latest`
- `GET /api/v1/scenarios/{scenarioId}/timeline`

### 方針
結果画面は完全に simulation result を表示するだけにする。
コメントやアラートも、可能なら API 側で `insights` として返す。

レスポンスに含めたい項目:
- `summary`
- `kpis`
- `insights`
- `warnings`
- `assetTimeline`
- `childCostTimeline`
- `annualCashFlowRows`

## 3.8 `ComparisonScreen.tsx`

### 固定になっているもの
- `scenarios`
- `comparisonData`
- 推奨シナリオ
- 比較表の数値
- 比較からの考察文

### 必要な API / 処理
- `POST /api/v1/scenarios/compare`
- `GET /api/v1/scenarios`

### 方針
比較画面では、フロント側で推奨判定を持たない。
API が比較軸ごとの評価を返す。

必要な比較軸:
- 最終資産
- 最小年間余剰
- 赤字年数
- 教育費ピーク
- 投資リスク
- 大型イベント支出の影響

## 4. 追加で必要な可変データ

最新の要件を踏まえると、以下も固定値ではなくシナリオデータとして必要。

## 4.1 年次追加収入/還付

対象:
- 住宅ローン減税
- 確定申告還付
- 節税効果
- 配当金
- 補助金/給付金
- その他一時収入

必要 API:
- `GET /api/v1/scenarios/{scenarioId}/annual-adjustments`
- `POST /api/v1/scenarios/{scenarioId}/annual-adjustments`
- `PATCH /api/v1/scenarios/{scenarioId}/annual-adjustments/{adjustmentId}`
- `DELETE /api/v1/scenarios/{scenarioId}/annual-adjustments/{adjustmentId}`

データ項目:
- `year`
- `name`
- `type`
- `amount`
- `repeatType`
- `startYear`
- `endYear`
- `memo`

## 4.2 年ごとのビッグイベント支出

対象:
- 結婚式
- 車購入
- 引っ越し
- 旅行
- 家具家電
- リフォーム
- 大型医療費
- 親族支援

必要 API:
- `GET /api/v1/scenarios/{scenarioId}/life-events`
- `POST /api/v1/scenarios/{scenarioId}/life-events`
- `PATCH /api/v1/scenarios/{scenarioId}/life-events/{eventId}`
- `DELETE /api/v1/scenarios/{scenarioId}/life-events/{eventId}`

データ項目:
- `year`
- `name`
- `category`
- `amount`
- `importance`
- `memo`

## 4.3 投資配分ルール

対象:
- 固定金額
- 余剰金額に対する割合
- 年次余剰が足りないときの扱い

必要 API:
- `PATCH /api/v1/scenarios/{scenarioId}/investment`

データ項目:
- `allocationType`
  - `fixed_amount`
  - `surplus_ratio`
- `monthlyFixedAmount`
- `surplusRatio`
- `annualAdditionalInvestment`
- `expectedReturn`
- `insufficientSurplusHandling`
  - `warn_only`
  - `cap_to_surplus`
  - `allow_negative_cashflow`

## 5. 推奨 API 一覧

## 5.1 Profile

| Method | Path | 用途 |
|---|---|---|
| GET | `/api/v1/me/profile` | 共通プロフィール取得 |
| PUT | `/api/v1/me/profile` | 共通プロフィール更新 |

## 5.2 Scenario

| Method | Path | 用途 |
|---|---|---|
| GET | `/api/v1/scenarios` | シナリオ一覧取得 |
| POST | `/api/v1/scenarios` | シナリオ作成 |
| GET | `/api/v1/scenarios/{scenarioId}` | シナリオ詳細取得 |
| PATCH | `/api/v1/scenarios/{scenarioId}` | シナリオ基本条件更新 |
| POST | `/api/v1/scenarios/{scenarioId}/duplicate` | シナリオ複製 |
| DELETE | `/api/v1/scenarios/{scenarioId}` | シナリオ削除 |

## 5.3 Scenario Sections

| Method | Path | 用途 |
|---|---|---|
| PATCH | `/api/v1/scenarios/{scenarioId}/household` | 家計条件更新 |
| PATCH | `/api/v1/scenarios/{scenarioId}/children` | 子ども費用条件更新 |
| PATCH | `/api/v1/scenarios/{scenarioId}/investment` | 投資条件更新 |
| PATCH | `/api/v1/scenarios/{scenarioId}/simulation-settings` | 試算年数などの設定更新 |

## 5.4 Annual Inputs

| Method | Path | 用途 |
|---|---|---|
| GET | `/api/v1/scenarios/{scenarioId}/annual-adjustments` | 年次追加収入/還付一覧 |
| POST | `/api/v1/scenarios/{scenarioId}/annual-adjustments` | 年次追加収入/還付追加 |
| PATCH | `/api/v1/scenarios/{scenarioId}/annual-adjustments/{adjustmentId}` | 年次追加収入/還付更新 |
| DELETE | `/api/v1/scenarios/{scenarioId}/annual-adjustments/{adjustmentId}` | 年次追加収入/還付削除 |
| GET | `/api/v1/scenarios/{scenarioId}/life-events` | ライフイベント支出一覧 |
| POST | `/api/v1/scenarios/{scenarioId}/life-events` | ライフイベント支出追加 |
| PATCH | `/api/v1/scenarios/{scenarioId}/life-events/{eventId}` | ライフイベント支出更新 |
| DELETE | `/api/v1/scenarios/{scenarioId}/life-events/{eventId}` | ライフイベント支出削除 |

## 5.5 Reference

| Method | Path | 用途 |
|---|---|---|
| GET | `/api/v1/reference/scenario-templates` | 新規作成テンプレート |
| GET | `/api/v1/reference/education-patterns` | 進学パターン別一般値 |
| GET | `/api/v1/reference/child-cost-categories` | 子ども費用カテゴリ |
| GET | `/api/v1/reference/household-categories` | 家計カテゴリ |
| GET | `/api/v1/reference/investment-defaults` | 投資初期値/選択肢 |
| GET | `/api/v1/reference/simulation-settings` | 試算年数/比較上限など |

## 5.6 Calculation / Simulation

| Method | Path | 用途 |
|---|---|---|
| POST | `/api/v1/calculations/take-home` | 概算手取り計算 |
| POST | `/api/v1/scenarios/{scenarioId}/simulate` | シナリオ再計算 |
| GET | `/api/v1/scenarios/{scenarioId}/simulation-results/latest` | 最新結果取得 |
| GET | `/api/v1/scenarios/{scenarioId}/timeline` | 年次タイムライン取得 |
| POST | `/api/v1/scenarios/compare` | 複数シナリオ比較 |

## 6. 処理フロー案

## 6.1 初期表示
1. `GET /me/profile`
2. `GET /scenarios`
3. `GET /reference/simulation-settings`
4. 一覧画面を表示

## 6.2 新規シナリオ作成
1. `GET /reference/scenario-templates`
2. ユーザーがテンプレート選択
3. `POST /scenarios`
4. 作成された `scenarioId` を持って入力ステップへ遷移

## 6.3 入力ステップ
1. 画面ごとに `PATCH /scenarios/{scenarioId}/...`
2. 入力内容はドラフト保存
3. 必要に応じて `POST /calculations/take-home` でプレビュー

## 6.4 結果表示
1. `POST /scenarios/{scenarioId}/simulate`
2. `GET /scenarios/{scenarioId}/simulation-results/latest`
3. 結果画面に KPI / グラフ / 年次表を表示

## 6.5 結果画面で年次微調整
1. 年次表からイベント/還付を追加
2. `POST /annual-adjustments` または `POST /life-events`
3. `POST /simulate`
4. 結果を再取得して反映

## 7. 実装優先度

### P0: MVP で必須
- `mockScenarios` の API 化
- 共通プロフィールの API 化
- シナリオ詳細/保存 API
- 教育費プリセットの API 化
- Simulation API による結果画面の可変化

### P1: 精度向上に必要
- 年次追加収入/還付 API
- ライフイベント支出 API
- 投資配分ルール API
- 比較 API

### P2: 運用・拡張
- マスタ管理画面
- 税制/手取り計算ロジックのバージョン管理
- 教育費一般値の出典/年度管理
- シミュレーション結果の履歴管理

## 8. 技術的な注意点

### 8.1 フロントに残してよいもの
- 表示文言
- UI の開閉状態
- 未保存の一時入力値
- 入力補助用の軽いプレビュー

### 8.2 フロントから外すべきもの
- 公式なシミュレーション計算
- 税/手取り計算
- 教育費一般値
- 投資成長計算
- 推奨判定
- 赤字/注意ステータス判定

### 8.3 計算ロジックのバージョン管理
シミュレーション結果には `calculationVersion` を持たせる。
税制や教育費一般値が変わった場合に、いつの前提で計算した結果かを追えるようにする。

## 9. 次の実装ステップ

1. API 型定義を `src/app/types/api.ts` に切り出す
2. `services/apiClient.ts` を作る
3. `ScenarioList` の `mockScenarios` を API 取得に差し替える
4. `EducationFormV2` の `presets` を `Reference API` 取得に差し替える
5. `ResultsScreen` の固定データを `Simulation Result API` 取得に差し替える
6. `ComparisonScreen` の固定データを `Compare API` 取得に差し替える

