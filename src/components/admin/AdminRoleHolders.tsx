import { useCallback, useEffect, useState } from "react";
import { tbl, ProfileRow } from "@/integrations/supabase/revamp";
import { ShieldCheck, PenSquare, RefreshCw, ChevronDown, UserRound } from "lucide-react";

type Role = "admin" | "contributor";

interface Holder {
  user_id: string;
  role: Role;
  granted_at: string;
  profile: ProfileRow | null;
}

const ROLE_META: Record<Role, { label: string; plural: string; icon: typeof ShieldCheck; note: string }> = {
  admin: {
    label: "Admin",
    plural: "Admins",
    icon: ShieldCheck,
    note: "Full control — users, pricing, payments, database.",
  },
  contributor: {
    label: "Contributor",
    plural: "Contributors",
    icon: PenSquare,
    note: "Can add and edit subject content.",
  },
};

/**
 * Everyone who holds a role, at a glance.
 *
 * The user search beside this answers "what does this person have?" — it cannot
 * answer "who has admin?", which is the question that actually matters for
 * security and previously meant a trip to the SQL editor.
 *
 * `auth.users` is not reachable from the browser, so emails come from
 * `profiles`. A role row whose profile is missing is still listed, by id: an
 * admin we cannot name is exactly the row worth seeing.
 */
export default function AdminRoleHolders({ onSelect }: { onSelect?: (p: ProfileRow) => void }) {
  const [holders, setHolders] = useState<Holder[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data: roles, error } = await tbl("user_roles")
        .select("user_id, role, created_at")
        .in("role", ["admin", "contributor"])
        .order("created_at", { ascending: true });
      if (error) throw error;

      const rows = (roles ?? []) as { user_id: string; role: Role; created_at: string }[];
      const ids = [...new Set(rows.map((r) => r.user_id))];

      // No FK between user_roles and profiles (both point at auth.users), so
      // PostgREST can't embed them — fetch the profiles separately.
      let byId = new Map<string, ProfileRow>();
      if (ids.length) {
        // select("*") deliberately. A hand-listed column set silently drops
        // whatever is added to ProfileRow later — is_test was missing here,
        // so an admin picked from this roster reached the panel below with the
        // flag undefined and its toggle appeared not to stick.
        const { data: profs } = await tbl("profiles")
          .select("*")
          .in("id", ids);
        byId = new Map(((profs ?? []) as ProfileRow[]).map((p) => [p.id, p]));
      }

      setHolders(rows.map((r) => ({
        user_id: r.user_id,
        role: r.role,
        granted_at: r.created_at,
        profile: byId.get(r.user_id) ?? null,
      })));
    } catch (e) {
      console.error("[AdminRoleHolders] failed to load:", e);
      setHolders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const admins = holders.filter((h) => h.role === "admin");
  const contributors = holders.filter((h) => h.role === "contributor");

  const nameOf = (h: Holder) =>
    h.profile?.full_name || h.profile?.username || h.profile?.email?.split("@")[0] || "Unknown user";

  const group = (role: Role, list: Holder[]) => {
    const meta = ROLE_META[role];
    return (
      <div key={role} className="space-y-2">
        <div className="flex items-baseline gap-2 px-1">
          <p className="text-[11px] font-bold tracking-[0.18em] uppercase text-zinc-500 flex items-center gap-1.5">
            <meta.icon className="w-3.5 h-3.5 td-accent-text" /> {meta.plural}
            <span className="td-surface-2 rounded-full px-1.5 py-0.5 text-[10px] text-zinc-300">{list.length}</span>
          </p>
          <span className="text-[11px] text-zinc-600 truncate">{meta.note}</span>
        </div>

        {list.length === 0 ? (
          <div className="td-surface rounded-2xl p-4 text-center text-zinc-600 text-xs">
            No {meta.plural.toLowerCase()}.
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-2">
            {list.map((h) => {
              const clickable = !!h.profile && !!onSelect;
              return (
                <button
                  key={`${h.user_id}:${h.role}`}
                  onClick={() => h.profile && onSelect?.(h.profile)}
                  disabled={!clickable}
                  title={clickable ? "Open in the panel below" : "No profile row for this user"}
                  className={`td-surface rounded-2xl p-3 flex items-center gap-3 text-left transition-colors ${
                    clickable ? "hover:border-white/20" : "opacity-70 cursor-default"
                  }`}
                >
                  <span className="w-9 h-9 rounded-full td-surface-2 flex items-center justify-center shrink-0">
                    <UserRound className="w-4 h-4 text-zinc-400" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-white text-[13px] font-semibold truncate">{nameOf(h)}</span>
                    <span className="block text-zinc-600 text-[11px] truncate">
                      {h.profile?.email ?? h.user_id}
                    </span>
                  </span>
                  <span className="text-[10px] text-zinc-600 shrink-0 text-right leading-tight">
                    since<br />
                    {new Date(h.granted_at).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "2-digit" })}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="td-surface rounded-3xl overflow-hidden">
      <button onClick={() => setOpen((o) => !o)} className="w-full flex items-center gap-3 px-4 sm:px-5 py-3.5 text-left">
        <span className="w-9 h-9 rounded-xl td-accent-bg flex items-center justify-center shrink-0">
          <ShieldCheck className="w-4 h-4" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-white text-sm font-bold">Who has control</span>
          <span className="block text-zinc-500 text-[11.5px]">
            {loading ? "Loading…" : `${admins.length} admin${admins.length === 1 ? "" : "s"} · ${contributors.length} contributor${contributors.length === 1 ? "" : "s"}`}
          </span>
        </span>
        <span
          role="button"
          tabIndex={0}
          onClick={(e) => { e.stopPropagation(); load(); }}
          onKeyDown={(e) => { if (e.key === "Enter") { e.stopPropagation(); load(); } }}
          className="td-btn-ghost px-3 py-1.5 rounded-full text-[11px] font-semibold inline-flex items-center gap-1.5 shrink-0"
        >
          <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} /> Refresh
        </span>
        <ChevronDown className={`w-4 h-4 text-zinc-500 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      <div className={`grid transition-[grid-template-rows] duration-300 ease-out ${open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
        <div className="overflow-hidden">
          <div className="px-4 sm:px-5 pb-5 pt-1 border-t border-white/5 space-y-5">
            {loading && holders.length === 0 ? (
              <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-2">
                {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-[60px] rounded-2xl td-surface-2 animate-pulse" />)}
              </div>
            ) : (
              <>
                {group("admin", admins)}
                {group("contributor", contributors)}
                <p className="text-[11px] text-zinc-600">
                  Roles are granted and revoked in the panel below. Every change is written to the Audit Log.
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
