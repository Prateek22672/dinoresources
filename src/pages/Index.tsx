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

//     // Get initial session
//     supabase.auth.getSession().then(({ data }) => {
//       setSession(data.session);
//       handleSession(data.session);
//     });

//     // Listen for auth changes
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

//   // 🔄 LOADING STATE
//   if (isLoading) {
//     return (
//       <div className="min-h-screen bg-[#09090b] flex flex-col items-center justify-center">
//         <div className="text-center space-y-6">
//           <div className="w-20 h-20 rounded-3xl bg-[#121214] flex items-center justify-center mx-auto">
//             <img
//               src={dinoLogo}
//               alt="Team Dino Logo"
//               className="w-12 h-12 opacity-80"
//             />
//           </div>
//           <p className="text-zinc-500 text-xs tracking-widest uppercase">
//             Loading Workspace...
//           </p>
//         </div>
//       </div>
//     );
//   }

//   // 🔐 NOT LOGGED IN
//   if (!session) {
//     if (location.pathname === "/auth") {
//       return <AuthPage />;
//     }
//     return <LandingPage />;
//   }

//   // 👤 PROFILE SETUP
//   if (needsProfileSetup || isEditMode) {
//     return <ProfileSetup onProfileUpdated={refreshProfile} />;
//   }

//   // 🏠 MAIN APP
//   return <Dashboard key={session.user.id} />;
// };

// export default Index;

import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

import AuthPage from "@/components/AuthPage";
import ProfileSetup from "@/components/ProfileSetup";
import Dashboard from "@/components/Dashboard";
import LandingPage from "@/components/LandingPage";

import dinoLogo from "@/assets/dinosaurWhite.png";

const Index = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(true);
  const [session, setSession] = useState<any | null>(null);
  const [needsProfileSetup, setNeedsProfileSetup] = useState(false);
  const [devToolsOpen, setDevToolsOpen] = useState(false);

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

  useEffect(() => {
    const preventDefault = (e: Event) => {
      e.preventDefault();
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();

      // F12
      if (e.key === "F12") {
        e.preventDefault();
        e.stopPropagation();
        return;
      }

      // Ctrl+Shift+I / J / C
      if (
        e.ctrlKey &&
        e.shiftKey &&
        ["i", "j", "c"].includes(key)
      ) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }

      // Ctrl+U, Ctrl+S, Ctrl+C, Ctrl+X, Ctrl+V, Ctrl+A
      if (
        e.ctrlKey &&
        ["u", "s", "c", "x", "v", "a"].includes(key)
      ) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }

      // Cmd versions for Mac
      if (
        e.metaKey &&
        ["u", "s", "c", "x", "v", "a"].includes(key)
      ) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }

      // PrintScreen
      if (e.key === "PrintScreen") {
        e.preventDefault();
        navigator.clipboard?.writeText("");
      }
    };

    const handleDragStart = (e: DragEvent) => {
      e.preventDefault();
    };

    const handleSelectStart = (e: Event) => {
      e.preventDefault();
    };

    const handleCopy = (e: ClipboardEvent) => {
      e.preventDefault();
    };

    const handleCut = (e: ClipboardEvent) => {
      e.preventDefault();
    };

    const handlePaste = (e: ClipboardEvent) => {
      e.preventDefault();
    };

    // crude DevTools detector
    const detectDevTools = () => {
      const widthThreshold = window.outerWidth - window.innerWidth > 160;
      const heightThreshold = window.outerHeight - window.innerHeight > 160;

      if (widthThreshold || heightThreshold) {
        setDevToolsOpen(true);
      } else {
        setDevToolsOpen(false);
      }
    };

    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("dragstart", handleDragStart);
    document.addEventListener("selectstart", handleSelectStart);
    document.addEventListener("copy", handleCopy);
    document.addEventListener("cut", handleCut);
    document.addEventListener("paste", handlePaste);

    window.addEventListener("resize", detectDevTools);
    const interval = setInterval(detectDevTools, 1000);

    // optional: disable right click on images explicitly
    const images = document.querySelectorAll("img");
    images.forEach((img) => {
      img.addEventListener("contextmenu", handleContextMenu);
      img.addEventListener("dragstart", handleDragStart);
    });

    return () => {
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("dragstart", handleDragStart);
      document.removeEventListener("selectstart", handleSelectStart);
      document.removeEventListener("copy", handleCopy);
      document.removeEventListener("cut", handleCut);
      document.removeEventListener("paste", handlePaste);

      window.removeEventListener("resize", detectDevTools);
      clearInterval(interval);

      images.forEach((img) => {
        img.removeEventListener("contextmenu", handleContextMenu);
        img.removeEventListener("dragstart", handleDragStart);
      });
    };
  }, []);

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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#09090b] flex flex-col items-center justify-center">
        <div className="text-center space-y-6">
          <div className="w-20 h-20 rounded-3xl bg-[#121214] flex items-center justify-center mx-auto">
            <img
              src={dinoLogo}
              alt="Team Dino Logo"
              className="w-12 h-12 opacity-80 pointer-events-none select-none"
              draggable={false}
            />
          </div>
          <p className="text-zinc-500 text-xs tracking-widest uppercase">
            Loading Workspace...
          </p>
        </div>
      </div>
    );
  }

  if (!session) {
    if (location.pathname === "/auth") {
      return <AuthPage />;
    }
    return <LandingPage />;
  }

  if (needsProfileSetup || isEditMode) {
    return <ProfileSetup onProfileUpdated={refreshProfile} />;
  }

  return (
    <>
      {devToolsOpen && (
        <div className="fixed inset-0 z-[9999] bg-black text-white flex items-center justify-center px-6 text-center">
          <div>
            <h1 className="text-2xl font-bold mb-4">Access Restricted</h1>
            <p className="text-sm text-zinc-300">
              Please close developer tools to continue using this page.
            </p>
          </div>
        </div>
      )}

      <div
        className="select-none"
        style={{
          WebkitUserSelect: "none",
          userSelect: "none",
          WebkitTouchCallout: "none",
        }}
      >
        <Dashboard key={session.user.id} />
      </div>
    </>
  );
};

export default Index;
