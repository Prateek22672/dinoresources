import { useEffect, lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useFeatureFlags } from "./hooks/useFeatureFlags";
import Index from "./pages/Index";
import { CartProvider } from "./context/CartContext";
import ProtectedRoute from "./components/layout/ProtectedRoute";
import SecurityGuard from "./components/layout/SecurityGuard";
import LoginTracker from "./components/layout/LoginTracker";
import SessionGuard from "./components/layout/SessionGuard";

// ── Code splitting: every page beyond the entry experience ships as its own
//    chunk, downloaded only when the user actually navigates there. ──
const NotFound = lazy(() => import("./pages/NotFound"));
const ResetPassword = lazy(() => import("./components/ResetPassword"));
const AboutPage = lazy(() => import("./components/AboutPage"));
const Store = lazy(() => import("./pages/Store"));
const Library = lazy(() => import("./pages/Library"));
const Cart = lazy(() => import("./pages/Cart"));
const Purchases = lazy(() => import("./pages/Purchases"));
const SubjectPage = lazy(() => import("./pages/SubjectPage"));
const Admin = lazy(() => import("./pages/Admin"));
const Contributor = lazy(() => import("./pages/Contributor"));
const Calc = lazy(() => import("./pages/Calc"));
const Jobs = lazy(() => import("./pages/Jobs"));
const JobsContributor = lazy(() => import("./pages/JobsContributor"));
const Agent = lazy(() => import("./pages/Agent"));

/** Minimal chunk-load fallback — matches the app's dark stage, no flash of white. */
const RouteFallback = () => (
  <div className="min-h-screen bg-[#09090b] flex items-center justify-center">
    <div className="w-8 h-8 rounded-full border-2 border-white/15 border-t-white/70 animate-spin" />
  </div>
);

const queryClient = new QueryClient();

/** Blocks a route when its admin feature flag is off (direct URLs included). */
const FeatureRoute = ({ flag, children }: { flag: string; children: JSX.Element }) => {
  const { isOn } = useFeatureFlags();
  if (!isOn(flag)) return <Navigate to="/dashboard" replace />;
  return children;
};

// Route-aware SEO — per-page title, description, canonical and social tags.
const ROUTE_META: Record<string, { title: string; desc: string }> = {
  "/": {
    title: "Team Dino | The Ultimate Student Workspace",
    desc: "Empowering students with centralized resources, intelligent AI tutoring, and seamless performance tracking. Stop searching for notes, start mastering your subjects.",
  },
  "/sgpa-calc": {
    title: "Free SGPA Calculator (GITAM) — WGP, Grades & CGPA | Team Dino",
    desc: "Calculate your SGPA & CGPA in seconds with the GITAM grade chart — Sessional 1 (30%), Sessional 2 (45%) and Lab/External (25%) weights. Free, no login needed.",
  },
  "/calc": {
    title: "Free SGPA, CGPA & Attendance Calculators | Team Dino",
    desc: "GITAM grade calculator, What-If CGPA predictor and attendance planner in one place. Free, no login needed.",
  },
  "/attendance-calc": {
    title: "Attendance Calculator — How Many Classes Can You Miss? | Team Dino",
    desc: "Check how many classes you can skip and still keep 75% attendance. Plan smart — free, no login needed.",
  },
  "/store": {
    title: "Store — Unlock Subjects & Year Combos | Team Dino",
    desc: "Notes, PYQs and Study-With-AI for every subject. Buy a single subject or save with a full-year combo — one payment, permanent access.",
  },
  "/jobs": {
    title: "Placement Prep — Company Patterns, Materials & Questions | Team Dino",
    desc: "Crack your dream company with exam patterns, curated materials and previous questions — organised company by company.",
  },
  "/about": {
    title: "About Us | Team Dino",
    desc: "Meet the team behind Team Dino — the student workspace crafted for the student community.",
  },
};

const SEO = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    const meta = ROUTE_META[pathname] ?? ROUTE_META["/"];
    const url = `https://teamdino.in${pathname === "/" ? "/" : pathname}`;

    document.title = meta.title;

    const upsert = (attr: "name" | "property", key: string, content: string) => {
      let el = document.querySelector(`meta[${attr}="${key}"]`);
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(attr, key);
        document.head.appendChild(el);
      }
      el.setAttribute("content", content);
    };

    upsert("name", "title", meta.title);
    upsert("name", "description", meta.desc);
    upsert("property", "og:title", meta.title);
    upsert("property", "og:description", meta.desc);
    upsert("property", "og:url", url);
    upsert("name", "twitter:title", meta.title);
    upsert("name", "twitter:description", meta.desc);
    upsert("name", "twitter:url", url);

    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.rel = "canonical";
      document.head.appendChild(canonical);
    }
    canonical.href = url;
  }, [pathname]);

  return null;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} storageKey="td-theme">
    <TooltipProvider>
      <Toaster />
      <Sonner position="top-center" theme="dark" />
      <BrowserRouter>
        <SEO />
        <CartProvider>
          <SecurityGuard />
          <LoginTracker />
          <SessionGuard />
          <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Index />} />
            <Route path="/setup" element={<Index />} />
            <Route path="/dashboard" element={<Index />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/about" element={<AboutPage />} />

            {/* Public tools — no login required (unified calc with toggle) */}
            <Route path="/sgpa-calc" element={<Calc initial="sgpa" />} />
            <Route path="/attendance-calc" element={<Calc initial="attendance" />} />
            <Route path="/calc" element={<Calc initial="sgpa" />} />

            {/* Commerce */}
            <Route path="/store" element={<ProtectedRoute><Store /></ProtectedRoute>} />
            <Route path="/library" element={<ProtectedRoute><Library /></ProtectedRoute>} />
            <Route path="/cart" element={<ProtectedRoute><Cart /></ProtectedRoute>} />
            <Route path="/purchases" element={<ProtectedRoute><Purchases /></ProtectedRoute>} />
            <Route path="/subject/:slug" element={<ProtectedRoute><SubjectPage /></ProtectedRoute>} />
            <Route path="/jobs" element={<ProtectedRoute><FeatureRoute flag="jobs"><Jobs /></FeatureRoute></ProtectedRoute>} />
            <Route path="/agent" element={<ProtectedRoute><FeatureRoute flag="agent"><Agent /></FeatureRoute></ProtectedRoute>} />
            <Route path="/contributor/jobs" element={<ProtectedRoute roles={["contributor", "admin"]}><FeatureRoute flag="jobs"><JobsContributor /></FeatureRoute></ProtectedRoute>} />

            {/* Role-gated dashboards */}
            <Route path="/admin" element={<ProtectedRoute roles={["admin"]}><Admin /></ProtectedRoute>} />
            <Route path="/contributor" element={<ProtectedRoute roles={["contributor", "admin"]}><Contributor /></ProtectedRoute>} />

            <Route path="*" element={<NotFound />} />
          </Routes>
          </Suspense>
        </CartProvider>
      </BrowserRouter>
    </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;