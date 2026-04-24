import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bell, BellRing, Check, Info, AlertCircle, CreditCard, MessageSquare } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

export const NotificationCenter = () => {
  const queryClient = useQueryClient();
  const { data: notifications, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);
      if (error) throw error;
      return data;
    }
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
  });

  const unreadCount = notifications?.filter(n => !n.read_at).length || 0;

  const getIcon = (type: string) => {
    switch (type) {
      case 'success': return <Check className="w-4 h-4 text-emerald-500" />;
      case 'payment': return <CreditCard className="w-4 h-4 text-primary" />;
      case 'warning': return <AlertCircle className="w-4 h-4 text-amber-500" />;
      case 'comment': return <MessageSquare className="w-4 h-4 text-blue-500" />;
      default: return <Info className="w-4 h-4 text-muted-foreground" />;
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative rounded-full hover:bg-primary/10 group">
          {unreadCount > 0 ? (
            <BellRing className="w-5 h-5 text-primary animate-pulse" />
          ) : (
            <Bell className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
          )}
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-primary text-[10px] font-black border-2 border-background">
              {unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0 bg-card/80 backdrop-blur-xl border-border/40 rounded-3xl shadow-2xl overflow-hidden" align="end">
        <div className="p-4 border-b border-border/10 flex items-center justify-between bg-primary/5">
          <h3 className="font-black uppercase text-xs tracking-widest italic flex items-center gap-2">
            <Bell className="w-3 h-3 text-primary" />
            Notifications
          </h3>
          {unreadCount > 0 && (
            <span className="text-[10px] font-bold text-primary italic">{unreadCount} non lues</span>
          )}
        </div>
        <ScrollArea className="h-80">
          {isLoading ? (
            <div className="p-4 space-y-4">
               {[1,2,3].map(i => <div key={i} className="h-12 bg-muted/20 animate-pulse rounded-xl" />)}
            </div>
          ) : notifications?.length === 0 ? (
            <div className="p-8 text-center space-y-2">
              <Bell className="w-8 h-8 mx-auto opacity-10" />
              <p className="text-xs text-muted-foreground italic">Aucune notification.</p>
            </div>
          ) : (
            <div className="divide-y divide-border/10">
              {notifications?.map((notification) => (
                <div 
                  key={notification.id} 
                  className={`p-4 transition-colors hover:bg-primary/5 cursor-pointer relative group ${!notification.read_at && 'bg-primary/[0.02]'}`}
                  onClick={() => !notification.read_at && markAsReadMutation.mutate(notification.id)}
                >
                  <div className="flex gap-3">
                    <div className="mt-1">{getIcon(notification.type)}</div>
                    <div className="flex-1 space-y-1">
                      <p className={`text-xs font-bold leading-tight ${!notification.read_at ? 'text-foreground' : 'text-muted-foreground'}`}>
                        {notification.title}
                      </p>
                      <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">
                        {notification.message}
                      </p>
                      <p className="text-[9px] text-muted-foreground/50 font-medium">
                        {format(new Date(notification.created_at), 'dd MMM à HH:mm', { locale: fr })}
                      </p>
                    </div>
                    {!notification.read_at && (
                      <div className="w-2 h-2 rounded-full bg-primary mt-1 shadow-[0_0_8px_rgba(var(--primary),0.5)]" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
        <div className="p-2 border-t border-border/10 bg-muted/10">
          <Button variant="ghost" className="w-full h-8 text-[9px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary rounded-xl">
            Voir tout l'historique
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};
