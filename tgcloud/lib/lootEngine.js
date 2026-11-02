import { sql } from 'sdk/db';

const TIER_WEIGHTS = { bronze: 60, silver: 28, golden: 12 };

const REWARD_POOL = {
  bronze: [
    { type: 'gold', amountMin: 50, amountMax: 120, weight: 60 },
    { type: 'gem', amountMin: 1, amountMax: 3, weight: 30 },
    { type: 'shard', amountMin: 1, amountMax: 2, weight: 10 },
  ],
  silver: [
    { type: 'gold', amountMin: 150, amountMax: 350, weight: 35 },
    { type: 'gem', amountMin: 3, amountMax: 8, weight: 40 },
    { type: 'shard', amountMin: 2, amountMax: 5, weight: 20 },
    { type: 'relic', amountMin: 1, amountMax: 1, weight: 5 },
  ],
  golden: [
    { type: 'gold', amountMin: 500, amountMax: 1200, weight: 20 },
    { type: 'gem', amountMin: 10, amountMax: 25, weight: 35 },
    { type: 'shard', amountMin: 5, amountMax: 12, weight: 30 },
    { type: 'relic', amountMin: 1, amountMax: 3, weight: 15 },
  ],
};

function pickTier() {
  const r = Math.random() * 100;
  if (r < TIER_WEIGHTS.bronze) return 'bronze';
  if (r < TIER_WEIGHTS.bronze + TIER_WEIGHTS.silver) return 'silver';
  return 'golden';
}

function rollReward(tier) {
  const pool = REWARD_POOL[tier] || REWARD_POOL.bronze;
  const totalWeight = pool.reduce((s, i) => s + i.weight, 0);
  let roll = Math.random() * totalWeight;
  for (const item of pool) {
    roll -= item.weight;
    if (roll <= 0) {
      const amount = Math.floor(Math.random() * (item.amountMax - item.amountMin + 1)) + item.amountMin;
      return { type: item.type, amount, tier };
    }
  }
  return { type: 'gold', amount: 50, tier };
}

export function generateChest(userId) {
  const tier = pickTier();
  const rewards = [];
  const count = tier === 'bronze' ? 1 : tier === 'silver' ? 2 : 3;
  for (let i = 0; i < count; i++) rewards.push(rollReward(tier));
  return { userId, tier, rewards, opened: false };
}

export function calculateElo(attackerRating, defenderRating, attackerWon) {
  const K = 32;
  const expected = 1 / (1 + Math.pow(10, (defenderRating - attackerRating) / 400));
  const actual = attackerWon ? 1 : 0;
  const delta = Math.round(K * (actual - expected));
  return { attackerNew: Math.max(0, attackerRating + delta), defenderNew: Math.max(0, defenderRating - delta), delta };
}

export function verifyBattleScore(score, stage, timeMs) {
  const cap = Math.max(100, stage * 250);
  return score >= 0 && score <= cap && timeMs > 15000 && timeMs < 120000;
}
