import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { Resend } from "npm:resend";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

Deno.serve(async (req) => {
  try {
    const { record } = await req.json();
    
    // Si delivered_file_url n'est pas présent, on ne fait rien
    if (!record.delivered_file_url) {
      return new Response(JSON.stringify({ message: "No delivery URL found." }), { status: 200 });
    }

    // Récupérer les informations de l'utilisateur et de l'indicateur via Supabase Client (optionnel si on passe les infos dans le payload)
    // Ici, on va utiliser le record (indicateur_id, user_id, mt5_id)
    
    const { data: profile } = await (await fetch(`${Deno.env.get("SUPABASE_URL")}/rest/v1/profiles?id=eq.${record.user_id}`, {
      headers: {
        'apikey': Deno.env.get("SUPABASE_ANON_KEY")!,
        'Authorization': `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`
      }
    })).json();

    const { data: indicator } = await (await fetch(`${Deno.env.get("SUPABASE_URL")}/rest/v1/indicators?id=eq.${record.indicator_id}`, {
      headers: {
        'apikey': Deno.env.get("SUPABASE_ANON_KEY")!,
        'Authorization': `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`
      }
    })).json();

    const userEmail = profile?.[0]?.email || "botesgroup0@gmail.com"; // Fallback pour test
    const fullName = profile?.[0]?.full_name || "Traders Botes Academy";
    const indicatorName = indicator?.[0]?.name || "Votre indicateur";

    const emailResponse = await resend.emails.send({
      from: "Botes Academy <noreply@botesacademy.com>",
      to: [userEmail],
      subject: `🚀 Votre indicateur ${indicatorName} est prêt !`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 10px; overflow: hidden;">
          <div style="background-color: #020817; padding: 40px; text-align: center;">
            <img src="https://botesacademy.com/logo.png" alt="Botes Academy Logo" width="150" />
          </div>
          <div style="padding: 40px; color: #333; line-height: 1.6;">
            <h2 style="color: #020817; margin-bottom: 20px;">Félicitations ${fullName} !</h2>
            <p>Nous avons d'excellentes nouvelles. Nos experts ont fini de configurer votre indicateur <strong>${indicatorName}</strong> spécifiquement pour votre compte <strong>MT5 ID: ${record.mt5_id}</strong>.</p>
            <p style="margin-top: 30px;">Vous pouvez dès maintenant le télécharger et commencer votre trading d'élite.</p>
            
            <div style="text-align: center; margin: 40px 0;">
              <a href="${record.delivered_file_url}" style="background-color: #020817; color: #ffffff; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; text-transform: uppercase;">Télécharger mon indicateur</a>
            </div>
            
            <p style="font-size: 12px; color: #666; font-style: italic;">Note : Pour toute assistance technique sur l'installation, n'hésitez pas à nous contacter sur Telegram.</p>
          </div>
          <div style="background-color: #f8f8f8; padding: 20px; text-align: center; font-size: 12px; color: #999;">
            &copy; 2026 Botes Academy - L'Élite du Trading.
          </div>
        </div>
      `,
    });

    return new Response(JSON.stringify(emailResponse), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { "Content-Type": "application/json" },
      status: 400,
    });
  }
});
