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
    if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

    try {
        const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
        const payload = await req.json();
        const { userId, courseId } = payload;

        // 1. Récupérer les infos
        const { data: user } = await supabase.from("profiles").select("full_name, email, matricule").eq("id", userId).single();
        const { data: course } = await supabase.from("courses").select("title").eq("id", courseId).single();

        if (!user || !course) throw new Error("Données manquantes");

        const subject = `🏆 Félicitations ! Vous avez complété ${course.title}`;

        const html = `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 40px; border-radius: 24px; background-color: #f8fafc; border: 1px solid #e2e8f0; text-align: center;">
            <p style="color: #3b82f6; font-weight: 800; letter-spacing: 2px; margin-bottom: 10px; font-size: 12px;">CERTIFICATION OFFICIELLE</p>
            <h1 style="color: #1e293b; font-size: 28px; margin: 0 0 20px 0;">BOTES ACADEMY</h1>
            
            <div style="background-color: #ffffff; padding: 40px; border-radius: 20px; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); border-top: 5px solid #3b82f6;">
                <h2 style="color: #1e293b; margin-bottom: 10px;">Bravo, ${user.full_name} !</h2>
                <p style="color: #64748b; font-size: 16px; line-height: 1.6;">
                    Nous avons le plaisir de vous confirmer la réussite totale de votre cursus :
                </p>
                <p style="font-size: 20px; font-weight: 800; color: #3b82f6; margin: 20px 0; text-transform: uppercase;">
                    ${course.title}
                </p>
                <div style="margin: 30px 0; padding: 15px; border: 1px dashed #cbd5e1; border-radius: 10px;">
                    <p style="margin: 0; font-size: 12px; color: #94a3b8;">ID CERTIFICAT : BA-${courseId.slice(0, 4)}-${userId.slice(0, 4)}</p>
                    <p style="margin: 5px 0 0 0; font-size: 12px; color: #94a3b8;">MATRICULE ÉLÈVE : ${user.matricule || 'N/A'}</p>
                </div>
                <p style="color: #475569; font-size: 14px;">Votre certificat officiel est désormais disponible dans votre espace personnel.</p>
                <a href="${SUPABASE_URL}/dashboard" style="display: inline-block; margin-top: 25px; background-color: #3b82f6; color: #ffffff; padding: 14px 30px; border-radius: 12px; text-decoration: none; font-weight: 700;">Télécharger mon certificat</a>
            </div>

            <p style="margin-top: 30px; font-size: 13px; color: #64748b;">
                C'est une étape majeure dans votre parcours de trader d'élite.<br/>Continuez à viser l'excellence.
            </p>
        </div>
        `;

        await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${RESEND_API_KEY}` },
            body: JSON.stringify({ from: "Botes Academy <academic@botes.academy>", to: [user.email], subject, html }),
        });

        return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 });
    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 });
    }
});
