import { api, db } from 'sdk';
import { eq } from 'sdk/db';
import { players, pvp_raids } from '../schema.js';

export default async function (params, ctx) {
  const user = ctx.initData.user || { id: 0 };
  const attackerId = user.id;
  const defenderId = params.defenderId;
  const attackerName = params.attackerName || 'ناشناس';
  // Record raid
  await db.insert(pvp_raids).values({ attackerId, defenderId, attackerWon: params.attackerWon ? 1 : 0, goldStolen: params.goldStolen || 0, eloDelta: params.eloDelta || 0 }).run();
  // Send instant revenge notification to defender
  await api.sendMessage({
    chat_id: defenderId,
    text: `⚠️ دژ شما توسط ${attackerName} غارت شد!\n⚔️ حمله انتقامی راه‌اندازی شود؟`,
    reply_markup: {
      inline_keyboard: [
        [{ text: '⚔️ حمله انتقامی', web_app: { url: 'https://t.me/immortal_bastion_bot/immortal' }, callback_data: 'revenge_raid' }],
      ],
    },
  });
  return { ok: true, notified: defenderId };
}
