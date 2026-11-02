import { api } from 'sdk';

export default async function (update) {
  const query = update.pre_checkout_query || {};
  if (query.id) {
    await api.answerPreCheckoutQuery({ pre_checkout_query_id: query.id, ok: true });
  }
}
