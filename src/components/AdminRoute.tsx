import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";

export const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, role, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Si l'utilisateur n'est pas connecté, redirige vers la page de connexion.
  // Si l'utilisateur est connecté mais n'est pas un admin, redirige vers la page d'accueil.
  const isStaff = role === 'admin' || role === 'receptionist';

  if (!user || !isStaff) {
    return <Navigate to={!user ? "/auth" : "/"} replace />;
  }

  return <>{children}</>;
};
