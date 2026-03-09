import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

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

        // We only care about payment_proofs
        const userId = record.user_id;
        const courseId = record.course_id;
        const status = record.status;
        const oldStatus = old_record?.status;

        // 1. Get User Email and Name
        const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("full_name")
            .eq("id", userId)
            .single();

        if (profileError) throw profileError;

        // Since profiles doesn't have email, we get it from auth.users (requires service role)
        const { data: userData, error: userError } = await supabase.auth.admin.getUserById(userId);
        if (userError) throw userError;
        const userEmail = userData.user.email;

        // 2. Get Course Title
        const { data: course, error: courseError } = await supabase
            .from("courses")
            .select("title")
            .eq("id", courseId)
            .single();

        if (courseError) throw courseError;

        let subject = "";
        let html = "";

        // 3. Logic based on type and status
        if (type === "INSERT" && status === "pending") {
            subject = `Reçu reçu - ${course.title}`;
            html = `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #3b82f6;">Bonjour ${profile.full_name},</h2>
          <p>Nous avons bien reçu votre preuve de paiement pour la formation : <strong>${course.title}</strong>.</p>
          <p>Un administrateur va vérifier votre reçu dans les plus brefs délais (généralement moins de 24h).</p>
          <p>Vous recevrez un email dès que votre accès sera activé.</p>
          <br/>
          <p>L'équipe Botes Academy</p>
        </div>
      `;
        } else if (type === "UPDATE" && status === "approved" && oldStatus !== "approved") {
            subject = `Accès activé ! - ${course.title}`;
            html = `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #10b981;">Félicitations ${profile.full_name} !</h2>
          <p>Votre paiement pour la formation <strong>${course.title}</strong> a été approuvé.</p>
          <p>Vous pouvez dès maintenant accéder à vos cours en cliquant sur le bouton ci-dessous :</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://botesacademy.com/formations/${courseId}" style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Accéder au cours</a>
          </div>
          <p>Bon apprentissage !</p>
          <br/>
          <p>L'équipe Botes Academy</p>
        </div>
      `;
        } else if (type === "UPDATE" && status === "rejected" && oldStatus !== "rejected") {
            subject = `Action requise : Paiement rejeté - ${course.title}`;
            html = `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #ef4444;">Bonjour ${profile.full_name},</h2>
          <p>Votre preuve de paiement pour <strong>${course.title}</strong> a été rejetée par notre équipe.</p>
          <p><strong>Motif du rejet :</strong> ${record.admin_notes || "Non précisé"}</p>
          <p>Veuillez soumettre une nouvelle preuve de paiement valide depuis votre espace client.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://botesacademy.com/checkout/${courseId}" style="background-color: #ef4444; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Soumettre à nouveau</a>
          </div>
          <p>Si vous avez des questions, n'hésitez pas à nous contacter.</p>
          <br/>
          <p>L'équipe Botes Academy</p>
        </div>
      `;
        }

        if (!subject || !html) {
            return new Response(JSON.stringify({ message: "No email sent for this update" }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 200,
            });
        }

        // 4. Send Email via Resend
        const recipients = [userEmail];

        // Add admin notification on new submissions
        if (type === "INSERT" && status === "pending") {
            const { data: adminRoles, error: adminRolesError } = await supabase
                .from("user_roles")
                .select("user_id")
                .eq("role", "admin");

            if (!adminRolesError && adminRoles.length > 0) {
                for (const role of adminRoles) {
                    const { data: adminUser, error: adminUserError } = await supabase.auth.admin.getUserById(role.user_id);
                    if (!adminUserError && adminUser.user.email) {
                        recipients.push(adminUser.user.email);
                    }
                }
            }

            // Modify subject/html for combined notification or send separately?
            // Let's send a specific one to admins if we wanted, but for simplicity we add them to 'to' or 'bcc'
            // Actually, Resend 'to' can be an array.
        }

        const res = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${RESEND_API_KEY}`,
            },
            body: JSON.stringify({
                from: "Botes Academy <notifications@botesacademy.com>",
                to: recipients,
                subject: subject,
                html: html,
            }),
        });

        const resData = await res.json();
        console.log("Resend API response:", resData);

        return new Response(JSON.stringify(resData), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
        });
    } catch (error) {
        console.error("Error in resend-webhook function:", error);
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 500,
        });
    }
});
