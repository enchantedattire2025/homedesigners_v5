import { Eye, Save, Send, X } from 'lucide-react';

interface QuoteSummaryPanelProps {
  subtotal: number;
  discount: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  saving: boolean;
  formatCurrency: (amount: number) => string;
  onDiscountChange: (value: number) => void;
  onPreview: () => void;
  onSave: () => void;
  onSend: () => void;
  onClose?: () => void;
  mobile?: boolean;
}

const QuoteSummaryPanel = ({ subtotal, discount, taxRate, taxAmount, total, saving, formatCurrency, onDiscountChange, onPreview, onSave, onSend, onClose, mobile = false }: QuoteSummaryPanelProps) => (
  <div className={mobile ? 'rounded-t-3xl bg-white p-5 shadow-2xl' : 'rounded-2xl border border-gray-200 bg-white p-5 shadow-sm'}>
    {mobile && <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-gray-300" />}
    <div className="mb-5 flex items-center justify-between"><h2 className="text-lg font-semibold text-secondary-800">Quote Summary</h2>{onClose && <button type="button" onClick={onClose} className="rounded-lg p-2 text-gray-500 hover:bg-gray-100" aria-label="Close summary"><X className="h-5 w-5" /></button>}</div>
    <div className="space-y-4 text-sm">
      <div className="flex justify-between text-gray-600"><span>Subtotal</span><strong className="text-secondary-800">{formatCurrency(subtotal)}</strong></div>
      <label className="flex items-center justify-between gap-4 text-gray-600"><span>Discount</span><input type="number" min="0" step="0.01" value={discount || ''} onChange={event => onDiscountChange(parseFloat(event.target.value) || 0)} placeholder="₹ 0" className="w-28 rounded-lg border border-gray-300 px-3 py-2 text-right text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100" /></label>
      <div className="flex justify-between text-gray-600"><span>Tax ({taxRate}%)</span><strong className="text-secondary-800">{formatCurrency(taxAmount)}</strong></div>
      <div className="border-t border-gray-200 pt-4"><div className="flex justify-between text-base font-bold"><span className="text-secondary-800">Total</span><span className="text-primary-700">{formatCurrency(total)}</span></div></div>
    </div>
    <div className="mt-6 space-y-2">
      <button type="button" onClick={onSave} disabled={saving} className="flex w-full items-center justify-center gap-2 rounded-xl bg-gray-100 px-4 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-200 disabled:opacity-50"><Save className="h-4 w-4" /> {saving ? 'Saving…' : 'Save Draft'}</button>
      <button type="button" onClick={onPreview} className="flex w-full items-center justify-center gap-2 rounded-xl border border-primary-600 px-4 py-3 text-sm font-semibold text-primary-700 transition hover:bg-primary-50"><Eye className="h-4 w-4" /> Preview Quotation</button>
      <button type="button" onClick={onSend} disabled={saving} className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-primary-700 disabled:opacity-50"><Send className="h-4 w-4" /> {saving ? 'Sending…' : 'Send to Customer'}</button>
    </div>
  </div>
);

export default QuoteSummaryPanel;
