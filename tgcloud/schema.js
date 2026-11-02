import { table, integer, text, sql } from 'sdk/db';

export const players = table({
  name: 'players',
  columns: {
    userId: integer({ primaryKey: true }),
    username: text(),
    firstName: text(),
    faction: text({ default: 'defender' }),
    stage: integer({ default: 1 }),
    eloRating: integer({ default: 1000 }),
    gold: integer({ default: 0 }),
    gems: integer({ default: 0 }),
    highScore: integer({ default: 0 }),
    castleLevel: integer({ default: 1 }),
    bowLevel: integer({ default: 1 }),
    towersJson: text({ default: '[]' }),
    unlockedUnitsJson: text({ default: '[]' }),
    defenseLayoutJson: text({ default: '{}' }),
    battlePassXp: integer({ default: 0 }),
    hasPremiumPass: integer({ default: 0 }),
    clanId: integer(),
    updatedAt: integer({ default: sql`(unixepoch())` }),
  },
});

export const pvp_raids = table({
  name: 'pvp_raids',
  columns: {
    id: integer({ primaryKey: true, autoIncrement: true }),
    attackerId: integer(),
    defenderId: integer(),
    attackerWon: integer(),
    goldStolen: integer(),
    eloDelta: integer(),
    createdAt: integer({ default: sql`(unixepoch())` }),
  },
});

export const clans = table({
  name: 'clans',
  columns: {
    id: integer({ primaryKey: true, autoIncrement: true }),
    name: text(),
    bossHp: integer({ default: 1000 }),
    bossMaxHp: integer({ default: 1000 }),
    bossLevel: integer({ default: 1 }),
    totalScore: integer({ default: 0 }),
  },
});

export const chests = table({
  name: 'chests',
  columns: {
    id: integer({ primaryKey: true, autoIncrement: true }),
    userId: integer(),
    tier: text(),
    opened: integer({ default: 0 }),
    rewardJson: text({ default: '{}' }),
    createdAt: integer({ default: sql`(unixepoch())` }),
  },
});

export const battles = table({
  name: 'battles',
  columns: {
    id: integer({ primaryKey: true, autoIncrement: true }),
    userId: integer(),
    type: text(),
    won: integer(),
    score: integer({ default: 0 }),
    createdAt: integer({ default: sql`(unixepoch())` }),
  },
});
