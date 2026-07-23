import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useFeatureFlags } from "./hooks/useFeatureFlags";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import ResetPassword from "./components/ResetPassword";
import AboutPage from "./components/AboutPage";
import { CartProvider } from "./context/CartContext";
import ProtectedRoute from "./components/layout/ProtectedRoute";
import SecurityGuard from "./components/layout/SecurityGuard";
import LoginTracker from "./components/layout/LoginTracker";
import SessionGuard from "./components/layout/SessionGuard";
import Store from "./pages/Store";
import Library from "./pages/Library";
import Cart from "./pages/Cart";
import Purchases from "./pages/Purchases";
import SubjectPage from "./pages/SubjectPage";
import Admin from "./pages/Admin";
import Contributor from "./pages/Contributor";
import Calc from "./pages/Calc";
import Jobs from "./pages/Jobs";
import JobsContributor from "./pages/JobsContributor";
import Agent from "./pages/Agent";

const queryClient = new QueryClient();

/** Blocks a route when its admin feature flag is off (direct URLs included). */
const FeatureRoute = ({ flag, children }: { flag: string; children: JSX.Element }) => {
  const { isOn } = useFeatureFlags();
  if (!isOn(flag)) return <Navigate to="/dashboard" replace />;
  return children;
};

// Component to handle dynamic SEO tags
const SEO = () => {
  useEffect(() => {
    document.title = "Team Dino | The Ultimate Student Workspace";
    
    // Update Meta Description
    let metaDescription = document.querySelector('meta[name="description"]');
    if (!metaDescription) {
      metaDescription = document.createElement('meta');
      metaDescription.setAttribute('name', 'description');
      document.head.appendChild(metaDescription);
    }
    metaDescription.setAttribute('content', 'Empowering students with centralized resources, intelligent AI tutoring, and seamless performance tracking.');
    
    // Update Theme Color for mobile browsers
    let themeColor = document.querySelector('meta[name="theme-color"]');
    if (!themeColor) {
      themeColor = document.createElement('meta');
      themeColor.setAttribute('name', 'theme-color');
      document.head.appendChild(themeColor);
    }
    themeColor.setAttribute('content', '#09090b');
  }, []);

  return null;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} storageKey="td-theme">
    <TooltipProvider>
      <SEO />
      <Toaster />
      <Sonner position="top-center" theme="dark" />
      <BrowserRouter>
        <CartProvider>
          <SecurityGuard />
          <LoginTracker />
          <SessionGuard />
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
        </CartProvider>
      </BrowserRouter>
    </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;