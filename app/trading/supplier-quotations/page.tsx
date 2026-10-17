import { redirect } from 'next/navigation';

/** Legacy path → Purchase Requisitions (same ERP form). */
export default function TradingSupplierQuotationsRedirect() {
  redirect('/trading/requisitions');
}
