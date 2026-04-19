// // import { useEffect, useState } from "react";
// // import { useNavigate, useLocation } from "react-router-dom";
// // import { supabase } from "@/integrations/supabase/client";

// // import AuthPage from "@/components/AuthPage";
// // import ProfileSetup from "@/components/ProfileSetup";
// // import Dashboard from "@/components/Dashboard";
// // import LandingPage from "@/components/LandingPage";

// // import dinoLogo from "@/assets/dinosaurWhite.png";

// // const Index = () => {
// //   const location = useLocation();
// //   const navigate = useNavigate();

// //   const [isLoading, setIsLoading] = useState(true);
// //   const [session, setSession] = useState<any | null>(null);
// //   const [needsProfileSetup, setNeedsProfileSetup] = useState(false);

// //   const isEditMode =
// //     new URLSearchParams(location.search).get("edit") === "true";

// //   useEffect(() => {
// //     const handleSession = async (session: any) => {
// //       try {
// //         const params = new URLSearchParams(window.location.search);

// //         const isRecovery =
// //           params.get("type") === "recovery" ||
// //           params.has("access_token") ||
// //           window.location.pathname === "/reset-password";

// //         if (isRecovery) {
// //           setIsLoading(false);
// //           return;
// //         }

// //         if (session?.user?.id) {
// //           await checkProfile(session.user.id);
// //         } else {
// //           setIsLoading(false);
// //         }
// //       } catch (error) {
// //         console.error("Session handling error:", error);
// //         setIsLoading(false);
// //       }
// //     };

// //     // Get initial session
// //     supabase.auth.getSession().then(({ data }) => {
// //       setSession(data.session);
// //       handleSession(data.session);
// //     });

// //     // Listen for auth changes
// //     const {
// //       data: { subscription },
// //     } = supabase.auth.onAuthStateChange((_event, session) => {
// //       setSession(session);
// //       handleSession(session);
// //     });

// //     return () => {
// //       subscription.unsubscribe();
// //     };
// //   }, []);

// //   const checkProfile = async (userId: string) => {
// //     try {
// //       const { data, error } = await supabase
// //         .from("profiles")
// //         .select("department, semester")
// //         .eq("id", userId)
// //         .single();

// //       if (error) {
// //         console.error("Profile fetch error:", error);
// //       }

// //       const needsSetup = !data?.department || !data?.semester;
// //       setNeedsProfileSetup(needsSetup);
// //     } catch (err) {
// //       console.error("Unexpected profile error:", err);
// //     } finally {
// //       setIsLoading(false);
// //     }
// //   };

// //   const refreshProfile = () => {
// //     if (session?.user?.id) {
// //       checkProfile(session.user.id);
// //     }
// //   };

// //   // 🔄 LOADING STATE
// //   if (isLoading) {
// //     return (
// //       <div className="min-h-screen bg-[#09090b] flex flex-col items-center justify-center">
// //         <div className="text-center space-y-6">
// //           <div className="w-20 h-20 rounded-3xl bg-[#121214] flex items-center justify-center mx-auto">
// //             <img
// //               src={dinoLogo}
// //               alt="Team Dino Logo"
// //               className="w-12 h-12 opacity-80"
// //             />
// //           </div>
// //           <p className="text-zinc-500 text-xs tracking-widest uppercase">
// //             Loading Workspace...
// //           </p>
// //         </div>
// //       </div>
// //     );
// //   }

// //   // 🔐 NOT LOGGED IN
// //   if (!session) {
// //     if (location.pathname === "/auth") {
// //       return <AuthPage />;
// //     }
// //     return <LandingPage />;
// //   }

// //   // 👤 PROFILE SETUP
// //   if (needsProfileSetup || isEditMode) {
// //     return <ProfileSetup onProfileUpdated={refreshProfile} />;
// //   }

// //   // 🏠 MAIN APP
// //   return <Dashboard key={session.user.id} />;
// // };

// // export default Index;

// import { useEffect, useState } from "react";
// import { useNavigate, useLocation } from "react-router-dom";
// import { supabase } from "@/integrations/supabase/client";

// import AuthPage from "@/components/AuthPage";
// import ProfileSetup from "@/components/ProfileSetup";
// import Dashboard from "@/components/Dashboard";
// import LandingPage from "@/components/LandingPage";

// import dinoLogo from "@/assets/dinosaurWhite.png";

// const Index = () => {
//   const location = useLocation();
//   const navigate = useNavigate();

//   const [isLoading, setIsLoading] = useState(true);
//   const [session, setSession] = useState<any | null>(null);
//   const [needsProfileSetup, setNeedsProfileSetup] = useState(false);
//   const [devToolsOpen, setDevToolsOpen] = useState(false);

//   const isEditMode =
//     new URLSearchParams(location.search).get("edit") === "true";

//   useEffect(() => {
//     const handleSession = async (session: any) => {
//       try {
//         const params = new URLSearchParams(window.location.search);

//         const isRecovery =
//           params.get("type") === "recovery" ||
//           params.has("access_token") ||
//           window.location.pathname === "/reset-password";

//         if (isRecovery) {
//           setIsLoading(false);
//           return;
//         }

//         if (session?.user?.id) {
//           await checkProfile(session.user.id);
//         } else {
//           setIsLoading(false);
//         }
//       } catch (error) {
//         console.error("Session handling error:", error);
//         setIsLoading(false);
//       }
//     };

//     supabase.auth.getSession().then(({ data }) => {
//       setSession(data.session);
//       handleSession(data.session);
//     });

//     const {
//       data: { subscription },
//     } = supabase.auth.onAuthStateChange((_event, session) => {
//       setSession(session);
//       handleSession(session);
//     });

//     return () => {
//       subscription.unsubscribe();
//     };
//   }, []);

//   useEffect(() => {
//     const preventDefault = (e: Event) => {
//       e.preventDefault();
//     };

//     const handleContextMenu = (e: MouseEvent) => {
//       e.preventDefault();
//     };

//     const handleKeyDown = (e: KeyboardEvent) => {
//       const key = e.key.toLowerCase();

//       // F12
//       if (e.key === "F12") {
//         e.preventDefault();
//         e.stopPropagation();
//         return;
//       }

//       // Ctrl+Shift+I / J / C
//       if (
//         e.ctrlKey &&
//         e.shiftKey &&
//         ["i", "j", "c"].includes(key)
//       ) {
//         e.preventDefault();
//         e.stopPropagation();
//         return;
//       }

//       // Ctrl+U, Ctrl+S, Ctrl+C, Ctrl+X, Ctrl+V, Ctrl+A
//       if (
//         e.ctrlKey &&
//         ["u", "s", "c", "x", "v", "a"].includes(key)
//       ) {
//         e.preventDefault();
//         e.stopPropagation();
//         return;
//       }

//       // Cmd versions for Mac
//       if (
//         e.metaKey &&
//         ["u", "s", "c", "x", "v", "a"].includes(key)
//       ) {
//         e.preventDefault();
//         e.stopPropagation();
//         return;
//       }

//       // PrintScreen
//       if (e.key === "PrintScreen") {
//         e.preventDefault();
//         navigator.clipboard?.writeText("");
//       }
//     };

//     const handleDragStart = (e: DragEvent) => {
//       e.preventDefault();
//     };

//     const handleSelectStart = (e: Event) => {
//       e.preventDefault();
//     };

//     const handleCopy = (e: ClipboardEvent) => {
//       e.preventDefault();
//     };

//     const handleCut = (e: ClipboardEvent) => {
//       e.preventDefault();
//     };

//     const handlePaste = (e: ClipboardEvent) => {
//       e.preventDefault();
//     };

//     // crude DevTools detector
//     const detectDevTools = () => {
//       const widthThreshold = window.outerWidth - window.innerWidth > 160;
//       const heightThreshold = window.outerHeight - window.innerHeight > 160;

//       if (widthThreshold || heightThreshold) {
//         setDevToolsOpen(true);
//       } else {
//         setDevToolsOpen(false);
//       }
//     };

//     document.addEventListener("contextmenu", handleContextMenu);
//     document.addEventListener("keydown", handleKeyDown);
//     document.addEventListener("dragstart", handleDragStart);
//     document.addEventListener("selectstart", handleSelectStart);
//     document.addEventListener("copy", handleCopy);
//     document.addEventListener("cut", handleCut);
//     document.addEventListener("paste", handlePaste);

//     window.addEventListener("resize", detectDevTools);
//     const interval = setInterval(detectDevTools, 1000);

//     // optional: disable right click on images explicitly
//     const images = document.querySelectorAll("img");
//     images.forEach((img) => {
//       img.addEventListener("contextmenu", handleContextMenu);
//       img.addEventListener("dragstart", handleDragStart);
//     });

//     return () => {
//       document.removeEventListener("contextmenu", handleContextMenu);
//       document.removeEventListener("keydown", handleKeyDown);
//       document.removeEventListener("dragstart", handleDragStart);
//       document.removeEventListener("selectstart", handleSelectStart);
//       document.removeEventListener("copy", handleCopy);
//       document.removeEventListener("cut", handleCut);
//       document.removeEventListener("paste", handlePaste);

//       window.removeEventListener("resize", detectDevTools);
//       clearInterval(interval);

//       images.forEach((img) => {
//         img.removeEventListener("contextmenu", handleContextMenu);
//         img.removeEventListener("dragstart", handleDragStart);
//       });
//     };
//   }, []);

//   const checkProfile = async (userId: string) => {
//     try {
//       const { data, error } = await supabase
//         .from("profiles")
//         .select("department, semester")
//         .eq("id", userId)
//         .single();

//       if (error) {
//         console.error("Profile fetch error:", error);
//       }

//       const needsSetup = !data?.department || !data?.semester;
//       setNeedsProfileSetup(needsSetup);
//     } catch (err) {
//       console.error("Unexpected profile error:", err);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const refreshProfile = () => {
//     if (session?.user?.id) {
//       checkProfile(session.user.id);
//     }
//   };

//   if (isLoading) {
//     return (
//       <div className="min-h-screen bg-[#09090b] flex flex-col items-center justify-center">
//         <div className="text-center space-y-6">
//           <div className="w-20 h-20 rounded-3xl bg-[#121214] flex items-center justify-center mx-auto">
//             <img
//               src={dinoLogo}
//               alt="Team Dino Logo"
//               className="w-12 h-12 opacity-80 pointer-events-none select-none"
//               draggable={false}
//             />
//           </div>
//           <p className="text-zinc-500 text-xs tracking-widest uppercase">
//             Loading Workspace...
//           </p>
//         </div>
//       </div>
//     );
//   }

//   if (!session) {
//     if (location.pathname === "/auth") {
//       return <AuthPage />;
//     }
//     return <LandingPage />;
//   }

//   if (needsProfileSetup || isEditMode) {
//     return <ProfileSetup onProfileUpdated={refreshProfile} />;
//   }

//   return (
//     <>
//       {devToolsOpen && (
//         <div className="fixed inset-0 z-[9999] bg-black text-white flex items-center justify-center px-6 text-center">
//           <div>
//             <h1 className="text-2xl font-bold mb-4">Access Restricted</h1>
//             <p className="text-sm text-zinc-300">
//               Please close developer tools to continue using this page.
//             </p>
//           </div>
//         </div>
//       )}

//       <div
//         className="select-none"
//         style={{
//           WebkitUserSelect: "none",
//           userSelect: "none",
//           WebkitTouchCallout: "none",
//         }}
//       >
//         <Dashboard key={session.user.id} />
//       </div>
//     </>
//   );
// };

// export default Index;
import { useEffect, useState, useRef, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

import AuthPage from "@/components/AuthPage";
import ProfileSetup from "@/components/ProfileSetup";
import Dashboard from "@/components/Dashboard";
import LandingPage from "@/components/LandingPage";

import dinoLogo from "@/assets/dinosaurWhite.png";

// ─── DevTools Detection ────────────────────────────────────────────────────────
const DEVTOOLS_THRESHOLD_PX = 160;   // px difference that signals a panel is open
const LOGOUT_GRACE_MS       = 5_000; // 5 s warning → then force logout

function useDevToolsGuard(onDetected: () => void, onClosed: () => void) {
  const logoutTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isOpenRef   = useRef(false);

  const check = useCallback(() => {
    // Strategy 1 — window size delta (catches undocked + side panels)
    const widthDelta  = window.outerWidth  - window.innerWidth;
    const heightDelta = window.outerHeight - window.innerHeight;
    const sizeOpen    = widthDelta > DEVTOOLS_THRESHOLD_PX || heightDelta > DEVTOOLS_THRESHOLD_PX;

    // Strategy 2 — debugger timing trick (catches even undocked DevTools)
    let timingOpen = false;
    const before = performance.now();
    // eslint-disable-next-line no-debugger
    debugger;
    const elapsed = performance.now() - before;
    if (elapsed > 100) timingOpen = true;

    const devOpen = sizeOpen || timingOpen;

    if (devOpen && !isOpenRef.current) {
      isOpenRef.current = true;
      onDetected();
      // Start logout countdown
      logoutTimer.current = setTimeout(async () => {
        await supabase.auth.signOut();
      }, LOGOUT_GRACE_MS);
    } else if (!devOpen && isOpenRef.current) {
      isOpenRef.current = false;
      if (logoutTimer.current) {
        clearTimeout(logoutTimer.current);
        logoutTimer.current = null;
      }
      onClosed();
    }
  }, [onDetected, onClosed]);

  useEffect(() => {
    // Poll every 800 ms
    const interval = setInterval(check, 800);

    // Also react to resize (most reliable for docked panels)
    window.addEventListener("resize", check);

    // Firebug / older tools
    const devtoolsOpen = /./;
    (devtoolsOpen as any).toString = () => { check(); return ""; };

    return () => {
      clearInterval(interval);
      window.removeEventListener("resize", check);
      if (logoutTimer.current) clearTimeout(logoutTimer.current);
    };
  }, [check]);
}

// ─── DevTools Blocker Overlay ──────────────────────────────────────────────────
function DevToolsBlocker({ countdown }: { countdown: number }) {
  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center"
      style={{ backdropFilter: "blur(24px)", background: "rgba(9,9,11,0.92)" }}
    >
      {/* Pulsing warning icon */}
      <div className="relative mb-6">
        <div className="absolute inset-0 rounded-full bg-red-500/20 animate-ping" />
        <div className="relative w-20 h-20 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center">
          <svg
            className="w-9 h-9 text-red-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
            />
          </svg>
        </div>
      </div>

      <h2 className="text-white text-xl font-bold mb-2 tracking-tight">
        Developer Tools Detected
      </h2>
      <p className="text-zinc-400 text-sm text-center max-w-xs leading-relaxed mb-6 px-4">
        This platform is protected. Please close DevTools to continue.
        <br />
        Your session will expire in{" "}
        <span className="text-red-400 font-bold tabular-nums">
          {Math.ceil(countdown / 1000)}s
        </span>{" "}
        if not closed.
      </p>

      <div className="w-48 h-1 bg-white/5 rounded-full overflow-hidden">
        <div
          className="h-full bg-red-500 rounded-full transition-all duration-1000"
          style={{ width: `${(countdown / LOGOUT_GRACE_MS) * 100}%` }}
        />
      </div>

      <p className="text-zinc-600 text-[10px] mt-6 uppercase tracking-widest">
        Session protected · Team Dino
      </p>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
const Index = () => {
  const location = useLocation();

  const [isLoading,         setIsLoading]         = useState(true);
  const [session,           setSession]           = useState<any | null>(null);
  const [needsProfileSetup, setNeedsProfileSetup] = useState(false);
  const [devToolsOpen,      setDevToolsOpen]      = useState(false);
  const [countdown,         setCountdown]         = useState(LOGOUT_GRACE_MS);

  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isEditMode = new URLSearchParams(location.search).get("edit") === "true";

  // ── DevTools guard callbacks ──────────────────────────────────────────────
  const handleDevToolsDetected = useCallback(() => {
    setDevToolsOpen(true);
    setCountdown(LOGOUT_GRACE_MS);
    countdownRef.current = setInterval(() => {
      setCountdown((prev) => {
        const next = prev - 1000;
        return next < 0 ? 0 : next;
      });
    }, 1000);
  }, []);

  const handleDevToolsClosed = useCallback(() => {
    setDevToolsOpen(false);
    setCountdown(LOGOUT_GRACE_MS);
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
  }, []);

  useDevToolsGuard(handleDevToolsDetected, handleDevToolsClosed);

  // ── Auth ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    const handleSession = async (session: any) => {
      try {
        const params = new URLSearchParams(window.location.search);
        const isRecovery =
          params.get("type") === "recovery" ||
          params.has("access_token") ||
          window.location.pathname === "/reset-password";

        if (isRecovery) { setIsLoading(false); return; }
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

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      handleSession(session);
    });

    return () => { subscription.unsubscribe(); };
  }, []);

  // ── Content protection (right-click, copy, devtools shortcuts) ───────────
  useEffect(() => {
    const blockContext = (e: MouseEvent)  => e.preventDefault();
    const blockClip   = (e: Event)       => e.preventDefault();

    const blockKeys = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (
        e.key === "F12" ||
        (e.ctrlKey && e.shiftKey && ["i", "j", "c"].includes(key)) ||
        (e.ctrlKey && key === "u")
      ) { e.preventDefault(); return; }

      if ((e.ctrlKey || e.metaKey) && ["c", "v", "x"].includes(key)) {
        e.preventDefault();
      }
    };

    document.addEventListener("contextmenu", blockContext);
    document.addEventListener("keydown",     blockKeys);
    document.addEventListener("copy",        blockClip);
    document.addEventListener("cut",         blockClip);
    document.addEventListener("paste",       blockClip);

    return () => {
      document.removeEventListener("contextmenu", blockContext);
      document.removeEventListener("keydown",     blockKeys);
      document.removeEventListener("copy",        blockClip);
      document.removeEventListener("cut",         blockClip);
      document.removeEventListener("paste",       blockClip);
    };
  }, []);

  // ── Profile ───────────────────────────────────────────────────────────────
  const checkProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("department, semester")
        .eq("id", userId)
        .single();
      if (error) console.error("Profile fetch error:", error);
      setNeedsProfileSetup(!data?.department || !data?.semester);
    } catch (err) {
      console.error("Unexpected profile error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshProfile = () => {
    if (session?.user?.id) checkProfile(session.user.id);
  };

  // ── Render ────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#09090b] flex flex-col items-center justify-center">
        <div className="text-center space-y-6">
          <div className="w-20 h-20 rounded-3xl bg-[#121214] flex items-center justify-center mx-auto">
            <img src={dinoLogo} alt="Team Dino Logo" className="w-12 h-12 opacity-80" />
          </div>
          <p className="text-zinc-500 text-xs tracking-widest uppercase">
            Loading Workspace...
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* ── DevTools blocker — rendered on top of everything ── */}
      {devToolsOpen && <DevToolsBlocker countdown={countdown} />}

      {/* ── Normal app flow ── */}
      {!session ? (
        location.pathname === "/auth" ? <AuthPage /> : <LandingPage />
      ) : needsProfileSetup || isEditMode ? (
        <ProfileSetup onProfileUpdated={refreshProfile} />
      ) : (
        <Dashboard key={session.user.id} />
      )}
    </>
  );
};

export default Index;