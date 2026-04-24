import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { getWelcomeTemplate } from "../_shared/templates.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
    if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

    try {
        const { fullName, email, courseTitle, resetLink } = await req.json();
        if (!fullName || !email) throw new Error("Informations manquantes.");

        const html = getWelcomeTemplate(fullName, courseTitle || 'Premium Training', resetLink);

        const res = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${RESEND_API_KEY}`,
            },
            body: JSON.stringify({
                from: "Botes Academy <notifications@botes.academy>",
                to: [email],
                subject: `Bienvenue sur Botes Academy — Activez votre compte`,
                html,
            }),
        });

        return new Response(JSON.stringify(await res.json()), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: res.ok ? 200 : 500,
        });
    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 500,
        });
    }
});
