// WhatsApp number normalization + share-message helpers for sales documents.

export function normalizeWhatsAppNumber(raw: string): string {
  if (!raw) return '';
  let digits = String(raw).replace(/[^0-9]/g, '');
  if (digits.startsWith('00')) digits = digits.slice(2);
  // Pakistani local mobile 03XXXXXXXXX -> 923XXXXXXXXX
  if (digits.startsWith('0') && digits.length >= 10) digits = `92${digits.slice(1)}`;
  return digits;
}

export function isValidWhatsAppNumber(digits: string): boolean {
  return /^[1-9]\d{6,14}$/.test(digits);
}

export function buildSalesOrderWhatsAppMessage(options: {
  customerName: string;
  number: string;
  grandTotalLabel: string;
  companyName: string;
}): string {
  const { customerName, number, grandTotalLabel, companyName } = options;
  return (
    `Dear ${customerName}, your Sales Order ${number} has been prepared. ` +
    `Order Total: ${grandTotalLabel}. Please find your Sales Order document attached. ` +
    `Thank you for choosing ${companyName}.`
  );
}
