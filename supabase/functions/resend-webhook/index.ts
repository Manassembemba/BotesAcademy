import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const SITE_URL = Deno.env.get("SITE_URL") || "https://botes.academy";

const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

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
        const { record, old_record, type } = payload;

        const userId = record.user_id;
        const status = record.status;
        const oldStatus = old_record?.status;

        // 1. Identify product type and fetch details
        let productTitle = "Produit";
        let productType = "";
        let deliveryInfo = "";
        let actionUrl = `${SITE_URL}/dashboard`;

        if (record.course_id) {
            const { data } = await supabase.from("courses").select("title").eq("id", record.course_id).single();
            productTitle = data?.title || "Formation";
            productType = "formation";
            actionUrl = `${SITE_URL}/formations/${record.course_id}`;
        } else if (record.strategy_id) {
            const { data } = await supabase.from("strategies").select("title, content").eq("id", record.strategy_id).single();
            productTitle = data?.title || "Stratégie";
            productType = "strategy";
            deliveryInfo = data?.content || "";
            // If content is a URL, use it, otherwise use dashboard
            if (deliveryInfo.startsWith('http')) actionUrl = deliveryInfo;
        } else if (record.indicator_id) {
            const { data } = await supabase.from("indicators").select("name, file_url").eq("id", record.indicator_id).single();
            productTitle = data?.name || "Indicateur";
            productType = "indicator";
            deliveryInfo = data?.file_url || "";
            if (deliveryInfo.startsWith('http')) actionUrl = deliveryInfo;
        }

        // 2. Get User Info
        const { data: profile } = await supabase.from("profiles").select("full_name").eq("id", userId).single();
        const { data: userData } = await supabase.auth.admin.getUserById(userId);
        const userEmail = userData.user.email;
        const fullName = profile?.full_name || "Étudiant";

        let subject = "";
        let bodyHtml = "";

        // Template logic
        if (type === "INSERT" && status === "pending") {
            subject = `Paiement en attente de validation - ${productTitle}`;
            bodyHtml = `
                <h2 style="color: #3b82f6;">Bonjour ${fullName},</h2>
                <p>Nous avons bien reçu votre preuve de paiement pour : <strong>${productTitle}</strong>.</p>
                <p>Un administrateur va vérifier votre reçu. Vous recevrez un e-mail de confirmation dès que votre accès sera activé.</p>
                <p>Merci de votre confiance.</p>
            `;
        } else if (type === "UPDATE" && status === "approved" && oldStatus !== "approved") {
            subject = `Accès activé : Votre commande est prête ! 🚀`;
            let deliverySection = "";
            
            if (productType === "indicator") {
                deliverySection = `
                    <div style="background-color: #f0fdf4; border: 1px solid #dcfce7; border-radius: 12px; padding: 20px; margin: 20px 0; text-align: center;">
                        <p style="color: #166534; font-weight: bold; margin-bottom: 15px;">Votre outil est prêt à être téléchargé :</p>
                        <a href="${actionUrl}" style="display: inline-block; background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">Télécharger l'Indicateur</a>
                        <p style="font-size: 11px; color: #166534; margin-top: 10px;">Note : Certains fichiers nécessitent une installation sur MT4/MT5.</p>
                    </div>
                `;
            } else if (productType === "strategy") {
                deliverySection = `
                    <div style="background-color: #eff6ff; border: 1px solid #dbeafe; border-radius: 12px; padding: 20px; margin: 20px 0;">
                        <p style="color: #1e40af; font-weight: bold; margin-bottom: 10px;">Accès à votre stratégie :</p>
                        <p style="color: #1e40af; font-size: 14px; background: white; padding: 10px; border-radius: 6px; border: 1px dashed #3b82f6;">${deliveryInfo}</p>
                    </div>
                `;
            } else {
                deliverySection = `
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${actionUrl}" style="display: inline-block; background-color: #3b82f6; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold;">Accéder à ma formation</a>
                    </div>
                `;
            }

            bodyHtml = `
                <h2 style="color: #10b981;">Félicitations ${fullName} !</h2>
                <p>Votre paiement pour <strong>${productTitle}</strong> a été approuvé.</p>
                ${deliverySection}
                <p>Bonne chance dans votre apprentissage !</p>
            `;
        } else if (type === "UPDATE" && status === "rejected" && oldStatus !== "rejected") {
            subject = `Action requise : Paiement rejeté - ${productTitle}`;
            bodyHtml = `
                <h2 style="color: #ef4444;">Bonjour ${fullName},</h2>
                <p>Nous n'avons pas pu valider votre preuve de paiement pour <strong>${productTitle}</strong>.</p>
                <p style="background-color: #fef2f2; padding: 15px; border-left: 4px solid #ef4444; color: #991b1b;"><strong>Motif :</strong> ${record.admin_notes || "Référence invalide ou image illisible."}</p>
                <p>Veuillez soumettre une nouvelle preuve de paiement valide pour débloquer votre accès.</p>
                <div style="text-align: center; margin: 25px 0;">
                    <a href="${SITE_URL}/marketplace" style="display: inline-block; background-color: #ef4444; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">Réessayer le paiement</a>
                </div>
            `;
        }

        if (!subject || !bodyHtml) return new Response("No action", { status: 200 });

        // Get Admins for new submissions
        let adminEmails: string[] = [];
        if (type === "INSERT" && status === "pending") {
            const { data: adminRoles } = await supabase.from("user_roles").select("user_id").eq("role", "admin");
            if (adminRoles) {
                for (const r of adminRoles) {
                    const { data: a } = await supabase.auth.admin.getUserById(r.user_id);
                    if (a?.user?.email) adminEmails.push(a.user.email);
                }
            }
        }

        const res = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${RESEND_API_KEY}`,
            },
            body: JSON.stringify({
                from: "Botes Academy <notifications@botes.academy>",
                to: [userEmail],
                bcc: adminEmails.length > 0 ? adminEmails : undefined,
                subject,
                html: `
                    <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 40px 20px; border: 1px solid #f1f5f9; border-radius: 16px;">
                        <div style="text-align: center; margin-bottom: 30px;">
                            <h1 style="color: #3b82f6; margin: 0; font-size: 24px;">BOTES ACADEMY</h1>
                        </div>
                        ${bodyHtml}
                        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #f1f5f9; text-align: center; color: #94a3b8; font-size: 11px;">
                            &copy; ${new Date().getFullYear()} Botes Academy.
                        </div>
                    </div>
                `,
            }),
        });

        return new Response(await res.text(), { status: res.status });
    } catch (error: any) {
        return new Response(error.message, { status: 500 });
    }
});
