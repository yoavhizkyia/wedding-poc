import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Contact, Side, Group } from '../types/Contact';
import { loadContacts, saveContacts } from './contactsStorage';
import { markDuplicates, mergeContacts } from '../utils/duplicateDetector';
import { isValidIsraeliMobile, normalizePhone } from '../utils/phoneNormalizer';

interface ContactsContextValue {
  contacts: Contact[];
  loading: boolean;
  addMany: (incoming: Contact[]) => Promise<{ added: number; skipped: number }>;
  update: (id: string, patch: Partial<Contact>) => Promise<void>;
  remove: (id: string) => Promise<void>;
  removeMany: (ids: string[]) => Promise<void>;
  bulkAssign: (ids: string[], patch: { side?: Side; group?: Group }) => Promise<void>;
  mergeIds: (ids: string[]) => Promise<void>;
  reset: () => Promise<void>;
}

const ContactsContext = createContext<ContactsContextValue | undefined>(undefined);

function recomputeFlags(items: Contact[]): Contact[] {
  const withInvalid = items.map((c) => {
    const invalid = !isValidIsraeliMobile(c.phone);
    return c.isInvalid === invalid ? c : { ...c, isInvalid: invalid };
  });
  return markDuplicates(withInvalid);
}

export function ContactsProvider({ children }: { children: React.ReactNode }) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    (async () => {
      const stored = await loadContacts();
      setContacts(recomputeFlags(stored));
      setLoading(false);
    })();
  }, []);

  const persist = useCallback((next: Contact[]) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      saveContacts(next).catch(() => {});
    }, 200);
  }, []);

  const setAll = useCallback(
    (next: Contact[]) => {
      const updated = recomputeFlags(next);
      setContacts(updated);
      persist(updated);
    },
    [persist]
  );

  const addMany = useCallback<ContactsContextValue['addMany']>(
    async (incoming) => {
      let added = 0;
      let skipped = 0;
      const existingPhones = new Set(
        contacts.map((c) => normalizePhone(c.phone)).filter(Boolean)
      );
      const next = [...contacts];
      for (const c of incoming) {
        const key = normalizePhone(c.phone);
        if (key && existingPhones.has(key)) {
          skipped++;
          continue;
        }
        if (key) existingPhones.add(key);
        next.push(c);
        added++;
      }
      setAll(next);
      return { added, skipped };
    },
    [contacts, setAll]
  );

  const update = useCallback<ContactsContextValue['update']>(
    async (id, patch) => {
      const next = contacts.map((c) => (c.id === id ? { ...c, ...patch } : c));
      setAll(next);
    },
    [contacts, setAll]
  );

  const remove = useCallback<ContactsContextValue['remove']>(
    async (id) => {
      setAll(contacts.filter((c) => c.id !== id));
    },
    [contacts, setAll]
  );

  const removeMany = useCallback<ContactsContextValue['removeMany']>(
    async (ids) => {
      const set = new Set(ids);
      setAll(contacts.filter((c) => !set.has(c.id)));
    },
    [contacts, setAll]
  );

  const bulkAssign = useCallback<ContactsContextValue['bulkAssign']>(
    async (ids, patch) => {
      const set = new Set(ids);
      const next = contacts.map((c) =>
        set.has(c.id) ? { ...c, ...patch } : c
      );
      setAll(next);
    },
    [contacts, setAll]
  );

  const mergeIds = useCallback<ContactsContextValue['mergeIds']>(
    async (ids) => {
      if (ids.length < 2) return;
      const set = new Set(ids);
      const toMerge = contacts.filter((c) => set.has(c.id));
      if (toMerge.length < 2) return;
      const merged = mergeContacts(toMerge);
      const others = contacts.filter((c) => !set.has(c.id));
      setAll([...others, merged]);
    },
    [contacts, setAll]
  );

  const reset = useCallback(async () => {
    setAll([]);
  }, [setAll]);

  const value = useMemo<ContactsContextValue>(
    () => ({
      contacts,
      loading,
      addMany,
      update,
      remove,
      removeMany,
      bulkAssign,
      mergeIds,
      reset,
    }),
    [contacts, loading, addMany, update, remove, removeMany, bulkAssign, mergeIds, reset]
  );

  return <ContactsContext.Provider value={value}>{children}</ContactsContext.Provider>;
}

export function useContacts(): ContactsContextValue {
  const ctx = useContext(ContactsContext);
  if (!ctx) throw new Error('useContacts must be used within ContactsProvider');
  return ctx;
}
