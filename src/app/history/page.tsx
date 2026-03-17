'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import MainLayout from '@/components/layout/MainLayout';
import { History, Calculator, Calendar } from 'lucide-react';

/**
 * 対局履歴ページ（個人管理版）
 */
export default function HistoryPage() {
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchDate, setSearchDate] = useState<string>('');

  useEffect(() => {
    const fetchMatches = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('matches')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false })
        .order('created_at', { ascending: false });
      
      setMatches(data || []);
      setLoading(false);
    };

    fetchMatches();
  }, []);

  // 日付ごとにグループ化
  const groupedMatches: { [key: string]: any[] } = {};
  matches.forEach(match => {
    if (searchDate && match.date !== searchDate) return;
    if (!groupedMatches[match.date]) {
      groupedMatches[match.date] = [];
    }
    groupedMatches[match.date].push(match);
  });

  // 日次合計の計算
  const calculateDailyTotals = (dateMatches: any[]) => {
    const totals: { [key: string]: { name: string, money: number } } = {};
    dateMatches.forEach(match => {
      match.players_results.forEach((p: any) => {
        if (!totals[p.playerId]) {
          totals[p.playerId] = { name: p.name, money: 0 };
        }
        totals[p.playerId].money += p.totalMoney;
      });
    });
    return Object.values(totals).sort((a, b) => b.money - a.money);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('この対局記録を削除しますか？')) return;
    
    const { error } = await supabase.from('matches').delete().eq('id', id);
    if (error) {
      alert('削除に失敗しました: ' + error.message);
    } else {
      setMatches(matches.filter(m => m.id !== id));
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6 pb-20">
        <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <History className="text-emerald-400" />
              対局履歴
            </h1>
            <p className="text-slate-400 text-xs">過去の対局と日次収支を確認します</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:w-48">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
              <input 
                type="date" 
                value={searchDate}
                onChange={(e) => setSearchDate(e.target.value)}
                onClick={(e) => (e.target as any).showPicker?.()}
                className="glass-select w-full pl-9 pr-4 py-2 text-xs font-bold text-white appearance-none cursor-pointer"
              />
            </div>
            {searchDate && (
              <button 
                onClick={() => setSearchDate('')}
                className="p-2 bg-white/5 hover:bg-white/10 text-slate-400 rounded-xl transition-colors"
                title="クリア"
              >
                <History size={16} className="rotate-180" />
              </button>
            )}
          </div>
        </header>

        {loading ? (
          <div className="text-center py-20 text-slate-500">読み込み中...</div>
        ) : matches.length === 0 ? (
          <div className="text-center py-20 text-slate-500 bg-white/5 rounded-3xl border border-dashed border-white/10">
            対局記録がまだありません
          </div>
        ) : (
          Object.keys(groupedMatches).map(date => {
            const dateMatches = groupedMatches[date];
            const dailyTotals = calculateDailyTotals(dateMatches);

            return (
              <div key={date} className="space-y-4">
                <div className="flex items-center gap-2 text-slate-400 font-bold text-sm px-1 pt-2">
                  <Calendar size={14} /> {date}
                </div>

                {/* 日次精算サマリー */}
                <div className="glass rounded-3xl p-5 border-l-4 border-l-emerald-500 shadow-xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-10">
                    <Calculator size={60} className="text-emerald-400" />
                  </div>
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-2 text-emerald-400 font-bold text-[10px] uppercase tracking-widest">
                      <Calculator size={14} /> Daily Settlement
                    </div>
                    <div className="text-right">
                      <span className="text-[9px] text-slate-500 font-bold uppercase block tracking-tighter mb-1">Total Movement</span>
                      <div className="text-lg font-mono font-bold text-emerald-400 drop-shadow-[0_0_10px_rgba(16,185,129,0.3)]">
                        ¥{dailyTotals.reduce((sum, t) => sum + (t.money > 0 ? t.money : 0), 0).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3 relative z-10">
                    {dailyTotals.map(total => (
                      <div key={total.name} className="flex justify-between items-center text-sm bg-white/5 p-2 px-3 rounded-xl border border-white/5">
                        <span className="text-slate-300 font-bold">{total.name}</span>
                        <span className={`font-mono font-bold ${total.money > 0 ? 'text-emerald-400' : total.money < 0 ? 'text-red-400' : 'text-slate-500'}`}>
                          {total.money > 0 ? '+' : ''}{total.money.toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 個別対局 */}
                <div className="space-y-4">
                  {dateMatches.map((match, idx) => (
                    <div key={match.id} className="glass rounded-3xl p-5 space-y-4 group transition-all hover:bg-white/[0.07]">
                      <div className="flex justify-between items-center pb-2 border-b border-white/5">
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] font-bold text-slate-500 bg-white/5 px-2 py-1 rounded">MATCH #{dateMatches.length - idx}</span>
                          <span className="text-[10px] text-slate-500">{new Date(match.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => window.location.href = `/input?edit=${match.id}`}
                            className="text-[10px] font-bold text-emerald-400 hover:text-emerald-300 bg-emerald-400/10 px-3 py-1 rounded-full transition-colors"
                          >
                            編集
                          </button>
                          <button 
                            onClick={() => handleDelete(match.id)}
                            className="text-[10px] font-bold text-red-400 hover:text-red-300 bg-red-400/10 px-3 py-1 rounded-full transition-colors"
                          >
                            削除
                          </button>
                        </div>
                      </div>

                      <div className="space-y-3">
                        {match.players_results.sort((a: any, b: any) => a.rank - b.rank).map((p: any) => (
                          <div key={p.playerId} className="grid grid-cols-12 items-center gap-2">
                            {/* 順位と名前 */}
                            <div className="col-span-4 flex items-center gap-2">
                              <span className={`w-5 h-5 flex items-center justify-center rounded-full text-[10px] font-bold ${
                                p.rank === 1 ? 'bg-yellow-500/20 text-yellow-500' : 
                                p.rank === 4 ? 'bg-slate-500/20 text-slate-500' : 'bg-white/5 text-slate-400'
                              }`}>
                                {p.rank}
                              </span>
                              <span className="text-white text-xs font-medium truncate">{p.name}</span>
                            </div>

                            {/* 点数 */}
                            <div className="col-span-3 text-right">
                              <span className="text-[10px] text-slate-500 block leading-none mb-1">SCORE</span>
                              <span className="text-white text-[11px] font-mono">{(p.score || 0).toLocaleString()}</span>
                            </div>

                            {/* ポイント */}
                            <div className="col-span-2 text-right">
                              <span className="text-[10px] text-slate-500 block leading-none mb-1">PTS</span>
                              <span className={`text-[11px] font-mono font-bold ${p.totalPoints > 0 ? 'text-emerald-400' : p.totalPoints < 0 ? 'text-red-400' : 'text-slate-500'}`}>
                                {p.totalPoints > 0 ? '+' : ''}{p.totalPoints.toFixed(1)}
                              </span>
                            </div>

                            {/* 金額 */}
                            <div className="col-span-3 text-right">
                              <span className="text-[10px] text-slate-500 block leading-none mb-1">MONEY</span>
                              <span className={`text-[11px] font-mono font-bold ${p.totalMoney > 0 ? 'text-emerald-400' : p.totalMoney < 0 ? 'text-red-400' : 'text-slate-500'}`}>
                                {p.totalMoney > 0 ? '+' : ''}{p.totalMoney.toLocaleString()}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>

                      {match.memo && (
                        <div className="text-[10px] text-slate-500 bg-white/5 p-2 rounded-xl italic">
                          {match.memo}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>
    </MainLayout>
  );
}
