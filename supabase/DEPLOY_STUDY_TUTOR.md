# 🚀 Deploy — Study-With-AI tutor ("Rex")

The UI ships with the frontend build, but it stays inert until these two steps
are done. **Order matters** — the function calls the new RPC, so the SQL has to
exist first.

---

> ## ⛔ Do NOT run `supabase db push`
>
> The remote `schema_migrations` table only has ~9 of the 56 local migrations
> recorded, even though they have all clearly been applied (their tables are
> live). `db push` would therefore try to **replay 36 old migrations**,
> including `..._data_migration_seed.sql` and `..._notices_helpbot_cleanup.sql`.
>
> Use the SQL Editor, exactly as `DEPLOY_LATEST.md` already instructs.

---

## ✅ Step 1 — Run the SQL

Supabase dashboard → **SQL Editor** → **+ New query** → paste the whole of
`supabase/migrations/20260822120000_study_ai_tutor.sql` → **Run**.

It creates:

| Object | What it does |
| ------ | ------------ |
| `idx_subject_qa_fts` | GIN full-text index over every question + answer |
| `search_subject_qa()` | Ranked retrieval. Withholds `answer_md` for anything the caller hasn't unlocked — same rule as `get_subject_qa` |
| `study_attempts` | Quiz / recall history (RLS: own rows only) |
| `study_mastery()` | Per-unit accuracy for the calling user |
| flag `studyai` | Admin → Features toggle for the whole tutor |

Idempotent — safe to re-run.

---

## ✅ Step 2 — Deploy the edge function

```bash
npx supabase functions deploy study-buddy
```

It reuses the existing Groq key pool (`_shared/groq.ts`), so **no new secret is
required**. Two optional ones:

```bash
# a dedicated key, tried before the shared pool (recommended — quizzes are
# token-heavy and shouldn't starve DinoBot)
npx supabase secrets set GROQ_API_KEY_STUDY=gsk_...

# a bigger model just for the tutor, without touching the rest of the site
npx supabase secrets set GROQ_MODEL_STUDY=openai/gpt-oss-120b
```

---

## Checking it worked

1. Open any unit of an unlocked subject → **Study With AI** tab.
2. The Rex card sits above the question list, and a floating **Ask Rex** pill
   sits bottom-right.
3. Ask something the unit covers — the reply should be badged
   **From your notes** with tappable source chips.
4. Ask something it doesn't (e.g. "what's a Kubernetes pod?") — the reply should
   be badged **Beyond your syllabus**.

If step 1 was skipped, the tutor answers everything as *Beyond your syllabus*
(retrieval returns nothing). That is the tell.

## Turning it off

Admin → Features → toggle **AI Tutor**. The card, the pill and the panel all
disappear; the rest of Study-With-AI is untouched. This is the instant kill
switch — no redeploy, no SQL.

---

## Full rollback

Nothing here modifies existing tables, so removing it is clean. Only run this
if you want the feature gone entirely — it deletes students' drill history.

```sql
DROP FUNCTION IF EXISTS public.study_mastery(uuid);
DROP FUNCTION IF EXISTS public.search_subject_qa(uuid, text, integer, integer);
DROP TABLE IF EXISTS public.study_attempts;          -- drill/recall history
DROP INDEX IF EXISTS public.idx_subject_qa_fts;      -- index only, no data
DELETE FROM public.feature_flags WHERE key = 'studyai';
```

`subject_qa`, `unit_topics`, `subjects` and every existing policy are untouched
by both the install and this rollback.
