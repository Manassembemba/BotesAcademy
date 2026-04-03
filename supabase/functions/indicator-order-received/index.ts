import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { Resend } from "npm:resend";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

Deno.serve(async (req) => {
  try {
    const { record } = await req.json();
    
    // On ne traite que les preuves de paiement liées à un indicateur
    if (!record.indicator_id) {
      return new Response(JSON.stringify({ message: "Not an indicator order." }), { status: 200 });
    }

    // Récupérer les informations
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

    const userEmail = profile?.[0]?.email || "botesgroup0@gmail.com";
    const fullName = profile?.[0]?.full_name || "Traders Botes Academy";
    const indicatorName = indicator?.[0]?.name || "votre outil";

    const emailResponse = await resend.emails.send({
      from: "Botes Academy <noreply@botesacademy.com>",
      to: [userEmail],
      subject: `✅ Commande reçue : ${indicatorName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 10px; overflow: hidden;">
          <div style="background-color: #020817; padding: 40px; text-align: center;">
            <img src="https://botesacademy.com/logo.png" alt="Botes Academy Logo" width="150" />
          </div>
          <div style="padding: 40px; color: #333; line-height: 1.6;">
            <h2 style="color: #020817; margin-bottom: 20px;">Accusé de réception</h2>
            <p>Bonjour ${fullName},</p>
            <p>Nous avons bien reçu votre preuve de paiement pour l'indicateur <strong>${indicatorName}</strong> ainsi que votre ID de compte <strong>MT5 : ${record.mt5_id}</strong>.</p>
            
            <div style="background-color: #fffbeb; border-left: 4px solid #f59e0b; padding: 20px; margin: 30px 0;">
              <p style="margin: 0; font-weight: bold; color: #92400e;">⏳ Délai de configuration</p>
              <p style="margin: 10px 0 0 0; font-size: 14px; color: #b45309;">
                La sécurisation personnalisée de votre outil demande une intervention manuelle de nos experts. 
                Veuillez noter que le délai de livraison est de <strong>24h à 48h ouvrées</strong>.
              </p>
            </div>

            <p>Vous recevrez un second email contenant votre lien de téléchargement dès que la configuration sera terminée.</p>
            
            <p style="margin-top: 30px;">Merci de votre patience et de votre confiance envers Botes Academy.</p>
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
