# ライフプランシミュレーション API 設計メモ

## 1. 目的
UI で見えている以下の体験を成立させるための API を整理する。

- 共通プロフィールを 1 回設定して使い回す
- シナリオを複数保存して比較する
- 子どもの人数、教育費、子ども関連費、投資配分を変えて試算する
- 年ごとのシミュレーション結果を一覧と詳細で確認する
- 一般的な教育費パターンや概算手取りを初期値として利用する

このプロダクトでは、単なるフォーム保存 API ではなく、`計算の一貫性` と `比較可能性` が重要になる。
そのため、試算ロジックはフロントエンドに分散させず、バックエンドの Simulation API に集約する前提で設計する。

## 2. 設計方針

### 2.1 API スタイル
- 初期は `REST + JSON` で十分
- ベースパスは `/api/v1`
- 認証前提の本番ではユーザー単位でデータ分離
- 計算系は `POST` で明示的に実行

### 2.2 データ責務
- `Profile API`
  - 本人・配偶者の年齢、ベース年収、ボーナスなど共通情報を保持
- `Scenario API`
  - 子どもの人数、家計条件、教育費設定、投資条件などシナリオ差分を保持
- `Reference API`
  - 一般的な教育費パターン、概算手取り係数、表示用マスタを返す
- `Simulation API`
  - 年次キャッシュフロー、資産推移、教育費ピーク、比較指標を計算

### 2.3 計算をサーバー側に寄せる理由
- 概算手取りのルールを UI ごとにズラさないため
- 第2子の純増率や教育費パターンの反映を統一するため
- 結果画面と比較画面で同じ結果を再現できるようにするため
- 将来、税制やロジック変更があっても再計算しやすくするため

## 3. 主要ドメイン

### 3.1 Common Profile
- 本人年齢
- 配偶者年齢
- 本人年収
- 配偶者年収
- 本人ボーナス
- 配偶者ボーナス
- 世帯属性
  - 任意: 居住地、税区分、扶養前提

### 3.2 Scenario
- シナリオ名
- 子どもの人数
- 第1子と第2子の年齢差
- 家計条件
  - 生活費
  - 住居費
  - その他固定費
  - 将来資金に回す余剰資金
- 子ども費用条件
  - 進学パターン
  - 保育費
  - 小学校
  - 中学校
  - 高校
  - 大学
  - 塾/受験費
  - 習い事/イベント費
  - 食費/衣服/医療費
  - 第2子の生活関連費増分率
- 投資条件
  - 毎月投資額
  - 年1回追加投資額
  - 想定利回り
  - 貯蓄のみ比較を有効にするか

### 3.3 Simulation Result
- 年ごとの結果
  - 年齢
  - 世帯手取り
  - 生活費
  - 子ども費用
  - 投資元本
  - 貯蓄積立
  - 年間収支
  - 年末資産残高
- 集計結果
  - 教育費ピーク年
  - 教育費ピーク額
  - 最終資産
  - 赤字年の有無
  - 最大赤字額
  - 貯蓄ケースとの差額

## 4. API 一覧

## 4.1 Profile API

### `GET /api/v1/me/profile`
共通プロフィール取得。

用途:
- シナリオ一覧画面の共通プロフィール表示
- 新規シナリオ作成時の初期値表示

レスポンス例:
```json
{
  "userAge": 35,
  "spouseAge": 33,
  "userIncome": 6000000,
  "spouseIncome": 3000000,
  "userBonus": 1200000,
  "spouseBonus": 600000,
  "updatedAt": "2026-04-22T10:30:00+09:00"
}
```

### `PUT /api/v1/me/profile`
共通プロフィール更新。

リクエスト例:
```json
{
  "userAge": 35,
  "spouseAge": 33,
  "userIncome": 6500000,
  "spouseIncome": 3200000,
  "userBonus": 1400000,
  "spouseBonus": 600000
}
```

補足:
- 保存後、既存シナリオの再計算が必要かどうかを返すと親切

レスポンスに含めたいもの:
- 更新済みプロフィール
- `requiresResimulation: true/false`

## 4.2 Scenario API

### `GET /api/v1/scenarios`
シナリオ一覧取得。

用途:
- 一覧画面表示
- 比較対象の選択

レスポンス例:
```json
{
  "items": [
    {
      "id": "scn_001",
      "name": "子ども2人_投資あり",
      "childrenCount": 2,
      "investmentEnabled": true,
      "finalAsset": 52000000,
      "educationPeak": 2400000,
      "hasDeficit": false,
      "updatedAt": "2026-04-22T10:30:00+09:00"
    }
  ]
}
```

### `POST /api/v1/scenarios`
新規シナリオ作成。

用途:
- 「ゼロから作成」
- テンプレートから作成

リクエスト例:
```json
{
  "name": "子ども2人_投資あり",
  "childrenCount": 2,
  "ageDifference": 3
}
```

### `GET /api/v1/scenarios/{scenarioId}`
シナリオ詳細取得。

用途:
- 編集再開
- 結果画面からの再編集

レスポンスは以下をひとまとまりで返す:
- シナリオ基本情報
- 家計条件
- 子ども費用条件
- 投資条件
- 最終計算日時

### `PATCH /api/v1/scenarios/{scenarioId}`
シナリオ部分更新。

用途:
- ステップごとの自動保存
- 一部フォーム編集

リクエスト例:
```json
{
  "household": {
    "livingExpenses": 250000,
    "housingCost": 100000,
    "fixedCosts": 50000,
    "futureBudget": 80000
  }
}
```

実装メモ:
- 画面ごとに `PATCH` を打てるよう、部分更新を前提にする
- 更新後に `draftVersion` を返すと競合管理しやすい

### `POST /api/v1/scenarios/{scenarioId}/duplicate`
シナリオ複製。

用途:
- 比較用の派生シナリオを素早く作る

### `DELETE /api/v1/scenarios/{scenarioId}`
シナリオ削除。

用途:
- 一覧画面で不要シナリオを整理

## 4.3 Reference API

### `GET /api/v1/reference/education-patterns`
教育費/子ども費用の一般値パターン一覧取得。

用途:
- 第1子/第2子の初期値反映
- UI の「一般値を再反映」

レスポンス例:
```json
{
  "items": [
    {
      "key": "public",
      "label": "すべて公立中心",
      "values": {
        "preschool": 250000,
        "elementary": 350000,
        "juniorHigh": 540000,
        "highSchool": 510000,
        "university": 1200000,
        "cram": 250000,
        "activity": 120000,
        "livingSupport": 360000
      }
    }
  ]
}
```

### `GET /api/v1/reference/take-home-rules`
概算手取りルール取得。

用途:
- フロントの説明表示
- バックエンド計算の根拠表示

備考:
- MVP では固定係数でも良い
- 将来は地域、扶養人数、社会保険区分で分岐可能

### `GET /api/v1/reference/simulation-settings`
表示上の共通設定取得。

想定項目:
- デフォルトのシミュレーション年数
- 比較可能な最大シナリオ数
- 子ども人数上限

## 4.4 Simulation API

### `POST /api/v1/scenarios/{scenarioId}/simulate`
シナリオ計算実行。

用途:
- 結果画面表示
- 保存後の再計算

リクエスト例:
```json
{
  "projectionYears": 30,
  "compareSavingsOnly": true
}
```

レスポンス例:
```json
{
  "summary": {
    "finalAsset": 52000000,
    "educationPeakYear": 2038,
    "educationPeakAmount": 2400000,
    "hasDeficit": false,
    "maxDeficit": 0,
    "differenceVsSavingsOnly": 8800000
  },
  "timeline": [
    {
      "year": 2027,
      "userAge": 36,
      "spouseAge": 34,
      "childCosts": 720000,
      "livingCosts": 4800000,
      "takeHomeIncome": 6600000,
      "investmentPrincipal": 800000,
      "savingsContribution": 360000,
      "netCashFlow": 680000,
      "endingAssets": 12680000
    }
  ],
  "calculatedAt": "2026-04-22T11:00:00+09:00"
}
```

### `POST /api/v1/scenarios/compare`
複数シナリオ比較。

用途:
- 比較画面

リクエスト例:
```json
{
  "scenarioIds": ["scn_001", "scn_002", "scn_003"],
  "projectionYears": 30
}
```

レスポンス例:
```json
{
  "items": [
    {
      "scenarioId": "scn_001",
      "name": "子ども2人_投資あり",
      "finalAsset": 52000000,
      "educationPeakAmount": 2400000,
      "maxDeficit": 0,
      "riskLevel": "medium"
    }
  ],
  "bestByMetric": {
    "finalAsset": "scn_001",
    "lowestPeakBurden": "scn_002",
    "lowestRisk": "scn_003"
  }
}
```

### `GET /api/v1/scenarios/{scenarioId}/timeline`
年次タイムラインだけ取得。

用途:
- 結果画面の「年ごとの X 年シミュレーション」
- 将来、表とグラフの遅延読み込みに使える

クエリ例:
- `?projectionYears=30`

## 5. 画面別 API マッピング

| 画面 | 主 API | 補助 API |
|---|---|---|
| シナリオ一覧 | `GET /me/profile`, `GET /scenarios` | `POST /scenarios`, `POST /scenarios/{id}/duplicate`, `DELETE /scenarios/{id}` |
| 基本情報 | `PATCH /scenarios/{id}` | なし |
| 家計入力 | `PATCH /scenarios/{id}` | `GET /reference/take-home-rules` |
| 子ども費用入力 | `PATCH /scenarios/{id}` | `GET /reference/education-patterns` |
| 投資設定 | `PATCH /scenarios/{id}` | なし |
| 結果画面 | `POST /scenarios/{id}/simulate`, `GET /scenarios/{id}/timeline` | なし |
| 比較画面 | `POST /scenarios/compare` | `GET /scenarios` |

## 6. バックエンド内部構成案

### 6.1 API Gateway / Web App
- 認証
- リクエスト検証
- レスポンス整形

### 6.2 Profile Service
- 共通プロフィールの CRUD
- プロフィール変更時の再計算フラグ管理

### 6.3 Scenario Service
- シナリオの CRUD
- 子フォーム単位の部分更新
- 複製処理

### 6.4 Reference Service
- 教育費一般値
- 概算手取り係数
- 設定マスタ

### 6.5 Simulation Service
- 年次キャッシュフロー生成
- 第2子増分率の反映
- 投資/貯蓄の資産推移計算
- 比較指標作成

## 7. DB モデル案

### `profiles`
- `user_id`
- `user_age`
- `spouse_age`
- `user_income`
- `spouse_income`
- `user_bonus`
- `spouse_bonus`
- `updated_at`

### `scenarios`
- `id`
- `user_id`
- `name`
- `children_count`
- `age_difference`
- `status`
- `latest_result_id`
- `created_at`
- `updated_at`

### `scenario_households`
- `scenario_id`
- `living_expenses`
- `housing_cost`
- `fixed_costs`
- `future_budget`

### `scenario_children`
- `id`
- `scenario_id`
- `child_order`
- `pattern_key`
- `preschool`
- `elementary`
- `junior_high`
- `high_school`
- `university`
- `cram`
- `activity`
- `living_support`
- `shared_cost_rate`

### `scenario_investments`
- `scenario_id`
- `monthly_investment`
- `annual_investment`
- `expected_return`
- `compare_savings_only`

### `simulation_results`
- `id`
- `scenario_id`
- `projection_years`
- `summary_json`
- `timeline_json`
- `calculated_at`

MVP では `summary_json` と `timeline_json` を JSON で持ってよい。
将来、分析クエリが増えたら年次テーブルを正規化する。

## 8. 仕組みの検討

### 8.1 いつ計算するか
候補は 2 つ。

1. 入力変更のたびに自動再計算
2. 結果画面遷移時に明示計算

推奨:
- MVP は `結果画面遷移時に計算`
- 途中のフォームでは `ドラフト保存`

理由:
- 計算コストを抑えやすい
- 画面遷移の責務が分かりやすい
- ロジック変更時に再計算しやすい

### 8.2 概算手取りの扱い
候補は 2 つ。

1. フロントで単純計算
2. API で計算

推奨:
- API で計算し、フロントは表示に専念

理由:
- 計算根拠を 1 か所に寄せられる
- 将来、扶養人数や地域係数を入れやすい
- 結果画面との整合が崩れにくい

### 8.3 教育費一般値の扱い
推奨:
- 参照 API から取得
- UI では「初期値として使う」だけ
- 保存時はシナリオ側に実値を持つ

理由:
- 後から一般値マスタを更新しても、保存済みシナリオの再現性を失わない

### 8.4 比較画面の作り方
推奨:
- 比較 API は `集計済みの比較用レスポンス` を返す
- フロントで生 timeline を 3 本束ねて比較しない

理由:
- UI が必要とする比較指標をサーバー側で揃えられる
- 比較基準のロジックを統一できる

## 9. MVP の最小 API セット

MVP ならまずは以下で足りる。

- `GET /api/v1/me/profile`
- `PUT /api/v1/me/profile`
- `GET /api/v1/scenarios`
- `POST /api/v1/scenarios`
- `GET /api/v1/scenarios/{scenarioId}`
- `PATCH /api/v1/scenarios/{scenarioId}`
- `GET /api/v1/reference/education-patterns`
- `POST /api/v1/scenarios/{scenarioId}/simulate`
- `POST /api/v1/scenarios/compare`

## 10. 次に詰めるべきこと

次の順で進めると実装に入りやすい。

1. API ごとの request / response JSON schema 定義
2. Simulation Service の年次計算ロジック定義
3. DB モデルの詳細化
4. 認証方式と保存戦略の決定
5. 画面から API への接続順序の整理
