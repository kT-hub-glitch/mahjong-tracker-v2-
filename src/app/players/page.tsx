'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import MainLayout from '@/components/layout/MainLayout';
import { UserPlus, Users, Trash2, Lock, Unlock } from 'lucide-react';

/**
 * 選手管理ページ（個人管理版）
 * ユーザーが登録した選手の一覧表示と新規追加を行います。
 */
export default function PlayersPage() {
  const [players, setPlayers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [userId, setUserId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      const { data: playersData } = await supabase
        .from('players')
        .select('*')
        .eq('user_id', user.id)
        .order('name');
      
      setPlayers(playersData || []);
      setLoading(false);
    };

    fetchData();
  }, []);

  const handleAddPlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlayerName || !userId) return;
    setError(null);

    const { data, error } = await supabase
      .from('players')
      .insert({ name: newPlayerName, user_id: userId })
      .select()
      .single();

    if (error) {
      setError(error.message);
    } else {
      setPlayers([...players, data].sort((a, b) => a.name.localeCompare(b.name)));
      setNewPlayerName('');
    }
  };

  const handleDeletePlayer = async (player: any) => {
    const confirmMessage = `選手「${player.name}」を削除しますか？\n\n※この選手を削除しても過去の対局記録は消えませんが、統計画面などで名前が正しく表示されなくなる可能性があります。本当に削除しますか？`;
    if (!confirm(confirmMessage)) return;

    const { error } = await supabase.from('players').delete().eq('id', player.id);
    if (error) {
      alert('削除に失敗しました: ' + error.message);
    } else {
      setPlayers(players.filter(p => p.id !== player.id));
    }
  };

  const handleToggleLock = async (player: any) => {
    const newLockState = !player.is_locked;
    const { error } = await supabase
      .from('players')
      .update({ is_locked: newLockState })
      .eq('id', player.id);

    if (error) {
      alert('ロック状態の変更に失敗しました: ' + error.message);
    } else {
      setPlayers(players.map(p => p.id === player.id ? { ...p, is_locked: newLockState } : p));
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <header>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Users className="text-emerald-400" />
            選手管理
          </h1>
          <p className="text-slate-400 text-xs">対局に参加するメンバーを登録します</p>
        </header>

        <form onSubmit={handleAddPlayer} className="glass rounded-3xl p-4 flex gap-3">
          <input
            type="text"
            value={newPlayerName}
            onChange={(e) => setNewPlayerName(e.target.value)}
            className="glass-input flex-1 rounded-xl px-4 py-2 text-sm"
            placeholder="選手名を入力"
            required
          />
          <button
            type="submit"
            disabled={!newPlayerName}
            className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl px-4 py-2 flex items-center gap-2 transition-all disabled:opacity-50"
          >
            <UserPlus size={18} />
            追加
          </button>
        </form>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-sm p-3 rounded-xl">
            {error}
          </div>
        )}

        <div className="space-y-3">
          {loading ? (
            <div className="text-center py-10 text-slate-500">読み込み中...</div>
          ) : players.length === 0 ? (
            <div className="text-center py-10 text-slate-500 bg-white/5 rounded-3xl border border-dashed border-white/10">
              選手がまだ登録されていません
            </div>
          ) : (
            players.map((player) => (
              <div key={player.id} className="glass rounded-2xl px-5 py-4 flex justify-between items-center group">
                <div className="flex items-center gap-3">
                  <p className="text-white font-medium">{player.name}</p>
                  {player.is_locked && (
                    <span className="text-[10px] bg-slate-700 text-slate-300 px-2 py-0.5 rounded-full font-bold">LOCKED</span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleToggleLock(player)}
                    className={`p-2 transition-colors rounded-xl ${player.is_locked ? 'text-amber-400 hover:bg-amber-400/10' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}
                    title={player.is_locked ? 'ロック解除' : 'ロックして保護'}
                  >
                    {player.is_locked ? <Lock size={18} /> : <Unlock size={18} />}
                  </button>
                  
                  {!player.is_locked && (
                    <button
                      onClick={() => handleDeletePlayer(player)}
                      className="text-slate-600 hover:text-red-400 p-2 rounded-xl transition-colors hover:bg-red-500/10"
                      title="削除"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </MainLayout>
  );
}
