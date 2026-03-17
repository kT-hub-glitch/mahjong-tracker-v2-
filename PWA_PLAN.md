# Web公開とモバイルPWA化 実装計画

## 概要
作成した Mahjong Tracker v2 をWeb上に公開し、スマートフォンで「インストール」してアプリのように使えるようにします。

## Proposed Changes

### [Feature] PWA (Progressive Web App) 対応
#### [NEW] [manifest.json](file:///C:/Users/takan/.gemini/antigravity/scratch/mahjong-tracker-v2/public/manifest.json)
- ホーム画面に追加した際のアイコン、アプリ名、テーマカラーを定義します。
- スタンドアロンモード（ブラウザの枠なし）で起動するように設定します。

#### [MODIFY] [layout.tsx](file:///C:/Users/takan/.gemini/antigravity/scratch/mahjong-tracker-v2/src/app/layout.tsx)
- メタタグを追加して、iOS/Androidでの表示を最適化します。
- `manifest.json` へのリンクを追加します。

### [Documentation] デプロイガイド
#### [NEW] [DEPLOY.md](file:///C:/Users/takan/.gemini/antigravity/scratch/mahjong-tracker-v2/DEPLOY.md)
- Vercel へのデプロイ手順をまとめます。
- Supabase の環境変数設定（`NEXT_PUBLIC_SUPABASE_URL` 等）の重要性を明記します。

## Verification Plan
1. ブラウザの開発者ツールの Lighthouse で集計し、PWAとして認識されているか確認。
2. モバイル実機での表示シミュレーションを行い、レイアウトが崩れていないか再点検。
