/**
 * The TeamDino feature catalog — one source of truth for the first-run tour,
 * the /whats-new page, and the team hand-off doc. Keep this current as features
 * ship; everything downstream updates automatically.
 */

export type Role = "student" | "contributor" | "admin";

export interface Feature {
  name: string;
  desc: string;          // what it is
  how: string;           // how to use / where to find it
  category: string;
  roles: Role[];         // who it's for
  isNew?: boolean;       // flag for the "new" badge
}

export const FEATURE_CATEGORIES = [
  "Study & Learn",
  "Track your progress",
  "Get help",
  "Unlock & access",
  "Make it yours",
  "For contributors",
  "For admins",
] as const;

export const FEATURES: Feature[] = [
  // ── Study & Learn ──
  { category: "Study & Learn", roles: ["student"], isNew: true,
    name: "Study-With-AI in every unit",
    desc: "Unit-wise Q&A explained clearly — mapped to your exact syllabus, not generic chatbot rambling.",
    how: "Open any subject → pick a unit → Study With AI tab. Tap a question to expand the answer." },
  { category: "Study & Learn", roles: ["student"], isNew: true,
    name: "Editorial videos by topic",
    desc: "Curated explainer videos, grouped topic-by-topic, playing in a compact in-site mini-player.",
    how: "Subject → unit → Editorial tab. Tap any video card to play it right there." },
  { category: "Study & Learn", roles: ["student"],
    name: "Topic picker inside units",
    desc: "Filter a unit down to a single topic so you study exactly what you need.",
    how: "Inside a unit, tap a topic chip to focus; tap 'All topics' to see everything." },
  { category: "Study & Learn", roles: ["student"],
    name: "PYQs & materials",
    desc: "Previous-year questions and curated materials for every subject and unit.",
    how: "Subject → PYQs, or the Resources tab in any unit." },
  { category: "Study & Learn", roles: ["student"], isNew: true,
    name: "Beautiful, readable answers",
    desc: "Notes render with smart callouts (Tip / Note / Example), clean tables and copy-able code — even from plain text.",
    how: "It's automatic — every Study-With-AI answer is formatted for easy reading." },

  // ── Track your progress ──
  { category: "Track your progress", roles: ["student"], isNew: true,
    name: "Exam readiness score",
    desc: "A live score of how ready you are per subject, based on what you've actually studied. The one tool that tells you where you stand.",
    how: "Dashboard → 'Your exam readiness'. It rises as you open units, Q&A and PYQs." },
  { category: "Track your progress", roles: ["student"], isNew: true,
    name: "Exam countdown calendar",
    desc: "Mark your exam dates and get a live 'N days to go' countdown, colour-coded as it nears.",
    how: "Dashboard → calendar on the right → tap a date to mark an exam." },
  { category: "Track your progress", roles: ["student"],
    name: "SGPA & CGPA calculators",
    desc: "Estimate your semester result and predict your CGPA with your college's grade chart.",
    how: "Dashboard → Calculators tile, or the SGPA/Attendance quick links. Free, no login needed." },
  { category: "Track your progress", roles: ["student"],
    name: "Attendance planner",
    desc: "See exactly how many classes you can skip and still hold 75%.",
    how: "Open the Attendance calculator from the Calculators tile." },
  { category: "Track your progress", roles: ["student"],
    name: "Streak & productivity",
    desc: "A daily login streak and a 7-day activity chart to keep you consistent.",
    how: "Dashboard → Overall information & Productivity cards." },

  // ── Get help ──
  { category: "Get help", roles: ["student", "contributor", "admin"], isNew: true,
    name: "DinoBot — AI help assistant",
    desc: "An assistant that answers questions AND does things for you: change your theme, navigate, add to cart, and raise a ticket after interviewing you — no random pop-ups.",
    how: "Header → ⚡ Instant Help. Ask it anything, or tap a suggested action." },
  { category: "Get help", roles: ["student", "contributor", "admin"], isNew: true,
    name: "Report an issue",
    desc: "Log a bug or suggestion in seconds; it reaches the team and you can track its status.",
    how: "Left rail → 'Report an issue' (or inside DinoBot). Pick a category, describe it, send." },
  { category: "Get help", roles: ["student", "contributor", "admin"],
    name: "Support tickets",
    desc: "Raise a formal ticket for payment or access problems and follow it to resolution.",
    how: "DinoBot → 'Raise a ticket', or the Instant Help flow." },
  { category: "Get help", roles: ["student", "contributor", "admin"], isNew: true,
    name: "Notices & What's-New",
    desc: "Important alerts appear in your header bell; a welcome popup surfaces the latest updates.",
    how: "Watch the 🔔 bell and the bottom-right What's-New popup." },

  // ── Unlock & access ──
  { category: "Unlock & access", roles: ["student"], isNew: true,
    name: "Subjects & full-year packs",
    desc: "Unlock a single subject, or open your whole year at once — one payment, permanent access.",
    how: "Rail → Subjects. Add to cart, then unlock. Owned subjects live in My Library." },
  { category: "Unlock & access", roles: ["student"], isNew: true,
    name: "Smart checkout",
    desc: "A clear breakdown of charges (GST, optional donation) and coupons, with a celebratory unlock.",
    how: "Cart → review the breakdown → Unlock now. Apply a coupon for a discount." },
  { category: "Unlock & access", roles: ["student"], isNew: true,
    name: "Spin & Win",
    desc: "A chance to win a discount on your purchase via a fair, admin-tuned prize wheel.",
    how: "In the Cart, tap Spin & Win when it's offered." },
  { category: "Unlock & access", roles: ["student"],
    name: "My Access history",
    desc: "Every unlock in one clear record.",
    how: "Rail → My Access." },

  // ── Make it yours ──
  { category: "Make it yours", roles: ["student", "contributor", "admin"], isNew: true,
    name: "Accent themes",
    desc: "Recolour the whole app — violet, teal, sapphire, gold or rose — in light or dark mode.",
    how: "Header → palette icon → pick your accent. Toggle light/dark too." },
  { category: "Make it yours", roles: ["student", "contributor", "admin"], isNew: true,
    name: "Collapsible side rail",
    desc: "Shrink the navigation to icons for more room on dense pages.",
    how: "Tap the « chevron at the top of the left rail." },

  // ── For contributors ──
  { category: "For contributors", roles: ["contributor", "admin"], isNew: true,
    name: "Contributor Studio",
    desc: "Add Study-With-AI Q&A, upload materials and drop editorial videos — unit by unit, topic by topic.",
    how: "Rail → Contribute. Pick a subject & unit, then add content." },
  { category: "For contributors", roles: ["contributor", "admin"], isNew: true,
    name: "Topic organisation",
    desc: "Create topics within a unit and file Q&A, materials and videos under them.",
    how: "Contribute → manage the topics strip, then assign each item a topic." },
  { category: "For contributors", roles: ["contributor", "admin"], isNew: true,
    name: "Issues board",
    desc: "Triage reported bugs — accept, set status, mark Done — alongside the team.",
    how: "Rail → Issues (visible to contributors & admins)." },

  // ── For admins ──
  { category: "For admins", roles: ["admin"], isNew: true,
    name: "Admin Console with search",
    desc: "15 sections — users, pricing, coupons, charges, notices, payments, security and more — with a search-to-jump box.",
    how: "Rail → Admin. Use the search bar to jump to any section instantly." },
  { category: "For admins", roles: ["admin"], isNew: true,
    name: "Grant / revoke access",
    desc: "Give or remove subject/year access for any user, fully audited.",
    how: "Admin → Users & Access → search a user → grant or revoke." },
  { category: "For admins", roles: ["admin"], isNew: true,
    name: "Configurable pricing & charges",
    desc: "Set subject and full-year prices, GST, optional donations and coupons — no code needed.",
    how: "Admin → Subjects & Pricing, Charges & GST, Coupons." },
  { category: "For admins", roles: ["admin"], isNew: true,
    name: "Notices & What's-New control",
    desc: "Message one student or everyone, and publish a welcome / What's-New popup that shows to all.",
    how: "Admin → Notices → compose a notice or edit the What's-New popup, then Publish." },
  { category: "For admins", roles: ["admin"], isNew: true,
    name: "DinoBot brain editor",
    desc: "Tune the assistant's instructions and knowledge from the console.",
    how: "Admin → Support Tickets → HelpBot brain." },
  { category: "For admins", roles: ["admin"], isNew: true,
    name: "Storage report & cleanup",
    desc: "See exactly how much space each operational table uses and clear resolved issues in one click.",
    how: "Issues page → Storage panel; Admin → Database for deeper cleanup." },
  { category: "For admins", roles: ["admin"], isNew: true,
    name: "Security controls",
    desc: "Set the security level, purchase-validity window and strict single-device login.",
    how: "Admin → Security." },
  { category: "For admins", roles: ["admin"], isNew: true,
    name: "Feature flags",
    desc: "Turn features (Jobs, Agent, Spin, Study-With-AI…) on or off across the whole site.",
    how: "Admin → Cards & Features." },
];
