# Auth email templates

Supabase stores these in the dashboard, not in the repo, so they drift silently
and nobody can review a change. The versions here are the source of truth —
edit the file, then paste it in.

| File | Paste into |
| ---- | ---------- |
| `reset-password.html` | Authentication → Emails → Templates → **Reset password** |
| `confirm-signup.html` | Authentication → Emails → Templates → **Confirm sign up** |

Both use only `{{ .ConfirmationURL }}`. Other variables Supabase offers:
`{{ .Token }}`, `{{ .TokenHash }}`, `{{ .SiteURL }}`, `{{ .Email }}`,
`{{ .RedirectTo }}`.

## Why these look nothing like the app's components

Email HTML is roughly 2005-era CSS. The rules followed here:

* **Tables for layout.** Flexbox and grid are unreliable in Outlook.
* **Every style inlined.** Gmail strips `<style>` blocks in several contexts,
  which would leave an unstyled wall of text.
* **No CSS variables, no web fonts.** Neither survives; the palette is
  hard-coded to the same hexes the app derives from `--td-accent`.
* **A visible plain-text URL under every button.** Some clients and corporate
  gateways strip or rewrite buttons — that link is the path that always works.
* **A preheader** — the grey preview line in the inbox list. Without one,
  clients scrape whatever text comes first, which looks broken.

Border radius degrades to square corners in Outlook desktop. That is fine and
deliberate; working around it needs VML, which costs more than it returns.

## Palette

Matches the app's default violet accent (`--td-accent: #7c6cf0`).

| Role | Hex |
| ---- | --- |
| Page background | `#0e0e11` |
| Card | `#1a1a1e` |
| Card border / rules | `#2b2b31` |
| Heading text | `#ffffff` |
| Body text | `#a1a1aa` |
| Muted / footer | `#71717a`, `#5b5b63` |
| Accent (button, links, eyebrow) | `#7c6cf0`, `#a9a0f5` |

If the app's accent is ever rebranded, these hexes need changing by hand — the
templates cannot read the site's CSS.

## Before you save

Send yourself one of each and check **Gmail on a phone** and **Outlook on
desktop**. Those two disagree the most; anything that survives both is safe.
