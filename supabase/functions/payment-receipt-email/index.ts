import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getReceiptTemplate } from "../_shared/templates.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
    if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

    try {
        const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
        const { userId, courseTitle, amount, paymentMethod, balance } = await req.json();

        const { data: user } = await supabase.from("profiles").select("full_name, email").eq("id", userId).single();
        if (!user) throw new Error("Utilisateur introuvable");

        const html = getReceiptTemplate(user.full_name, courseTitle, amount, paymentMethod, balance);

        await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${RESEND_API_KEY}` },
            body: JSON.stringify({
                from: "Botes Academy <billing@botes.academy>",
                to: [user.email],
                subject: `Reçu de paiement — ${courseTitle}`,
                html,
            }),
        });

        return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 });
    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 });
    }
});
