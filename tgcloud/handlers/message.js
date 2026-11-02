import { api, db } from 'sdk';
import { eq, desc, sql } from 'sdk/db';
import { players } from '../schema.js';

export default async function (update) {
  const msg = update.message || {};
  if (!msg.text && !msg.successful_payment) return;
  const user = msg.from || { id: 0 };
  const text = msg.text || '';

  if (msg.successful_payment) {
    const invoicePayload = msg.successful_payment.invoice_payload || '';
    const userId = user.id;
    const existing = await db.select().from(players).where(eq(players.userId, userId)).run();
    if (existing.length === 0) {
      await db.insert(players).values({ userId, username: user.username || '', firstName: user.first_name || '', gems: 0, gold: 0 }).run();
    }
    const row = existing[0] || { userId, gems: 0, gold: 0, battlePassXp: 0, hasPremiumPass: 0 };
    let gems = row.gems || 0;
    let pass = row.hasPremiumPass || 0;
    let xp = row.battlePassXp || 0;
    if (invoicePayload.includes('gem_pack')) gems += 50;
    if (invoicePayload.includes('pass')) { pass = 1; xp = 500; }
    if (invoicePayload.includes('instant_chest')) gems += 5;
    await db.update(players).set({ gems, hasPremiumPass: pass, battlePassXp: xp, updatedAt: sql`(unixepoch())` }).where(eq(players.userId, userId)).run();
    await api.sendMessage({ chat_id: userId, text: '❖ پرداخت موفق! جواهرات و بلیط نبرد به حساب شما افزوده شد.' });
    return;
  }

  if (text.startsWith('/start')) {
    const refMatch = text.match(/ref_(\d+)/);
    const userId = user.id;
    const username = user.username || '';
    const firstName = user.first_name || '';
    const existing = await db.select().from(players).where(eq(players.userId, userId)).run();
    if (existing.length === 0) {
      await db.insert(players).values({ userId, username, firstName, faction: 'defender', stage: 1, eloRating: 1000, gold: 200, gems: 10, castleLevel: 1, bowLevel: 1, towersJson: '[]', unlockedUnitsJson: '[]', defenseLayoutJson: '{}', battlePassXp: 0, hasPremiumPass: 0 }).run();
    }
    if (refMatch) {
      const refId = parseInt(refMatch[1], 10);
      if (refId !== userId) {
        const ref = await db.select().from(players).where(eq(players.userId, refId)).run();
        if (ref.length > 0) {
          const refGold = (ref[0].gold || 0) + 30;
          await db.update(players).set({ gold: refGold, updatedAt: sql`(unixepoch())` }).where(eq(players.userId, refId)).run();
        }
      }
    }
    await api.sendMessage({ chat_id: userId, text: `به دژ جاویدان خوش آمدید! ⚔️ ادغام کن و در نبردهای باستانی پیروز شوید.\n\n📍 /stats برای آمار شما\n🎮 برای شروع، درون مینی‌اپ به دژ وارد شوید.` });
    return;
  }

  if (text === '/stats') {
    const userId = user.id;
    const rows = await db.select().from(players).where(eq(players.userId, userId)).run();
    if (rows.length === 0) {
      await api.sendMessage({ chat_id: userId, text: 'ابتدا /start را بزنید.' });
      return;
    }
    const r = rows[0];
    await api.sendMessage({ chat_id: userId, text: `📊 آمار شما\nنام: ${r.username || r.firstName || 'نامشخص'}\nمرحله: ${r.stage}\nELO: ${r.eloRating}\nطلا: ${r.gold}\nجواهر: ${r.gems}\nقلعه: سطح ${r.castleLevel}\nبلیط نبرد: ${r.hasPremiumPass ? '✅' : '❌'}` });
    return;
  }
}
