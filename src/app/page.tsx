'use client';

import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import MainLayout from '@/components/layout/MainLayout';
import { Users, History, TrendingUp, Filter, ChevronRight, Share2, Copy, Check } from 'lucide-react';
import { calculateAllPlayerStats, PlayerStats } from '@/lib/stats-logic';
import PlayerStatsModal from '@/components/stats/PlayerStatsModal';

/**
 * メインページ（ダッシュボード）
 * ログイン状態をチェックし、個人の統計情報を表示します。
 */
export default function Home() {
  const [loading, setLoading] = useState(true);
  const [players, setPlayers] = useState<any[]>([]);
  const [matches, setMatches] = useState<any[]>([]);
  const [stats, setStats] = useState<{ [id: string]: PlayerStats }>({});
  const [selectedYear, setSelectedYear] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [shareToken, setShareToken] = useState<string | null>(null);
  const [isShareActive, setIsShareActive] = useState<boolean>(false);
  const [copied, setCopied] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<any>(null);
  const router = useRouter();

  const filteredMatches = useMemo(() => {
    return matches.filter(m => {
      const year = m.date.split('-')[0];
      if (selectedYear !== 'all' && year !== selectedYear) return false;
      if (startDate && m.date < startDate) return false;
      if (endDate && m.date > endDate) return false;
      return true;
    });
  }, [matches, selectedYear, startDate, endDate]);

  const years = useMemo(() => {
    const yearsSet = new Set<string>();
    matches.forEach(m => {
      const year = m.date.split('-')[0];
      if (year) yearsSet.add(year);
    });
    return Array.from(yearsSet).sort((a, b) => b.localeCompare(a));
  }, [matches]);

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push('/login');
        return;
      }

      // 並列でデータ取得
      const [{ data: playersData }, { data: matchesData }, { data: shareData }] = await Promise.all([
        supabase.from('players').select('*').eq('user_id', user.id).order('name'),
        supabase.from('matches').select('*').eq('user_id', user.id).order('date', { ascending: false }),
        supabase.from('share_settings').select('*').eq('user_id', user.id).maybeSingle()
      ]);

      if (shareData) {
        setShareToken(shareData.token);
        setIsShareActive(shareData.is_active);
      }

      setPlayers(playersData || []);
      setMatches(matchesData || []);
      setLoading(false);
    };

    fetchData();
  }, [router]);

  useEffect(() => {
    if (players.length > 0) {
      const newStats = calculateAllPlayerStats(filteredMatches, players, selectedYear === 'all' ? undefined : selectedYear, startDate || undefined, endDate || undefined);
      setStats(newStats);
    }
  }, [filteredMatches, players, selectedYear, startDate, endDate]);

  const handleToggleShare = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    if (!shareToken) {
      const newToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      const { data, error } = await supabase.from('share_settings').insert({
        user_id: user.id,
        token: newToken,
        is_active: true
      }).select().single();
      
      if (!error && data) {
        setShareToken(data.token);
        setIsShareActive(true);
      }
    } else {
      const { error } = await supabase.from('share_settings').update({
        is_active: !isShareActive,
        updated_at: new Date().toISOString()
      }).eq('user_id', user.id);
      
      if (!error) {
        setIsShareActive(!isShareActive);
      }
    }
  };

  const copyToClipboard = () => {
    if (!shareToken) return;
    const url = `${window.location.origin}/share/${shareToken}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-emerald-500 animate-pulse text-xl font-bold">読み込み中...</div>
      </div>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-8 pb-20">
        <header className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">
              Dashboard
            </h1>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">Analytics Overview</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="flex items-center gap-2 glass px-3 py-1 rounded-2xl border-white/20">
              <Filter size={14} className="text-emerald-400" />
              <select
                value={selectedYear}
                onChange={(e) => { setSelectedYear(e.target.value); setStartDate(''); setEndDate(''); }}
                className="glass-select text-white text-xs font-bold py-2 outline-none rounded-xl"
              >
                <option value="all">全期間</option>
                {years.map(y => (
                  <option key={y} value={y}>{y}年</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2 glass px-3 py-1.5 rounded-2xl border-white/20 text-xs">
              <input 
                type="date"
                value={startDate}
                onChange={(e) => { setStartDate(e.target.value); setSelectedYear('all'); }}
                onClick={(e) => (e.target as any).showPicker?.()}
                className="bg-transparent text-white w-[110px] outline-none font-mono cursor-pointer"
              />
              <span className="text-slate-500 font-bold">-</span>
              <input 
                type="date"
                value={endDate}
                onChange={(e) => { setEndDate(e.target.value); setSelectedYear('all'); }}
                onClick={(e) => (e.target as any).showPicker?.()}
                className="bg-transparent text-white w-[110px] outline-none font-mono cursor-pointer"
              />
            </div>
          </div>
        </header>

        {/* 共有設定 UI */}
        <section className="glass rounded-3xl p-5 border-white/20">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-sm font-bold text-emerald-400 flex items-center gap-2 mb-1">
                <Share2 size={16} /> Public Share Link
              </h2>
              <p className="text-[10px] text-slate-400">
                これをONにすると、専用URLでこの成績画面をご友人に「閲覧専用」として共有できます。
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-end sm:items-center gap-4">
              {isShareActive && shareToken && (
                <div className="flex items-center gap-2 bg-white/5 p-2 rounded-xl border border-white/10 animate-in fade-in min-w-[250px]">
                  <input 
                    type="text"
                    readOnly
                    value={`${typeof window !== 'undefined' ? window.location.origin : ''}/share/${shareToken}`}
                    className="bg-transparent text-xs text-white/80 w-full outline-none px-2"
                  />
                  <button 
                    onClick={copyToClipboard}
                    className="p-2 bg-emerald-500/20 hover:bg-emerald-500/40 text-emerald-400 rounded-xl transition-colors shrink-0"
                  >
                    {copied ? <Check size={16} /> : <Copy size={16} />}
                  </button>
                </div>
              )}
              <button
                onClick={handleToggleShare}
                className={`w-12 h-6 rounded-full p-1 transition-colors shrink-0 ${isShareActive ? 'bg-emerald-600' : 'bg-slate-700'}`}
              >
                <div className={`w-4 h-4 bg-white rounded-full transition-transform ${isShareActive ? 'translate-x-6' : 'translate-x-0'}`} />
              </button>
            </div>
          </div>
        </section>

        {/* サマリーカード */}
        <div className="grid grid-cols-2 gap-4">
          <div className="glass rounded-3xl p-5 relative overflow-hidden group border-white/20">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
              <History size={64} className="text-emerald-400" />
            </div>
            <div className="text-[10px] text-slate-400 font-bold uppercase mb-1">Total Matches</div>
            <div className="text-3xl font-mono font-bold text-white">{filteredMatches.length}</div>
          </div>
          <div className="glass rounded-3xl p-5 relative overflow-hidden group border-white/20">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
              <Users size={64} className="text-emerald-400" />
            </div>
            <div className="text-[10px] text-slate-400 font-bold uppercase mb-1">Active Players</div>
            <div className="text-3xl font-mono font-bold text-white">{players.length}</div>
          </div>
        </div>

        {/* 選手一覧 */}
        <section className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <TrendingUp size={16} className="text-emerald-500" /> Player Rankings
            </h2>
          </div>

          <div className="space-y-3">
            {players.length === 0 ? (
              <div className="text-center py-10 glass rounded-3xl border border-dashed border-white/20 text-slate-500 text-sm">
                選手が登録されていません
              </div>
            ) : (
              players
                .map(p => ({ ...p, stat: stats[p.id] }))
                .filter(p => p.stat && p.stat.matchCount > 0)
                .sort((a, b) => (b.stat?.totalPoints || 0) - (a.stat?.totalPoints || 0))
                .map((player, idx) => (
                  <button
                    key={player.id}
                    onClick={() => setSelectedPlayer(player)}
                    className="glass w-full text-left rounded-3xl p-5 flex items-center gap-4 group transition-all hover:bg-white/[0.1] border-white/20"
                  >
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-mono font-bold text-lg ${
                      idx === 0 ? 'bg-yellow-500/20 text-yellow-500 border border-yellow-500/40' : 
                      idx === 1 ? 'bg-slate-300/20 text-slate-300 border border-slate-300/40' :
                      idx === 2 ? 'bg-orange-700/20 text-orange-400 border border-orange-700/40' : 'bg-white/10 text-slate-400 border border-white/5'
                    }`}>
                      {idx + 1}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-white text-lg truncate">{player.name}</div>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">{player.stat?.matchCount} Matches</span>
                        <div className="w-1 h-1 bg-white/20 rounded-full" />
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Avg Rank: {player.stat?.avgRank.toFixed(2)}</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className={`text-xl font-mono font-bold ${(player.stat?.totalPoints || 0) > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {(player.stat?.totalPoints || 0) > 0 ? '+' : ''}{(player.stat?.totalPoints || 0).toFixed(1)}
                      </div>
                      <div className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">PTS</div>
                    </div>

                    <ChevronRight size={16} className="text-slate-600 group-hover:text-emerald-400 transition-colors" />
                  </button>
                ))
            )}

            {/* まだ対局がない選手 */}
            {players.filter(p => !stats[p.id] || stats[p.id].matchCount === 0).length > 0 && (
              <div className="pt-6 border-t border-white/10">
                <p className="text-[10px] text-slate-500 font-bold uppercase px-1 mb-3">No Matches Recorded</p>
                <div className="grid grid-cols-2 gap-3">
                  {players.filter(p => !stats[p.id] || stats[p.id].matchCount === 0).map(p => (
                    <div key={p.id} className="glass rounded-2xl p-4 flex items-center gap-3 opacity-70 border-white/10">
                      <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-xs text-slate-500">
                        ?
                      </div>
                      <span className="text-xs font-bold text-slate-300 truncate">{p.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* 選手名簿へ誘導 */}
        <section className="bg-emerald-600/10 rounded-[32px] p-8 border border-emerald-500/20 flex flex-col items-center gap-4 text-center mt-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 shadow-inner">
            <Users size={28} />
          </div>
          <div>
            <h3 className="text-white font-bold text-lg">選手を追加・管理</h3>
            <p className="text-sm text-slate-400 mt-1 max-w-[200px]">新しい面子を登録したり、名前の修正ができます</p>
          </div>
          <button 
            onClick={() => router.push('/players')}
            className="mt-2 w-full glass-dark text-white text-sm font-bold py-4 rounded-2xl hover:bg-white/10 transition-all border-white/20 active:scale-[0.98]"
          >
            選手一覧へ
          </button>
        </section>
      </div>

      {/* 選手詳細モーダル */}
      {selectedPlayer && (
        <PlayerStatsModal
          player={selectedPlayer}
          stats={stats[selectedPlayer.id]}
          year={selectedYear !== 'all' ? selectedYear : startDate || endDate ? `${startDate || '開始'} ~ ${endDate || '現在'}` : 'all'}
          onClose={() => setSelectedPlayer(null)}
        />
      )}
    </MainLayout>
  );
}
