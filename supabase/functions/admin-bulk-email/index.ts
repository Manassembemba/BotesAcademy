import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
        const payload = await req.json();
        const { userIds, subject, message } = payload;

        if (!userIds || !subject || !message) {
            throw new Error("Informations manquantes (userIds, subject, message requis).");
        }

        // 1. Récupérer les emails des utilisateurs
        const { data: users, error: fetchError } = await supabase
            .from("profiles")
            .select("id, full_name, email")
            .in("id", userIds);

        if (fetchError) throw fetchError;
        if (!users || users.length === 0) throw new Error("Aucun utilisateur trouvé.");

        // 2. Envoyer les emails via Resend (en batch ou individuellement)
        // Note: Resend supporte jusqu'à 50 destinataires par appel
        const emails = users.map(u => u.email).filter(Boolean);

        const html = `
        <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: auto; padding: 30px;
                    border: 1px solid #e2e8f0; border-radius: 20px; background:#ffffff;">
          <div style="text-align: center; margin-bottom: 24px;">
            <h1 style="color: #3b82f6; margin: 0; font-size: 28px; letter-spacing: -1px;">BOTES ACADEMY</h1>
          </div>
          <p style="color: #475569; line-height: 1.7; font-size: 16px; white-space: pre-wrap;">
            ${message}
          </p>
          <hr style="border:none; border-top:1px solid #f1f5f9; margin: 30px 0;"/>
          <p style="color:#cbd5e1; font-size:11px; text-align:center;">
            Botes Academy &mdash; Formation Trading &amp; Investissement.
          </p>
        </div>
        `;

        const res = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${RESEND_API_KEY}`,
            },
            body: JSON.stringify({
                from: "Botes Academy <notifications@botes.academy>",
                to: emails,
                subject: subject,
                html,
            }),
        });

        const resData = await res.json();
        
        return new Response(JSON.stringify({ success: true, data: resData }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
        });
    } catch (error) {
        console.error(JSON.stringify({ step: 'BULK_EMAIL', status: 'ERROR', message: error.message }))
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 500,
        });
    }
});
