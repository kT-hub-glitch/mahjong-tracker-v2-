# Vercel デプロイガイド

Mahjong Tracker v2 をWeb上に公開し、ブラウザからアクセスできるようにする手順です。

## 1. Vercel へのデプロイ
1. [Vercel](https://vercel.com/) にログインし、プロジェクトをインポートします。
2. **Environment Variables** (環境変数) の設定画面で、以下の値を設定します。
   - `NEXT_PUBLIC_SUPABASE_URL`: Supabase の URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase の Anon キー
   ※ これらはプロジェクト内の `.env.local` ファイルにある値をコピーしてください。

## 2. Supabase の設定
1. Supabase のダッシュボードから **Authentication > URL Configuration** を開きます。
2. **Site URL** にデプロイ後の Vercel の URL (例: `https://your-app-name.vercel.app`) を設定します。

## 3. ブラウザでの利用
- デプロイ完了後、発行されたURLにアクセスすれば、PCやスマホのブラウザで利用可能です。
- スマホブラウザの「ホーム画面に追加」機能を使うと、ブラウザの枠なし（スタンドアロンモード）で、ネイティブアプリのように使うことができます。
