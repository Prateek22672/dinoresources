import { toast } from "sonner";
import { invokeFn } from "@/integrations/supabase/revamp";

export interface IndexResult {
  id: string;
  title: string;
  status: "ok" | "no_text" | "failed" | "unsupported";
  pages?: number;
  chunks?: number;
  error?: string;
}

/**
 * Hand a freshly added material to the indexer so Rex can read it. Runs in
 * the background after the upload succeeds; the outcome is a toast, because
 * the commonest failure (Drive file not shared publicly) is one only the
 * contributor can fix, and right now is when they can fix it.
 */
export async function indexMaterial(resourceId: string): Promise<void> {
  const { data, error } = await invokeFn<{ results: IndexResult[] }>("ingest-material", { resource_id: resourceId });
  const r = data?.results?.[0];
  if (error || !r) {
    // the function may not be deployed yet — the upload itself still worked
    console.warn("[materialIndex] indexing skipped:", error);
    return;
  }
  if (r.status === "ok") toast.success(`Rex can now read “${r.title}” (${r.pages} pages)`);
  else toast.warning(`Rex can't read “${r.title}”: ${r.error ?? r.status}`, { duration: 9000 });
}
