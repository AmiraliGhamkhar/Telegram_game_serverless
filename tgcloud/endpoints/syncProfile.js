import { db } from 'sdk';
import { eq, sql } from 'sdk/db';
import { players } from '../schema.js';

export default async function (params, ctx) {
  const user = ctx.initData.user || { id: 0 };
  const userId = user.id;
  const existing = await db.select().from(players).where(eq(players.userId, userId)).run();
  if (existing.length === 0) {
    await db.insert(players).values({ userId, username: user.username || '', firstName: user.first_name || '', faction: params.faction || 'defender', stage: params.stage || 1, eloRating: 1000, gold: 200, gems: 10, castleLevel: params.castleLevel || 1, bowLevel: params.bowLevel || 1, towersJson: params.towersJson || '[]', unlockedUnitsJson: params.unlockedUnitsJson || '[]', defenseLayoutJson: params.defenseLayoutJson || '{}', battlePassXp: 0, hasPremiumPass: 0 }).run();
  } else {
    await db.update(players).set({
      username: user.username || existing[0].username || '',
      firstName: user.first_name || existing[0].firstName || '',
      faction: params.faction || existing[0].faction,
      stage: params.stage || existing[0].stage,
      gold: params.gold !== undefined ? params.gold : existing[0].gold,
      gems: params.gems !== undefined ? params.gems : existing[0].gems,
      castleLevel: params.castleLevel || existing[0].castleLevel,
      bowLevel: params.bowLevel || existing[0].bowLevel,
      towersJson: params.towersJson || existing[0].towersJson,
      unlockedUnitsJson: params.unlockedUnitsJson || existing[0].unlockedUnitsJson,
      defenseLayoutJson: params.defenseLayoutJson || existing[0].defenseLayoutJson,
      eloRating: params.eloRating || existing[0].eloRating,
      updatedAt: sql`(unixepoch())`,
    }).where(eq(players.userId, userId)).run();
  }
  return { ok: true, userId };
}
