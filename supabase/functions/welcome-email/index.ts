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
        const { fullName, email, courseTitle, resetLink } = payload;

        if (!fullName || !email) {
            throw new Error("Informations manquantes (fullName, email requis).");
        }

        const subject = `Bienvenue sur Botes Academy — Activez votre compte`;

        // Bloc du bouton d'activation (affiché uniquement si le lien existe)
        const ctaBlock = resetLink ? `
          <div style="text-align:center; margin: 30px 0;">
            <a href="${resetLink}"
               style="display:inline-block; background-color:#3b82f6; color:#ffffff; font-weight:bold;
                      font-size:16px; padding:14px 32px; border-radius:12px; text-decoration:none;
                      letter-spacing:0.5px;">
              🔑 Définir mon mot de passe
            </a>
          </div>
          <p style="color:#64748b; font-size:12px; text-align:center;">Ce lien est valable 24h. Si vous ne l'avez pas demandé, ignorez cet email.</p>
        ` : `
          <div style="background-color:#fef3c7; padding:16px; border-radius:12px; border:1px solid #fde68a; margin:20px 0;">
            <p style="margin:0; color:#92400e; font-size:13px;">⚠️ Le lien d'activation n'a pas pu être généré. Contactez l'administrateur.</p>
          </div>
        `

        const html = `
        <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: auto; padding: 30px;
                    border: 1px solid #e2e8f0; border-radius: 20px; background:#ffffff;
                    box-shadow: 0 10px 15px -3px rgba(0,0,0,0.08);">

          <div style="text-align: center; margin-bottom: 24px;">
            <h1 style="color: #3b82f6; margin: 0; font-size: 28px; letter-spacing: -1px;">BOTES ACADEMY</h1>
            <p style="color: #94a3b8; font-size: 13px; margin-top: 4px;">Votre succès commence ici.</p>
          </div>

          <h2 style="color: #1e293b; font-size: 20px;">Bienvenue, ${fullName} ! 🎉</h2>

          <p style="color: #475569; line-height: 1.7; font-size: 14px;">
            Votre compte a été créé et vous êtes inscrit(e) à la formation
            <strong style="color:#1e293b;">${courseTitle || 'Premium Training'}</strong>.
            <br/>Cliquez sur le bouton ci-dessous pour choisir votre mot de passe et accéder à votre espace.
          </p>

          ${ctaBlock}

          <hr style="border:none; border-top:1px solid #f1f5f9; margin: 30px 0;"/>

          <p style="color:#cbd5e1; font-size:11px; text-align:center;">
            Botes Academy &mdash; Formation Trading &amp; Investissement.<br/>
            Ceci est un message automatique, ne pas répondre.
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
                to: [email],
                subject,
                html,
            }),
        });

        const resData = await res.json();
        console.log(JSON.stringify({ step: 'RESEND', status: res.ok ? 'OK' : 'ERROR', statusCode: res.status, data: resData }))

        return new Response(JSON.stringify(resData), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: res.ok ? 200 : 500,
        });
    } catch (error) {
        console.error(JSON.stringify({ step: 'WELCOME_EMAIL', status: 'ERROR', message: error.message }))
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 500,
        });
    }
});
