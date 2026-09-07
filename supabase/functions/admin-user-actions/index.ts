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

async function isStaff(userId: string) {
    const { data: roleData, error } = await supabaseAdmin
        .from("user_roles")
        .select("role")
        .eq("user_id", userId);
    if (error || !roleData) return false;
    const roles = roleData.map(r => r.role);
    return roles.includes("admin") || roles.includes("receptionist");
}

async function isAdmin(userId: string) {
    const { data: roleData, error } = await supabaseAdmin
        .from("user_roles")
        .select("role")
        .eq("user_id", userId);
    if (error || !roleData) return false;
    const roles = roleData.map(r => r.role);
    return roles.includes("admin");
}

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        // Validation Staff (Admin ou Réceptionniste)
        const authHeader = req.headers.get("Authorization");
        if (!authHeader) throw new Error("Missing Authorization header");

        const token = authHeader.replace("Bearer ", "");
        const jwtPayload = await verifyJWT(token);
        if (!jwtPayload || !jwtPayload.sub) {
            throw new Error("Invalid JWT");
        }

        const callerStaffId = jwtPayload.sub;
        if (!(await isStaff(callerStaffId))) {
            throw new Error("Unauthorized: Not a staff member (admin or receptionist)");
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
                    admin_id: callerStaffId,
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
                    admin_id: callerStaffId,
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
                    admin_id: callerStaffId,
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
                    admin_id: callerStaffId,
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
                    admin_id: callerStaffId,
                    action: "profile_updated",
                    target_id: targetUserId,
                    target_type: "user",
                    details: data
                });
                break;

            case "UPDATE_ROLE":
                if (!(await isAdmin(callerStaffId))) {
                    throw new Error("Seul un administrateur peut modifier les rôles.");
                }
                if (!data?.role) {
                    throw new Error("Rôle requis pour l'action UPDATE_ROLE.");
                }
                if (targetUserId === callerStaffId && data.role !== "admin") {
                    throw new Error("Vous ne pouvez pas révoquer votre propre statut administrateur.");
                }

                // Mettre à jour user_roles
                const { error: upsertRoleErr } = await supabaseAdmin
                    .from("user_roles")
                    .upsert({ user_id: targetUserId, role: data.role }, { onConflict: "user_id,role" });
                if (upsertRoleErr) {
                    // Si conflit sur la contrainte UNIQUE, supprimer l'ancien rôle d'abord
                    await supabaseAdmin.from("user_roles").delete().eq("user_id", targetUserId);
                    const { error: insertRoleErr } = await supabaseAdmin.from("user_roles").insert({
                        user_id: targetUserId,
                        role: data.role
                    });
                    if (insertRoleErr) throw insertRoleErr;
                } else {
                    // Nettoyer les autres rôles pour garder un rôle principal
                    await supabaseAdmin
                        .from("user_roles")
                        .delete()
                        .eq("user_id", targetUserId)
                        .neq("role", data.role);
                }

                // Si des cours assignés sont spécifiés (pour un formateur)
                if (Array.isArray(data.courseIds)) {
                    // Supprimer les assignations existantes
                    await supabaseAdmin.from("course_teachers").delete().eq("teacher_id", targetUserId);
                    if (data.courseIds.length > 0 && data.role === "teacher") {
                        const assignments = data.courseIds.map((cId: string) => ({
                            teacher_id: targetUserId,
                            course_id: cId
                        }));
                        const { error: assignErr } = await supabaseAdmin.from("course_teachers").insert(assignments);
                        if (assignErr) throw assignErr;
                    }
                }

                await supabaseAdmin.from("admin_audit_logs").insert({
                    admin_id: callerStaffId,
                    action: "role_updated",
                    target_id: targetUserId,
                    target_type: "user",
                    details: { new_role: data.role, assigned_courses: data.courseIds || [] }
                });
                break;

            case "CREATE_STAFF_USER":
                if (!(await isAdmin(callerStaffId))) {
                    throw new Error("Seul un administrateur peut créer des membres du personnel.");
                }
                if (!data?.email || !data?.fullName || !data?.role) {
                    throw new Error("Email, nom complet et rôle sont requis.");
                }

                const staffPassword = data.password || Math.random().toString(36).slice(-10) + "Aa1!";
                const { data: newAuthData, error: newAuthErr } = await supabaseAdmin.auth.admin.createUser({
                    email: data.email.trim().toLowerCase(),
                    password: staffPassword,
                    email_confirm: true,
                    user_metadata: { full_name: data.fullName.trim(), phone: data.phone?.trim() || null }
                });

                if (newAuthErr) throw newAuthErr;
                const newUserId = newAuthData.user.id;

                // Mise à jour de profiles
                await supabaseAdmin.from("profiles").upsert({
                    id: newUserId,
                    full_name: data.fullName.trim(),
                    phone: data.phone?.trim() || null,
                    profile_completed: true,
                    registration_source: "admin_staff"
                });

                // Attribution du rôle
                await supabaseAdmin.from("user_roles").upsert({
                    user_id: newUserId,
                    role: data.role
                });

                // Cours assignés si formateur
                if (data.role === "teacher" && Array.isArray(data.courseIds) && data.courseIds.length > 0) {
                    const assignments = data.courseIds.map((cId: string) => ({
                        teacher_id: newUserId,
                        course_id: cId
                    }));
                    await supabaseAdmin.from("course_teachers").insert(assignments);
                }

                // Génération éventuelle du lien de réinitialisation pour le staff
                let staffResetLink: string | null = null;
                const { data: staffLink } = await supabaseAdmin.auth.admin.generateLink({
                    type: "recovery",
                    email: data.email.trim().toLowerCase(),
                    options: { redirectTo: `${Deno.env.get('SITE_URL') || 'https://botes.academy'}/update-password` }
                });
                if (staffLink?.properties?.action_link) {
                    staffResetLink = staffLink.properties.action_link;
                }

                responsePayload.newUserId = newUserId;
                responsePayload.resetLink = staffResetLink;
                responsePayload.initialPassword = staffPassword;

                await supabaseAdmin.from("admin_audit_logs").insert({
                    admin_id: callerStaffId,
                    action: "staff_created",
                    target_id: newUserId,
                    target_type: "user",
                    details: { email: data.email, role: data.role, fullName: data.fullName }
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
