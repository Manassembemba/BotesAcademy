import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Megaphone, Calendar } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export const AnnouncementsWidget = () => {
  const { data: announcements, isLoading } = useQuery({
    queryKey: ['announcements'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(3);
      if (error) throw error;
      return data;
    }
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2].map(i => (
          <Skeleton key={i} className="h-24 w-full rounded-2xl" />
        ))}
      </div>
    );
  }

  if (!announcements || announcements.length === 0) {
    return (
      <Card className="p-8 text-center bg-muted/5 border-dashed border-2 rounded-3xl">
        <Megaphone className="w-8 h-8 mx-auto mb-2 opacity-20" />
        <p className="text-xs text-muted-foreground font-medium italic">Aucune annonce pour le moment.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {announcements.map((announcement) => (
        <Card key={announcement.id} className="p-6 border-none bg-card/10 backdrop-blur-md rounded-3xl shadow-premium group hover:bg-card/20 transition-all duration-500 overflow-hidden relative border border-white/5">
          {/* Accent decoration */}
          <div className="absolute top-0 left-0 w-1 h-full bg-primary/20 group-hover:bg-primary transition-colors" />
          
          <div className="flex flex-col gap-4">
            <div className="flex items-start justify-between">
              <div className="p-2.5 bg-primary/10 rounded-xl text-primary">
                <Megaphone className="w-5 h-5" />
              </div>
              <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-wider border-primary/20 text-primary px-2.5 py-0.5 rounded-full">
                Nouveau
              </Badge>
            </div>
            
            <div className="space-y-1.5">
              <h4 className="font-bold text-sm text-foreground tracking-tight group-hover:text-primary transition-colors">{announcement.title}</h4>
              <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
                {announcement.message}
              </p>
            </div>

            <div className="pt-2 border-t border-border/40 flex items-center justify-between">
              <span className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                {format(new Date(announcement.created_at), 'dd MMMM yyyy', { locale: fr })}
              </span>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};
