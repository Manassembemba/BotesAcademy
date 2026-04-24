import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send, Loader2, MessageSquare, User } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface Message {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  profiles: {
    full_name: string;
    avatar_url: string | null;
  };
}

interface CourseChatProps {
  courseId: string;
}

export const CourseChat = ({ courseId }: CourseChatProps) => {
  const { user, role } = useAuth();
  const queryClient = useQueryClient();
  const [newMessage, setNewMessage] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: messages, isLoading } = useQuery({
    queryKey: ['course-messages', courseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('course_messages')
        .select(`
          *,
          profiles:user_id (full_name, avatar_url)
        `)
        .eq('course_id', courseId)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      return data as unknown as Message[];
    },
  });

  // Subscribe to new messages
  useEffect(() => {
    const channel = supabase
      .channel(`course-chat-${courseId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'course_messages',
          filter: `course_id=eq.${courseId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['course-messages', courseId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [courseId, queryClient]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      const { error } = await supabase.from('course_messages').insert({
        course_id: courseId,
        user_id: user?.id,
        content,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setNewMessage("");
    },
    onError: (error: any) => {
      toast.error("Erreur lors de l'envoi : " + error.message);
    },
  });

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || sendMessageMutation.isPending) return;
    sendMessageMutation.mutate(newMessage.trim());
  };

  return (
    <div className="flex flex-col h-[600px] bg-card/50 backdrop-blur-sm rounded-[2.5rem] border border-primary/10 shadow-lg overflow-hidden">
      <div className="p-6 border-b border-primary/10 bg-primary/5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/20 rounded-xl text-primary">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-black uppercase italic tracking-tighter">Forum d'entraide</h3>
            <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Posez vos questions aux formateurs</p>
          </div>
        </div>
      </div>

      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-thin scrollbar-thumb-primary/10"
      >
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : messages?.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full opacity-40 space-y-2">
            <MessageSquare className="w-12 h-12" />
            <p className="font-black italic uppercase text-xs tracking-widest">Aucun message pour le moment</p>
          </div>
        ) : (
          messages?.map((msg) => {
            const isOwn = msg.user_id === user?.id;
            return (
              <div key={msg.id} className={`flex gap-3 ${isOwn ? 'flex-row-reverse' : ''}`}>
                <Avatar className="h-8 w-8 shrink-0 border border-primary/10">
                  <AvatarImage src={msg.profiles?.avatar_url || ''} />
                  <AvatarFallback className="text-[10px] font-bold">
                    {msg.profiles?.full_name?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className={`flex flex-col max-w-[80%] ${isOwn ? 'items-end' : ''}`}>
                  <div className="flex items-center gap-2 mb-1 px-1">
                    <span className="text-[10px] font-black uppercase tracking-tighter text-muted-foreground">
                      {msg.profiles?.full_name}
                    </span>
                    <span className="text-[9px] font-bold text-muted-foreground/50">
                      {format(new Date(msg.created_at), 'HH:mm', { locale: fr })}
                    </span>
                  </div>
                  <div className={`p-3 rounded-2xl text-sm font-medium shadow-sm ${
                    isOwn 
                      ? 'bg-primary text-white rounded-tr-none' 
                      : 'bg-muted/50 text-foreground rounded-tl-none border border-border/50'
                  }`}>
                    {msg.content}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <form onSubmit={handleSend} className="p-4 bg-muted/30 border-t border-primary/10 flex gap-2">
        <Input 
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Posez votre question ici..."
          className="rounded-xl bg-background border-primary/10 focus:border-primary"
        />
        <Button 
          type="submit" 
          size="icon" 
          className="rounded-xl shrink-0 shadow-glow-primary"
          disabled={!newMessage.trim() || sendMessageMutation.isPending}
        >
          {sendMessageMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </Button>
      </form>
    </div>
  );
};
