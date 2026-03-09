import { createContext, useContext, useEffect, useState } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  role: string | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  role: null,
  loading: true,
  signOut: async () => { },
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserRole = async (user: User) => {
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("Timeout Supabase (5s)")), 5000);
      });

      try {
        const query = supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .single();

        const result = (await Promise.race([query, timeoutPromise])) as any;

        if (result.error && result.error.code !== 'PGRST116') {
          throw result.error;
        }
        return result.data?.role ?? null;
      } catch (error) {
        console.error("Erreur lors de la récupération du rôle:", error);
        return null;
      }
    };

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session) {
        setSession(session);
        setUser(session.user);

        fetchUserRole(session.user).then(userRole => {
          setRole(userRole);
        });
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        setSession(session);
        setUser(session.user);

        fetchUserRole(session.user).then(userRole => {
          setRole(userRole);
        });
      } else {
        setSession(null);
        setUser(null);
        setRole(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setRole(null);
      toast.success("Déconnexion réussie");
      navigate("/");
    } catch (error) {
      toast.error("Erreur lors de la déconnexion");
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, role, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
