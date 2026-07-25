// // export default Index;
// import { useEffect, useState, useRef, useCallback } from "react";
// import { useLocation } from "react-router-dom";
// import { supabase } from "@/integrations/supabase/client";

// import AuthPage from "@/components/AuthPage";
// import ProfileSetup from "@/components/ProfileSetup";
// import Dashboard from "@/components/Dashboard";
// import LandingPage from "@/components/LandingPage";

// import dinoLogo from "@/assets/dinosaurWhite.png";

// // ─── Constants ────────────────────────────────────────────────────────────────
// const DEVTOOLS_THRESHOLD_PX = 160;
// const LOGOUT_GRACE_MS       = 5_000;

// // ─── Device Detection ────────────────────────────────────────────────────────
// const isIOS = () => {
//   return (
//     /iPad|iPhone|iPod/.test(navigator.userAgent) ||
//     (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
//   );
// };

// function useDevToolsGuard(onDetected: () => void, onClosed: () => void) {
//   const logoutTimer     = useRef<ReturnType<typeof setTimeout> | null>(null);
//   const isOpenRef       = useRef(false);
//   const inputFocusedRef = useRef(false);

//   // ── Track input focus (Safe for all devices) ───────────────────────────────
//   useEffect(() => {
//     const onFocusIn = (e: FocusEvent) => {
//       const t = e.target as HTMLElement;
//       if (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || (t as any).isContentEditable) {
//         inputFocusedRef.current = true;
//       }
//     };
//     const onFocusOut = (e: FocusEvent) => {
//       const t = e.target as HTMLElement;
//       if (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || (t as any).isContentEditable) {
//         setTimeout(() => { inputFocusedRef.current = false; }, 600);
//       }
//     };
//     document.addEventListener("focusin", onFocusIn, true);
//     document.addEventListener("focusout", onFocusOut, true);
//     return () => {
//       document.removeEventListener("focusin", onFocusIn, true);
//       document.removeEventListener("focusout", onFocusOut, true);
//     };
//   }, []);

//   // ── Core detection ────────────────────────────────────────────────────────
//   const check = useCallback(() => {
//     // CRITICAL FIX: Skip DevTools guard entirely for iOS users.
//     // iOS Chrome/Safari address bar resizing causes permanent false positives.
//     if (isIOS()) return;

//     const inputOpen = inputFocusedRef.current;

//     // Strategy 1 — width delta
//     const widthDelta = window.outerWidth - window.innerWidth;
//     const widthOpen  = widthDelta > DEVTOOLS_THRESHOLD_PX;

//     // Strategy 2 — height delta
//     const heightDelta = window.outerHeight - window.innerHeight;
//     const heightOpen  = !inputOpen && heightDelta > DEVTOOLS_THRESHOLD_PX;

//     // Strategy 3 — debugger timing
//     let timingOpen = false;
//     if (!inputOpen) {
//       const before = performance.now();
//       // eslint-disable-next-line no-debugger
//       debugger;
//       if (performance.now() - before > 100) timingOpen = true;
//     }

//     const devOpen = widthOpen || heightOpen || timingOpen;

//     if (devOpen && !isOpenRef.current) {
//       isOpenRef.current = true;
//       onDetected();
//       logoutTimer.current = setTimeout(async () => {
//         await supabase.auth.signOut();
//       }, LOGOUT_GRACE_MS);
//     } else if (!devOpen && isOpenRef.current) {
//       isOpenRef.current = false;
//       if (logoutTimer.current) {
//         clearTimeout(logoutTimer.current);
//         logoutTimer.current = null;
//       }
//       onClosed();
//     }
//   }, [onDetected, onClosed]);

//   useEffect(() => {
//     // If iOS, don't even set up the polling interval or resize listeners
//     if (isIOS()) return;

//     const interval = setInterval(check, 800);
//     window.addEventListener("resize", check);

//     const devtoolsOpen = /./;
//     (devtoolsOpen as any).toString = () => { check(); return ""; };

//     return () => {
//       clearInterval(interval);
//       window.removeEventListener("resize", check);
//       if (logoutTimer.current) clearTimeout(logoutTimer.current);
//     };
//   }, [check]);
// }

// // ─── DevTools Blocker Overlay ──────────────────────────────────────────────────
// function DevToolsBlocker({ countdown }: { countdown: number }) {
//   return (
//     <div
//       className="fixed inset-0 z-[9999] flex flex-col items-center justify-center"
//       style={{ backdropFilter: "blur(24px)", background: "rgba(9,9,11,0.92)" }}
//     >
//       <div className="relative mb-6">
//         <div className="absolute inset-0 rounded-full bg-red-500/20 animate-ping" />
//         <div className="relative w-20 h-20 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center">
//           <svg className="w-9 h-9 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
//             <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
//           </svg>
//         </div>
//       </div>
//       <h2 className="text-white text-xl font-bold mb-2 tracking-tight">Developer Tools Detected</h2>
//       <p className="text-zinc-400 text-sm text-center max-w-xs leading-relaxed mb-6 px-4">
//         This platform is protected. Please close DevTools to continue.
//         <br />
//         Your session will expire in <span className="text-red-400 font-bold tabular-nums">{Math.ceil(countdown / 1000)}s</span> if not closed.
//       </p>
//       <div className="w-48 h-1 bg-white/5 rounded-full overflow-hidden">
//         <div
//           className="h-full bg-red-500 rounded-full transition-all duration-1000"
//           style={{ width: `${(countdown / LOGOUT_GRACE_MS) * 100}%` }}
//         />
//       </div>
//     </div>
//   );
// }

// const Index = () => {
//   const location = useLocation();
//   const [isLoading, setIsLoading] = useState(true);
//   const [session, setSession] = useState<any | null>(null);
//   const [needsProfileSetup, setNeedsProfileSetup] = useState(false);
//   const [devToolsOpen, setDevToolsOpen] = useState(false);
//   const [countdown, setCountdown] = useState(LOGOUT_GRACE_MS);

//   const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
//   const isEditMode = new URLSearchParams(location.search).get("edit") === "true";
//   const isLoggedIn = !!session;

//   const handleDevToolsDetected = useCallback(() => {
//     setDevToolsOpen(true);
//     setCountdown(LOGOUT_GRACE_MS);
//     countdownRef.current = setInterval(() => {
//       setCountdown((prev) => Math.max(0, prev - 1000));
//     }, 1000);
//   }, []);

//   const handleDevToolsClosed = useCallback(() => {
//     setDevToolsOpen(false);
//     setCountdown(LOGOUT_GRACE_MS);
//     if (countdownRef.current) {
//       clearInterval(countdownRef.current);
//       countdownRef.current = null;
//     }
//   }, []);

//   useDevToolsGuard(handleDevToolsDetected, handleDevToolsClosed);

//   useEffect(() => {
//     const handleSession = async (session: any) => {
//       try {
//         const params = new URLSearchParams(window.location.search);
//         const isRecovery = params.get("type") === "recovery" || params.has("access_token") || window.location.pathname === "/reset-password";
//         if (isRecovery) { setIsLoading(false); return; }
//         if (session?.user?.id) { await checkProfile(session.user.id); } else { setIsLoading(false); }
//       } catch (error) { setIsLoading(false); }
//     };
//     supabase.auth.getSession().then(({ data }) => {
//       setSession(data.session);
//       handleSession(data.session);
//     });
//     const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
//       setSession(session);
//       handleSession(session);
//     });
//     return () => { subscription.unsubscribe(); };
//   }, []);

//   useEffect(() => {
//     if (!isLoggedIn) return;
//     const block = (e: Event) => e.preventDefault();
//     const blockKeys = (e: KeyboardEvent) => {
//       const key = e.key.toLowerCase();
//       if (e.key === "F12" || (e.ctrlKey && e.shiftKey && ["i", "j", "c"].includes(key)) || (e.ctrlKey && key === "u")) {
//         e.preventDefault();
//       }
//       if ((e.ctrlKey || e.metaKey) && ["c", "v", "x"].includes(key)) e.preventDefault();
//     };
//     document.addEventListener("contextmenu", block);
//     document.addEventListener("keydown", blockKeys);
//     document.addEventListener("copy", block);
//     document.addEventListener("cut", block);
//     document.addEventListener("paste", block);
//     return () => {
//       document.removeEventListener("contextmenu", block);
//       document.removeEventListener("keydown", blockKeys);
//       document.removeEventListener("copy", block);
//       document.removeEventListener("cut", block);
//       document.removeEventListener("paste", block);
//     };
//   }, [isLoggedIn]);

//   const checkProfile = async (userId: string) => {
//     try {
//       const { data } = await supabase.from("profiles").select("department, semester").eq("id", userId).single();
//       setNeedsProfileSetup(!data?.department || !data?.semester);
//     } catch (err) { } finally { setIsLoading(false); }
//   };

//   if (isLoading) {
//     return (
//       <div className="min-h-screen bg-[#09090b] flex flex-col items-center justify-center">
//         <img src={dinoLogo} alt="Logo" className="w-12 h-12 opacity-80 animate-pulse" />
//       </div>
//     );
//   }

//   return (
//     <>
//       {devToolsOpen && <DevToolsBlocker countdown={countdown} />}
//       {!session ? (
//         location.pathname === "/auth" ? <AuthPage /> : <LandingPage />
//       ) : needsProfileSetup || isEditMode ? (
//         <ProfileSetup onProfileUpdated={() => checkProfile(session.user.id)} />
//       ) : (
//         <Dashboard key={session.user.id} />
//       )}
//     </>
//   );
// };

// export default Index;

import { useEffect, useState, Suspense } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { lazyWithReload as lazy } from "@/lib/lazyWithReload";

// Landing stays in the entry bundle — logged-out first paint must be instant.
// The signed-in app (Dashboard + shell) is its own chunk, fetched behind the splash.
import LandingPage from "@/components/LandingPage";
import SplashScreen, { useMinSplash } from "@/components/layout/SplashScreen";
const AuthPage = lazy(() => import("@/components/AuthPage"));
const ProfileSetup = lazy(() => import("@/components/ProfileSetup"));
const Dashboard = lazy(() => import("@/components/Dashboard"));

/** Idle-time prefetch — warm the auth/dashboard chunks while the visitor reads the landing. */
function usePrefetchAppChunks(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;
    const t = setTimeout(() => {
      import("@/components/AuthPage");
      import("@/components/Dashboard");
    }, 2500);
    return () => clearTimeout(t);
  }, [enabled]);
}

const Index = () => {
  const location = useLocation();

  const [isLoading, setIsLoading] = useState(true);
  const [session, setSession] = useState<any | null>(null);
  const [needsProfileSetup, setNeedsProfileSetup] = useState(false);
  const showSplash = useMinSplash(isLoading);

  const isEditMode =
    new URLSearchParams(location.search).get("edit") === "true";

  useEffect(() => {
    const handleSession = async (session: any) => {
      try {
        const params = new URLSearchParams(window.location.search);

        const isRecovery =
          params.get("type") === "recovery" ||
          params.has("access_token") ||
          window.location.pathname === "/reset-password";

        if (isRecovery) {
          setIsLoading(false);
          return;
        }

        if (session?.user?.id) {
          await checkProfile(session.user.id);
        } else {
          setIsLoading(false);
        }
      } catch (error) {
        console.error("Session handling error:", error);
        setIsLoading(false);
      }
    };

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      handleSession(data.session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      handleSession(session);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Site protection (DevTools / copy-paste blocking) is now centrally controlled
  // by <SecurityGuard /> in App.tsx, driven by the admin-configurable
  // app_settings.security_level. The old hardcoded blocker was removed.

  const checkProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("department, semester")
        .eq("id", userId)
        .single();

      if (error) {
        console.error("Profile fetch error:", error);
      }

      const needsSetup = !data?.department || !data?.semester;
      setNeedsProfileSetup(needsSetup);
    } catch (err) {
      console.error("Unexpected profile error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshProfile = () => {
    if (session?.user?.id) {
      checkProfile(session.user.id);
    }
  };

  // warm the auth/dashboard chunks while a logged-out visitor reads the landing
  usePrefetchAppChunks(!isLoading && !session);

  if (showSplash) {
    return <SplashScreen />;
  }

  if (!session) {
    if (location.pathname === "/auth") {
      return (
        <Suspense fallback={<SplashScreen />}>
          <AuthPage />
        </Suspense>
      );
    }
    return <LandingPage />;
  }

  if (needsProfileSetup || isEditMode) {
    return (
      <Suspense fallback={<SplashScreen />}>
        <ProfileSetup onProfileUpdated={refreshProfile} />
      </Suspense>
    );
  }

  return (
    <Suspense fallback={<SplashScreen />}>
      <Dashboard key={session.user.id} />
    </Suspense>
  );
};

export default Index;
