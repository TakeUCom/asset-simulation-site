
# ライフプランシミュレーション UI

Figma Make で生成したフロントエンド実装です。

元デザイン:
[Figma ファイル](https://www.figma.com/design/Nt6rb0Ecqmr23oWbrhwvrp/%E3%83%A9%E3%82%A4%E3%83%95%E3%83%97%E3%83%A9%E3%83%B3%E3%82%B7%E3%83%9F%E3%83%A5%E3%83%AC%E3%83%BC%E3%82%B7%E3%83%A7%E3%83%B3UI%E3%83%87%E3%82%B6%E3%82%A4%E3%83%B3)

## 前提

- Node.js 18 以上を推奨
- `npm` が使えること

## 起動方法

```powershell
cd C:\git\asset-simulation-site\ui
npm install
npm run dev
```

起動後、ターミナルに表示される Vite のローカルURLをブラウザで開いてください。

## ビルド

```powershell
cd C:\git\asset-simulation-site\ui
npm run build
```

## ディレクトリ概要

- `src/app/components`: 画面やUIコンポーネント
- `src/styles`: テーマ、フォント、スタイル
- `src/imports`: 要件定義や画面定義の取り込みファイル
- `guidelines`: Figma Make が出力した補助ガイド

## 主な画面コンポーネント

- `BasicInfoForm.tsx`
- `HouseholdForm.tsx`
- `EducationForm.tsx`
- `InvestmentForm.tsx`
- `ResultsScreen.tsx`
- `ComparisonScreen.tsx`
- `ScenarioList.tsx`

## 補足

- 依存関係の取得はまだ実行していません。初回起動時に `npm install` が必要です。
- もし依存関係の解決で `react` / `react-dom` 関連の警告が出る場合は、表示内容に応じて追加インストールを行ってください。
