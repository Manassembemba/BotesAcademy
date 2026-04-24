import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getRecommendationTemplate } from "../_shared/templates.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

serve(async (req) => {
    try {
        const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
        
        // 1. Calculer la date d'il y a 2 jours
        const targetDate = new Date();
        targetDate.setDate(targetDate.getDate() - 2);
        const dateStr = targetDate.toISOString().split('T')[0];

        // 2. Trouver les élèves ayant complété un cours à cette date
        // Note: On utilise une vue ou une requête agrégée pour savoir qui a fini à 100%
        const { data: completions } = await supabase
            .from("purchases")
            .select(`
                user_id,
                course_id,
                courses (title),
                profiles (full_name, email)
            `)
            .eq("enrollment_status", "active")
            .filter("last_lesson_completed_at", "gte", `${dateStr}T00:00:00`)
            .filter("last_lesson_completed_at", "lte", `${dateStr}T23:59:59`);

        // 3. Récupérer un produit "Elite" à recommander (ex: l'indicateur le plus populaire)
        const { data: bestSeller } = await supabase
            .from("indicators")
            .select("name, description")
            .limit(1)
            .single();

        const sent = [];
        for (const record of completions || []) {
            const html = getRecommendationTemplate(
                record.profiles.full_name, 
                record.courses.title,
                bestSeller?.name || "Pack Indicateurs Pro",
                bestSeller?.description || "Boostez vos entrées avec nos algorithmes de détection de tendance institutionnelle."
            );

            await fetch("https://api.resend.com/emails", {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${RESEND_API_KEY}` },
                body: JSON.stringify({ 
                    from: "Botes Academy <marketing@botes.academy>", 
                    to: [record.profiles.email], 
                    subject: `🚀 La suite logique pour votre trading, ${record.profiles.full_name.split(' ')[0]}`, 
                    html 
                }),
            });
            sent.push(record.profiles.email);
        }

        return new Response(JSON.stringify({ success: true, sent }), { status: 200 });
    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
});
