import { db } from 'sdk';
import { eq, sql } from 'sdk/db';
import { players } from '../schema.js';

export default async function (params, ctx) {
  const user = ctx.initData.user || { id: 0 };
  const userId = user.id;
  const stage = params.stage || 1;
  const rows = await db.select().from(players).where(eq(players.userId, userId)).run();
  if (rows.length === 0) return { ok: false, error: 'player not found' };
  const r = rows[0];
  const newStage = Math.max(r.stage || 1, stage);
  const newGold = (r.gold || 0) + 50 + (stage * 10);
  const newXps = (r.battlePassXp || 0) + 30;
  await db.update(players).set({ stage: newStage, gold: newGold, battlePassXp: newXps, updatedAt: sql`(unixepoch())` }).where(eq(players.userId, userId)).run();
  return { ok: true, stage: newStage, gold: newGold, xp: newXps };
}
