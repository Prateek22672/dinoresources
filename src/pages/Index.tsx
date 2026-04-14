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

    // Get initial session
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      handleSession(data.session);
    });

    // Listen for auth changes
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

  // 🔄 LOADING STATE
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#09090b] flex flex-col items-center justify-center">
        <div className="text-center space-y-6">
          <div className="w-20 h-20 rounded-3xl bg-[#121214] flex items-center justify-center mx-auto">
            <img
              src={dinoLogo}
              alt="Team Dino Logo"
              className="w-12 h-12 opacity-80"
            />
          </div>
          <p className="text-zinc-500 text-xs tracking-widest uppercase">
            Loading Workspace...
          </p>
        </div>
      </div>
    );
  }

  // 🔐 NOT LOGGED IN
  if (!session) {
    if (location.pathname === "/auth") {
      return <AuthPage />;
    }
    return <LandingPage />;
  }

  // 👤 PROFILE SETUP
  if (needsProfileSetup || isEditMode) {
    return <ProfileSetup onProfileUpdated={refreshProfile} />;
  }

  // 🏠 MAIN APP
  return <Dashboard key={session.user.id} />;
};

export default Index;