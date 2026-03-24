-- 1. 選手テーブル (ユーザーごとに独立)
CREATE TABLE players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL, -- Supabase AuthのユーザーID
  name TEXT NOT NULL,
  show_in_ranking BOOLEAN DEFAULT TRUE, -- ランキングに表示するかどうか
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 対局記録テーブル
CREATE TABLE matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL, -- Supabase AuthのユーザーID
  date DATE NOT NULL,
  settings JSONB NOT NULL,
  memo TEXT,
  players_results JSONB NOT NULL, -- 各選手のスコア、順位、チップ、役満情報など
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS (Row Level Security) の設定
-- ログインユーザーが自分のデータのみを操作できるようにします
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;

-- Players Policy
CREATE POLICY "Users can manage their own players" ON players
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Matches Policy
CREATE POLICY "Users can manage their own matches" ON matches
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
