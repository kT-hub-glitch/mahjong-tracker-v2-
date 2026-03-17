# Mahjong Tracker v2 デプロイガイド (Vercel編)

このアプリケーションをWeb上に公開し、スマートフォンで利用する手順を説明します。

## 1. Vercel へのデプロイ
最も簡単で推奨される方法は **Vercel** へのデプロイです。

1. [Vercel](https://vercel.com/) にログイン（GitHub連携がおすすめ）。
2. GitHubのリポジトリを選択してインポートします。
3. **重要: 環境変数を追加してください**
   デプロイ設定の「Environment Variables」に、ローカルの `.env.local` と同じ内容を追加します。
   - `NEXT_PUBLIC_SUPABASE_URL`: (SupabaseのURL)
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: (SupabaseのAnon Key)

## 2. スマートフォンでの利用方法
デプロイしたURL（例: `https://your-app.vercel.app`）にアクセスします。

### iPhone (Safari)
1. 画面下部の「共有」ボタン（四角から矢印が出ているアイコン）を押します。
2. **「ホーム画面に追加」** を選択します。

### Android (Chrome)
1. 画面右上のメニュー（縦の三点リーダー）を押します。
2. **「アプリをインストール」** または **「ホーム画面に追加」** を選択します。

これで、ブラウザの枠がない **フルスクリーンアプリ** として Mahjong Tracker を利用できるようになります！

## 注意点
- 無料版の Vercel/Supabase を使用している場合、一定期間アクセスがないとプロジェクトがスリープする場合があります。その際は再度アクセスして少し待てば復旧します。
