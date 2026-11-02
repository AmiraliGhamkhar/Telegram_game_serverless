import { db } from 'sdk';
import { eq, desc, sql } from 'sdk/db';
import { players, pvp_raids } from '../schema.js';
import { calculateElo } from '../lib/lootEngine.js';

export default async function (params, ctx) {
  const user = ctx.initData.user || { id: 0 };
  const userId = user.id;
  if (params.action === 'list') {
    const others = await db.select().from(players).where(eq(players.userId, userId)).run();
    // Return top 5 players by ELO as matchmaking targets
    const targets = await db.select({ userId: players.userId, username: players.username, firstName: players.firstName, eloRating: players.eloRating, defenseLayoutJson: players.defenseLayoutJson }).from(players).where(eq(players.userId, userId)).run();
    // Actually query all and filter in code because no OR/NOT easily; use simple select all
    const all = await db.select().from(players).run();
    const targetsList = all.filter(p => p.userId !== userId).sort((a, b) => (b.eloRating || 0) - (a.eloRating || 0)).slice(0, 5).map(p => ({ userId: p.userId, username: p.username, firstName: p.firstName, eloRating: p.eloRating, defenseLayoutJson: p.defenseLayoutJson || '{}' }));
    return { ok: true, targets: targetsList };
  }
  if (params.action === 'raid') {
    const defenderId = params.defenderId;
    const attackerWon = params.attackerWon ? 1 : 0;
    const goldStolen = params.goldStolen || 0;
    const attackerRows = await db.select().from(players).where(eq(players.userId, userId)).run();
    const defenderRows = await db.select().from(players).where(eq(players.userId, defenderId)).run();
    if (attackerRows.length === 0 || defenderRows.length === 0) return { ok: false };
    const ar = attackerRows[0];
    const dr = defenderRows[0];
    const eloCalc = calculateElo(ar.eloRating || 1000, dr.eloRating || 1000, attackerWon === 1);
    const newAttackerElo = eloCalc.attackerNew;
    const newDefenderElo = eloCalc.defenderNew;
    const delta = eloCalc.delta;
    await db.insert(pvp_raids).values({ attackerId: userId, defenderId, attackerWon, goldStolen, eloDelta: delta }).run();
    await db.update(players).set({ eloRating: newAttackerElo, gold: (ar.gold || 0) + (attackerWon ? goldStolen : 0), updatedAt: sql`(unixepoch())` }).where(eq(players.userId, userId)).run();
    await db.update(players).set({ eloRating: newDefenderElo, gold: Math.max(0, (dr.gold || 0) - goldStolen), updatedAt: sql`(unixepoch())` }).where(eq(players.userId, defenderId)).run();
    return { ok: true, delta, attackerElo: newAttackerElo, defenderElo: newDefenderElo };
  }
  return { ok: false };
}
