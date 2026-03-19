'use client';

import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import MainLayout from '@/components/layout/MainLayout';
import { calculateMatchResults, MahjongSettings, PlayerInput } from '@/lib/mahjong-logic';
import { Save, AlertCircle, Settings2, Users, Trophy, History as HistoryIcon, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

/**
 * 対局入力ページ（個人管理版）
 */
export default function InputPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [players, setPlayers] = useState<any[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [selectedSessionPlayerIds, setSelectedSessionPlayerIds] = useState<string[]>([]);
  const [isFilterEnabled, setIsFilterEnabled] = useState(true);
  const [showPlayerSelector, setShowPlayerSelector] = useState(false);

  // フォーム状態
  const [date, setDate] = useState(new Date().toLocaleDateString('sv-SE'));
  const [settings, setSettings] = useState<any>({
    uma1: '',
    uma2: '',
    uma3: '',
    uma4: '',
    okaEnabled: true,
    startPoints: 0,
    returnPoints: 0,
    fractionRule: 'originRule',
    rateSettings: '',
    chipEnabled: false,
    chipRate: '',
    tieRankingRule: 'split',
  });
  const [memo, setMemo] = useState('');

  const [playerInputs, setPlayerInputs] = useState<({ playerId: string, yakuman: boolean } & Omit<PlayerInput, 'score' | 'chips'> & { score: number | string, chips: number | '' })[]>([
    { playerId: '', score: '', chips: '', yakuman: false },
    { playerId: '', score: '', chips: '', yakuman: false },
    { playerId: '', score: '', chips: '', yakuman: false },
    { playerId: '', score: '', chips: '', yakuman: false },
  ]);

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      // 選手一覧の取得
      const { data: playersData } = await supabase
        .from('players')
        .select('*')
        .eq('user_id', user.id)
        .order('name');
      setPlayers(playersData || []);

      // 編集モードの場合、既存データの読み込み
      const params = new URLSearchParams(window.location.search);
      const editId = params.get('edit');
      if (editId) {
        const { data: match } = await supabase
          .from('matches')
          .select('*')
          .eq('id', editId)
          .single();
        
        if (match) {
          setDate(match.date);
          setSettings(match.settings);
          setMemo(match.memo || '');
          // players_results から playerInputs へ変換 (100で割って表示)
          const inputs = match.players_results.map((r: any) => ({
            playerId: r.playerId,
            score: typeof r.score === 'number' ? String(r.score / 100) : '',
            chips: r.chips || 0,
            yakuman: !!r.yakumanCount
          }));
          setPlayerInputs(inputs.length === 4 ? inputs : playerInputs);
        }
      } else {
        // 新規作成時：前回の設定を引き継ぐ
        const { data: lastMatch } = await supabase
          .from('matches')
          .select('settings')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
        
        if (lastMatch) {
          setSettings(lastMatch.settings);
        }
      }

      setLoading(false);

      // ローカルストレージから参加者設定を復元
      const savedIds = localStorage.getItem('mahjong_session_players');
      if (savedIds) {
        try {
          setSelectedSessionPlayerIds(JSON.parse(savedIds));
        } catch (e) {
          console.error('Failed to load session players', e);
        }
      }
    };
    fetchData();
  }, []);

  // 参加者設定を保存
  useEffect(() => {
    if (selectedSessionPlayerIds.length > 0) {
      localStorage.setItem('mahjong_session_players', JSON.stringify(selectedSessionPlayerIds));
    }
  }, [selectedSessionPlayerIds]);

  const handleScoreChange = (index: number, value: string) => {
    const newInputs = [...playerInputs];
    newInputs[index].score = value;
    setPlayerInputs(newInputs);
  };

  const handleChipChange = (index: number, value: string) => {
    const newInputs = [...playerInputs];
    newInputs[index].chips = value === '' ? '' : parseInt(value) || 0;
    setPlayerInputs(newInputs);
  };

  const handlePlayerChange = (index: number, playerId: string) => {
    const newInputs = [...playerInputs];
    newInputs[index].playerId = playerId;
    setPlayerInputs(newInputs);

    // 選択されたら、自動的に本日の参加者リストに追加（未追加の場合）
    if (playerId && !selectedSessionPlayerIds.includes(playerId)) {
      setSelectedSessionPlayerIds(prev => [...prev, playerId]);
    }
  };

  const toggleSessionPlayer = (playerId: string) => {
    setSelectedSessionPlayerIds(prev => 
      prev.includes(playerId) 
        ? prev.filter(id => id !== playerId) 
        : [...prev, playerId]
    );
  };

  const filteredPlayers = useMemo(() => {
    if (!isFilterEnabled || selectedSessionPlayerIds.length === 0) {
      return players;
    }
    return players.filter(p => selectedSessionPlayerIds.includes(p.id));
  }, [players, selectedSessionPlayerIds, isFilterEnabled]);

  const handleYakumanChange = (index: number, checked: boolean) => {
    const newInputs = [...playerInputs];
    newInputs[index].yakuman = checked;
    setPlayerInputs(newInputs);
  };

  // 表示用には 100倍 して計算
  const currentTotal = playerInputs.reduce((sum, p) => sum + (Number(p.score) || 0) * 100, 0);
  const targetTotal = settings.okaEnabled ? settings.startPoints * 4 : 120000;
  const isTotalValid = currentTotal === targetTotal;

  const currentChipTotal = playerInputs.reduce((sum, p) => sum + (Number(p.chips) || 0), 0);
  const isChipTotalValid = !settings.chipEnabled || currentChipTotal === 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isTotalValid || !isChipTotalValid || !userId || saving) return;
    
    // 重複チェック
    const selectedIds = playerInputs.map(p => p.playerId);
    if (new Set(selectedIds).size !== 4 || selectedIds.includes('')) {
      alert('選手を正しく4名選択してください（重複不可）。');
      return;
    }

    setSaving(true);
    try {
      const normalizedSettings: MahjongSettings = {
        ...settings,
        uma1: Number(settings.uma1) || 0,
        uma2: Number(settings.uma2) || 0,
        uma3: Number(settings.uma3) || 0,
        uma4: Number(settings.uma4) || 0,
        rateSettings: Number(settings.rateSettings) || 0,
        chipRate: Number(settings.chipRate) || 0,
        startPoints: Number(settings.startPoints) || 0,
        returnPoints: Number(settings.returnPoints) || 0,
      };

      const normalizedInputs = playerInputs.map(p => ({
        ...p,
        score: (Number(p.score) || 0) * 100, // 100倍して保存
        chips: Number(p.chips) || 0
      }));
      const results = calculateMatchResults(normalizedInputs, normalizedSettings);
      
      const matchData = {
        user_id: userId,
        date,
        settings: normalizedSettings,
        memo,
        players_results: results.map((r, idx) => ({
          ...r,
          playerId: playerInputs[idx].playerId,
          score: (Number(playerInputs[idx].score) || 0) * 100,
          chips: Number(playerInputs[idx].chips) || 0,
          yakumanCount: playerInputs[idx].yakuman ? 1 : 0,
          name: players.find(p => p.id === playerInputs[idx].playerId)?.name
        }))
      };

      const params = new URLSearchParams(window.location.search);
      const editId = params.get('edit');

      let error;
      if (editId) {
        // 更新
        const { error: err } = await supabase.from('matches').update(matchData).eq('id', editId);
        error = err;
      } else {
        // 新規作成
        const { error: err } = await supabase.from('matches').insert(matchData);
        error = err;
      }

      if (error) throw error;

      alert(editId ? '記録を更新しました。' : '対局記録を保存しました。');
      router.push('/history');
    } catch (err: any) {
      alert('エラーが発生しました: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <MainLayout><div className="text-center py-20 text-slate-500">読み込み中...</div></MainLayout>;

  return (
    <MainLayout>
      <div className="space-y-6 pb-20">
        <header>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Save className="text-emerald-400" />
            対局入力
          </h1>
          <p className="text-slate-400 text-xs">本日の対局結果を記録します</p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 基本設定 */}
          <section className="glass rounded-3xl p-5 space-y-5">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm mb-1">
              <Settings2 size={16} /> ルール詳細設定
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-[10px] text-slate-500 mb-1 uppercase font-bold">対局日</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  onClick={(e) => (e.target as any).showPicker?.()}
                  className="glass-input w-full rounded-xl px-3 py-2 text-sm cursor-pointer"
                />
              </div>

              <div className="col-span-2">
                <div className="flex items-center justify-between p-3 bg-white/5 rounded-2xl border border-white/10 mb-4">
                  <div>
                    <p className="text-sm font-bold text-white leading-none">オカ</p>
                    <p className="text-[10px] text-slate-500 mt-1">開始点と返し点の差を1位に加算します</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const newOka = !settings.okaEnabled;
                      setSettings({ 
                        ...settings, 
                        okaEnabled: newOka,
                        startPoints: newOka ? settings.startPoints : 30000,
                        returnPoints: newOka ? settings.returnPoints : 30000 
                      });
                    }}
                    className={`w-12 h-6 rounded-full p-1 transition-colors ${settings.okaEnabled ? 'bg-emerald-600' : 'bg-slate-700'}`}
                  >
                    <div className={`w-4 h-4 bg-white rounded-full transition-transform ${settings.okaEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
                  </button>
                </div>
              </div>

              {settings.okaEnabled && (
                <>
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-1 uppercase font-bold">開始点 (配給原点)</label>
                    <div className="relative">
                      <input
                        type="number"
                        value={settings.startPoints ? settings.startPoints / 100 : ''}
                        onChange={(e) => setSettings({ ...settings, startPoints: (parseInt(e.target.value) || 0) * 100 })}
                        className="glass-input w-full rounded-xl pl-3 pr-8 py-2 text-sm text-right font-bold tracking-widest"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-500 pointer-events-none font-mono font-bold">00</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-1 uppercase font-bold">返し点 (原点)</label>
                    <div className="relative">
                      <input
                        type="number"
                        value={settings.returnPoints ? settings.returnPoints / 100 : ''}
                        onChange={(e) => setSettings({ ...settings, returnPoints: (parseInt(e.target.value) || 0) * 100 })}
                        className="glass-input w-full rounded-xl pl-3 pr-8 py-2 text-sm text-right font-bold tracking-widest"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-500 pointer-events-none font-mono font-bold">00</span>
                    </div>
                  </div>
                </>
              )}

              <div className="col-span-2">
                <label className="block text-[10px] text-slate-500 mb-2 uppercase font-bold">ウマ設定 (1位-2位)</label>
                <div className="grid grid-cols-2 gap-4 bg-white/5 p-4 rounded-2xl border border-white/10">
                  <div className="flex flex-col gap-1">
                    <span className="text-[9px] text-slate-500 font-bold uppercase">1位</span>
                    <div className="relative">
                      <input
                        type="number"
                        value={settings.uma1}
                        onChange={(e) => {
                          const val = e.target.value;
                          setSettings({ ...settings, uma1: val, uma4: val === '' || val === '-' ? '' : -(parseInt(val) || 0) });
                        }}
                        className="glass-input w-full rounded-xl px-3 py-2 text-sm font-bold text-emerald-400"
                        placeholder="30"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[9px] text-slate-500 font-bold uppercase">2位</span>
                    <div className="relative">
                      <input
                        type="number"
                        value={settings.uma2}
                        onChange={(e) => {
                          const val = e.target.value;
                          setSettings({ ...settings, uma2: val, uma3: val === '' || val === '-' ? '' : -(parseInt(val) || 0) });
                        }}
                        className="glass-input w-full rounded-xl px-3 py-2 text-sm font-bold text-emerald-400"
                        placeholder="10"
                      />
                    </div>
                  </div>
                  <div className="col-span-2 flex justify-center items-center gap-4 mt-1 opacity-50">
                    <div className="text-[9px] font-bold text-slate-500 italic">3位: {settings.uma3}</div>
                    <div className="text-[9px] font-bold text-slate-500 italic">4位: {settings.uma4}</div>
                  </div>
                </div>
              </div>

              <div className="col-span-2">
                <label className="block text-[10px] text-slate-500 mb-1 uppercase font-bold">端数処理</label>
                <select
                  value={settings.fractionRule}
                  onChange={(e) => setSettings({ ...settings, fractionRule: e.target.value as any })}
                  className="glass-select w-full rounded-xl px-3 py-2 text-sm"
                >
                  <option value="none">調整なし</option>
                  <option value="roundUp">切り上げ</option>
                  <option value="roundDown">切り捨て</option>
                  <option value="fiveRound">五捨六入 (0.5を丸める)</option>
                  <option value="originRule">原点以上切り捨て / 未満切り上げ</option>
                </select>
              </div>

              <div className="col-span-2">
                <label className="block text-[10px] text-slate-500 mb-1 uppercase font-bold">同点時の順位</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSettings({ ...settings, tieRankingRule: 'split' })}
                    className={`h-10 rounded-xl px-3 text-xs font-bold transition-all border ${
                      settings.tieRankingRule === 'split' 
                        ? 'bg-emerald-600/20 border-emerald-500/50 text-emerald-400' 
                        : 'bg-white/5 border-white/10 text-slate-500'
                    }`}
                  >
                    同着 (分け合い)
                  </button>
                  <button
                    type="button"
                    onClick={() => setSettings({ ...settings, tieRankingRule: 'seatPriority' })}
                    className={`h-10 rounded-xl px-3 text-xs font-bold transition-all border ${
                      settings.tieRankingRule === 'seatPriority' 
                        ? 'bg-emerald-600/20 border-emerald-500/50 text-emerald-400' 
                        : 'bg-white/5 border-white/10 text-slate-500'
                    }`}
                  >
                    席順 (上家優先)
                  </button>
                </div>
                <p className="text-[9px] text-slate-500 mt-1 px-1">※席順の場合、入力欄の上のスロットが優先されます</p>
              </div>

              <div>
                <label className="block text-[10px] text-slate-500 mb-1 uppercase font-bold">点レート (1000点)</label>
                <div className="relative">
                  <input
                    type="number"
                    value={settings.rateSettings}
                    onChange={(e) => setSettings({ ...settings, rateSettings: e.target.value })}
                    className="glass-input w-full rounded-xl px-3 py-2 text-sm pr-7"
                    placeholder="50"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-500 font-bold">円</span>
                </div>
              </div>

              <div className="flex items-end mb-1">
                <button
                  type="button"
                  onClick={() => setSettings({ ...settings, chipEnabled: !settings.chipEnabled })}
                  className={`flex-1 h-10 rounded-xl px-3 text-xs font-bold transition-all border ${
                    settings.chipEnabled 
                      ? 'bg-emerald-600/20 border-emerald-500/50 text-emerald-400' 
                      : 'bg-white/5 border-white/10 text-slate-500'
                  }`}
                >
                  チップ {settings.chipEnabled ? '有効' : '無効'}
                </button>
              </div>

              {settings.chipEnabled && (
                <div className="col-span-2">
                  <label className="block text-[10px] text-slate-500 mb-1 uppercase font-bold">チップ単価 (1枚)</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={settings.chipRate}
                      onChange={(e) => setSettings({ ...settings, chipRate: e.target.value })}
                      className="glass-input w-full rounded-xl px-3 py-2 text-sm pr-7"
                      placeholder="100"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-500 font-bold">円</span>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* 本日の参加者設定 */}
          <section className="glass rounded-3xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div 
                className="flex items-center gap-2 text-emerald-400 font-bold text-sm cursor-pointer"
                onClick={() => setShowPlayerSelector(!showPlayerSelector)}
              >
                <Users size={16} /> 本日の参加者
                <span className="bg-emerald-500/10 text-emerald-500 text-[10px] px-2 py-0.5 rounded-full">
                  {selectedSessionPlayerIds.length}名設定中
                </span>
                <ChevronRight size={14} className={`transition-transform ${showPlayerSelector ? 'rotate-90' : ''}`} />
              </div>
              <button
                type="button"
                onClick={() => setIsFilterEnabled(!isFilterEnabled)}
                className={`text-[10px] font-bold px-3 py-1 rounded-full transition-all ${
                  isFilterEnabled ? 'bg-emerald-600 text-white' : 'bg-white/5 text-slate-500 border border-white/10'
                }`}
              >
                絞り込み: {isFilterEnabled ? 'ON' : 'OFF'}
              </button>
            </div>

            {showPlayerSelector && (
              <div className="grid grid-cols-2 gap-2 pt-2 animate-in fade-in slide-in-from-top-2">
                {players.map((p: any) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => toggleSessionPlayer(p.id)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs transition-all ${
                      selectedSessionPlayerIds.includes(p.id)
                        ? 'bg-emerald-600/20 border-emerald-500/50 text-emerald-400'
                        : 'bg-white/5 border-white/10 text-slate-500'
                    }`}
                  >
                    <div className={`w-2 h-2 rounded-full ${selectedSessionPlayerIds.includes(p.id) ? 'bg-emerald-400' : 'bg-transparent border border-slate-600'}`} />
                    <span className="truncate">{p.name}</span>
                  </button>
                ))}
                {players.length === 0 && (
                  <div className="col-span-2 text-center py-4 text-slate-500 text-[10px]">
                    選手が登録されていません
                  </div>
                )}
              </div>
            )}
          </section>

          {/* 選手・点数入力 */}
          <section className="space-y-3">
            <div className="flex flex-col gap-2 px-1 mb-2">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                <Users size={16} /> 点数入力
              </div>
              <div className="flex flex-wrap gap-2">
                <div className={`text-[10px] font-bold px-3 py-1.5 rounded-xl border flex items-center gap-1.5 ${isTotalValid ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-red-500/10 border-red-500/30 text-red-500'}`}>
                  <span>点数: {currentTotal.toLocaleString()} / {targetTotal.toLocaleString()}</span>
                  {!isTotalValid && (
                    <span className="opacity-80">
                      ({currentTotal > targetTotal ? '+' : ''}{(currentTotal - targetTotal).toLocaleString()} 点)
                    </span>
                  )}
                </div>
                {settings.chipEnabled && (
                  <div className={`text-[10px] font-bold px-3 py-1.5 rounded-xl border flex items-center gap-1.5 ${isChipTotalValid ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-red-500/10 border-red-500/30 text-red-500'}`}>
                    <span>チップ合計: {currentChipTotal > 0 ? `+${currentChipTotal}` : currentChipTotal}</span>
                    {!isChipTotalValid && (
                      <span className="opacity-80">
                        ({currentChipTotal > 0 ? `${currentChipTotal} 枚オーバー` : `${Math.abs(currentChipTotal)} 枚不足`})
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {playerInputs.map((input, idx) => (
              <div key={idx} className="glass rounded-2xl p-4 flex gap-3 items-center">
                <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[10px] font-bold text-slate-500">
                  {idx + 1}
                </div>
                <div className="flex-1 space-y-2">
                  <select
                    value={input.playerId}
                    onChange={(e) => handlePlayerChange(idx, e.target.value)}
                    className="glass-select w-full rounded-xl px-3 py-2 text-sm"
                    required
                  >
                    <option value="">選手を選択</option>
                    {filteredPlayers.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                    {!isFilterEnabled && players.length > filteredPlayers.length && (
                      <option disabled>── 他の選手 ──</option>
                    )}
                  </select>
                  <div className="grid grid-cols-5 gap-2">
                    <div className="relative col-span-3">
                      <button
                        type="button"
                        tabIndex={-1}
                        onClick={() => {
                          const current = input.score.toString();
                          if (current === '0' || current === '') {
                            handleScoreChange(idx, '-');
                          } else {
                            handleScoreChange(idx, current.startsWith('-') ? current.replace('-', '') : '-' + current);
                          }
                        }}
                        className="absolute left-1.5 top-1/2 -translate-y-1/2 z-10 w-9 h-9 flex items-center justify-center text-slate-400 hover:text-emerald-400 bg-white/5 hover:bg-white/10 rounded-lg transition-colors font-bold text-sm"
                      >
                        ±
                      </button>
                      <input
                        type="number"
                        value={input.score}
                        onChange={(e) => handleScoreChange(idx, e.target.value)}
                        className="glass-input w-full rounded-xl pl-11 pr-10 text-xl font-bold text-right py-3 tracking-widest"
                        placeholder="300"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xl text-white/30 pointer-events-none font-bold font-mono tracking-widest">00</span>
                    </div>
                    {settings.chipEnabled && (
                      <div className="relative col-span-2">
                        <button
                          type="button"
                          tabIndex={-1}
                          onClick={() => {
                            const current = input.chips.toString();
                            if (current === '0' || current === '') {
                              handleChipChange(idx, '-');
                            } else {
                              handleChipChange(idx, current.startsWith('-') ? current.replace('-', '') : '-' + current);
                            }
                          }}
                          className="absolute left-1.5 top-1/2 -translate-y-1/2 z-10 w-9 h-9 flex items-center justify-center text-emerald-500/60 hover:text-emerald-400 bg-emerald-500/5 hover:bg-emerald-500/10 rounded-lg transition-colors font-bold text-sm"
                        >
                          ±
                        </button>
                        <input
                          type="number"
                          value={input.chips}
                          onChange={(e) => handleChipChange(idx, e.target.value)}
                          className="glass-input w-full rounded-xl pl-11 pr-3 text-lg font-bold text-right text-emerald-400 py-3"
                          placeholder="枚数"
                        />
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 pt-1 border-t border-white/5">
                    <button
                      type="button"
                      onClick={() => handleYakumanChange(idx, !input.yakuman)}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-[10px] font-bold transition-all ${
                        input.yakuman 
                          ? 'bg-yellow-500/20 border-yellow-500 text-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.2)]'
                          : 'bg-white/5 border-white/10 text-slate-500 hover:bg-white/10'
                      }`}
                    >
                      <Trophy size={12} className={input.yakuman ? 'animate-bounce' : ''} />
                      役満あがり
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </section>

          {/* 対局メモ */}
          <section className="glass rounded-3xl p-5 space-y-3">
            <div className="flex items-center gap-2 text-slate-400 font-bold text-sm">
              <HistoryIcon size={16} /> 自由記入メモ
            </div>
            <textarea
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder="役の内容や印象的な出来事など..."
              className="glass-input w-full rounded-2xl px-4 py-3 text-sm min-h-[100px] resize-none"
            />
          </section>

          {(!isTotalValid || !isChipTotalValid) && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-xs p-4 rounded-2xl flex flex-col gap-2">
              {!isTotalValid && (
                <div className="flex items-center gap-2">
                  <AlertCircle size={16} className="shrink-0" />
                  <div>
                    <p className="font-bold">点数合計エラー</p>
                    <p className="text-[10px] mt-1 opacity-80">
                      目標 ({targetTotal.toLocaleString()}) に対して 
                      <strong className="text-red-400 ml-1">
                        {Math.abs(currentTotal - targetTotal).toLocaleString()} 点 {currentTotal > targetTotal ? 'オーバーしています' : '足りません'}。
                      </strong>
                    </p>
                  </div>
                </div>
              )}
              {!isChipTotalValid && (
                <div className="flex items-center gap-2">
                  <AlertCircle size={16} className="shrink-0" />
                  <div>
                    <p className="font-bold">チップ合計エラー</p>
                    <p className="text-[10px] mt-1 opacity-80">
                      現在のチップ合計が {currentChipTotal > 0 ? `+${currentChipTotal}` : currentChipTotal} 枚です。合計が 0 枚になるように入力してください。
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={!isTotalValid || !isChipTotalValid || saving}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-5 rounded-3xl shadow-lg shadow-emerald-600/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving ? '保存中...' : <><Save size={20} /> {new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '').get('edit') ? '記録を更新する' : '対局記録を保存する'}</>}
          </button>
        </form>
      </div>
    </MainLayout>
  );
}
