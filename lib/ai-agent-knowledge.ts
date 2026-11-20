export type AiChatMessage = {
  role: 'user' | 'assistant' | 'system';
  content: string;
};

type KnowledgeHit = {
  keywords: string[];
  answerEn: string;
  answerUr: string;
};

const URDU_HINTS =
  /\b(kya|kesa|kaisa|kaise|hai|ho|bhai|karo|banao|haan|nahi|kitne|salam|order|customer|product)\b/i;

const KNOWLEDGE: KnowledgeHit[] = [
  {
    keywords: ['invoice', 'sale invoice', 'create invoice', 'billing', 'bill'],
    answerEn:
      'To create a sales invoice: **Sales → Invoices → Create Invoice**. Or ask me: **create sales order** first, then invoice from the order after delivery.',
    answerUr:
      'Sales invoice: **Sales → Invoices → Create Invoice**. Pehle order chahiye ho to mujhe bolo **sales order banao**.',
  },
  {
    keywords: ['sales agent', 'commission', 'slab', 'salesperson'],
    answerEn:
      'Sales Agents: **Settings → Sales Agents** (slabs + toggles). Agent master: **Sales → Salespersons**.',
    answerUr:
      'Sales agents settings: **Settings → Sales Agents**. Agents list: **Sales → Salespersons**.',
  },
  {
    keywords: ['pos', 'checkout', 'cashier'],
    answerEn: 'Open **POS**, start a shift, add items, then Checkout.',
    answerUr: '**POS** kholo, shift start karo, items add karke Checkout.',
  },
  {
    keywords: ['stock', 'inventory', 'warehouse', 'product'],
    answerEn: 'Stock & products: **Warehouse** module. Units: **Settings → Units**.',
    answerUr: 'Stock/products **Warehouse** mein hain. Units: **Settings → Units**.',
  },
  {
    keywords: ['payment', 'receive'],
    answerEn: 'Customer payments: **Sales → Payments**.',
    answerUr: 'Customer payment: **Sales → Payments**.',
  },
  {
    keywords: ['hello', 'hi', 'hey', 'salam', 'kesa', 'kaise', 'help'],
    answerEn:
      "Hi! I'm **Bison Assistant**. I can guide the ERP, and I can **create a sales order** with you step-by-step (customer → product → qty → add more?). Try: **create sales order** or Roman Urdu: **sales order banao**.",
    answerUr:
      "Salam bhai! Main **Bison Assistant** hun. ERP guide + **sales order** step-by-step bana sakta hun (customer → product → qty → aur add?). Bolo: **sales order banao**.",
  },
];

function scoreHit(text: string, hit: KnowledgeHit): number {
  let score = 0;
  for (const kw of hit.keywords) {
    if (text.includes(kw)) score += kw.split(' ').length;
  }
  return score;
}

/** Local ERP helper — English + Roman Urdu, no API key. */
export function localAssistantReply(userText: string): string {
  const raw = String(userText || '').trim();
  const text = raw.toLowerCase();
  const ur = URDU_HINTS.test(raw);

  if (!text) {
    return ur
      ? 'Bolo — sales order banaun, ya kisi module ke bare mein poochho.'
      : 'Ask me to **create a sales order**, or about any ERP module.';
  }

  let best: KnowledgeHit | null = null;
  let bestScore = 0;
  for (const hit of KNOWLEDGE) {
    const s = scoreHit(text, hit);
    if (s > bestScore) {
      bestScore = s;
      best = hit;
    }
  }

  if (best && bestScore > 0) return ur ? best.answerUr : best.answerEn;

  return ur
    ? [
        'Samajh gaya nahi bilkul — lekin ye try karo:',
        '',
        '• **sales order banao** — main customer/product/qty poochunga',
        '• **Ali ke liye order banao** — customer pehle set',
        '• Invoice / stock / POS ke bare mein poochho',
      ].join('\n')
    : [
        "I didn't catch a specific screen — try:",
        '',
        '• **create sales order** — I will ask customer, product, quantity',
        '• **order for Ali** — start with a customer',
        '• Ask about invoice, stock, POS, or settings',
      ].join('\n');
}

export const AI_QUICK_PROMPTS = [
  'Create sales order',
  'Sales order banao',
  'Kesa hu bhai',
  'How do I create an invoice?',
];
