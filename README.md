# Life Plan Simulation Site

子どもの人数、教育費、家計、投資条件をもとに将来のライフプランを試算するプロダクトの作業ディレクトリです。

## Structure

- [docs](C:\git\asset-simulation-site\docs): 要件、画面定義、Figma Make 指示書
- [ui](C:\git\asset-simulation-site\ui): Figma Make から出力したフロントエンド実装

## Documents

- [要件定義ドラフト](C:\git\asset-simulation-site\docs\requirements.md)
- [機能一覧と優先度](C:\git\asset-simulation-site\docs\feature-list.md)
- [画面一覧・機能一覧・簡易版画面定義書](C:\git\asset-simulation-site\docs\screen-definition.md)
- [デザインシステム指示書](C:\git\asset-simulation-site\docs\design-system-brief.md)
- [Figma Make 依頼指示書](C:\git\asset-simulation-site\docs\figma-make-request.md)
- [Figma Make 完成版プロンプト](C:\git\asset-simulation-site\docs\figma-make-final-prompt.md)

## UI Startup

UI を起動する場合は [ui/README.md](C:\git\asset-simulation-site\ui\README.md) を参照してください。

最短手順は以下です。

```powershell
cd C:\git\asset-simulation-site\ui
npm install
npm run dev
```

起動後は、Vite が表示するローカルURLをブラウザで開いて確認します。

## GitHub Pages

GitHub Pages 用の workflow は [deploy-pages.yml](C:\git\asset-simulation-site\.github\workflows\deploy-pages.yml) を追加済みです。

公開するには、GitHub 側で以下を設定してください。

1. リポジトリの `Settings` を開く
2. `Pages` を開く
3. `Build and deployment` の `Source` で `GitHub Actions` を選ぶ
4. `main` ブランチへ push する

補足:

- このリポジトリは `ui/` 配下を build して `ui/dist` を Pages へ配備します
- リポジトリ Pages では `/asset-simulation-site/` 配下で動くよう、Vite の `base` を自動調整します
- 独自ドメインやユーザー Pages に切り替える場合は、必要に応じて `VITE_BASE_PATH` で公開パスを上書きできます
