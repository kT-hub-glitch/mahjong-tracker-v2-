'use client';

import React from 'react';
import { X, Trophy, Target, TrendingUp, Users, Calendar, Award, History as HistoryIcon } from 'lucide-react';
import { PlayerStats } from '@/lib/stats-logic';

interface PlayerStatsModalProps {
  player: any;
  stats: PlayerStats;
  year: string;
  onClose: () => void;
}

export default function PlayerStatsModal({ player, stats, year, onClose }: PlayerStatsModalProps) {
  if (!stats) return null;

  const ranks = [
    { rank: 1, label: '1位', color: '#eab308', count: stats.rankCounts[1] || 0 },
    { rank: 2, label: '2位', color: '#10b981', count: stats.rankCounts[2] || 0 },
    { rank: 3, label: '3位', color: '#94a3b8', count: stats.rankCounts[3] || 0 },
    { rank: 4, label: '4位', color: '#ef4444', count: stats.rankCounts[4] || 0 },
  ];

  // 円グラフの計算 (SVG実装)
  const totalCount = stats.matchCount;
  let currentPercentage = 0;
  const pieSlices = ranks.map(r => {
    const percent = totalCount > 0 ? (r.count / totalCount) * 100 : 0;
    const start = currentPercentage;
    currentPercentage += percent;
    return { ...r, percent, start };
  });

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-300">
      <div className="glass w-full max-w-lg max-h-[92vh] overflow-y-auto rounded-t-[40px] sm:rounded-[40px] shadow-2xl flex flex-col animate-in slide-in-from-bottom-20 duration-500">
        
        {/* ヘッダー */}
        <div className="sticky top-0 z-10 glass-dark px-8 py-6 border-b border-white/10 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              <Award className="text-yellow-500" size={28} />
              {player.name}
              <span className="text-xs text-slate-500 font-bold uppercase tracking-widest bg-white/5 px-3 py-1 rounded-full border border-white/10">Stats</span>
            </h2>
            <p className="text-[10px] text-slate-500 font-extrabold uppercase tracking-[0.2em] flex items-center gap-1.5 mt-2 ml-1">
              <Calendar size={12} className="text-emerald-500" /> {year === 'all' ? 'All Time' : `${year}nd Season`} Overview
            </p>
          </div>
          <button onClick={onClose} className="w-10 h-10 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-2xl transition-all text-slate-400 hover:text-white border border-white/10 active:scale-90">
            <X size={24} />
          </button>
        </div>

        <div className="p-8 space-y-10">
          {/* 主要スタッツグリッド - 6項目統一レイアウト (3x2) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {/* 1行目 */}
            <div className="p-5 glass rounded-3xl border-white/20 space-y-2 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-3 opacity-5">
                <Target size={40} className="text-emerald-400" />
              </div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">平均順位</span>
              <div className="text-3xl font-mono font-bold text-emerald-400 drop-shadow-[0_0_10px_rgba(16,185,129,0.2)]">
                {stats.avgRank.toFixed(2)}
              </div>
            </div>
            <div className="p-5 glass rounded-3xl border-white/20 space-y-2 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-3 opacity-5">
                <Trophy size={40} className="text-emerald-400" />
              </div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">連対率</span>
              <div className="text-3xl font-mono font-bold text-emerald-400 drop-shadow-[0_0_10px_rgba(16,185,129,0.2)]">
                {stats.top2Rate.toFixed(1)}<span className="text-lg ml-0.5">%</span>
              </div>
            </div>
            <div className="p-5 glass rounded-3xl border-white/20 space-y-2 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-3 opacity-5">
                <HistoryIcon size={40} className="text-emerald-400" />
              </div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">対局数</span>
              <div className="text-3xl font-mono font-bold text-emerald-400 drop-shadow-[0_0_10px_rgba(16,185,129,0.1)]">
                {stats.matchCount}<span className="text-lg ml-1 opacity-40">戦</span>
              </div>
            </div>

            {/* 2行目 */}
            <div className="p-5 glass rounded-3xl border-white/20 space-y-2 relative overflow-hidden group">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">合計ポイント</span>
              <div className={`text-3xl font-mono font-bold ${stats.totalPoints >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {stats.totalPoints >= 0 ? '+' : ''}{stats.totalPoints.toFixed(1)}
              </div>
            </div>
            <div className="p-5 glass rounded-3xl border-white/20 space-y-2 relative overflow-hidden group">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">平均ポイント</span>
              <div className={`text-3xl font-mono font-bold ${stats.avgPoints >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {stats.avgPoints >= 0 ? '+' : ''}{stats.avgPoints.toFixed(2)}
              </div>
            </div>
            <div className="p-5 glass rounded-3xl border-white/20 space-y-2 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-3 opacity-5">
                <TrendingUp size={40} className="text-emerald-400" />
              </div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">最高得点</span>
              <div className="text-2xl font-mono font-bold text-emerald-400 mt-1 drop-shadow-[0_0_10px_rgba(16,185,129,0.1)]">
                {stats.maxScore.toLocaleString()}
              </div>
            </div>
            <div className="p-5 glass rounded-3xl border-yellow-500/30 space-y-2 relative overflow-hidden group bg-yellow-500/5">
              <div className="absolute top-0 right-0 p-3 opacity-10">
                <Trophy size={40} className="text-yellow-500" />
              </div>
              <span className="text-[10px] text-yellow-500/70 font-bold uppercase tracking-wider">生涯役満回数</span>
              <div className="text-3xl font-mono font-bold text-yellow-500 drop-shadow-[0_0_15px_rgba(234,179,8,0.4)] transition-transform group-hover:scale-110 duration-500">
                {stats.yakumanCount}<span className="text-lg ml-1 opacity-60">回</span>
              </div>
            </div>
          </div>

          {/* 財務・チップデータ追加枠 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 p-5 glass rounded-3xl border-emerald-500/30 space-y-2 relative overflow-hidden group bg-emerald-500/5">
              <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider mb-2 block">合計収支 (Money)</span>
              <div className={`text-4xl font-mono font-bold ${stats.totalMoney >= 0 ? 'text-emerald-400' : 'text-red-400'} drop-shadow-[0_0_15px_rgba(16,185,129,0.2)]`}>
                {stats.totalMoney >= 0 ? '+' : '-'}¥{Math.abs(stats.totalMoney).toLocaleString()}
              </div>
              <div className="flex flex-col sm:flex-row gap-3 sm:items-center text-xs font-bold pt-4 mt-2 border-t border-white/10">
                <div className="flex-1 bg-white/5 px-3 py-2 rounded-xl flex justify-between items-center">
                  <span className="text-slate-400">スコア分収支</span>
                  <span className={`${stats.moneyFromScore >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{stats.moneyFromScore >= 0 ? '+' : '-'}¥{Math.abs(stats.moneyFromScore).toLocaleString()}</span>
                </div>
                <div className="flex-1 bg-white/5 px-3 py-2 rounded-xl flex justify-between items-center">
                  <span className="text-slate-400">チップ分収支</span>
                  <span className={`${stats.moneyFromChips >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{stats.moneyFromChips >= 0 ? '+' : '-'}¥{Math.abs(stats.moneyFromChips).toLocaleString()}</span>
                </div>
              </div>
            </div>
            <div className="col-span-2 sm:col-span-1 p-5 glass rounded-3xl border-white/20 space-y-2 relative overflow-hidden group">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">合計チップ枚数</span>
              <div className={`text-3xl font-mono font-bold ${stats.totalChips >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {stats.totalChips >= 0 ? '+' : ''}{stats.totalChips} <span className="text-lg opacity-40 ml-1">枚</span>
              </div>
            </div>
          </div>

          {/* 順位率分布 (円グラフ) */}
          <div className="space-y-6">
            <h3 className="text-[11px] font-extrabold text-slate-400 uppercase flex items-center gap-2 px-1 tracking-widest">
              <Trophy size={14} className="text-yellow-500" /> 順位比率分布
            </h3>
            
            <div className="flex flex-col sm:flex-row items-center gap-10">
              {/* SVG Donuts Chart */}
              <div className="relative w-48 h-48">
                <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                  {pieSlices.map((slice, i) => (
                    <circle
                      key={i}
                      cx="50"
                      cy="50"
                      r="40"
                      fill="transparent"
                      stroke={slice.color}
                      strokeWidth="12"
                      strokeDasharray={`${slice.percent * 2.51} 251.2`}
                      strokeDashoffset={-slice.start * 2.51}
                      className="transition-all duration-1000 ease-out"
                    />
                  ))}
                  <circle cx="50" cy="50" r="30" fill="transparent" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <div className="text-xs text-slate-500 font-bold uppercase tracking-tighter">Average</div>
                  <div className="text-2xl font-mono font-bold text-white tracking-tighter">{stats.avgRank.toFixed(1)}</div>
                </div>
              </div>

              {/* 凡例 */}
              <div className="flex-1 w-full grid grid-cols-2 gap-3">
                {pieSlices.map(slice => (
                  <div key={slice.rank} className="flex flex-col gap-1 p-3 glass-dark rounded-2xl border border-white/5">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full shadow-[0_0_8px_currentColor]" style={{ backgroundColor: slice.color, color: slice.color }} />
                      <span className="text-xs font-bold text-slate-400">{slice.label}</span>
                    </div>
                    <div className="flex justify-between items-baseline">
                      <span className="text-lg font-mono font-bold text-white">{slice.percent.toFixed(1)}%</span>
                      <span className="text-[10px] text-slate-500 font-bold">{slice.count}回</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 直接対決データ */}
          <div className="space-y-4 pb-4">
            <h3 className="text-[11px] font-extrabold text-slate-400 uppercase flex items-center gap-2 px-1 tracking-widest text-emerald-500">
              <Users size={14} /> 対戦成績 (vs)
            </h3>
            <div className="space-y-3">
              {Object.keys(stats.headToHead).length > 0 ? (
                Object.entries(stats.headToHead).map(([id, data]) => (
                  <div key={id} className="glass-dark rounded-3xl p-5 flex justify-between items-center transition-all hover:bg-white/[0.04] border border-white/5">
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-3">
                        <span className="text-base font-bold text-white">{data.name}</span>
                        <span className="text-[10px] text-slate-500 font-bold bg-white/5 px-3 py-0.5 rounded-full border border-white/10 uppercase tracking-tighter">{data.matchCount} 試合</span>
                      </div>
                      <div className="flex items-center gap-3 text-[10px] font-extrabold uppercase tracking-widest">
                        <div className="flex items-center gap-1">
                          <span className="text-emerald-400">{data.winCount}勝</span>
                          <span className="text-slate-600">/</span>
                          <span className="text-red-400">{data.loseCount}敗</span>
                        </div>
                        <div className="w-1 h-1 bg-white/20 rounded-full" />
                        <span className="text-slate-400">平均順位: {(data.rankSum / data.matchCount).toFixed(2)}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-lg font-mono font-bold ${data.pointDiff > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {data.pointDiff > 0 ? '+' : ''}{data.pointDiff.toFixed(1)}
                      </div>
                      <div className="text-[9px] text-slate-500 font-bold uppercase tracking-[0.1em]">ポイント差</div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 glass rounded-3xl border border-dashed border-white/10 text-[10px] text-slate-500 italic uppercase font-bold tracking-widest">
                  データがありません
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
