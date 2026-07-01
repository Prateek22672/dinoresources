import {
  createContext, useContext, useEffect, useState, useCallback, ReactNode,
} from "react";
import { supabase } from "@/integrations/supabase/client";
import { tbl, CartItemType } from "@/integrations/supabase/revamp";
import { toast } from "sonner";

export interface EnrichedCartItem {
  id: string;            // cart_items.id
  item_type: CartItemType;
  target_id: string;     // subject_id or year_id
  label: string;
  price_paise: number;
}

interface CartContextValue {
  items: EnrichedCartItem[];
  count: number;
  totalPaise: number;
  loading: boolean;
  isInCart: (type: CartItemType, targetId: string) => boolean;
  addSubject: (subjectId: string, label?: string) => Promise<void>;
  addCombo: (yearId: string, label?: string) => Promise<void>;
  remove: (cartItemId: string) => Promise<void>;
  clear: () => Promise<void>;
  refresh: () => Promise<void>;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<EnrichedCartItem[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setItems([]); return; }

      const { data: rows } = await tbl("cart_items")
        .select("id, item_type, subject_id, year_id")
        .eq("user_id", user.id);
      const cart = (rows ?? []) as any[];
      if (cart.length === 0) { setItems([]); return; }

      const subjectIds = cart.filter((c) => c.subject_id).map((c) => c.subject_id);
      const yearIds = cart.filter((c) => c.year_id).map((c) => c.year_id);

      const [subjRes, yearRes] = await Promise.all([
        subjectIds.length
          ? tbl("subjects").select("id, name, price_paise").in("id", subjectIds)
          : Promise.resolve({ data: [] }),
        yearIds.length
          ? tbl("years").select("id, name, combo_price_paise").in("id", yearIds)
          : Promise.resolve({ data: [] }),
      ]);
      const subjMap = new Map<string, any>((subjRes.data ?? []).map((s: any) => [s.id, s]));
      const yearMap = new Map<string, any>((yearRes.data ?? []).map((y: any) => [y.id, y]));

      const enriched: EnrichedCartItem[] = cart.map((c) => {
        if (c.item_type === "subject") {
          const s = subjMap.get(c.subject_id);
          return {
            id: c.id, item_type: "subject", target_id: c.subject_id,
            label: s?.name ?? "Subject", price_paise: s?.price_paise ?? 0,
          };
        }
        const y = yearMap.get(c.year_id);
        return {
          id: c.id, item_type: "combo", target_id: c.year_id,
          label: y ? `${y.name} — Full Access` : "Year Combo",
          price_paise: y?.combo_price_paise ?? 0,
        };
      });
      setItems(enriched);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    // IMPORTANT: never call other supabase methods (e.g. auth.getUser) directly
    // inside this callback — it holds the auth lock and deadlocks every other
    // supabase call. Defer with setTimeout(0) so refresh() runs after the lock
    // is released.
    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      setTimeout(() => { refresh(); }, 0);
    });
    return () => sub.subscription.unsubscribe();
  }, [refresh]);

  const isInCart = useCallback(
    (type: CartItemType, targetId: string) =>
      items.some((i) => i.item_type === type && i.target_id === targetId),
    [items],
  );

  const addSubject = useCallback(async (subjectId: string, label?: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { toast.error("Please log in first."); return; }
    if (isInCart("subject", subjectId)) { toast.info("Already in cart"); return; }
    const { error } = await tbl("cart_items")
      .insert({ user_id: user.id, item_type: "subject", subject_id: subjectId });
    if (error && !/duplicate/i.test(error.message)) { toast.error("Could not add to cart"); return; }
    toast.success(`${label ?? "Subject"} added to cart`);
    await refresh();
  }, [isInCart, refresh]);

  const addCombo = useCallback(async (yearId: string, label?: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { toast.error("Please log in first."); return; }
    if (isInCart("combo", yearId)) { toast.info("Already in cart"); return; }
    const { error } = await tbl("cart_items")
      .insert({ user_id: user.id, item_type: "combo", year_id: yearId });
    if (error && !/duplicate/i.test(error.message)) { toast.error("Could not add to cart"); return; }
    toast.success(`${label ?? "Year combo"} added to cart`);
    await refresh();
  }, [isInCart, refresh]);

  const remove = useCallback(async (cartItemId: string) => {
    setItems((prev) => prev.filter((i) => i.id !== cartItemId)); // optimistic
    await tbl("cart_items").delete().eq("id", cartItemId);
    await refresh();
  }, [refresh]);

  const clear = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setItems([]);
    await tbl("cart_items").delete().eq("user_id", user.id);
  }, []);

  const totalPaise = items.reduce((sum, i) => sum + i.price_paise, 0);

  return (
    <CartContext.Provider value={{
      items, count: items.length, totalPaise, loading,
      isInCart, addSubject, addCombo, remove, clear, refresh,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
