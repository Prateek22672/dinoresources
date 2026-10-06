import { useEffect, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { SITE, metaFor, jsonLdFor } from "@/data/seo";
import { useFeatureFlags } from "./hooks/useFeatureFlags";
import { lazyWithReload as lazy } from "./lib/lazyWithReload";
import ErrorBoundary from "./components/ErrorBoundary";
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
const Showcase = lazy(() => import("./pages/Showcase"));
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
const Issues = lazy(() => import("./pages/Issues"));
const WhatsNewPage = lazy(() => import("./pages/WhatsNewPage"));

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

// Route-aware SEO — per-page title, description, canonical, robots, social
// tags and structured data. The data lives in src/data/seo.ts.
const SEO = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    const meta = metaFor(pathname);
    const url = `${SITE}${pathname === "/" ? "/" : pathname}`;

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
    // private pages stay out of search results; links on them still count
    upsert("name", "robots", meta.noindex ? "noindex, follow" : "index, follow, max-image-preview:large");
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

    // per-route JSON-LD (FAQ, About, breadcrumbs) beside the site-wide graph
    document.getElementById("route-jsonld")?.remove();
    const ld = jsonLdFor(pathname);
    if (ld) {
      const tag = document.createElement("script");
      tag.type = "application/ld+json";
      tag.id = "route-jsonld";
      tag.textContent = JSON.stringify(ld);
      document.head.appendChild(tag);
    }
  }, [pathname]);

  return null;
};

/**
 * Start every route at the top. The browser keeps the previous page's scroll
 * offset across a client-side navigation, so opening a subject from a
 * scrolled-down Store dropped you into the middle of the new page. Anchor
 * links (#hash) are left alone so they can still jump to their target.
 */
const ScrollToTop = () => {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) return;
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [pathname, hash]);
  return null;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    {/* Light is the default now. This only affects people who have never
        picked a theme — next-themes reads td-theme from localStorage first,
        so anyone who already chose dark keeps it. The ThemePicker popup is
        what tells the rest that the choice exists at all. */}
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} storageKey="td-theme">
    <TooltipProvider>
      <Toaster />
      <Sonner position="top-center" closeButton />
      <BrowserRouter>
        <SEO />
        <ScrollToTop />
        <CartProvider>
          <SecurityGuard />
          <LoginTracker />
          <SessionGuard />
          <ErrorBoundary>
          <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Index />} />
            <Route path="/setup" element={<Index />} />
            <Route path="/dashboard" element={<Index />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/showcase" element={<FeatureRoute flag="showcase"><Showcase /></FeatureRoute>} />

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
            <Route path="/issues" element={<ProtectedRoute roles={["contributor", "admin"]}><Issues /></ProtectedRoute>} />
            <Route path="/whats-new" element={<ProtectedRoute><WhatsNewPage /></ProtectedRoute>} />

            <Route path="*" element={<NotFound />} />
          </Routes>
          </Suspense>
          </ErrorBoundary>
        </CartProvider>
      </BrowserRouter>
    </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;