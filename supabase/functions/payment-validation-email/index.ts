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
        
        // Données : userId, courseTitle, status ('approved' | 'rejected'), adminNote
        const { userId, courseTitle, status, adminNote } = payload;

        const { data: user } = await supabase.from("profiles").select("full_name, email").eq("id", userId).single();
        if (!user) throw new Error("Utilisateur introuvable");

        const isApproved = status === 'approved';
        const subject = isApproved ? `✅ Paiement validé — ${courseTitle}` : `⚠️ Action requise : Paiement refusé — ${courseTitle}`;

        const html = `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 40px; border-radius: 20px; background-color: #ffffff; border: 1px solid #e2e8f0;">
            <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #3b82f6; font-size: 24px; margin: 0;">BOTES ACADEMY</h1>
            </div>

            <h2 style="color: #1e293b;">Bonjour ${user.full_name},</h2>

            <p style="font-size: 15px; line-height: 1.6; color: #475569;">
                Nous avons examiné votre preuve de paiement pour la formation <strong>${courseTitle}</strong>.
            </p>

            <div style="padding: 20px; border-radius: 12px; margin: 25px 0; border: 1px solid ${isApproved ? '#10b981' : '#ef4444'}; background-color: ${isApproved ? '#f0fdf4' : '#fef2f2'};">
                <p style="margin: 0; font-weight: 700; color: ${isApproved ? '#166534' : '#991b1b'}; font-size: 16px;">
                    Statut : ${isApproved ? 'APPROUVÉ' : 'REFUSÉ'}
                </p>
                ${adminNote ? `<p style="margin-top: 10px; font-size: 14px; color: #475569; border-top: 1px solid #e2e8f0; padding-top: 10px;"><strong>Note de l'administration :</strong><br/>${adminNote}</p>` : ''}
            </div>

            ${isApproved ? `
                <p style="color: #475569; font-size: 14px;">Votre accès est désormais actif. Vous pouvez commencer vos leçons immédiatement.</p>
                <div style="text-align: center; margin-top: 30px;">
                    <a href="${SUPABASE_URL}" style="background-color: #1e293b; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">Accéder au cours</a>
                </div>
            ` : `
                <p style="color: #475569; font-size: 14px;">Veuillez soumettre une nouvelle preuve de paiement valide (capture d'écran lisible du transfert) depuis votre tableau de bord.</p>
            `}

            <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 30px 0;" />
            <p style="text-align: center; font-size: 11px; color: #94a3b8;">Botes Academy &mdash; Support Billing</p>
        </div>
        `;

        await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${RESEND_API_KEY}` },
            body: JSON.stringify({ from: "Botes Academy <billing@botes.academy>", to: [user.email], subject, html }),
        });

        return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 });
    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 });
    }
});
