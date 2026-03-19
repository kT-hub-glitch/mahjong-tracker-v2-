'use client';

import { useEffect, useState, useMemo, use } from 'react';
import { supabase } from '@/lib/supabase';
import { Users, History, TrendingUp, Filter, ChevronRight, Lock } from 'lucide-react';
import { calculateAllPlayerStats, PlayerStats } from '@/lib/stats-logic';
import PlayerStatsModal from '@/components/stats/PlayerStatsModal';

export default function SharedDashboard({ params }: { params: Promise<{ token: string }> }) {
  const resolvedParams = use(params);
  const token = resolvedParams.token;
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [players, setPlayers] = useState<any[]>([]);
  const [matches, setMatches] = useState<any[]>([]);
  const [stats, setStats] = useState<{ [id: string]: PlayerStats }>({});
  const [selectedYear, setSelectedYear] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedPlayer, setSelectedPlayer] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'stats' | 'history'>('stats');

  const years = useMemo(() => {
    const yearsSet = new Set<string>();
    matches.forEach(m => {
      const year = m.date.split('-')[0];
      if (year) yearsSet.add(year);
    });
    return Array.from(yearsSet).sort((a, b) => b.localeCompare(a));
  }, [matches]);

  useEffect(() => {
    const fetchSharedData = async () => {
      if (!token) return;

      const { data, error } = await supabase.rpc('get_shared_data', { share_token: token });

      if (error || !data) {
        setError('無効なリンクです。または共有がオフになっています。');
        setLoading(false);
        return;
      }

      const { players: pData, matches: mData } = data as any;
      setPlayers(pData || []);
      setMatches(mData || []);
      setLoading(false);
    };

    fetchSharedData();
  }, [token]);

  const filteredMatches = useMemo(() => {
    return matches.filter(m => {
      const year = m.date.split('-')[0];
      if (selectedYear !== 'all' && year !== selectedYear) return false;
      if (startDate && m.date < startDate) return false;
      if (endDate && m.date > endDate) return false;
      return true;
    });
  }, [matches, selectedYear, startDate, endDate]);

  const groupedMatches = useMemo(() => {
    const groups: { [key: string]: any[] } = {};
    filteredMatches.forEach(match => {
      if (!groups[match.date]) groups[match.date] = [];
      groups[match.date].push(match);
    });
    return groups;
  }, [filteredMatches]);

  useEffect(() => {
    if (players.length > 0) {
      const newStats = calculateAllPlayerStats(filteredMatches, players, selectedYear === 'all' ? undefined : selectedYear, startDate || undefined, endDate || undefined);
      setStats(newStats);
    }
  }, [filteredMatches, players, selectedYear, startDate, endDate]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0B1120]">
        <div className="text-emerald-500 animate-pulse text-xl font-bold">データを読み込み中...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4 bg-[#0B1120]">
        <div className="glass p-8 rounded-3xl text-center space-y-4 max-w-sm w-full">
          <Lock size={48} className="text-slate-500 mx-auto opacity-50" />
          <h1 className="text-xl font-bold text-white">アクセスできません</h1>
          <p className="text-sm text-slate-400">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#0B1120] text-slate-200 font-sans selection:bg-emerald-500/30 selection:text-emerald-200">
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-900/20 via-[#0B1120] to-[#0B1120] pointer-events-none" />
      <div className="max-w-3xl mx-auto p-4 pt-8 sm:p-8 sm:pt-12 relative z-10 transition-all duration-300">
        <div className="space-y-8 pb-20">
          <header className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-white tracking-tight">Shared Stats</h1>
              <p className="text-emerald-400 text-[10px] font-bold uppercase tracking-widest mt-1 flex items-center gap-1"><Lock size={10} /> View-Only Mode</p>
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
                  className="bg-transparent text-white w-[110px] outline-none font-mono"
                />
                <span className="text-slate-500 font-bold">-</span>
                <input 
                  type="date"
                  value={endDate}
                  onChange={(e) => { setEndDate(e.target.value); setSelectedYear('all'); }}
                  className="bg-transparent text-white w-[110px] outline-none font-mono"
                />
              </div>
            </div>
          </header>

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

          <div className="flex bg-white/5 p-1 rounded-2xl mb-6">
            <button
              onClick={() => setActiveTab('stats')}
              className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all ${
                activeTab === 'stats' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/50' : 'text-slate-400 hover:text-white'
              }`}
            >
              成績ランキング
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all ${
                activeTab === 'history' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/50' : 'text-slate-400 hover:text-white'
              }`}
            >
              対局履歴
            </button>
          </div>

          {activeTab === 'stats' ? (
            <section className="space-y-4">
              <div className="flex justify-between items-center px-1">
                <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <TrendingUp size={16} className="text-emerald-500" /> Player Rankings
                </h2>
              </div>
              <div className="space-y-3">
                {players
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
                  ))}
              </div>
            </section>
          ) : (
            <section className="space-y-6">
              {Object.keys(groupedMatches).length === 0 ? (
                <div className="text-center py-20 text-slate-500 bg-white/5 rounded-3xl border border-dashed border-white/10">
                  該当する対局記録がありません
                </div>
              ) : (
                Object.keys(groupedMatches).sort((a,b) => b.localeCompare(a)).map(date => (
                  <div key={date} className="space-y-4">
                    <div className="flex items-center gap-2 text-slate-400 font-bold text-sm px-1">
                      <History size={14} /> {date}
                    </div>
                    
                    <div className="space-y-4">
                      {groupedMatches[date].map((match, idx) => (
                        <div key={match.id} className="glass rounded-3xl p-5 space-y-4 border-white/20">
                          <div className="flex items-center gap-3 pb-2 border-b border-white/5">
                            <span className="text-[10px] font-bold text-slate-500 bg-white/5 px-2 py-1 rounded">MATCH #{groupedMatches[date].length - idx}</span>
                            <span className="text-[10px] text-slate-500">{new Date(match.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>

                          <div className="space-y-3">
                            {match.players_results.sort((a: any, b: any) => a.rank - b.rank).map((p: any) => (
                              <div key={p.playerId} className="grid grid-cols-12 items-center gap-1">
                                <div className="col-span-4 flex items-center gap-1.5 min-w-0">
                                  <span className={`w-4 h-4 shrink-0 flex items-center justify-center rounded-full text-[9px] font-bold ${
                                    p.rank === 1 ? 'bg-yellow-500/20 text-yellow-500' : 'bg-white/5 text-slate-400'
                                  }`}>
                                    {p.rank}
                                  </span>
                                  <span className="text-white text-[11px] font-medium truncate">{p.name}</span>
                                </div>
      
                                <div className="col-span-3 text-right">
                                  <span className="text-[8px] text-slate-500 block leading-none mb-0.5">SCORE</span>
                                  <span className="text-white text-[10px] font-mono whitespace-nowrap">{(p.score || 0).toLocaleString()}</span>
                                </div>
      
                                {match.settings.chipEnabled ? (
                                  <>
                                    <div className="col-span-2 text-right">
                                      <span className="text-[8px] text-slate-500 block leading-none mb-0.5">CHIP</span>
                                      <span className={`text-[10px] font-mono font-bold ${(p.chips || 0) > 0 ? 'text-emerald-400' : (p.chips || 0) < 0 ? 'text-red-400' : 'text-slate-500'}`}>
                                        {(p.chips || 0) > 0 ? '+' : ''}{p.chips || 0}
                                      </span>
                                    </div>
                                    <div className="col-span-3 text-right">
                                      <span className="text-[8px] text-slate-500 block leading-none mb-0.5">PTS</span>
                                      <span className={`text-[10px] font-mono font-bold ${p.totalPoints > 0 ? 'text-emerald-400' : p.totalPoints < 0 ? 'text-red-400' : 'text-slate-500'}`}>
                                        {p.totalPoints > 0 ? '+' : ''}{p.totalPoints.toFixed(1)}
                                      </span>
                                    </div>
                                  </>
                                ) : (
                                  <div className="col-span-5 text-right">
                                    <span className="text-[8px] text-slate-500 block leading-none mb-0.5">PTS</span>
                                    <span className={`text-[10px] font-mono font-bold ${p.totalPoints > 0 ? 'text-emerald-400' : p.totalPoints < 0 ? 'text-red-400' : 'text-slate-500'}`}>
                                      {p.totalPoints > 0 ? '+' : ''}{p.totalPoints.toFixed(1)}
                                    </span>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </section>
          )}
        </div>

        {selectedPlayer && (
          <PlayerStatsModal
            player={selectedPlayer}
            stats={stats[selectedPlayer.id]}
            year={selectedYear !== 'all' ? selectedYear : startDate || endDate ? `${startDate || '開始'} ~ ${endDate || '現在'}` : 'all'}
            onClose={() => setSelectedPlayer(null)}
          />
        )}
      </div>
    </main>
  );
}
