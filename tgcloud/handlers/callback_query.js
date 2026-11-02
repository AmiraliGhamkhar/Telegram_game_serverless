import { api } from 'sdk';

export default async function (update) {
  const query = update.callback_query || {};
  if (!query.id) return;
  const data = query.data || '';
  if (data === 'revenge_raid') {
    await api.answerCallbackQuery({ callback_query_id: query.id, text: '⚔️ حمله انتقامی آغاز شد!' });
  } else {
    await api.answerCallbackQuery({ callback_query_id: query.id, text: '✅ انجام شد' });
  }
}
