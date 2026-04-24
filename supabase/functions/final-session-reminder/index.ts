import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getFinalReminderTemplate } from "../_shared/templates.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

serve(async (req) => {
    try {
        const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
        
        // 1. Récupérer les inscriptions actives non soldées
        const { data: enrollments, error: fetchError } = await supabase
            .from("purchases")
            .select(`
                id, 
                paid_amount,
                total_amount,
                created_at,
                courses (title, estimated_duration),
                course_sessions (start_date, end_date),
                profiles (full_name, email)
            `)
            .eq("enrollment_status", "active")
            .gt("total_amount", 0);

        if (fetchError) throw fetchError;

        const sent = [];
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        for (const record of enrollments || []) {
            const balance = (record.total_amount || 0) - (record.paid_amount || 0);
            if (balance <= 0) continue;

            // Calcul de la date de fin
            let endDate: Date;
            if (record.course_sessions?.end_date) {
                endDate = new Date(record.course_sessions.end_date);
            } else {
                // Si pas de date de fin explicite, on calcule : début + durée
                const start = new Date(record.course_sessions?.start_date || record.created_at);
                const duration = parseInt(record.courses?.estimated_duration) || 30;
                endDate = new Date(start);
                endDate.setDate(start.getDate() + duration);
            }
            endDate.setHours(0, 0, 0, 0);

            // Calcul du nombre de jours restants avant la fin
            const diffTime = endDate.getTime() - today.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            // SI NOUS SOMMES À EXACTEMENT 3 JOURS DE LA FIN
            if (diffDays === 3) {
                const html = getFinalReminderTemplate(record.profiles.full_name, record.courses.title, balance);
                
                await fetch("https://api.resend.com/emails", {
                    method: "POST",
                    headers: { "Content-Type": "application/json", Authorization: `Bearer ${RESEND_API_KEY}` },
                    body: JSON.stringify({ 
                        from: "Botes Academy <billing@botes.academy>", 
                        to: [record.profiles.email], 
                        subject: `🚨 Urgent : 3 jours restants pour solder votre formation`, 
                        html 
                    }),
                });
                sent.push(record.profiles.email);
            }
        }

        return new Response(JSON.stringify({ success: true, count: sent.length, emails: sent }), { status: 200 });
    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
});
