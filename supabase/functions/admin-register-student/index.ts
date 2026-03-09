
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { email, password, fullName, courseId, vacationId, amount, paymentMethod, shouldNotify } = await req.json()

    // 1. Create User in Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      user_metadata: { full_name: fullName },
      email_confirm: true
    })

    if (authError) throw authError
    const userId = authData.user.id

    // 2. Insert Purchase
    const { error: purchaseError } = await supabaseAdmin.from('purchases').insert({
      user_id: userId,
      course_id: courseId,
      vacation_id: vacationId || null,
      amount: amount,
      payment_status: 'completed',
      validation_status: 'approved',
      validated_at: new Date().toISOString()
    })

    if (purchaseError) {
      // Cleanup: delete the created auth user if purchase insertion fails
      await supabaseAdmin.auth.admin.deleteUser(userId)
      throw purchaseError
    }

    // 3. Insert Payment Proof (for accounting)
    const { error: proofError } = await supabaseAdmin.from('payment_proofs').insert({
      user_id: userId,
      course_id: courseId,
      vacation_id: vacationId || null,
      amount: amount,
      payment_method: paymentMethod,
      status: 'approved',
      validated_at: new Date().toISOString(),
      admin_notes: `Inscription manuelle. MDP: ${password}`
    })

    if (proofError) throw proofError

    return new Response(JSON.stringify({ success: true, userId }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
