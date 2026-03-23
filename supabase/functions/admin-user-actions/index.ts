import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import * as base64url from "https://deno.land/std@0.190.0/encoding/base64url.ts";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
});

// Helper for JWT Validation
async function verifyJWT(token: string) {
    try {
        const parts = token.split(".");
        if (parts.length !== 3) return null;
        const payloadStr = new TextDecoder().decode(base64url.decode(parts[1]));
        return JSON.parse(payloadStr);
    } catch {
        return null;
    }
}

async function isAdmin(userId: string) {
    const { data: roleData, error } = await supabaseAdmin
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .single();
    if (error || !roleData || roleData.role !== "admin") return false;
    return true;
}

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        // Validation Admin
        const authHeader = req.headers.get("Authorization");
        if (!authHeader) throw new Error("Missing Authorization header");

        const token = authHeader.replace("Bearer ", "");
        const jwtPayload = await verifyJWT(token);
        if (!jwtPayload || !jwtPayload.sub) {
            throw new Error("Invalid JWT");
        }
        
        const callerAdminId = jwtPayload.sub;
        if (!(await isAdmin(callerAdminId))) {
            throw new Error("Unauthorized: Not an admin");
        }

        const payload = await req.json();
        const { action, targetUserId, data } = payload;

        if (!action || !targetUserId) {
            throw new Error("Missing required fields: action or targetUserId");
        }

        let responsePayload: any = { success: true, action };

        switch (action) {
            case "DELETE_USER":
                // Supabase Auth Admin delete (Will cascade to profiles because of FK added earlier)
                const { error: deleteErr } = await supabaseAdmin.auth.admin.deleteUser(targetUserId);
                if (deleteErr) throw deleteErr;
                
                await supabaseAdmin.from("admin_audit_logs").insert({
                    admin_id: callerAdminId,
                    action: "user_deleted",
                    target_id: targetUserId,
                    target_type: "user",
                    details: { reason: "Manual deletion from dashboard" }
                });
                break;

            case "SUSPEND_USER":
                const banDurationStr = data?.durationHours ? `${data.durationHours}h` : "87600h"; // Par defaut 10 ans = permanent
                const { error: banErr } = await supabaseAdmin.auth.admin.updateUserById(targetUserId, {
                    ban_duration: banDurationStr
                });
                if (banErr) throw banErr;
                
                // Mettre à jour profiles avec la date calculée
                const banDate = new Date();
                banDate.setHours(banDate.getHours() + (data?.durationHours || 87600));

                await supabaseAdmin.from("profiles").update({ banned_until: banDate.toISOString() }).eq("id", targetUserId);

                await supabaseAdmin.from("admin_audit_logs").insert({
                    admin_id: callerAdminId,
                    action: "user_suspended",
                    target_id: targetUserId,
                    target_type: "user",
                    details: { duration: banDurationStr }
                });
                break;

            case "RESTORE_USER":
                const { error: unbanErr } = await supabaseAdmin.auth.admin.updateUserById(targetUserId, {
                    ban_duration: "none"
                });
                if (unbanErr) throw unbanErr;

                await supabaseAdmin.from("profiles").update({ banned_until: null }).eq("id", targetUserId);

                await supabaseAdmin.from("admin_audit_logs").insert({
                    admin_id: callerAdminId,
                    action: "user_restored",
                    target_id: targetUserId,
                    target_type: "user",
                    details: {}
                });
                break;

            case "SEND_RECOVERY":
                // Récupérer l'email de l'user
                const { data: userData, error: userErr } = await supabaseAdmin.auth.admin.getUserById(targetUserId);
                if (userErr || !userData.user.email) throw new Error("Can't find user email for recovery " + userErr?.message);
                
                const { data: linkData, error: linkErr } = await supabaseAdmin.auth.admin.generateLink({
                    type: "recovery",
                    email: userData.user.email,
                    options: { redirectTo: `${Deno.env.get('SITE_URL') || 'https://botes.academy'}/update-password` }
                });
                if (linkErr) throw linkErr;

                responsePayload.recoveryLink = linkData.properties.action_link;

                await supabaseAdmin.from("admin_audit_logs").insert({
                    admin_id: callerAdminId,
                    action: "password_reset_sent",
                    target_id: targetUserId,
                    target_type: "user",
                    details: { email: userData.user.email }
                });
                break;

            case "UPDATE_PROFILE":
                if (!data || (!data.fullName && !data.email)) {
                    throw new Error("No data provided to update.");
                }

                // Update auth Si email change
                if (data.email) {
                    const { error: emailErr } = await supabaseAdmin.auth.admin.updateUserById(targetUserId, {
                        email: data.email,
                        email_confirm: true // Force confirm
                    });
                    if (emailErr) throw emailErr;
                }

                // Update profiles
                const profileUpdates: any = {};
                if (data.fullName) profileUpdates.full_name = data.fullName;
                
                if (Object.keys(profileUpdates).length > 0) {
                    const { error: profileErr } = await supabaseAdmin.from("profiles").update(profileUpdates).eq("id", targetUserId);
                    if (profileErr) throw profileErr;
                }

                responsePayload.updated = data;

                await supabaseAdmin.from("admin_audit_logs").insert({
                    admin_id: callerAdminId,
                    action: "profile_updated",
                    target_id: targetUserId,
                    target_type: "user",
                    details: data
                });
                break;

            default:
                throw new Error(`Unknown action: ${action}`);
        }

        return new Response(JSON.stringify(responsePayload), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
        });

    } catch (error: any) {
        console.error(JSON.stringify({ error: error.message }));
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 400,
        });
    }
});
