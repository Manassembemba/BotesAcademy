import { useState, useEffect } from "react";
import { Bell, Check, Trash2, ExternalLink } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'course' | 'payment' | 'comment';
  link: string | null;
  read_at: string | null;
  created_at: string;
}

export const NotificationBell = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);

  // Fetch notifications
  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await (supabase as any)
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (error) throw error;
      return data as Notification[];
    },
    enabled: !!user,
  });

  const unreadCount = notifications.filter(n => !n.read_at).length;

  // Real-time subscription
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('notifications_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['notifications', user.id] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient]);

  // Mutations
  const markAsReadMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const { error } = await (supabase as any).rpc('mark_all_notifications_read', {
        p_user_id: user?.id
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] });
      toast.success("Toutes les notifications ont été marquées comme lues.");
    },
  });

  const getTypeStyles = (type: string) => {
    switch (type) {
      case 'payment': return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20";
      case 'course': return "bg-primary/10 text-primary border-primary/20";
      case 'warning': return "bg-warning/10 text-warning border-warning/20";
      case 'error': return "bg-destructive/10 text-destructive border-destructive/20";
      default: return "bg-muted text-muted-foreground border-border";
    }
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative hover:bg-primary/10 transition-colors rounded-xl">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <Badge 
              className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center p-0 text-[10px] font-black border-2 border-background animate-pulse"
              variant="destructive"
            >
              {unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0 overflow-hidden rounded-2xl bg-card border-border/50 shadow-2xl backdrop-blur-xl">
        <div className="flex items-center justify-between p-4 border-b border-border/50 bg-muted/30">
          <h3 className="font-black uppercase tracking-tighter italic text-sm">Notifications</h3>
          {unreadCount > 0 && (
            <Button 
                variant="ghost" 
                size="sm" 
                className="h-7 text-[10px] font-bold uppercase tracking-tight hover:text-primary"
                onClick={() => markAllAsReadMutation.mutate()}
            >
              Tout lire
            </Button>
          )}
        </div>
        
        <ScrollArea className="h-80">
          {notifications.length === 0 ? (
            <div className="p-8 text-center flex flex-col items-center gap-3">
              <Bell className="w-8 h-8 opacity-20" />
              <p className="text-xs text-muted-foreground font-medium italic">Aucune notification pour le moment.</p>
            </div>
          ) : (
            <div className="flex flex-col">
              {notifications.map((n) => (
                <div 
                  key={n.id} 
                  className={cn(
                    "p-4 border-b border-border/30 transition-colors hover:bg-muted/50 relative group",
                    !n.read_at && "bg-primary/5 before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1 before:bg-primary"
                  )}
                >
                  <div className="flex justify-between items-start mb-1">
                    <Badge variant="outline" className={cn("text-[8px] h-4 px-1.5 uppercase font-black", getTypeStyles(n.type))}>
                      {n.type}
                    </Badge>
                    <span className="text-[9px] text-muted-foreground font-medium">
                      {formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: fr })}
                    </span>
                  </div>
                  <h4 className="text-sm font-black uppercase tracking-tight italic leading-tight mb-1">{n.title}</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{n.message}</p>
                  
                  <div className="flex gap-2 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    {!n.read_at && (
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-6 px-2 text-[9px] font-bold gap-1 rounded-lg"
                            onClick={() => markAsReadMutation.mutate(n.id)}
                        >
                            <Check className="w-3 h-3" /> Lu
                        </Button>
                    )}
                    {n.link && (
                        <Button 
                            variant="default" 
                            size="sm" 
                            className="h-6 px-2 text-[9px] font-bold gap-1 rounded-lg"
                            onClick={() => {
                                window.location.href = n.link!;
                                markAsReadMutation.mutate(n.id);
                            }}
                        >
                            <ExternalLink className="w-3 h-3" /> Voir
                        </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
        <div className="p-2 border-t border-border/50 bg-muted/20 text-center">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Centre de Notifications Botes</p>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
