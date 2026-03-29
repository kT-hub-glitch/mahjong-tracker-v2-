/**
 * 統計計算ロジック
 */

export interface PlayerStats {
  matchCount: number;
  totalScore: number;
  totalPoints: number;
  totalChipPoints: number; // チップをポイント換算したものの合計
  totalMoney: number;
  totalChips: number;
  moneyFromScore: number;
  moneyFromChips: number;
  avgRank: number;
  avgScore: number;
  avgPoints: number; // 麻雀ポイントの平均
  avgChipPoints: number; // チップポイントの平均
  maxScore: number;
  top2Rate: number; // 連対率
  rankCounts: { [rank: number]: number };
  yakumanCount: number;
  recentResults: {
    matchId: string;
    date: string;
    rank: number;
    points: number;
    score: number;
  }[];
  headToHead: { [otherPlayerId: string]: { 
    name: string, 
    winCount: number, 
    loseCount: number, 
    pointDiff: number, // ポイント差（ウマ・オカ込）
    rankSum: number, // 対戦時の自分の合計順位
    matchCount: number // 対戦回数
  } };
}

/**
 * 全対局データから全選手の統計を算出します
 */
export function calculateAllPlayerStats(matches: any[], players: any[], targetYear?: string, startDate?: string, endDate?: string): { [playerId: string]: PlayerStats } {
  const stats: { [playerId: string]: PlayerStats } = {};

  // 日付降順にソート（直近10戦を正確に取得するため）
  const sortedMatches = [...matches].sort((a, b) => {
    // 日付が同じならcreated_atでソート
    if (a.date === b.date) {
      return (b.created_at || '').localeCompare(a.created_at || '');
    }
    return b.date.localeCompare(a.date);
  });

  // 初期化
  players.forEach(p => {
    stats[p.id] = {
      matchCount: 0,
      totalScore: 0,
      totalPoints: 0,
      totalChipPoints: 0,
      totalMoney: 0,
      totalChips: 0,
      moneyFromScore: 0,
      moneyFromChips: 0,
      avgRank: 0,
      avgScore: 0,
      avgPoints: 0,
      avgChipPoints: 0,
      maxScore: -Infinity,
      top2Rate: 0,
      rankCounts: { 1: 0, 2: 0, 3: 0, 4: 0 },
      yakumanCount: 0,
      recentResults: [],
      headToHead: {}
    };
  });

  // 対局ごとに集計
  sortedMatches.forEach(match => {
    // 年フィルター
    if (targetYear && !match.date.startsWith(targetYear)) return;

    // 期間指定フィルター
    if (startDate && match.date < startDate) return;
    if (endDate && match.date > endDate) return;

    const results = match.players_results;
    
    results.forEach((p: any) => {
      const s = stats[p.playerId];
      if (!s) return;

      s.matchCount++;
      s.totalScore += p.score || 0;
      s.totalPoints += p.totalPoints || 0;
      s.totalMoney += p.totalMoney || 0;

      // チップ換算ポイントの集計
      const chipPoints = p.chipPoints !== undefined 
        ? p.chipPoints 
        : (match.settings.chipEnabled && (match.settings.rateSettings || 0) > 0 
          ? ((p.chips || 0) * (match.settings.chipRate || 0)) / match.settings.rateSettings 
          : 0);
      s.totalChipPoints += chipPoints;

      const chipMoney = (p.chips || 0) * (match.settings.chipRate || 0);
      s.totalChips += p.chips || 0;
      s.moneyFromChips += chipMoney;
      s.moneyFromScore += (p.totalMoney || 0) - chipMoney;

      s.rankCounts[p.rank]++;
      s.yakumanCount += p.yakumanCount || 0;
      if (p.score > s.maxScore) s.maxScore = p.score;

      // 直近50戦のデータを追加 (matchesが降順の場合、最初の方に追加される)
      if (s.recentResults.length < 50) {
        s.recentResults.push({
          matchId: match.id,
          date: match.date,
          rank: p.rank,
          points: (p.totalPoints || 0) + chipPoints, // ここもチップ込にするか分けるか？ とりあえず合計を表示
          score: p.score || 0
        });
      }

      // 直接対決データの集計
      results.forEach((other: any) => {
        if (p.playerId === other.playerId) return;

        if (!s.headToHead[other.playerId]) {
          const otherPlayerName = other.name || players.find(pl => pl.id === other.playerId)?.name || 'Unknown';
          s.headToHead[other.playerId] = { 
            name: otherPlayerName, 
            winCount: 0, 
            loseCount: 0, 
            pointDiff: 0,
            rankSum: 0,
            matchCount: 0
          };
        }
        
        const h2h = s.headToHead[other.playerId];
        h2h.matchCount++;
        h2h.rankSum += p.rank;

        // 順位で勝敗判定
        if (p.rank < other.rank) {
          h2h.winCount++;
        } else if (p.rank > other.rank) {
          h2h.loseCount++;
        }
        h2h.pointDiff += ((p.totalPoints || 0) - (other.totalPoints || 0));
      });
    });
  });

  // 平均値などの算出
  Object.keys(stats).forEach(id => {
    const s = stats[id];
    if (s.matchCount > 0) {
      s.avgRank = (s.rankCounts[1] * 1 + s.rankCounts[2] * 2 + s.rankCounts[3] * 3 + s.rankCounts[4] * 4) / s.matchCount;
      s.avgScore = s.totalScore / s.matchCount;
      s.avgPoints = s.totalPoints / s.matchCount;
      s.avgChipPoints = s.totalChipPoints / s.matchCount;
      s.top2Rate = ((s.rankCounts[1] + s.rankCounts[2]) / s.matchCount) * 100;
    } else {
      s.maxScore = 0;
    }
  });

  return stats;
}
