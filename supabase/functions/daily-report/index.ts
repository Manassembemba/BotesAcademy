import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { getDailyReportTemplate } from "../notification-service/templates.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

serve(async (req) => {
    try {
        const now = new Date();
        const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();

        // 1. Fetch Stats
        // New students
        const { count: newStudents } = await supabase
            .from("profiles")
            .select("*", { count: "exact", head: true })
            .gt("created_at", yesterday);

        // Revenue (approved payments)
        const { data: payments } = await supabase
            .from("payment_proofs")
            .select("amount")
            .eq("status", "approved")
            .gt("updated_at", yesterday);
        
        const revenue = payments?.reduce((acc, p) => acc + (Number(p.amount) || 0), 0) || 0;

        // Absences
        const { count: absences } = await supabase
            .from("attendance")
            .select("*", { count: "exact", head: true })
            .eq("status", "absent")
            .gt("created_at", yesterday);

        // New comments
        const { count: comments } = await supabase
            .from("comments")
            .select("*", { count: "exact", head: true })
            .gt("created_at", yesterday);

        // 2. Get Admin Emails
        const { data: adminRoles } = await supabase
            .from("user_roles")
            .select("user_id")
            .eq("role", "admin");
        
        const adminEmails: string[] = [];
        if (adminRoles) {
            for (const r of adminRoles) {
                const { data: a } = await supabase.auth.admin.getUserById(r.user_id);
                if (a?.user?.email) adminEmails.push(a.user.email);
            }
        }

        if (adminEmails.length === 0) {
            return new Response("No admins found", { status: 200 });
        }

        // 3. Generate Template
        const html = getDailyReportTemplate({
            newStudents: newStudents || 0,
            revenue: revenue.toFixed(2),
            absences: absences || 0,
            comments: comments || 0
        });

        // 4. Send Email
        const res = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${RESEND_API_KEY}`,
            },
            body: JSON.stringify({
                from: "Botes Academy <reports@botes.academy>",
                to: adminEmails,
                subject: `📊 Rapport Quotidien Botes Academy - ${now.toLocaleDateString('fr-FR')}`,
                html: html,
            }),
        });

        const resData = await res.json();
        return new Response(JSON.stringify(resData), { status: 200 });

    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
});
