import { ChevronDown, ChevronRight, Home, Plus, Pencil } from 'lucide-react';
import QuoteItemCard from './QuoteItemCard';
import type { QuoteItem } from '../pages/DesignerQuoteGenerator';

interface QuoteRoomSectionProps {
  name: string;
  items: { item: QuoteItem; index: number }[];
  subtotal: number;
  expanded: boolean;
  formatCurrency: (amount: number) => string;
  onToggle: () => void;
  onAddItem: () => void;
  onRename: () => void;
  onEditItem: (index: number) => void;
  onDuplicateItem: (index: number) => void;
  onDeleteItem: (index: number) => void;
}

const QuoteRoomSection = ({ name, items, subtotal, expanded, formatCurrency, onToggle, onAddItem, onRename, onEditItem, onDuplicateItem, onDeleteItem }: QuoteRoomSectionProps) => (
  <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
    <button type="button" onClick={onToggle} className="flex w-full items-center gap-3 px-4 py-4 text-left transition hover:bg-gray-50 sm:px-5">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-50 text-primary-700"><Home className="h-4 w-4" /></span>
      <span className="min-w-0 flex-1"><span className="block truncate font-semibold text-secondary-800">{name}</span><span className="text-xs text-gray-500">{items.length} item{items.length === 1 ? '' : 's'}</span></span>
      <span className="hidden text-right sm:block"><span className="block text-[11px] uppercase tracking-wide text-gray-400">Room subtotal</span><span className="font-semibold text-secondary-800">{formatCurrency(subtotal)}</span></span>
      <span className="text-gray-500">{expanded ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}</span>
    </button>
    {expanded && <div className="border-t border-gray-100 px-3 pb-3 pt-3 sm:px-5 sm:pb-5">
      <div className="mb-3 flex items-center justify-between sm:hidden"><span className="text-xs text-gray-500">Room subtotal</span><strong className="text-sm text-secondary-800">{formatCurrency(subtotal)}</strong></div>
      <div className="space-y-2">{items.map(({ item, index }) => <QuoteItemCard key={item.id ?? `item-${index}`} item={item} index={index} formatCurrency={formatCurrency} onEdit={() => onEditItem(index)} onDuplicate={() => onDuplicateItem(index)} onDelete={() => onDeleteItem(index)} />)}</div>
      <div className="mt-3 flex gap-2">
        <button type="button" onClick={onAddItem} className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-dashed border-primary-300 px-3 py-3 text-sm font-semibold text-primary-700 transition hover:bg-primary-50"><Plus className="h-4 w-4" /> Add Item</button>
        <button type="button" onClick={onRename} className="rounded-xl border border-gray-200 px-3 text-gray-600 transition hover:bg-gray-50" title="Rename room" aria-label="Rename room"><Pencil className="h-4 w-4" /></button>
      </div>
    </div>}
  </section>
);

export default QuoteRoomSection;
