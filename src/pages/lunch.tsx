import Head from 'next/head';
import { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Page } from 'modules';
import { Button, FluidContainer, Typography, Panel } from 'components';
import { Colors, Spaces, FontSizes, media } from 'theme';
import {
  FiPlus,
  FiTrash2,
  FiEdit2,
  FiCheck,
  FiX,
  FiChevronDown,
  FiChevronUp,
  FiClock,
} from 'react-icons/fi';

// ── Types ─────────────────────────────────────────────────────────────────────

interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: string;
}

interface CartItem {
  menuItemId: string;
  quantity: number;
  specialInstructions: string;
}

interface Order {
  id: string;
  personName: string;
  items: CartItem[];
}

interface Session {
  name: string;
  cutoffTime: string; // 'HH:MM' or ''
  isOpen: boolean;
}

type SessionStatus = 'open' | 'closing-soon' | 'closed';

// ── Constants ─────────────────────────────────────────────────────────────────

const INITIAL_MENU: MenuItem[] = [
  { id: '1', name: 'Burrito Bowl', price: 9.5, category: 'Entrées' },
  { id: '2', name: 'Tacos (3)', price: 8.75, category: 'Entrées' },
  { id: '3', name: 'Chips & Guac', price: 4.25, category: 'Sides' },
  { id: '4', name: 'Chips & Salsa', price: 2.5, category: 'Sides' },
  { id: '5', name: 'Fountain Drink', price: 2.0, category: 'Drinks' },
  { id: '6', name: 'Water Bottle', price: 1.5, category: 'Drinks' },
];

const INITIAL_SESSION: Session = {
  name: 'Thursday Lunch',
  cutoffTime: '',
  isOpen: true,
};

// ── Helpers ───────────────────────────────────────────────────────────────────

const uid = () => Math.random().toString(36).slice(2, 9);
const fmt = (n: number) => `$${n.toFixed(2)}`;

function getStatus(session: Session): SessionStatus {
  if (!session.isOpen) return 'closed';
  if (!session.cutoffTime) return 'open';
  const [h, m] = session.cutoffTime.split(':').map(Number);
  const cutoff = new Date();
  cutoff.setHours(h, m, 0, 0);
  const diff = cutoff.getTime() - Date.now();
  if (diff <= 0) return 'closed';
  if (diff <= 15 * 60 * 1000) return 'closing-soon';
  return 'open';
}

function orderTotal(order: Order, menu: MenuItem[]): number {
  return order.items.reduce((sum, ci) => {
    const item = menu.find((m) => m.id === ci.menuItemId);
    return sum + (item ? item.price * ci.quantity : 0);
  }, 0);
}

interface TallyRow {
  menuItemId: string;
  name: string;
  category: string;
  totalQty: number;
  totalCost: number;
  orderLines: { personName: string; quantity: number; specialInstructions: string }[];
}

function buildTally(orders: Order[], menu: MenuItem[]): TallyRow[] {
  const map = new Map<string, TallyRow>();
  orders.forEach((order) => {
    order.items.forEach((ci) => {
      const mi = menu.find((m) => m.id === ci.menuItemId);
      if (!mi) return;
      if (!map.has(ci.menuItemId)) {
        map.set(ci.menuItemId, {
          menuItemId: ci.menuItemId,
          name: mi.name,
          category: mi.category,
          totalQty: 0,
          totalCost: 0,
          orderLines: [],
        });
      }
      const row = map.get(ci.menuItemId)!;
      row.totalQty += ci.quantity;
      row.totalCost += mi.price * ci.quantity;
      row.orderLines.push({
        personName: order.personName,
        quantity: ci.quantity,
        specialInstructions: ci.specialInstructions,
      });
    });
  });
  return Array.from(map.values()).sort(
    (a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name),
  );
}

// ── Shared atoms ──────────────────────────────────────────────────────────────

const GoldAccent = styled.div`
  width: 48px;
  height: 3px;
  background-color: ${Colors.primary};
  margin-bottom: ${Spaces.md};
`;

const Kicker = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 12px;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: ${Colors.gold};
  margin-bottom: ${Spaces.sm};
  &::before,
  &::after {
    content: '';
    display: inline-block;
    width: 28px;
    height: 2px;
    background: ${Colors.primary};
  }
`;

const FieldLabel = styled.label`
  display: block;
  font-size: ${FontSizes['2xs']};
  font-weight: 700;
  color: ${Colors.greyDarkest};
  margin-bottom: 5px;
  letter-spacing: 0.04em;
`;

const Field = styled.input`
  width: 100%;
  border: 1px solid ${Colors.greyLighter};
  border-radius: 6px;
  padding: 9px 12px;
  font-size: ${FontSizes.xs};
  font-family: inherit;
  background: ${Colors.white};
  color: ${Colors.black};
  &:focus {
    outline: none;
    border-color: ${Colors.greyDark};
    box-shadow: 0 0 0 3px rgba(0, 0, 0, 0.07);
  }
`;

const FieldSelect = styled.select`
  width: 100%;
  border: 1px solid ${Colors.greyLighter};
  border-radius: 6px;
  padding: 9px 32px 9px 12px;
  font-size: ${FontSizes.xs};
  font-family: inherit;
  background: ${Colors.white}
    url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236e6e6e' stroke-width='2.5'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")
    no-repeat right 12px center;
  appearance: none;
  color: ${Colors.black};
  &:focus {
    outline: none;
    border-color: ${Colors.greyDark};
    box-shadow: 0 0 0 3px rgba(0, 0, 0, 0.07);
  }
`;

const FieldTextarea = styled.textarea`
  width: 100%;
  border: 1px solid ${Colors.greyLighter};
  border-radius: 6px;
  padding: 9px 12px;
  font-size: ${FontSizes['2xs']};
  font-family: inherit;
  background: ${Colors.white};
  color: ${Colors.black};
  resize: vertical;
  line-height: 1.5;
  &:focus {
    outline: none;
    border-color: ${Colors.greyDark};
    box-shadow: 0 0 0 3px rgba(0, 0, 0, 0.07);
  }
`;

const IconBtn = styled.button<{ danger?: boolean }>`
  background: none;
  border: none;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 5px;
  border-radius: 4px;
  color: ${(p) => (p.danger ? Colors.red : Colors.greyDark)};
  flex-shrink: 0;
  &:hover {
    background: ${Colors.greyLightest};
    color: ${(p) => (p.danger ? Colors.red : Colors.black)};
  }
`;

// ── SessionBanner ─────────────────────────────────────────────────────────────

const bannerBg: Record<SessionStatus, string> = {
  open: Colors.primary,
  'closing-soon': Colors.nuestraOrange,
  closed: Colors.greyDarker,
};
const bannerFg: Record<SessionStatus, string> = {
  open: Colors.black,
  'closing-soon': Colors.white,
  closed: Colors.white,
};
const statusLabel: Record<SessionStatus, string> = {
  open: 'Open',
  'closing-soon': 'Closing Soon',
  closed: 'Closed',
};

const BannerOuter = styled.div<{ $status: SessionStatus }>`
  background-color: ${(p) => bannerBg[p.$status]};
  color: ${(p) => bannerFg[p.$status]};
  padding: 14px 72px;
  ${media('desktop')('padding: 14px 36px;')}
  ${media('mobile')('padding: 12px 16px;')}
`;

const BannerInner = styled.div`
  max-width: 1440px;
  margin: 0 auto;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
`;

const StatusPill = styled.span`
  display: inline-block;
  padding: 3px 10px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  background: rgba(0, 0, 0, 0.18);
  color: inherit;
`;

const BannerField = styled.input`
  background: rgba(255, 255, 255, 0.22);
  border: 1px solid rgba(255, 255, 255, 0.55);
  border-radius: 4px;
  padding: 4px 9px;
  font-size: ${FontSizes.sm};
  font-weight: 700;
  font-family: inherit;
  color: inherit;
  &:focus {
    outline: none;
    background: rgba(255, 255, 255, 0.32);
  }
`;

const BannerTimeField = styled(BannerField)`
  width: 130px;
  font-weight: 400;
  font-size: ${FontSizes.xs};
`;

const BannerEditTrigger = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  color: inherit;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-family: inherit;
  font-size: ${FontSizes.sm};
  font-weight: 700;
  padding: 0;
  opacity: 0.9;
  &:hover { opacity: 1; }
`;

const BannerTimeTrigger = styled(BannerEditTrigger)`
  font-size: ${FontSizes.xs};
  font-weight: 400;
  opacity: 0.75;
`;

const BannerIconBtn = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  color: inherit;
  display: inline-flex;
  align-items: center;
  padding: 3px;
  border-radius: 3px;
  opacity: 0.8;
  &:hover { opacity: 1; }
`;

interface SessionBannerProps {
  session: Session;
  status: SessionStatus;
  onChange: (s: Session) => void;
}

function SessionBanner({ session, status, onChange }: SessionBannerProps) {
  const [editName, setEditName] = useState(false);
  const [editCutoff, setEditCutoff] = useState(false);
  const [draftName, setDraftName] = useState(session.name);
  const [draftCutoff, setDraftCutoff] = useState(session.cutoffTime);

  const saveName = () => {
    onChange({ ...session, name: draftName.trim() || session.name });
    setEditName(false);
  };
  const saveCutoff = () => {
    onChange({ ...session, cutoffTime: draftCutoff });
    setEditCutoff(false);
  };
  const toggleOpen = () => onChange({ ...session, isOpen: !session.isOpen });

  return (
    <BannerOuter $status={status} role="banner">
      <BannerInner>
        {editName ? (
          <>
            <BannerField
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') saveName();
                if (e.key === 'Escape') setEditName(false);
              }}
              autoFocus
              aria-label="Session name"
            />
            <BannerIconBtn onClick={saveName} aria-label="Save name">
              <FiCheck size={15} />
            </BannerIconBtn>
            <BannerIconBtn onClick={() => setEditName(false)} aria-label="Cancel">
              <FiX size={15} />
            </BannerIconBtn>
          </>
        ) : (
          <BannerEditTrigger
            onClick={() => { setDraftName(session.name); setEditName(true); }}
            aria-label="Edit session name"
          >
            {session.name}
            <FiEdit2 size={13} style={{ opacity: 0.65 }} />
          </BannerEditTrigger>
        )}

        <StatusPill>{statusLabel[status]}</StatusPill>

        {editCutoff ? (
          <>
            <BannerTimeField
              type="time"
              value={draftCutoff}
              onChange={(e) => setDraftCutoff(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') saveCutoff();
                if (e.key === 'Escape') setEditCutoff(false);
              }}
              autoFocus
              aria-label="Cutoff time"
            />
            <BannerIconBtn onClick={saveCutoff} aria-label="Save cutoff">
              <FiCheck size={15} />
            </BannerIconBtn>
            <BannerIconBtn onClick={() => setEditCutoff(false)} aria-label="Cancel">
              <FiX size={15} />
            </BannerIconBtn>
          </>
        ) : (
          <BannerTimeTrigger
            onClick={() => { setDraftCutoff(session.cutoffTime); setEditCutoff(true); }}
            aria-label="Set cutoff time"
          >
            <FiClock size={13} />
            {session.cutoffTime ? `Cutoff ${session.cutoffTime}` : 'Set cutoff'}
            <FiEdit2 size={11} style={{ opacity: 0.6 }} />
          </BannerTimeTrigger>
        )}

        <div style={{ marginLeft: 'auto' }}>
          <Button
            variant={status === 'closed' ? 'white' : 'black'}
            padding="7px 16px"
            fontSize={FontSizes.xs}
            onClick={toggleOpen}
          >
            {session.isOpen ? 'Close Orders' : 'Reopen Orders'}
          </Button>
        </div>
      </BannerInner>
    </BannerOuter>
  );
}

// ── MenuManager ───────────────────────────────────────────────────────────────

const MenuCollapseBtn = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0;
  margin-bottom: ${Spaces.md};
  &:hover { opacity: 0.75; }
`;

const MenuGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: ${Spaces.md};
`;

const MenuRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 72px 130px 32px 32px;
  gap: 8px;
  align-items: center;
  padding: 9px 12px;
  background: ${Colors.greyLightest};
  border-radius: 8px;
  ${media('tablet')('grid-template-columns: 1fr 64px 110px 32px 32px;')}
  ${media('mobile')('grid-template-columns: 1fr 60px auto 32px 32px; gap: 6px;')}
`;

const MenuEditRow = styled(MenuRow)`
  background: ${Colors.white};
  border: 1px solid ${Colors.greyLighter};
`;

const AddRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 100px 140px auto;
  gap: 10px;
  align-items: flex-end;
  padding: ${Spaces.md};
  border: 1px dashed ${Colors.greyLighter};
  border-radius: 8px;
  ${media('mobile')(
    'grid-template-columns: 1fr 1fr; & > :last-child { grid-column: 1 / -1; }',
  )}
`;

interface MenuManagerProps {
  menu: MenuItem[];
  onAdd: (item: Omit<MenuItem, 'id'>) => void;
  onUpdate: (item: MenuItem) => void;
  onDelete: (id: string) => void;
}

function MenuManager({ menu, onAdd, onUpdate, onDelete }: MenuManagerProps) {
  const [open, setOpen] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Partial<MenuItem>>({});
  const [newItem, setNewItem] = useState({ name: '', price: '', category: '' });

  const startEdit = (item: MenuItem) => {
    setEditingId(item.id);
    setDraft({ ...item });
  };
  const saveEdit = () => {
    if (!draft.id || !draft.name?.trim() || draft.price == null) return;
    onUpdate({ id: draft.id, name: draft.name.trim(), price: Number(draft.price), category: draft.category || '' });
    setEditingId(null);
  };
  const handleAdd = () => {
    if (!newItem.name.trim() || !newItem.price) return;
    onAdd({ name: newItem.name.trim(), price: Number(newItem.price), category: newItem.category.trim() });
    setNewItem({ name: '', price: '', category: '' });
  };

  const categories = Array.from(new Set(menu.map((m) => m.category).filter(Boolean)));

  return (
    <section aria-label="Menu management">
      <MenuCollapseBtn onClick={() => setOpen((v) => !v)} aria-expanded={open}>
        <GoldAccent style={{ margin: 0, flexShrink: 0 }} />
        <Typography variant="labelTitle" as="span">Menu</Typography>
        {open ? <FiChevronUp size={15} /> : <FiChevronDown size={15} />}
      </MenuCollapseBtn>

      {open && (
        <>
          <datalist id="cat-suggestions">
            {categories.map((c) => <option key={c} value={c} />)}
          </datalist>

          {menu.length === 0 && (
            <Typography variant="copy" color="greyDark" margin={`0 0 ${Spaces.md}`}>
              No menu items yet — add one below.
            </Typography>
          )}

          <MenuGrid>
            {menu.map((item) =>
              editingId === item.id ? (
                <MenuEditRow key={item.id}>
                  <Field
                    value={draft.name ?? ''}
                    onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
                    placeholder="Item name"
                    aria-label="Item name"
                  />
                  <Field
                    type="number"
                    min="0"
                    step="0.01"
                    value={draft.price ?? ''}
                    onChange={(e) => setDraft((d) => ({ ...d, price: Number(e.target.value) }))}
                    placeholder="Price"
                    aria-label="Price"
                  />
                  <Field
                    list="cat-suggestions"
                    value={draft.category ?? ''}
                    onChange={(e) => setDraft((d) => ({ ...d, category: e.target.value }))}
                    placeholder="Category"
                    aria-label="Category"
                  />
                  <IconBtn onClick={saveEdit} aria-label="Save changes">
                    <FiCheck size={15} style={{ color: Colors.blue }} />
                  </IconBtn>
                  <IconBtn onClick={() => setEditingId(null)} aria-label="Cancel edit">
                    <FiX size={15} />
                  </IconBtn>
                </MenuEditRow>
              ) : (
                <MenuRow key={item.id}>
                  <Typography variant="span" weight="600">{item.name}</Typography>
                  <Typography variant="span" color="greyDark">{fmt(item.price)}</Typography>
                  <Typography variant="span" color="greyDark" nowrap>{item.category}</Typography>
                  <IconBtn onClick={() => startEdit(item)} aria-label={`Edit ${item.name}`}>
                    <FiEdit2 size={14} style={{ color: Colors.blue }} />
                  </IconBtn>
                  <IconBtn danger onClick={() => onDelete(item.id)} aria-label={`Delete ${item.name}`}>
                    <FiTrash2 size={14} />
                  </IconBtn>
                </MenuRow>
              ),
            )}
          </MenuGrid>

          <AddRow>
            <div>
              <FieldLabel htmlFor="new-name">Item name</FieldLabel>
              <Field
                id="new-name"
                value={newItem.name}
                onChange={(e) => setNewItem((d) => ({ ...d, name: e.target.value }))}
                placeholder="e.g. Burrito Bowl"
                onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); }}
              />
            </div>
            <div>
              <FieldLabel htmlFor="new-price">Price ($)</FieldLabel>
              <Field
                id="new-price"
                type="number"
                min="0"
                step="0.01"
                value={newItem.price}
                onChange={(e) => setNewItem((d) => ({ ...d, price: e.target.value }))}
                placeholder="0.00"
              />
            </div>
            <div>
              <FieldLabel htmlFor="new-cat">Category</FieldLabel>
              <Field
                id="new-cat"
                list="cat-suggestions"
                value={newItem.category}
                onChange={(e) => setNewItem((d) => ({ ...d, category: e.target.value }))}
                placeholder="e.g. Entrées"
              />
            </div>
            <Button variant="black" padding="10px 18px" fontSize={FontSizes.xs} onClick={handleAdd}>
              <FiPlus size={13} style={{ verticalAlign: 'middle', marginRight: 4 }} />
              Add
            </Button>
          </AddRow>
        </>
      )}
    </section>
  );
}

// ── OrderForm ─────────────────────────────────────────────────────────────────

const CartRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 72px 32px;
  gap: 8px;
  align-items: flex-start;
  padding: ${Spaces.md};
  background: ${Colors.greyLightest};
  border-radius: 8px;
`;

const CartNotesSpan = styled.div`
  grid-column: 1 / -1;
`;

const ConfirmBanner = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  background: ${Colors.primary};
  border-radius: 8px;
  padding: 12px 16px;
  margin-top: ${Spaces.md};
`;

const emptyCartItem = (): CartItem => ({ menuItemId: '', quantity: 1, specialInstructions: '' });

interface OrderFormProps {
  menu: MenuItem[];
  isOpen: boolean;
  onSubmit: (order: Omit<Order, 'id'>) => void;
}

function OrderForm({ menu, isOpen, onSubmit }: OrderFormProps) {
  const [personName, setPersonName] = useState('');
  const [cart, setCart] = useState<CartItem[]>([emptyCartItem()]);
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState('');

  const update = (i: number, patch: Partial<CartItem>) =>
    setCart((prev) => prev.map((ci, idx) => (idx === i ? { ...ci, ...patch } : ci)));

  const remove = (i: number) =>
    setCart((prev) => prev.filter((_, idx) => idx !== i));

  const handleSubmit = () => {
    if (!personName.trim()) { setError('Please enter your name.'); return; }
    const valid = cart.filter((ci) => ci.menuItemId);
    if (!valid.length) { setError('Please select at least one item.'); return; }
    setError('');
    onSubmit({ personName: personName.trim(), items: valid });
    setPersonName('');
    setCart([emptyCartItem()]);
    setConfirmed(true);
    setTimeout(() => setConfirmed(false), 4000);
  };

  if (!isOpen) {
    return (
      <Panel topBorder backgroundColor="greyLightest">
        <Typography variant="labelTitle" color="greyDark">
          Orders are closed. The live tally is still visible below.
        </Typography>
      </Panel>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: Spaces.md }}>
        <FieldLabel htmlFor="order-name">Your name</FieldLabel>
        <Field
          id="order-name"
          value={personName}
          onChange={(e) => { setPersonName(e.target.value); setError(''); }}
          placeholder="e.g. David"
          style={{ maxWidth: 300 }}
        />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: Spaces.md }}>
        {cart.map((ci, i) => (
          <CartRow key={i}>
            <div>
              <FieldLabel htmlFor={`cart-item-${i}`}>Item</FieldLabel>
              <FieldSelect
                id={`cart-item-${i}`}
                value={ci.menuItemId}
                onChange={(e) => update(i, { menuItemId: e.target.value })}
              >
                <option value="">— select —</option>
                {menu.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} — {fmt(m.price)}
                  </option>
                ))}
              </FieldSelect>
            </div>
            <div>
              <FieldLabel htmlFor={`cart-qty-${i}`}>Qty</FieldLabel>
              <Field
                id={`cart-qty-${i}`}
                type="number"
                min="1"
                value={ci.quantity}
                onChange={(e) => update(i, { quantity: Math.max(1, Number(e.target.value)) })}
              />
            </div>
            <IconBtn
              danger
              style={{ marginTop: 22 }}
              onClick={() => remove(i)}
              aria-label="Remove item"
              disabled={cart.length === 1}
            >
              <FiTrash2 size={15} />
            </IconBtn>
            <CartNotesSpan>
              <FieldLabel htmlFor={`cart-notes-${i}`}>
                Special instructions{' '}
                <span style={{ fontWeight: 400, opacity: 0.55 }}>(optional)</span>
              </FieldLabel>
              <FieldTextarea
                id={`cart-notes-${i}`}
                value={ci.specialInstructions}
                onChange={(e) => update(i, { specialInstructions: e.target.value })}
                placeholder="e.g. no sour cream, extra guac"
                rows={2}
              />
            </CartNotesSpan>
          </CartRow>
        ))}
      </div>

      <Button
        variant="outline"
        padding="9px 16px"
        fontSize={FontSizes.xs}
        onClick={() => setCart((p) => [...p, emptyCartItem()])}
        margin={`0 ${Spaces.md} 0 0`}
      >
        <FiPlus size={13} style={{ verticalAlign: 'middle', marginRight: 4 }} />
        Add another item
      </Button>

      {error && (
        <Typography variant="copy" color="red" margin={`${Spaces.sm} 0 0`}>
          {error}
        </Typography>
      )}

      <div style={{ marginTop: Spaces.md }}>
        <Button onClick={handleSubmit}>Submit Order</Button>
      </div>

      {confirmed && (
        <ConfirmBanner role="alert" aria-live="polite">
          <FiCheck size={17} />
          <Typography variant="cta" as="span">
            Order submitted! Check the tally below.
          </Typography>
        </ConfirmBanner>
      )}
    </div>
  );
}

// ── LiveTally ─────────────────────────────────────────────────────────────────

const CategoryLabel = styled.span`
  display: inline-block;
  background: ${Colors.primary};
  color: ${Colors.black};
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  padding: 2px 9px;
  border-radius: 999px;
  margin: ${Spaces.md} 0 ${Spaces.sm};
`;

const TallyItem = styled.div`
  border-bottom: 1px solid ${Colors.greyLighter};
  &:last-child {
    border-bottom: none;
  }
`;

const TallyBtn = styled.button`
  display: grid;
  grid-template-columns: 1fr auto auto auto;
  gap: ${Spaces.md};
  align-items: center;
  width: 100%;
  background: none;
  border: none;
  cursor: pointer;
  padding: 11px 0;
  text-align: left;
  border-radius: 4px;
  &:hover {
    background: ${Colors.greyLightest};
    padding-left: 6px;
    padding-right: 6px;
  }
`;

const TallyExpanded = styled.div`
  padding: 4px 0 12px ${Spaces.lg};
  display: flex;
  flex-direction: column;
  gap: 5px;
`;

const PersonTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: ${FontSizes.xs};
  th,
  td {
    text-align: left;
    padding: 9px ${Spaces.md};
    border-bottom: 1px solid ${Colors.greyLighter};
    vertical-align: top;
  }
  th {
    font-weight: 700;
    font-size: 11px;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    background: ${Colors.greyLightest};
    color: ${Colors.greyDarkest};
  }
  tr:last-child td {
    border-bottom: none;
  }
`;

const GrandTotalBar = styled.div`
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: ${Spaces.md};
  padding: ${Spaces.md} 0;
  border-top: 2px solid ${Colors.greyDarkest};
  margin-top: ${Spaces.md};
`;

interface LiveTallyProps {
  orders: Order[];
  menu: MenuItem[];
}

function LiveTally({ orders, menu }: LiveTallyProps) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const tally = buildTally(orders, menu);
  const grandTotal = orders.reduce((s, o) => s + orderTotal(o, menu), 0);
  const categories = Array.from(new Set(tally.map((t) => t.category)));

  const toggle = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  if (orders.length === 0) {
    return (
      <Typography variant="copy" color="greyDark">
        No orders yet — be the first to submit.
      </Typography>
    );
  }

  const personMap = orders.reduce((acc, order) => {
    if (!acc.has(order.personName)) acc.set(order.personName, []);
    acc.get(order.personName)!.push(order);
    return acc;
  }, new Map<string, Order[]>());

  return (
    <>
      <Panel topBorder>
        {categories.map((cat) => (
          <div key={cat}>
            <CategoryLabel>{cat || 'Other'}</CategoryLabel>
            {tally
              .filter((t) => t.category === cat)
              .map((t) => (
                <TallyItem key={t.menuItemId}>
                  <TallyBtn
                    onClick={() => toggle(t.menuItemId)}
                    aria-expanded={expanded.has(t.menuItemId)}
                    aria-label={`${t.name}, ${t.totalQty} ordered, ${fmt(t.totalCost)}`}
                  >
                    <Typography variant="labelTitle" as="span">{t.name}</Typography>
                    <Typography variant="span" color="greyDark" as="span">
                      ×{t.totalQty}
                    </Typography>
                    <Typography variant="span" weight="700" as="span">
                      {fmt(t.totalCost)}
                    </Typography>
                    {expanded.has(t.menuItemId) ? (
                      <FiChevronUp size={14} />
                    ) : (
                      <FiChevronDown size={14} />
                    )}
                  </TallyBtn>
                  {expanded.has(t.menuItemId) && (
                    <TallyExpanded>
                      {t.orderLines.map((line, i) => (
                        <Typography key={i} variant="copy" as="p" size="xs" margin="0">
                          <strong>{line.personName}</strong> ×{line.quantity}
                          {line.specialInstructions && (
                            <em style={{ color: Colors.greyDark }}>
                              {' '}
                              — {line.specialInstructions}
                            </em>
                          )}
                        </Typography>
                      ))}
                    </TallyExpanded>
                  )}
                </TallyItem>
              ))}
          </div>
        ))}
      </Panel>

      <Typography variant="labelTitle" as="h3" margin={`${Spaces.lg} 0 ${Spaces.sm}`}>
        Per-Person Breakdown
      </Typography>
      <PersonTable>
        <thead>
          <tr>
            <th>Name</th>
            <th>Items</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          {Array.from(personMap).map(([name, personOrders]) => {
            const total = personOrders.reduce((s, o) => s + orderTotal(o, menu), 0);
            const lines = personOrders
              .flatMap((o) =>
                o.items.map((ci) => {
                  const mi = menu.find((m) => m.id === ci.menuItemId);
                  return mi ? `${mi.name} ×${ci.quantity}` : null;
                }),
              )
              .filter(Boolean)
              .join(', ');
            return (
              <tr key={name}>
                <td>
                  <strong>{name}</strong>
                </td>
                <td>{lines}</td>
                <td>
                  <strong>{fmt(total)}</strong>
                </td>
              </tr>
            );
          })}
        </tbody>
      </PersonTable>

      <GrandTotalBar>
        <Typography variant="labelTitle" as="span">Grand Total</Typography>
        <Typography variant="title" as="span" size="2xl">
          {fmt(grandTotal)}
        </Typography>
      </GrandTotalBar>
    </>
  );
}

// ── Layout ────────────────────────────────────────────────────────────────────

const TwoCol = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${Spaces['2xl']};
  ${media('desktop')('grid-template-columns: 1fr;')}
`;

const SectionDivider = styled.hr`
  border: none;
  border-top: 1px solid ${Colors.greyLighter};
  margin: ${Spaces['2xl']} 0;
`;

// ── Page ──────────────────────────────────────────────────────────────────────

export default function LunchPage() {
  const [session, setSession] = useState<Session>(INITIAL_SESSION);
  const [menu, setMenu] = useState<MenuItem[]>(INITIAL_MENU);
  const [orders, setOrders] = useState<Order[]>([]);

  const status = getStatus(session);

  // Auto-close when cutoff passes
  useEffect(() => {
    if (!session.cutoffTime || !session.isOpen) return;
    const id = setInterval(() => {
      if (getStatus(session) === 'closed') {
        setSession((s) => ({ ...s, isOpen: false }));
      }
    }, 30_000);
    return () => clearInterval(id);
  }, [session.cutoffTime, session.isOpen]);

  const addMenuItem = (item: Omit<MenuItem, 'id'>) =>
    setMenu((prev) => [...prev, { ...item, id: uid() }]);

  const updateMenuItem = (item: MenuItem) =>
    setMenu((prev) => prev.map((m) => (m.id === item.id ? item : m)));

  const deleteMenuItem = (id: string) =>
    setMenu((prev) => prev.filter((m) => m.id !== id));

  const submitOrder = (order: Omit<Order, 'id'>) =>
    setOrders((prev) => [...prev, { ...order, id: uid() }]);

  return (
    <Page>
      <Head>
        <title>Lunch Orders — U-SU</title>
        <meta name="description" content="Place your lunch order for a shared group pickup run." />
        <meta name="robots" content="noindex" />
      </Head>

      <SessionBanner session={session} status={status} onChange={setSession} />

      <FluidContainer backgroundColor="white">
        <MenuManager
          menu={menu}
          onAdd={addMenuItem}
          onUpdate={updateMenuItem}
          onDelete={deleteMenuItem}
        />

        <SectionDivider />

        <TwoCol>
          <section aria-label="Place your order">
            <Kicker>Place Your Order</Kicker>
            <Typography as="h2" variant="titleSmall" margin={`0 0 ${Spaces.lg}`}>
              What are you getting?
            </Typography>
            <OrderForm menu={menu} isOpen={status !== 'closed'} onSubmit={submitOrder} />
          </section>

          <section aria-label="Live order tally">
            <Kicker>Live Tally</Kicker>
            <Typography as="h2" variant="titleSmall" margin={`0 0 ${Spaces.lg}`}>
              {orders.length} order{orders.length !== 1 ? 's' : ''} so far
            </Typography>
            <LiveTally orders={orders} menu={menu} />
          </section>
        </TwoCol>
      </FluidContainer>
    </Page>
  );
}
