/**
 * Assumption-based sales-order agent (English + Roman Urdu).
 * No LLM key — slot-filling conversation for create sales order.
 */

export type AgentLang = 'en' | 'ur';

export type AgentStep =
  | 'idle'
  | 'ask_customer'
  | 'pick_customer'
  | 'ask_product'
  | 'pick_product'
  | 'ask_qty'
  | 'ask_add_more'
  | 'confirm'
  | 'creating'
  | 'done';

export type AgentCustomer = {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
};

export type AgentProduct = {
  id: string;
  name: string;
  sku?: string;
  unitPrice?: number;
  sellingPrice?: number;
};

export type AgentLine = {
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
};

export type SalesFlowSession = {
  lang: AgentLang;
  step: AgentStep;
  intent: 'sales_order' | null;
  customer: AgentCustomer | null;
  customerCandidates: AgentCustomer[];
  productCandidates: AgentProduct[];
  pendingProduct: AgentProduct | null;
  pendingProductQuery: string;
  lines: AgentLine[];
  lastOrderNumber?: string | null;
};

export type SalesFlowDeps = {
  searchCustomers: (q: string) => Promise<AgentCustomer[]>;
  searchProducts: (q: string) => Promise<AgentProduct[]>;
  createSalesOrder: (payload: {
    customer: AgentCustomer;
    lines: AgentLine[];
  }) => Promise<{ orderNumber?: string; id?: string }>;
};

export type SalesFlowResult = {
  reply: string;
  session: SalesFlowSession;
  suggestions?: string[];
};

export function emptySalesSession(lang: AgentLang = 'en'): SalesFlowSession {
  return {
    lang,
    step: 'idle',
    intent: null,
    customer: null,
    customerCandidates: [],
    productCandidates: [],
    pendingProduct: null,
    pendingProductQuery: '',
    lines: [],
    lastOrderNumber: null,
  };
}

const URDU_HINTS =
  /\b(kya|kesa|kaisa|kaise|hai|ho|bhai|yar|yaar|karo|kar|banao|bana|do|haan|han|ji|nahi|nahin|bas|theek|sahi|kitna|kitne|kitni|salam|assalam|walaikum|customer|product|saman|order|qty|quantity|pcs)\b/i;

export function detectLang(text: string, prev?: AgentLang): AgentLang {
  if (URDU_HINTS.test(text)) return 'ur';
  return prev || 'en';
}

function t(lang: AgentLang, en: string, ur: string) {
  return lang === 'ur' ? ur : en;
}

function normalize(text: string) {
  return String(text || '')
    .trim()
    .replace(/\s+/g, ' ');
}

function isYes(text: string) {
  return /^(yes|y|yeah|yep|ok|okay|sure|haan|han|ji|bilkul|theek|sahi|haanji|hanji|aur\s*add|add\s*karo|continue)\b/i.test(
    text.trim()
  ) || /^(haan|han|ji|yes)\s*[!.]*$/i.test(text.trim());
}

function isNo(text: string) {
  return /^(no|n|nope|nah|nahi|nahin|bas|bas\s*karo|enough|done|complete|khatam|nahi\s*bhai)\b/i.test(
    text.trim()
  ) || /^(nahi|no|bas)\s*[!.]*$/i.test(text.trim());
}

function isCancel(text: string) {
  return /^(cancel|abort|stop|band|band\s*karo|cancel\s*karo|reset|clear)\b/i.test(text.trim());
}

function isConfirmCreate(text: string) {
  return /^(confirm|create|save|bana\s*do|banao|create\s*karo|order\s*bana\s*do|haan\s*bana\s*do|yes\s*create|go\s*ahead)\b/i.test(
    text.trim()
  );
}

function wantsSalesOrder(text: string) {
  const s = text.toLowerCase();
  return (
    /sales?\s*order/.test(s) ||
    /sale\s*order/.test(s) ||
    /create\s+(a\s+)?(sales?\s+)?order/.test(s) ||
    /new\s+(sales?\s+)?order/.test(s) ||
    /order\s*(banao|bana|create|karo)/.test(s) ||
    /order\s*create/.test(s) ||
    /so\s*banao/.test(s) ||
    /naya\s*order/.test(s) ||
    /sales?\s*order\s*(banao|bana|create)/.test(s)
  );
}

function isGreeting(text: string) {
  return /^(hi|hello|hey|salam|assalam|assalamualaikum|salaam|kesa\s*hu|kesa\s*ho|kaisa\s*ho|kaise\s*ho|kesay\s*ho|what'?s\s*up)\b/i.test(
    text.trim()
  );
}

/** Try extract customer name from free text */
export function extractCustomerHint(text: string): string | null {
  const patterns = [
    /(?:for|customer|client)\s+(?:is\s+)?([A-Za-z][\w.\s'-]{1,40}?)(?:\s+(?:of|product|item|qty|quantity|\d)|$)/i,
    /(?:customer|client)\s*[:=]\s*([A-Za-z][\w.\s'-]{1,40})/i,
    /([A-Za-z][\w.\s'-]{1,30}?)\s+(?:ke\s+liye|kay\s+liye|keliye|ko)\b/i,
    /(?:customer|client)\s+([A-Za-z][\w.\s'-]{1,40})/i,
  ];
  for (const re of patterns) {
    const m = text.match(re);
    if (m?.[1]) {
      const name = m[1].trim().replace(/[.,;:!]+$/, '');
      if (name.length >= 2 && !/^(order|sales|sale|product|item|qty)$/i.test(name)) {
        return name;
      }
    }
  }
  return null;
}

/** Try extract product name from free text */
export function extractProductHint(text: string): string | null {
  const patterns = [
    /(?:product|item|saman)\s*[:=]?\s*([A-Za-z0-9][\w.\s-]{1,40}?)(?:\s+(?:qty|quantity|kitne|x|\d)|$)/i,
    /(?:of|product|item)\s+([A-Za-z0-9][\w.\s-]{1,40}?)\s+(\d+)/i,
    /(\d+)\s*(?:pcs|kg|g|ltr|liter|piece|pieces|units?)?\s+(?:of\s+)?([A-Za-z0-9][\w.\s-]{1,40})/i,
    /([A-Za-z0-9][\w.\s-]{2,40}?)\s+(\d+)\s*(?:pcs|kg|g|ltr|piece|pieces|units?)?\b/i,
  ];
  for (const re of patterns) {
    const m = text.match(re);
    if (!m) continue;
    // groups vary
    const candidate = (m[2] && /[A-Za-z]/.test(m[2]) ? m[2] : m[1])?.trim();
    if (
      candidate &&
      candidate.length >= 2 &&
      !/^(for|customer|order|sales|sale|qty|quantity|kitne)$/i.test(candidate)
    ) {
      return candidate.replace(/[.,;:!]+$/, '');
    }
  }
  return null;
}

export function extractQuantity(text: string): number | null {
  const patterns = [
    /(?:qty|quantity|kitne|kitna|qnty)\s*[:=]?\s*(\d+(?:\.\d+)?)/i,
    /(\d+(?:\.\d+)?)\s*(?:pcs|kg|g|ltr|liter|piece|pieces|units?)\b/i,
    /\bx\s*(\d+(?:\.\d+)?)\b/i,
    /^(\d+(?:\.\d+)?)$/,
  ];
  for (const re of patterns) {
    const m = text.match(re);
    if (m?.[1]) {
      const n = Number(m[1]);
      if (Number.isFinite(n) && n > 0) return n;
    }
  }
  // "rice 10" style — last number if looks like qty
  const nums = [...text.matchAll(/\b(\d+(?:\.\d+)?)\b/g)].map((m) => Number(m[1]));
  if (nums.length === 1 && nums[0] > 0 && nums[0] < 100000) return nums[0];
  return null;
}

function formatLines(lines: AgentLine[], lang: AgentLang) {
  if (!lines.length) return t(lang, '(no items yet)', '(abhi koi item nahi)');
  return lines
    .map(
      (l, i) =>
        `${i + 1}. ${l.productName} × ${l.quantity}${
          l.unitPrice ? ` @ ${l.unitPrice}` : ''
        }`
    )
    .join('\n');
}

function summary(session: SalesFlowSession) {
  const lang = session.lang;
  const cust = session.customer?.name || '—';
  return t(
    lang,
    `**Sales order draft**\n• Customer: **${cust}**\n• Items:\n${formatLines(session.lines, lang)}\n\nCreate this order? (yes / confirm)`,
    `**Sales order draft**\n• Customer: **${cust}**\n• Items:\n${formatLines(session.lines, lang)}\n\nOrder create karun? (haan / confirm)`
  );
}

function pickByIndexOrName<T extends { name: string }>(
  text: string,
  list: T[]
): T | null {
  const n = text.trim();
  const asNum = Number(n);
  if (Number.isInteger(asNum) && asNum >= 1 && asNum <= list.length) {
    return list[asNum - 1];
  }
  const lower = n.toLowerCase();
  const exact = list.find((x) => x.name.toLowerCase() === lower);
  if (exact) return exact;
  const partial = list.filter((x) => x.name.toLowerCase().includes(lower));
  if (partial.length === 1) return partial[0];
  return null;
}

function listOptions(items: { name: string; sku?: string }[], lang: AgentLang) {
  const lines = items
    .slice(0, 8)
    .map((c, i) => `${i + 1}. ${c.name}${c.sku ? ` (${c.sku})` : ''}`)
    .join('\n');
  return (
    lines +
    '\n\n' +
    t(
      lang,
      'Reply with the **number** or the exact name.',
      'Number ya exact name likh do.'
    )
  );
}

async function resolveCustomer(
  query: string,
  deps: SalesFlowDeps,
  session: SalesFlowSession
): Promise<SalesFlowResult> {
  const lang = session.lang;
  const q = query.trim();
  if (!q) {
    return {
      reply: t(
        lang,
        'Which **customer** is this sales order for?',
        'Ye sales order kis **customer** ke liye hai? Name batao.'
      ),
      session: { ...session, step: 'ask_customer' },
      suggestions: lang === 'ur' ? ['Cancel'] : ['Cancel'],
    };
  }

  const found = await deps.searchCustomers(q);
  if (!found.length) {
    return {
      reply: t(
        lang,
        `No customer found for "**${q}**". Try another name, or create the customer in Sales first.`,
        `"**${q}**" se koi customer nahi mila. Dusra naam try karo, ya pehle Sales mein customer banao.`
      ),
      session: { ...session, step: 'ask_customer', customerCandidates: [] },
    };
  }

  if (found.length === 1) {
    const next: SalesFlowSession = {
      ...session,
      customer: found[0],
      customerCandidates: [],
      step: 'ask_product',
    };
    if (session.pendingProductQuery) {
      const q = session.pendingProductQuery;
      return resolveProduct(q, deps, { ...next, pendingProductQuery: '' });
    }
    if (session.lines.length) {
      return {
        reply:
          t(
            lang,
            `Got it — customer **${found[0].name}**.`,
            `Theek hai — customer **${found[0].name}**.`
          ) +
          '\n\n' +
          summary({ ...next, step: 'confirm' }),
        session: { ...next, step: 'confirm' },
        suggestions:
          lang === 'ur' ? ['Haan bana do', 'Aur add karo', 'Cancel'] : ['Confirm', 'Add more', 'Cancel'],
      };
    }
    return {
      reply: t(
        lang,
        `Customer set: **${found[0].name}**. Which **product** should I add?`,
        `Customer set: **${found[0].name}**. Kaunsa **product** add karun?`
      ),
      session: next,
      suggestions: lang === 'ur' ? ['Cancel'] : ['Cancel'],
    };
  }

  return {
    reply:
      t(
        lang,
        `I found multiple customers for "**${q}**":`,
        `"**${q}**" ke kai customers mile:`
      ) +
      '\n' +
      listOptions(found, lang),
    session: {
      ...session,
      step: 'pick_customer',
      customerCandidates: found.slice(0, 8),
    },
  };
}

async function resolveProduct(
  query: string,
  deps: SalesFlowDeps,
  session: SalesFlowSession
): Promise<SalesFlowResult> {
  const lang = session.lang;
  const q = query.trim();
  if (!q) {
    return {
      reply: t(
        lang,
        'Which **product** do you want to add?',
        'Kaunsa **product** add karna hai? Name batao.'
      ),
      session: { ...session, step: 'ask_product' },
    };
  }

  const qtyInQuery = extractQuantity(q);
  // Strip trailing qty words for search
  const searchQ = q
    .replace(/(?:qty|quantity|kitne|kitna)\s*[:=]?\s*\d+(?:\.\d+)?/gi, '')
    .replace(/\b\d+(?:\.\d+)?\s*(?:pcs|kg|g|ltr|piece|pieces|units?)?\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim() || q;

  const found = await deps.searchProducts(searchQ);
  if (!found.length) {
    return {
      reply: t(
        lang,
        `No product found for "**${searchQ}**". Try another name or SKU.`,
        `"**${searchQ}**" se koi product nahi mila. Dusra name/SKU try karo.`
      ),
      session: { ...session, step: 'ask_product', productCandidates: [] },
    };
  }

  if (found.length === 1) {
    const product = found[0];
    if (qtyInQuery && qtyInQuery > 0) {
      return addLine(session, product, qtyInQuery, deps);
    }
    return {
      reply: t(
        lang,
        `Product: **${product.name}**. How many (**quantity**)?`,
        `Product: **${product.name}**. **Kitne** chahiye? (quantity)`
      ),
      session: {
        ...session,
        pendingProduct: product,
        productCandidates: [],
        pendingProductQuery: '',
        step: 'ask_qty',
      },
      suggestions: lang === 'ur' ? ['1', '5', '10', 'Cancel'] : ['1', '5', '10', 'Cancel'],
    };
  }

  return {
    reply:
      t(
        lang,
        `Multiple products match "**${searchQ}**":`,
        `"**${searchQ}**" se kai products mile:`
      ) +
      '\n' +
      listOptions(found, lang),
    session: {
      ...session,
      step: 'pick_product',
      productCandidates: found.slice(0, 8),
      pendingProductQuery: searchQ,
    },
  };
}

async function addLine(
  session: SalesFlowSession,
  product: AgentProduct,
  qty: number,
  _deps: SalesFlowDeps
): Promise<SalesFlowResult> {
  const lang = session.lang;
  const unitPrice = Number(product.unitPrice ?? product.sellingPrice ?? 0) || 0;
  const line: AgentLine = {
    productId: product.id,
    productName: product.name,
    sku: product.sku || '',
    quantity: qty,
    unitPrice,
  };
  const lines = [...session.lines, line];
  const next: SalesFlowSession = {
    ...session,
    lines,
    pendingProduct: null,
    productCandidates: [],
    pendingProductQuery: '',
    step: 'ask_add_more',
  };

  return {
    reply: t(
      lang,
      `Added **${product.name} × ${qty}**.\n\nCurrent items:\n${formatLines(lines, lang)}\n\nDo you want to **add more** products? (yes / no)`,
      `**${product.name} × ${qty}** add ho gaya.\n\nAbhi items:\n${formatLines(lines, lang)}\n\n**Aur product** add karun? (haan / nahi)`
    ),
    session: next,
    suggestions:
      lang === 'ur'
        ? ['Haan aur add karo', 'Nahi, confirm karo', 'Cancel']
        : ['Yes, add more', 'No, confirm', 'Cancel'],
  };
}

/**
 * Main turn handler for sales-order guided flow.
 * Returns null if message is not part of sales flow (caller can use FAQ).
 */
export async function handleSalesFlowTurn(
  rawMessage: string,
  prevSession: SalesFlowSession | null | undefined,
  deps: SalesFlowDeps
): Promise<SalesFlowResult | null> {
  const text = normalize(rawMessage);
  if (!text) return null;

  let session = prevSession ? { ...prevSession } : emptySalesSession();
  session.lang = detectLang(text, session.lang);

  // Cancel anytime
  if (isCancel(text) && session.intent === 'sales_order') {
    return {
      reply: t(
        session.lang,
        'Okay — sales order draft cancelled. Say **create sales order** anytime to start again.',
        'Theek hai — sales order draft cancel. Dobara shuru ke liye **sales order banao** likh dena.'
      ),
      session: emptySalesSession(session.lang),
      suggestions:
        session.lang === 'ur'
          ? ['Sales order banao', 'Kesa hu bhai']
          : ['Create sales order', 'Hello'],
    };
  }

  // Greeting when idle
  if (session.step === 'idle' && !session.intent && isGreeting(text)) {
    return {
      reply: t(
        session.lang,
        "Hey! I'm good — ready to help. Want to **create a sales order**? Tell me the customer and product, or just say **create sales order**.",
        "Bhai theek hun! Sales mein madad kar sakta hun. **Sales order banao** bolo — customer aur product ke sath, ya pehle order start karo."
      ),
      session: { ...session, lang: detectLang(text, session.lang) },
      suggestions:
        session.lang === 'ur'
          ? ['Sales order banao', 'Ali ke liye order banao']
          : ['Create sales order', 'Order for Ali'],
    };
  }

  const inFlow =
    session.intent === 'sales_order' &&
    session.step !== 'idle' &&
    session.step !== 'done';
  const starting = wantsSalesOrder(text);

  if (!inFlow && !starting) {
    return null; // not our flow
  }

  // Start a fresh sales-order flow (do not restart mid-conversation)
  if (!inFlow && starting) {
    session = {
      ...emptySalesSession(session.lang),
      lang: session.lang,
      intent: 'sales_order',
    };
    const customerHint = extractCustomerHint(text);
    const productHint = extractProductHint(text);
    const qtyHint = extractQuantity(text);

    if (customerHint) {
      if (productHint && qtyHint) {
        session.pendingProductQuery = `${productHint} ${qtyHint}`;
      } else if (productHint) {
        session.pendingProductQuery = productHint;
      }
      return resolveCustomer(customerHint, deps, { ...session, step: 'ask_customer' });
    }

    if (productHint) {
      session.pendingProductQuery = qtyHint ? `${productHint} ${qtyHint}` : productHint;
    }

    return {
      reply: t(
        session.lang,
        "Let's create a **sales order**. Which **customer**?",
        "Chalo **sales order** banate hain. Kis **customer** ke liye?"
      ),
      session: { ...session, step: 'ask_customer' },
      suggestions: session.lang === 'ur' ? ['Cancel'] : ['Cancel'],
    };
  }

  // Active steps
  switch (session.step) {
    case 'ask_customer': {
      return resolveCustomer(text, deps, session);
    }
    case 'pick_customer': {
      const picked = pickByIndexOrName(text, session.customerCandidates);
      if (!picked) {
        return {
          reply:
            t(
              session.lang,
              'Please pick a customer by **number** or name from the list:',
              'List se **number** ya name se customer choose karo:'
            ) +
            '\n' +
            listOptions(session.customerCandidates, session.lang),
          session,
        };
      }
      session.customer = picked;
      session.customerCandidates = [];
      if (session.pendingProductQuery) {
        const q = session.pendingProductQuery;
        session.pendingProductQuery = '';
        return resolveProduct(q, deps, { ...session, step: 'ask_product' });
      }
      return {
        reply: t(
          session.lang,
          `Customer: **${picked.name}**. Which **product**?`,
          `Customer: **${picked.name}**. Kaunsa **product**?`
        ),
        session: { ...session, step: 'ask_product' },
      };
    }
    case 'ask_product': {
      return resolveProduct(text, deps, session);
    }
    case 'pick_product': {
      const picked = pickByIndexOrName(text, session.productCandidates);
      if (!picked) {
        // maybe they typed a fresh product name
        if (!/^\d+$/.test(text)) {
          return resolveProduct(text, deps, session);
        }
        return {
          reply:
            t(
              session.lang,
              'Pick a product by **number** or name:',
              'Product **number** ya name se choose karo:'
            ) +
            '\n' +
            listOptions(session.productCandidates, session.lang),
          session,
        };
      }
      const qty = extractQuantity(text);
      if (qty) return addLine(session, picked, qty, deps);
      return {
        reply: t(
          session.lang,
          `Product: **${picked.name}**. Quantity?`,
          `Product: **${picked.name}**. Quantity (kitne)?`
        ),
        session: {
          ...session,
          pendingProduct: picked,
          productCandidates: [],
          step: 'ask_qty',
        },
        suggestions: ['1', '5', '10', 'Cancel'],
      };
    }
    case 'ask_qty': {
      const qty = extractQuantity(text);
      if (!qty || !session.pendingProduct) {
        return {
          reply: t(
            session.lang,
            'Please send a valid **quantity** (e.g. 5 or 10 pcs).',
            'Sahi **quantity** likho (jaise 5 ya 10 pcs).'
          ),
          session,
          suggestions: ['1', '5', '10'],
        };
      }
      return addLine(session, session.pendingProduct, qty, deps);
    }
    case 'ask_add_more': {
      if (isYes(text) || /add\s*more|aur|another|naya\s*product/i.test(text)) {
        return {
          reply: t(
            session.lang,
            'Okay — which **product** next?',
            'Theek — agla **product** kaunsa?'
          ),
          session: { ...session, step: 'ask_product' },
        };
      }
      if (isNo(text) || isConfirmCreate(text) || /confirm|bas|khatam|create/i.test(text)) {
        if (!session.customer) {
          return {
            reply: t(
              session.lang,
              'Still need the **customer** name before I create the order.',
              'Order se pehle **customer** ka naam chahiye.'
            ),
            session: { ...session, step: 'ask_customer' },
          };
        }
        if (!session.lines.length) {
          return {
            reply: t(
              session.lang,
              'Add at least one **product** first.',
              'Pehle kam az kam ek **product** add karo.'
            ),
            session: { ...session, step: 'ask_product' },
          };
        }
        return {
          reply: summary(session),
          session: { ...session, step: 'confirm' },
          suggestions:
            session.lang === 'ur'
              ? ['Haan bana do', 'Aur add karo', 'Cancel']
              : ['Confirm create', 'Add more', 'Cancel'],
        };
      }
      // treat as new product
      return resolveProduct(text, deps, { ...session, step: 'ask_product' });
    }
    case 'confirm': {
      if (isYes(text) || isConfirmCreate(text)) {
        if (!session.customer || !session.lines.length) {
          return {
            reply: t(session.lang, 'Draft incomplete.', 'Draft incomplete hai.'),
            session: emptySalesSession(session.lang),
          };
        }
        try {
          const created = await deps.createSalesOrder({
            customer: session.customer,
            lines: session.lines,
          });
          const num = created.orderNumber || created.id || '';
          return {
            reply: t(
              session.lang,
              `Done! Sales order **${num}** created for **${session.customer.name}**.\n\nItems:\n${formatLines(session.lines, session.lang)}\n\nOpen it under **Sales → Orders**.`,
              `Ho gaya! Sales order **${num}** create ho gaya — customer **${session.customer.name}**.\n\nItems:\n${formatLines(session.lines, session.lang)}\n\n**Sales → Orders** mein dekh lo.`
            ),
            session: {
              ...emptySalesSession(session.lang),
              step: 'done',
              lastOrderNumber: num,
            },
            suggestions:
              session.lang === 'ur'
                ? ['Naya sales order banao', 'Kesa hu']
                : ['Create another sales order', 'Hello'],
          };
        } catch (err: any) {
          return {
            reply: t(
              session.lang,
              `Could not create the order: ${err?.message || 'unknown error'}. You can fix details and say **confirm** again, or **cancel**.`,
              `Order create nahi hua: ${err?.message || 'error'}. Details theek karke phir **confirm** bolo, ya **cancel**.`
            ),
            session: { ...session, step: 'confirm' },
            suggestions:
              session.lang === 'ur' ? ['Confirm', 'Cancel'] : ['Confirm', 'Cancel'],
          };
        }
      }
      if (isYes(text) === false && (isNo(text) || /add\s*more|aur/i.test(text))) {
        return {
          reply: t(
            session.lang,
            'No problem — which product should I add?',
            'Theek — kaunsa product add karun?'
          ),
          session: { ...session, step: 'ask_product' },
        };
      }
      return {
        reply: summary(session),
        session,
        suggestions:
          session.lang === 'ur'
            ? ['Haan bana do', 'Aur add karo', 'Cancel']
            : ['Confirm create', 'Add more', 'Cancel'],
      };
    }
    default:
      return null;
  }
}
