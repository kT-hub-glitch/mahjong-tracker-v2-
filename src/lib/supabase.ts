import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * Supabase クライアントの初期化
 * クライアントサイドおよびサーバーサイド（要環境変数）で使用可能です。
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
