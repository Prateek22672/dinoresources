/**
 * Page-level SEO: titles, descriptions, indexing rules and structured data
 * per route, applied by <SEO /> in App.tsx. The FAQ copy lives here (not in
 * the pages) because it is published twice — on the page, and as FAQPage
 * JSON-LD — and the two must say exactly the same thing.
 */

export interface RouteMeta { title: string; desc: string; noindex?: boolean }

export const SITE = "https://teamdino.in";

export const HOME_FAQ = [
  { q: "Is TeamDino free?", a: "The calculators (SGPA, CGPA predictor, attendance) are 100% free with no login. Subject packs — notes, important questions, PYQs and Rex — start at ₹11, with full-year packs that cost less than a plate of biryani." },
  { q: "What's inside a subject pack?", a: "The syllabus, unit-wise notes and material, important questions, previous year papers, and Rex — the AI tutor that explains from that material. Curated videos are free for everyone — no purchase needed. Access unlocks instantly after payment." },
  { q: "What's a full-year pack?", a: "Every subject in your year for one price. If you'll need more than two subjects, the full-year pack always wins." },
  { q: "I paid but can't access — what now?", a: "Tap Instant Help inside the app — DinoBot files a support ticket for you and the team resolves it within 24 hours." },
  { q: "Which college is this for?", a: "Built by and for GITAM students — the grade chart, units and PYQs match GITAM's actual pattern." },
];

export const ABOUT_FAQ = [
  { q: "What is Team Dino?", a: "Team Dino is a study workspace for GITAM students: unit-wise notes, important questions, previous year papers and an AI tutor (Rex) for every subject, plus free SGPA, CGPA and attendance calculators." },
  { q: "Who makes Team Dino?", a: "A small team of GITAM students who were tired of hunting for notes before exams. Everything is curated and checked by students who have taken the same courses." },
  { q: "Is Team Dino free?", a: "The calculators are free with no login. Subjects are a one-time unlock — buy a single subject or the full-year pack, with no subscription." },
  { q: "How is Rex different from ChatGPT?", a: "Rex answers from the material uploaded for your subject and shows which file and page each answer came from, so explanations match your syllabus instead of the internet." },
];

export const ROUTE_META: Record<string, RouteMeta> = {
  "/": {
    title: "Team Dino — GITAM Notes, PYQs, Important Questions & AI Tutor",
    desc: "Unit-wise notes, important questions, previous year papers and Rex, an AI tutor that explains from your own syllabus — plus free SGPA, CGPA and attendance calculators for GITAM students.",
  },
  "/about": {
    title: "About Team Dino — Built by GITAM Students, for GITAM Students",
    desc: "Why a group of GITAM students built Team Dino: one place for notes, important questions, PYQs and an AI tutor that reads your material. Meet the team and the Dino universe.",
  },
  "/sgpa-calc": {
    title: "Free SGPA Calculator (GITAM) — WGP, Grades & CGPA | Team Dino",
    desc: "Calculate your SGPA & CGPA in seconds with the GITAM grade chart — Sessional 1 (30%), Sessional 2 (45%) and Lab/External (25%) weights. Free, no login needed.",
  },
  "/calc": {
    title: "Free SGPA, CGPA & Attendance Calculators for GITAM | Team Dino",
    desc: "GITAM grade calculator, What-If CGPA predictor and attendance planner in one place. Free, no login needed.",
  },
  "/attendance-calc": {
    title: "Attendance Calculator — How Many Classes Can You Miss? | Team Dino",
    desc: "Check how many classes you can skip and still keep 75% attendance. Plan smart — free, no login needed.",
  },
  "/store": {
    title: "Store — Unlock GITAM Subjects & Full-Year Packs | Team Dino",
    desc: "Notes, important questions, PYQs and the Rex AI tutor for every subject. Unlock one subject or the whole year — one payment, no subscription.",
  },
  "/showcase": {
    title: "Campus Showcase — Projects Built by GITAM Students | Team Dino",
    desc: "Projects, startups, research and designs built by GITAM students. Browse what campus is building, like your favourites, and share your own.",
  },
  "/jobs": {
    title: "Placement Prep — Company Patterns, Materials & Questions | Team Dino",
    desc: "Crack your dream company with exam patterns, curated materials and previous questions — organised company by company.",
  },
  // Signed-in or transactional pages: useful to students, useless (and
  // thin/duplicate) as search results — keep them out of the index.
  "/auth": { title: "Sign in | Team Dino", desc: "Sign in to Team Dino.", noindex: true },
  "/setup": { title: "Set up your profile | Team Dino", desc: "Pick your department and year.", noindex: true },
  "/dashboard": { title: "Dashboard | Team Dino", desc: "Your subjects, progress and tools.", noindex: true },
  "/library": { title: "My Library | Team Dino", desc: "Subjects you've unlocked.", noindex: true },
  "/cart": { title: "Cart | Team Dino", desc: "Your cart.", noindex: true },
  "/purchases": { title: "Purchases | Team Dino", desc: "Your orders and receipts.", noindex: true },
  "/whats-new": { title: "What's New | Team Dino", desc: "The latest Team Dino features.", noindex: true },
  "/admin": { title: "Admin | Team Dino", desc: "Admin console.", noindex: true },
  "/contributor": { title: "Contribute | Team Dino", desc: "Contributor tools.", noindex: true },
  "/issues": { title: "Issues | Team Dino", desc: "Issue tracker.", noindex: true },
};

/** Subject pages, reset-password etc. share one private fallback. */
export function metaFor(pathname: string): RouteMeta {
  if (ROUTE_META[pathname]) return ROUTE_META[pathname];
  if (pathname.startsWith("/subject/")) return { title: "Subject | Team Dino", desc: "Notes, important questions, PYQs and Rex for this subject.", noindex: true };
  if (pathname.startsWith("/contributor/")) return ROUTE_META["/contributor"];
  return { ...ROUTE_META["/"], noindex: true };
}

const faqLd = (items: { q: string; a: string }[]) => ({
  "@type": "FAQPage",
  mainEntity: items.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
});

const crumbs = (name: string, path: string) => ({
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Team Dino", item: `${SITE}/` },
    { "@type": "ListItem", position: 2, name, item: `${SITE}${path}` },
  ],
});

/** Route-specific JSON-LD, added on top of the site-wide graph in index.html. */
export function jsonLdFor(pathname: string): object | null {
  if (pathname === "/") return { "@context": "https://schema.org", "@graph": [faqLd(HOME_FAQ)] };
  if (pathname === "/about") {
    return {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "AboutPage",
          name: ROUTE_META["/about"].title,
          description: ROUTE_META["/about"].desc,
          url: `${SITE}/about`,
          about: { "@id": `${SITE}/#org` },
        },
        faqLd(ABOUT_FAQ),
        crumbs("About", "/about"),
      ],
    };
  }
  if (pathname === "/sgpa-calc") return { "@context": "https://schema.org", "@graph": [crumbs("SGPA Calculator", "/sgpa-calc")] };
  if (pathname === "/attendance-calc") return { "@context": "https://schema.org", "@graph": [crumbs("Attendance Calculator", "/attendance-calc")] };
  return null;
}
