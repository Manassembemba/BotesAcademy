import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { 
    getWelcomeTemplate, 
    getPasswordChangedTemplate, 
    getAttendanceAbsentTemplate, 
    getDailyReportTemplate 
} from "./templates.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SITE_URL = Deno.env.get("SITE_URL") || "https://botes.academy";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailPayload {
    type: "WELCOME" | "PASSWORD_CHANGED" | "ACCOUNT_SUSPENDED" | "ATTENDANCE_ABSENT" | "NEW_COMMENT";
    email: string;
    fullName: string;
    data?: any;
}

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const payload: EmailPayload = await req.json();
        const { type, email, fullName, data } = payload;

        if (!email || !type || !fullName) {
            throw new Error("Missing required fields (email, type, fullName)");
        }

        let subject = "";
        let html = "";

        switch (type) {
            case "WELCOME":
                subject = "Bienvenue chez Botes Academy ! 🚀";
                html = getWelcomeTemplate(fullName);
                break;

            case "PASSWORD_CHANGED":
                subject = "Sécurité : Votre mot de passe a été modifié 🛡️";
                html = getPasswordChangedTemplate(fullName);
                break;

            case "ATTENDANCE_ABSENT":
                subject = `Avis d'absence - ${data?.courseTitle || "Formation"}`;
                html = getAttendanceAbsentTemplate(fullName, data);
                break;

            case "NEW_COMMENT":
                subject = "Nouveau commentaire sur une formation 💬";
                // Réutilisation d'un template ou personnalisation rapide
                html = getDailyReportTemplate({ 
                    newStudents: 0, revenue: 0, absences: 0, 
                    comments: 1, // Simulé pour le test
                    isInteraction: true 
                });
                break;

            default:
                throw new Error(`Unknown email type: ${type}`);
        }

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
        return new Response(JSON.stringify(resData), {
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
