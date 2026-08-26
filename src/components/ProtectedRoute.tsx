import { useAuth } from "@/contexts/AuthContext";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const ProtectedRoute = () => {
  const { user, loading } = useAuth();
  const location = useLocation();

  const { data: profile, isLoading: isLoadingProfile } = useQuery({
    queryKey: ['profile-completion', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('profiles')
        .select('profile_completed, role')
        .eq('id', user?.id)
        .single();
      return data;
    },
    enabled: !!user,
  });

  if (loading || (user && isLoadingProfile)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-2 h-2 bg-primary rounded-full animate-ping"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Ne pas forcer l'onboarding pour : admins, comptes avec email interne, pages déjà exclues
  const isAdmin = profile?.role === 'admin';
  const hasInternalEmail = user.email?.endsWith('@botesacademy.cd');
  const excludedPaths = ["/onboarding", "/profile", "/update-password"];
  const isExcluded = excludedPaths.some((p) => location.pathname.startsWith(p));

  if (profile && !profile.profile_completed && !isAdmin && !hasInternalEmail && !isExcluded) {
    return <Navigate to="/onboarding" replace />;
  }

  return <Outlet />;
};

