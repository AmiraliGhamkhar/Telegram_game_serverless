import { db } from 'sdk';
import { eq, sql } from 'sdk/db';
import { clans, players } from '../schema.js';

export default async function (params, ctx) {
  const user = ctx.initData.user || { id: 0 };
  const userId = user.id;
  const clanId = params.clanId || 1;
  if (params.action === 'get') {
    const clanRows = await db.select().from(clans).where(eq(clans.id, clanId)).run();
    return { ok: true, clan: clanRows[0] || { id: clanId, name: 'هزارم', bossHp: 1000, bossMaxHp: 1000, bossLevel: 1, totalScore: 0 } };
  }
  if (params.action === 'attack') {
    const damage = params.damage || 100;
    const clanRows = await db.select().from(clans).where(eq(clans.id, clanId)).run();
    if (clanRows.length === 0) return { ok: false, error: 'clan not found' };
    const c = clanRows[0];
    const newHp = Math.max(0, (c.bossHp || 0) - damage);
    const newScore = (c.totalScore || 0) + damage;
    await db.update(clans).set({ bossHp: newHp, totalScore: newScore, updatedAt: sql`(unixepoch())` }).where(eq(clans.id, clanId)).run();
    return { ok: true, bossHp: newHp, score: newScore, defeated: newHp <= 0 };
  }
  return { ok: false };
}
