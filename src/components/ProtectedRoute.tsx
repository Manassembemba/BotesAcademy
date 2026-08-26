import { useAuth } from "@/contexts/AuthContext";
import { Navigate, Outlet } from "react-router-dom";

export const ProtectedRoute = () => {
  const { user, loading } = useAuth();

  if (loading) {
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

  // La complétion du profil est optionnelle — aucune redirection forcée
  return <Outlet />;
};

