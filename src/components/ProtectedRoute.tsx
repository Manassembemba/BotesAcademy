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
        .select('profile_completed')
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

  // Redirection forcée vers l'onboarding si le profil n'est pas complété
  // On évite la boucle de redirection infinie en vérifiant si on n'y est pas déjà
  if (profile && !profile.profile_completed && location.pathname !== "/onboarding") {
    return <Navigate to="/onboarding" replace />;
  }

  return <Outlet />;
};
