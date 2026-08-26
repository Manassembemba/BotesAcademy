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

    const { email, fullName, phone, mt5Id, courseId, sessionId, vacationName, amount, paymentMethod, adminId } = body
    
    const sanitizedFullName = String(fullName || '').trim()
    const sanitizedPhone = String(phone || '').trim()
    let sanitizedEmail = String(email || '').trim().toLowerCase()

    // Si pas d'email fourni OU email invalide → générer un identifiant interne automatique
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!sanitizedEmail || !emailRegex.test(sanitizedEmail)) {
      const cleanPhone = sanitizedPhone.replace(/\D/g, '')
      const uniqueSuffix = cleanPhone ? cleanPhone : `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`
      const fallbackEmail = `etudiant_${uniqueSuffix}@botesacademy.cd`
      log('EMAIL_FALLBACK', 'INFO', { originalEmail: sanitizedEmail || '(vide)', generatedEmail: fallbackEmail })
      sanitizedEmail = fallbackEmail
    } else {
      log('EMAIL_VALID', 'INFO', { email: sanitizedEmail })
    }

    // Normalisation du mode de paiement pour respecter la contrainte
    const validMethods = ['cash', 'cash_deposit', 'mobile_money', 'bank_transfer', 'pos', 'card', 'other']
    const sanitizedPaymentMethod = validMethods.includes(paymentMethod) ? paymentMethod : 'cash'
    
    log('PARSE_BODY', 'OK', { email: sanitizedEmail, fullName: sanitizedFullName, phone: sanitizedPhone, mt5Id, courseId, sessionId, vacationName, amount, paymentMethod: sanitizedPaymentMethod, adminId })

    // -- Validation des champs requis
    if (!sanitizedFullName || !courseId) {
      log('VALIDATE', 'ERROR', { fullName: !!sanitizedFullName, courseId: !!courseId })
      throw new Error('[VALIDATE] Champs requis manquants : nom complet et formation obligatoire')
    }
    log('VALIDATE', 'OK')

    // -- ETAPE 1 : Création ou Récupération du compte Auth
    log('AUTH_CREATE_USER', 'START', { email: sanitizedEmail })
    const tempPassword = generateSecurePassword()
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: sanitizedEmail,
      password: tempPassword,
      email_confirm: true,
      user_metadata: { full_name: sanitizedFullName, phone: sanitizedPhone }
    })

    if (authError) {
      // Si l'utilisateur existe déjà, on récupère son ID existant
      if (authError.status === 422 || authError.message.includes('already')) {
        log('AUTH_CREATE_USER', 'INFO', { message: 'Email déjà enregistré, récupération du compte existant...' })
        const { data: listData } = await supabaseAdmin.auth.admin.listUsers()
        const existingUser = listData?.users?.find((u: any) => u.email?.toLowerCase() === sanitizedEmail)
        
        if (existingUser) {
          userId = existingUser.id
          log('AUTH_CREATE_USER', 'OK', { userId, isExisting: true })
        } else {
          throw new Error(`[AUTH] ${authError.message}`)
        }
      } else {
        log('AUTH_CREATE_USER', 'ERROR', { code: authError.status, message: authError.message })
        throw new Error(`[AUTH] ${authError.message}`)
      }
    } else {
      userId = authData.user.id
      log('AUTH_CREATE_USER', 'OK', { userId })
    }

    // -- ETAPE 2 : Génération du Magic Link de reset
    log('AUTH_GENERATE_LINK', 'START', { email: sanitizedEmail })
    const siteUrl = Deno.env.get('SITE_URL') ?? 'https://botesacademy.com'
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email: sanitizedEmail,
      options: { redirectTo: `${siteUrl}/update-password` }
    })

    if (linkError) {
      log('AUTH_GENERATE_LINK', 'ERROR', { message: linkError.message })
    } else {
      log('AUTH_GENERATE_LINK', 'OK', { hasLink: !!linkData?.properties?.action_link })
    }
    const resetLink = linkError ? null : linkData?.properties?.action_link

    // -- ETAPE 3 : Insertion Purchase
    log('INSERT_PURCHASE', 'START', { userId, course_id: courseId, amount })
    const { data: courseData } = await supabaseAdmin
      .from('courses')
      .select('price, registration_fee')
      .eq('id', courseId)
      .single()
    
    const registrationFee = courseData?.registration_fee || 0
    const coursePrice = courseData?.price || 0
    const totalToPay = coursePrice + registrationFee

    const { error: purchaseError } = await supabaseAdmin.from('purchases').insert({
      user_id: userId,
      course_id: courseId,
      session_id: sessionId || null,
      vacation_name: vacationName || null, // Switched from vacation_id
      amount: amount,
      total_amount: totalToPay,
      paid_amount: amount,
      payment_status: amount >= totalToPay ? 'completed' : 'partial',
      validation_status: 'approved',
      validated_at: new Date().toISOString(),
      enrollment_status: 'active'
    })

    if (purchaseError) {
      log('INSERT_PURCHASE', 'ERROR', { code: purchaseError.code, message: purchaseError.message })
      log('ROLLBACK', 'INFO', { action: 'delete_user', userId })
      await supabaseAdmin.auth.admin.deleteUser(userId)
      userId = null
      throw new Error(`[PURCHASE] ${purchaseError.message}`)
    }
    log('INSERT_PURCHASE', 'OK')

    // -- ETAPE 4 : Mise à jour de la source d'inscription (Audit)
    log('INIT_PROFILE', 'START', { userId })
    const { error: profileError } = await supabaseAdmin.from('profiles').update({
      registration_source: 'admin',
      phone: sanitizedPhone || null,
      mt5_id: mt5Id || null,
      profile_completed: false
    }).eq('id', userId)

    if (profileError) {
      log('INIT_PROFILE', 'ERROR', { message: profileError.message })
    } else {
      log('INIT_PROFILE', 'OK')
    }

    // -- ETAPE 5 : Insertion Payment Proof
    log('INSERT_PROOF', 'START', { userId, courseId, amount })
    const { error: proofError } = await supabaseAdmin.from('payment_proofs').insert({
      user_id: userId,
      course_id: courseId,
      session_id: sessionId || null,
      vacation_name: vacationName || null, // Switched from vacation_id
      amount,
      payment_method: sanitizedPaymentMethod,
      mt5_id: mt5Id || null,
      status: 'approved',
      validated_at: new Date().toISOString(),
      admin_notes: 'Inscription manuelle par Admin. Matricule auto-généré par le système.'
    })

    if (proofError) {
      log('INSERT_PROOF', 'ERROR', { code: proofError.code, message: proofError.message })
      log('ROLLBACK', 'INFO', { action: 'delete_purchase_and_user', userId })
      await supabaseAdmin.from('purchases').delete().eq('user_id', userId)
      await supabaseAdmin.auth.admin.deleteUser(userId)
      userId = null
      throw new Error(`[PROOF] ${proofError.message}`)
    }
    log('INSERT_PROOF', 'OK')
    
    // -- ETAPE 6 : Incrémentation de la capacité de la session
    if (sessionId) {
      const { error: incError } = await supabaseAdmin.rpc('increment_session_students', { 
        session_id: sessionId 
      })
      if (incError) log('INCREMENT_SESSION', 'ERROR', { message: incError.message })
    }

    // -- ETAPE 7 : Audit log
    if (adminId) {
      supabaseAdmin.from('admin_audit_logs').insert({
        admin_id: adminId,
        action: 'manual_enrollment',
        target_type: 'user',
        target_id: userId,
        details: { student_email: email, student_name: fullName, course_id: courseId, amount, payment_method: paymentMethod }
      }).then(() => {})
    }

    log('FUNCTION', 'OK', { userId })
    return new Response(
      JSON.stringify({ success: true, userId, resetLink }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error) {
    log('FUNCTION', 'ERROR', { message: (error as Error).message, userId })
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
