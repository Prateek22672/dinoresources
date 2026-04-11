import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import AuthPage from "@/components/AuthPage";
import ProfileSetup from "@/components/ProfileSetup";
import Dashboard from "@/components/Dashboard";
import LandingPage from "@/components/LandingPage"; // Import the new Landing Page

import dinoLogo from "@/assets/image.png";

const Index = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [session, setSession] = useState<any>(null);
  const [needsProfileSetup, setNeedsProfileSetup] = useState(false);
  const isEditMode = new URLSearchParams(location.search).get("edit") === "true";

  useEffect(() => {
    const handleSession = async (session: any) => {
      const params = new URLSearchParams(window.location.search);
      const isRecovery =
        params.get("type") === "recovery" ||
        params.has("access_token") ||
        window.location.pathname === "/reset-password";

      if (isRecovery) {
        setIsLoading(false);
        return;
      }

      if (session) {
        await checkProfile(session.user.id);
      } else {
        setIsLoading(false);
      }
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      handleSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      handleSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkProfile = async (userId: string) => {
    const { data } = await supabase.from("profiles").select("department, semester").eq("id", userId).single();
    const needsSetup = !data?.department || !data?.semester;
    setNeedsProfileSetup(needsSetup);
    setIsLoading(false);
  };

  const refreshProfile = () => {
    if (session?.user?.id) {
      checkProfile(session.user.id);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#09090b] flex flex-col items-center justify-center relative overflow-hidden font-sans">
        <div className="text-center space-y-6 relative z-10 animate-in fade-in duration-1000">
          <div className="w-20 h-20 rounded-3xl bg-[#121214] flex items-center justify-center shadow-2xl mx-auto animate-pulse border border-white/5 relative">
            <div className="absolute inset-0 rounded-3xl border border-white/10" />
            <img src={dinoLogo} alt="Team Dino Logo" className="w-12 h-12 opacity-80 rounded-xl" />
          </div>
          <p className="text-zinc-500 font-bold tracking-[0.2em] uppercase text-xs animate-pulse">
            Loading Workspace
          </p>
        </div>
      </div>
    );
  }

  // ROUTING LOGIC
  if (!session) {
    // If they explicitly go to /auth, show login. Otherwise, show Landing Page.
    if (location.pathname === "/auth") {
      return <AuthPage />;
    }
    return <LandingPage />;
  }

  if (needsProfileSetup || isEditMode) {
    return <ProfileSetup onProfileUpdated={refreshProfile} />;
  }

  // If authenticated and on "/" or "/dashboard", show the main app
  return <Dashboard key={session.user.id} />;
};

export default Index;