import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getReminderTemplate } from "../_shared/templates.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

serve(async (req) => {
    try {
        const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
        const { data: enrollments } = await supabase
            .from("purchases")
            .select(`
                id, 
                paid_amount,
                total_amount,
                created_at,
                courses (title, estimated_duration),
                course_sessions (start_date),
                profiles (full_name, email)
            `)
            .eq("enrollment_status", "active");

        const sent = [];
        for (const record of enrollments || []) {
            const balance = (record.total_amount || 0) - (record.paid_amount || 0);
            if (balance <= 0) continue;

            const startDate = new Date(record.course_sessions?.start_date || record.created_at);
            const duration = parseInt(record.courses?.estimated_duration) || 30;
            const midPoint = Math.floor(duration / 2);
            
            const daysSinceStart = Math.ceil(Math.abs(new Date().getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

            if (daysSinceStart === midPoint) {
                const html = getReminderTemplate(record.profiles.full_name, record.courses.title, balance);
                await fetch("https://api.resend.com/emails", {
                    method: "POST",
                    headers: { "Content-Type": "application/json", Authorization: `Bearer ${RESEND_API_KEY}` },
                    body: JSON.stringify({ from: "Botes Academy <billing@botes.academy>", to: [record.profiles.email], subject: `📌 Rappel : Solde de formation — ${record.courses.title}`, html }),
                });
                sent.push(record.profiles.email);
            }
        }
        return new Response(JSON.stringify({ success: true, sent }), { status: 200 });
    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
});
