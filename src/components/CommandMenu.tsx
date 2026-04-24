import * as React from "react";
import { useNavigate } from "react-router-dom";
import {
  Calculator,
  Calendar,
  CreditCard,
  Settings,
  Smile,
  User,
  BookOpen,
  ShoppingBag,
  LayoutDashboard,
  LogOut,
  Moon,
  Sun,
  Search,
} from "lucide-react";

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "next-themes";
import { supabase } from "@/integrations/supabase/client";

export function CommandMenu() {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const [courses, setCourses] = React.useState<any[]>([]);
  const navigate = useNavigate();
  const { signOut, user, role } = useAuth();
  const { setTheme, theme } = useTheme();

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  React.useEffect(() => {
    if (search.length > 2) {
      const fetchCourses = async () => {
        const { data } = await supabase
          .from("courses")
          .select("id, title, category")
          .ilike("title", `%${search}%`)
          .limit(5);
        if (data) setCourses(data);
      };
      fetchCourses();
    } else {
      setCourses([]);
    }
  }, [search]);

  const runCommand = React.useCallback((command: () => void) => {
    setOpen(false);
    command();
  }, []);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="hidden lg:flex items-center gap-2 px-4 py-2 text-xs font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-all bg-muted/20 border border-border/40 rounded-2xl hover:bg-primary/5 hover:border-primary/20"
      >
        <Search className="w-4 h-4" />
        <span>Rechercher...</span>
        <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput 
          placeholder="Tapez une commande ou recherchez..." 
          value={search}
          onValueChange={setSearch}
        />
        <CommandList className="bg-glass-dark/95 backdrop-blur-3xl border-none">
          <CommandEmpty>Aucun résultat trouvé.</CommandEmpty>
          
          {courses.length > 0 && (
            <CommandGroup heading="Formations">
              {courses.map((course) => (
                <CommandItem
                  key={course.id}
                  onSelect={() => runCommand(() => navigate(`/course/${course.id}`))}
                  className="gap-3 py-4"
                >
                  <BookOpen className="w-4 h-4 text-primary" />
                  <div className="flex flex-col">
                    <span className="font-bold text-sm">{course.title}</span>
                    <span className="text-[10px] uppercase tracking-widest opacity-60">{course.category}</span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          <CommandGroup heading="Navigation Rapide">
            <CommandItem onSelect={() => runCommand(() => navigate("/formations"))} className="gap-3 py-4">
              <BookOpen className="w-4 h-4" />
              <span>Catalogue des Formations</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => navigate("/marketplace"))} className="gap-3 py-4">
              <ShoppingBag className="w-4 h-4" />
              <span>Marketplace Gold</span>
            </CommandItem>
            {user && (
              <CommandItem onSelect={() => runCommand(() => navigate(role === "admin" ? "/admin/dashboard" : "/dashboard"))} className="gap-3 py-4">
                <LayoutDashboard className="w-4 h-4" />
                <span>Mon Tableau de bord</span>
              </CommandItem>
            )}
          </CommandGroup>

          <CommandSeparator />

          <CommandGroup heading="Paramètres">
            <CommandItem onSelect={() => runCommand(() => setTheme(theme === "dark" ? "light" : "dark"))} className="gap-3 py-4">
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              <span>Changer le thème</span>
            </CommandItem>
            {user ? (
              <>
                <CommandItem onSelect={() => runCommand(() => navigate("/profile"))} className="gap-3 py-4">
                  <User className="w-4 h-4" />
                  <span>Mon Profil</span>
                </CommandItem>
                <CommandItem onSelect={() => runCommand(() => signOut())} className="gap-3 py-4 text-destructive">
                  <LogOut className="w-4 h-4" />
                  <span>Se déconnecter</span>
                </CommandItem>
              </>
            ) : (
              <CommandItem onSelect={() => runCommand(() => navigate("/auth"))} className="gap-3 py-4">
                <User className="w-4 h-4" />
                <span>Se connecter</span>
              </CommandItem>
            )}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
