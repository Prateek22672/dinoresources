import { useEffect, useState, ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole, UserRole } from "@/hooks/useUserRole";
import SplashScreen from "./SplashScreen";

interface ProtectedRouteProps {
  children: ReactNode;
  /** If set, the user must hold one of these roles or they're redirected. */
  roles?: UserRole[];
}

const FullPageLoader = () => <SplashScreen />;

export default function ProtectedRoute({ children, roles }: ProtectedRouteProps) {
  const navigate = useNavigate();
  const { role, isLoading: roleLoading } = useUserRole();
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { navigate("/auth"); return; }
      setAuthChecked(true);
    });
  }, [navigate]);

  useEffect(() => {
    if (!authChecked || roleLoading) return;
    if (roles && (!role || !roles.includes(role))) {
      navigate("/dashboard");
    }
  }, [authChecked, roleLoading, role, roles, navigate]);

  if (!authChecked || roleLoading) return <FullPageLoader />;
  if (roles && (!role || !roles.includes(role))) return <FullPageLoader />;

  return <>{children}</>;
}
