import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Plus, Search, Edit, Trash2, Globe, Eye, EyeOff, 
  Users, DollarSign, BookOpen, MoreVertical, 
  Filter, LayoutGrid, List, Loader2, AlertCircle,
  TrendingUp, Star, CheckCircle2, ChevronRight
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, 
  DropdownMenuSeparator, DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const FormationManagement = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const { data: courses, isLoading } = useQuery({
    queryKey: ['adminCourses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('courses')
        .select(`
          *,
          purchases:purchases(count)
        `)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('courses').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Formation supprimée avec succès.");
      queryClient.invalidateQueries({ queryKey: ['adminCourses'] });
    },
    onError: (error: any) => toast.error(`Erreur: ${error.message}`)
  });

  const togglePublishMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string, status: 'published' | 'draft' }) => {
      const { error } = await supabase
        .from('courses')
        .update({ status: status === 'published' ? 'draft' : 'published' })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Statut mis à jour !");
      queryClient.invalidateQueries({ queryKey: ['adminCourses'] });
    },
    onError: (error: any) => toast.error(`Erreur: ${error.message}`)
  });

  const filteredCourses = courses?.filter(c => 
    c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.category?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = [
    { label: "Formations", value: courses?.length || 0, icon: BookOpen, color: "text-primary", bg: "bg-primary/10" },
    { label: "Élèves Inscrits", value: courses?.reduce((acc, c) => acc + (c.purchases?.[0]?.count || 0), 0) || 0, icon: Users, color: "text-blue-600", bg: "bg-blue-500/10" },
    { label: "Catalogues Actifs", value: courses?.filter(c => c.status === 'published').length || 0, icon: Globe, color: "text-emerald-600", bg: "bg-emerald-500/10" },
    { label: "Modules Premium", value: courses?.filter(c => c.is_paid).length || 0, icon: DollarSign, color: "text-amber-600", bg: "bg-amber-500/10" }
  ];

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8 space-y-6 pb-16">
      {/* HEADER UNIFIÉ */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-border/40">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 text-[11px] font-semibold">
            <BookOpen className="w-3 h-3" /> Catalogue Pédagogique
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Gestion des Formations
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Pilotage du catalogue, des sessions et des programmes d'élite.
          </p>
        </div>
        <Link to="/admin/formations/new">
          <Button size="sm" className="h-10 px-4 rounded-xl font-semibold text-xs gap-2 shadow-xs">
            <Plus className="w-4 h-4" /> Nouvelle Formation
          </Button>
        </Link>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <Card key={i} className="rounded-2xl border border-border/50 bg-card p-4 sm:p-5 shadow-xs hover:border-primary/20 transition-colors">
            <div className="flex items-center gap-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${stat.bg} ${stat.color}`}>
                <stat.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">{stat.label}</p>
                <p className="text-2xl font-bold tracking-tight text-foreground">{stat.value}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* BARRE RECHERCHE & VUES */}
      <div className="flex flex-col sm:flex-row gap-3 items-center bg-card border border-border/50 p-3 rounded-2xl shadow-xs">
        <div className="relative flex-1 w-full group">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input 
            placeholder="Rechercher une formation..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-10 bg-transparent border-none focus-visible:ring-0 font-medium text-sm"
          />
        </div>
        <div className="flex items-center gap-1.5 bg-muted/50 p-1 rounded-xl border border-border/40">
           <Button variant="ghost" size="icon" onClick={() => setViewMode('grid')} className={`w-8 h-8 rounded-lg transition-all ${viewMode === 'grid' ? "bg-primary text-white shadow-xs" : "text-muted-foreground"}`}><LayoutGrid className="w-4 h-4" /></Button>
           <Button variant="ghost" size="icon" onClick={() => setViewMode('list')} className={`w-8 h-8 rounded-lg transition-all ${viewMode === 'list' ? "bg-primary text-white shadow-xs" : "text-muted-foreground"}`}><List className="w-4 h-4" /></Button>
        </div>
      </div>

      {/* GRILLE DES FORMATIONS */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-32 gap-4">
            <Loader2 className="w-12 h-12 animate-spin text-primary" />
            <p className="font-black uppercase italic tracking-widest text-xs animate-pulse">Scanning database...</p>
        </div>
      ) : filteredCourses?.length === 0 ? (
        <div className="text-center py-32 bg-muted/10 rounded-[4rem] border-2 border-dashed border-white/5">
            <AlertCircle className="w-16 h-16 mx-auto mb-6 opacity-20" />
            <h3 className="text-2xl font-black uppercase italic">Aucune formation détectée</h3>
            <p className="text-muted-foreground font-medium italic mt-2">Commencez par initialiser un nouveau cursus.</p>
        </div>
      ) : (
        <div className={cn(
            viewMode === 'grid' 
                ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8" 
                : "flex flex-col gap-4"
        )}>
          <AnimatePresence mode="popLayout">
            {filteredCourses?.map((course, idx) => (
              <motion.div
                key={course.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.4, delay: idx * 0.05 }}
              >
                {viewMode === 'grid' ? (
                  /* --- GRID CARD [ELITE DESIGN] --- */
                  <Card className="group rounded-[3rem] border-white/5 bg-card/60 backdrop-blur-md overflow-hidden hover:border-primary/40 hover:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.3)] transition-all duration-500 h-full flex flex-col">
                    <div className="relative aspect-video overflow-hidden">
                        <img src={course.thumbnail_url || "/placeholder.svg"} className="w-full h-full object-cover transition-transform duration-[2000ms] group-hover:scale-110" />
                        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
                        <div className="absolute top-6 left-6">
                            <Badge className={cn(
                                "font-black uppercase text-[8px] tracking-[0.2em] px-3 py-1 rounded-full border-none shadow-2xl",
                                course.status === 'published' ? "bg-emerald-500 text-white" : "bg-amber-500 text-white"
                            )}>
                                {course.status === 'published' ? 'Live // Public' : 'Draft // Interne'}
                            </Badge>
                        </div>
                        <div className="absolute bottom-6 right-6">
                            <div className="w-12 h-12 rounded-2xl bg-black/40 backdrop-blur-xl border border-white/10 flex items-center justify-center text-white">
                                <Users className="w-5 h-5 mr-1" /><span className="text-xs font-black italic">{course.purchases?.[0]?.count || 0}</span>
                            </div>
                        </div>
                    </div>
                    <CardContent className="p-8 flex-1 flex flex-col">
                        <div className="flex justify-between items-start mb-4">
                            <Badge variant="outline" className="text-[9px] font-black uppercase tracking-[0.2em] border-primary/20 text-primary">
                                {course.category || "FORMATION"}
                            </Badge>
                            <span className="text-xl font-black italic text-foreground">{course.is_paid ? `${course.price}$` : "Libre"}</span>
                        </div>
                        <h3 className="text-xl font-black uppercase tracking-tight italic group-hover:text-primary transition-colors leading-tight mb-2">{course.title}</h3>
                        <p className="text-xs text-muted-foreground line-clamp-2 mb-4">{course.description}</p>
                        
                        {/* CRÉNEAUX DISPONIBLES */}
                        <div className="flex items-center gap-2 mb-4">
                          <span className="text-[9px] font-black uppercase text-muted-foreground">Créneaux :</span>
                          <div className="flex gap-1.5">
                            <Badge variant="secondary" className="text-[8px] font-bold">Matin</Badge>
                            <Badge variant="secondary" className="text-[8px] font-bold">Midi</Badge>
                            <Badge variant="secondary" className="text-[8px] font-bold">Soir</Badge>
                          </div>
                        </div>

                        {/* ACTION RAPIDE VOIR LES ÉTUDIANTS */}
                        <div className="mt-auto pt-4 border-t border-white/5 space-y-3">
                            <Link to={`/admin/attendance`} className="w-full">
                              <Button variant="outline" size="sm" className="w-full h-10 rounded-xl font-black text-[10px] uppercase tracking-wider border-primary/30 text-primary hover:bg-primary/10">
                                <Users className="w-3.5 h-3.5 mr-2" /> Voir les {course.purchases?.[0]?.count || 0} Inscrits & Présences
                              </Button>
                            </Link>

                            <div className="flex items-center justify-between gap-4">
                                <div className="flex items-center gap-2">
                                    <Button size="icon" variant="ghost" onClick={() => navigate(`/admin/formations/${course.id}/edit`)} className="rounded-xl hover:bg-primary/10 hover:text-primary" title="Modifier le cours"><Edit className="w-4 h-4" /></Button>
                                    <Button size="icon" variant="ghost" onClick={() => togglePublishMutation.mutate({ id: course.id, status: course.status })} className="rounded-xl hover:bg-blue-500/10 hover:text-blue-500" title={course.status === 'published' ? 'Dépublier' : 'Publier'}>
                                        {course.status === 'published' ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </Button>
                                </div>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="rounded-xl"><MoreVertical className="w-4 h-4" /></Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-56 p-2 rounded-2xl bg-card border-white/10 shadow-2xl">
                                        <DropdownMenuItem onClick={() => navigate(`/formations/${course.id}`)} className="gap-3 p-3 rounded-xl cursor-pointer">
                                            <Globe className="w-4 h-4" /> Voir sur le site
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => navigate(`/admin/enrollment`)} className="gap-3 p-3 rounded-xl cursor-pointer">
                                            <Users className="w-4 h-4" /> Inscrire un étudiant
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem 
                                            onClick={() => { 
                                              const count = course.purchases?.[0]?.count || 0;
                                              if (count > 0) {
                                                alert(`Impossible de supprimer cette formation car ${count} étudiant(s) y sont actuellement inscrit(s).`);
                                                return;
                                              }
                                              if(confirm("Supprimer cette formation ?")) deleteMutation.mutate(course.id);
                                            }} 
                                            className="gap-3 p-3 rounded-xl cursor-pointer text-destructive hover:bg-destructive/10"
                                        >
                                            <Trash2 className="w-4 h-4" /> Supprimer
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>
                    </CardContent>
                  </Card>
                ) : (
                  /* --- LIST VIEW [TECH TABLE] --- */
                  <div className="group relative p-4 rounded-2xl bg-card border border-white/5 hover:border-primary/20 transition-all flex items-center gap-6">
                    <div className="w-20 h-14 rounded-xl overflow-hidden flex-shrink-0">
                        <img src={course.thumbnail_url || "/placeholder.svg"} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h4 className="font-black uppercase tracking-tight italic truncate text-sm">{course.title}</h4>
                        <div className="flex items-center gap-4 mt-1">
                            <span className="text-[9px] font-bold text-muted-foreground uppercase">{course.category}</span>
                            <span className="text-[9px] font-black text-primary italic">{course.price}$</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-8 px-6 border-x border-white/5">
                        <div className="text-center">
                            <p className="text-[8px] font-black text-muted-foreground uppercase">Élèves</p>
                            <p className="text-sm font-black italic">{course.purchases?.[0]?.count || 0}</p>
                        </div>
                        <Badge className={cn("text-[8px] font-black uppercase tracking-widest", course.status === 'published' ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-amber-500/10 text-amber-500 border-amber-500/20")}>
                            {course.status}
                        </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button size="icon" variant="ghost" onClick={() => navigate(`/admin/formations/${course.id}/edit`)} className="w-10 h-10 rounded-xl"><Edit className="w-4 h-4" /></Button>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="w-10 h-10 rounded-xl"><MoreVertical className="w-4 h-4" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56 p-2 rounded-2xl">
                                <DropdownMenuItem onClick={() => togglePublishMutation.mutate({ id: course.id, status: course.status })} className="gap-3 p-3 rounded-xl">
                                    {course.status === 'published' ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />} {course.status === 'published' ? 'Dépublier' : 'Publier'}
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                    onClick={() => { if(confirm("Supprimer ?")) deleteMutation.mutate(course.id) }} 
                                    className="gap-3 p-3 rounded-xl text-destructive"
                                >
                                    <Trash2 className="w-4 h-4" /> Supprimer
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

export default FormationManagement;
