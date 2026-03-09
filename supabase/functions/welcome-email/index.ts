import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const payload = await req.json();
        const { fullName, email, password, courseTitle } = payload;

        if (!fullName || !email || !password) {
            throw new Error("Informations d'identification manquantes.");
        }

        const subject = `Bienvenue sur Botes Academy ! - Vos identifiants`;
        const html = `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 30px; border: 1px solid #e2e8f0; border-radius: 20px; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 20px;">
            <h1 style="color: #3b82f6; margin: 0;">BOTES ACADEMY</h1>
            <p style="color: #64748b; font-size: 14px;">Votre succès commence ici.</p>
          </div>
          
          <h2 style="color: #1e293b; border-bottom: 2px solid #3b82f6; display: inline-block; padding-bottom: 5px;">Bienvenue ${fullName} !</h2>
          
          <p style="color: #475569; line-height: 1.6;">Votre compte a été créé avec succès par notre équipe d'administration. Vous avez été inscrit à la formation : <strong>${courseTitle || "Premium Training"}</strong>.</p>
          
          <div style="background-color: #f8fafc; padding: 20px; border-radius: 12px; border: 1px dashed #cbd5e1; margin: 25px 0;">
            <p style="margin: 0 0 10px 0; font-weight: bold; color: #1e293b;">Vos accès confidentiels :</p>
            <p style="margin: 5px 0;"><strong>📧 Email :</strong> ${email}</p>
            <p style="margin: 5px 0;"><strong>🔑 Mot de passe :</strong> <span style="background-color: #e2e8f0; padding: 2px 6px; border-radius: 4px; font-family: monospace;">${password}</span></p>
          </div>

          <p style="color: #475569; font-size: 14px;">Nous vous recommandons de changer votre mot de passe après votre première connexion.</p>

          <div style="text-align: center; margin-top: 30px;">
            <a href="https://botesacademy.com/auth" style="background-color: #3b82f6; color: white; padding: 14px 28px; text-decoration: none; border-radius: 10px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 6px -1px rgba(59, 130, 246, 0.5);">Se connecter au Dashboard</a>
          </div>

          <hr style="margin-top: 40px; border: none; border-top: 1px solid #e2e8f0;" />
          
          <p style="color: #94a3b8; font-size: 12px; text-align: center; margin-top: 20px;">
            Botes Academy - Formation en Trading & Investissement.<br/>
            Ceci est un message automatique, merci de ne pas y répondre.
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
                from: "Botes Academy <notifications@botesacademy.com>",
                to: [email],
                subject: subject,
                html: html,
            }),
        });

        const resData = await res.json();
        
        return new Response(JSON.stringify(resData), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 500,
        });
    }
});
