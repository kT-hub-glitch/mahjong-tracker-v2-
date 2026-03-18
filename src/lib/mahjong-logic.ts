/**
 * 麻雀計算ロジック
 * 旧バージョンの app.js から移植した、ウマ、オカ、精算計算のコアロジックです。
 */

export type FractionRule = 'none' | 'roundUp' | 'roundDown' | 'fiveRound' | 'originRule';

export interface MahjongSettings {
  uma1: number;
  uma2: number;
  uma3: number;
  uma4: number;
  okaEnabled: boolean;
  startPoints: number;
  returnPoints: number;
  fractionRule: FractionRule;
  rateSettings: number; // 1000点あたりの金額
  chipEnabled: boolean;
  chipRate: number; // 1枚あたりの金額
  tieRankingRule: 'split' | 'seatPriority'; // 同点時の順位
}

export interface PlayerInput {
  score: number;
  chips: number;
  rawRank?: number; // 同点時の手動順位調整用
}

export interface PlayerResult extends PlayerInput {
  rank: number;
  pointAdjust: number; // ウマ・オカの加減
  totalPoints: number; // 最終的なpt
  totalMoney: number;  // 最終的な金額
}

/**
 * 点数からポイントへの変換（端数処理込み）
 */
export function calculatePointDiff(score: number, originPoint: number, rule: FractionRule): number {
  let pointDiff = (score - originPoint) / 1000;

  switch (rule) {
    case 'roundUp':
      return Math.ceil(pointDiff);
    case 'roundDown':
      return Math.floor(pointDiff);
    case 'fiveRound':
      return Math.round(pointDiff);
    case 'originRule':
      // 原点以上なら切り捨て、未満なら切り上げ
      return score >= originPoint ? Math.floor(pointDiff) : Math.ceil(pointDiff);
    default:
      return pointDiff;
  }
}

/**
 * 1対局の全プレイヤーの結果を計算します
 */
export function calculateMatchResults(
  players: PlayerInput[],
  settings: MahjongSettings
): PlayerResult[] {
  const { uma1, uma2, uma3, uma4, okaEnabled, startPoints, returnPoints, fractionRule, rateSettings, chipRate, tieRankingRule } = settings;

  // 1. 基礎データの準備
  // 合計点は常に開始点×4。返し点はポイント計算の基準。
  const targetTotal = startPoints * 4;
  const originPoint = returnPoints; 

  // 合計点チェック
  const currentTotal = players.reduce((sum, p) => sum + p.score, 0);
  if (currentTotal !== targetTotal) {
    throw new Error(`点数の合計 (${currentTotal}) が目標値 (${targetTotal}) と一致しません。`);
  }

  // 2. ウマ・オカの加点計算
  const okaBonus = okaEnabled ? ((returnPoints - startPoints) * 4) / 1000 : 0;
  const baseAdjustments = [uma1 + okaBonus, uma2, uma3, uma4];

  // 3. 順位付けとウマ分配
  // 点数で降順、同点の場合は rawRank があれば昇順（1位が優先）
  const sortedIndices = players
    .map((_, index) => index)
    .sort((a, b) => {
      if (players[b].score !== players[a].score) return players[b].score - players[a].score;
      // 同点の場合、席順優先ならインデックスが小さい（起家側）を優先、そうでなければrawRank（あれば）
      if (tieRankingRule === 'seatPriority') return a - b;
      return (players[a].rawRank || 0) - (players[b].rawRank || 0);
    });

  const results: PlayerResult[] = new Array(players.length);

  let i = 0;
  while (i < sortedIndices.length) {
    let j = i + 1;
    // 同点・同順位のグループを探す（同着分け合い設定時のみ）
    if (tieRankingRule === 'split') {
      while (
        j < sortedIndices.length &&
        players[sortedIndices[j]].score === players[sortedIndices[i]].score
      ) {
        j++;
      }
    }

    const numTied = j - i;
    const sumAdjust = baseAdjustments.slice(i, j).reduce((a, b) => a + b, 0);
    const avgAdjust = sumAdjust / numTied;

    for (let k = i; k < j; k++) {
      const originalIdx = sortedIndices[k];
      const player = players[originalIdx];
      
      const pointDiff = calculatePointDiff(player.score, originPoint, fractionRule);
      const totalPoints = pointDiff + avgAdjust;
      
      const moneyFromPoints = totalPoints * rateSettings;
      const moneyFromChips = player.chips * (settings.chipEnabled ? chipRate : 0);
      const totalMoney = Math.round(moneyFromPoints + moneyFromChips);

      results[originalIdx] = {
        ...player,
        rank: i + 1,
        pointAdjust: avgAdjust,
        totalPoints,
        totalMoney
      };
    }
    i = j;
  }

  return results;
}
