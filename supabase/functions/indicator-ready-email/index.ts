import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getMT5IndicatorReadyTemplate } from "../_shared/templates.ts";

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
        const { purchaseId } = await req.json();

        // 1. Récupérer les infos de l'achat, de l'utilisateur et de l'indicateur
        const { data: purchase, error: pError } = await supabase
            .from("indicator_purchases")
            .select(`
                user_id,
                mt5_id,
                indicators (name),
                profiles (full_name, email)
            `)
            .eq("id", purchaseId)
            .single();

        if (pError || !purchase) throw new Error("Achat introuvable");

        const html = getMT5IndicatorReadyTemplate(
            purchase.profiles.full_name,
            purchase.indicators.name,
            purchase.mt5_id || "Non spécifié"
        );

        await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${RESEND_API_KEY}` },
            body: JSON.stringify({
                from: "Botes Academy <tech@botes.academy>",
                to: [purchase.profiles.email],
                subject: `🚀 Votre indicateur MT5 est prêt : ${purchase.indicators.name}`,
                html,
            }),
        });

        return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 });
    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 });
    }
});
