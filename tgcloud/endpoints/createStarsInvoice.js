import { api } from 'sdk';

export default async function (params, ctx) {
  const item = params.item || 'gem_pack';
  const title = item === 'gem_pack' ? 'بسته جواهر (50)' : item === 'pass' ? 'بلیط نبرد سلطنتی' : 'باز کردن فوری صندوق';
  const description = item === 'gem_pack' ? '50 جواهر برای تقویت قلعه' : item === 'pass' ? 'دسترسی به بلیط نبرد فصلی' : 'باز کردن فوری صندوق طلایی';
  const amount = item === 'gem_pack' ? 50 : item === 'pass' ? 100 : 10;
  const invoiceLink = await api.createInvoiceLink({
    title,
    description,
    payload: item,
    currency: 'XTR',
    prices: [{ label: title, amount }],
  });
  return { ok: true, url: invoiceLink, item, amount };
}
