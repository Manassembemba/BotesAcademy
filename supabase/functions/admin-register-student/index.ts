import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function generateSecurePassword(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%'
  const array = new Uint8Array(16)
  crypto.getRandomValues(array)
  return Array.from(array).map(b => chars[b % chars.length]).join('')
}

function log(step: string, status: 'START' | 'OK' | 'ERROR' | 'INFO', detail?: unknown) {
  const entry = {
    ts: new Date().toISOString(),
    step,
    status,
    ...(detail !== undefined ? { detail } : {}),
  }
  if (status === 'ERROR') {
    console.error(JSON.stringify(entry))
  } else {
    console.log(JSON.stringify(entry))
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  let userId: string | null = null
  log('FUNCTION', 'START', { method: req.method })

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // -- Parse du body
    let body: any
    try {
      body = await req.json()
    } catch (e) {
      log('PARSE_BODY', 'ERROR', { error: String(e) })
      throw new Error('[PARSE] Corps de la requête invalide (JSON malformé)')
    }

    const { email, fullName, courseId, sessionId, vacationId, amount, paymentMethod, adminId } = body
    log('PARSE_BODY', 'OK', { email, fullName, courseId, sessionId, vacationId, amount, paymentMethod, adminId })

    // -- Validation des champs requis
    if (!email || !fullName || !courseId) {
      log('VALIDATE', 'ERROR', { email: !!email, fullName: !!fullName, courseId: !!courseId })
      throw new Error('[VALIDATE] Champs requis manquants : email, fullName, courseId')
    }
    log('VALIDATE', 'OK')

    // -- ETAPE 1 : Création du compte Auth
    log('AUTH_CREATE_USER', 'START', { email })
    const tempPassword = generateSecurePassword()
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: { full_name: fullName }
    })

    if (authError) {
      log('AUTH_CREATE_USER', 'ERROR', { code: authError.status, message: authError.message })
      throw new Error(`[AUTH] ${authError.message}`)
    }
    userId = authData.user.id
    log('AUTH_CREATE_USER', 'OK', { userId })

    // -- ETAPE 2 : Génération du Magic Link de reset
    log('AUTH_GENERATE_LINK', 'START', { email })
    const siteUrl = Deno.env.get('SITE_URL') ?? 'https://botesacademy.com'
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email,
      options: { redirectTo: `${siteUrl}/update-password` }
    })

    if (linkError) {
      log('AUTH_GENERATE_LINK', 'ERROR', { message: linkError.message })
    } else {
      log('AUTH_GENERATE_LINK', 'OK', { hasLink: !!linkData?.properties?.action_link })
    }
    const resetLink = linkError ? null : linkData?.properties?.action_link

    // -- ETAPE 3 : Insertion Purchase
    log('INSERT_PURCHASE', 'START', { userId, courseId, amount })
    const { error: purchaseError } = await supabaseAdmin.from('purchases').insert({
      user_id: userId,
      course_id: courseId,
      session_id: sessionId || null,
      vacation_id: (vacationId && vacationId !== 'none') ? vacationId : null,
      amount,
      payment_status: 'completed',
      validation_status: 'approved',
      validated_at: new Date().toISOString()
    })

    if (purchaseError) {
      log('INSERT_PURCHASE', 'ERROR', { code: purchaseError.code, message: purchaseError.message, details: purchaseError.details })
      log('ROLLBACK', 'INFO', { action: 'delete_user', userId })
      await supabaseAdmin.auth.admin.deleteUser(userId)
      userId = null
      throw new Error(`[PURCHASE] ${purchaseError.message}`)
    }
    log('INSERT_PURCHASE', 'OK')

    // -- ETAPE 4 : Insertion Payment Proof
    log('INSERT_PROOF', 'START', { userId, courseId, amount })
    const { error: proofError } = await supabaseAdmin.from('payment_proofs').insert({
      user_id: userId,
      course_id: courseId,
      session_id: sessionId || null,
      vacation_id: (vacationId && vacationId !== 'none') ? vacationId : null,
      amount,
      payment_method: paymentMethod,
      status: 'approved',
      validated_at: new Date().toISOString(),
      admin_notes: 'Inscription manuelle. Lien de connexion envoyé par email.'
    })

    if (proofError) {
      log('INSERT_PROOF', 'ERROR', { code: proofError.code, message: proofError.message, details: proofError.details })
      log('ROLLBACK', 'INFO', { action: 'delete_purchase_and_user', userId })
      await supabaseAdmin.from('purchases').delete().eq('user_id', userId)
      await supabaseAdmin.auth.admin.deleteUser(userId)
      userId = null
      throw new Error(`[PROOF] ${proofError.message}`)
    }
    log('INSERT_PROOF', 'OK')

    // -- ETAPE 5 : Audit log (non bloquant)
    if (adminId) {
      log('AUDIT_LOG', 'INFO', { adminId, action: 'manual_enrollment' })
      supabaseAdmin.from('admin_audit_logs').insert({
        admin_id: adminId,
        action: 'manual_enrollment',
        target_type: 'user',
        target_id: userId,
        details: { student_email: email, student_name: fullName, course_id: courseId, amount, payment_method: paymentMethod }
      }).then(() => {})
    }

    log('FUNCTION', 'OK', { userId, hasResetLink: !!resetLink })
    return new Response(
      JSON.stringify({ success: true, userId, resetLink }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error) {
    log('FUNCTION', 'ERROR', { message: error.message, userId })
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
