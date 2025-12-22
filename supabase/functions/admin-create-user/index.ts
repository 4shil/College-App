// Supabase Edge Function: admin-create-user
// Creates a new Auth user + sets profile/role.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.1'

type CreateUserRequest = {
  email: string
  password: string
  full_name: string
  phone?: string | null
  primary_role: string
  department_id?: string | null
}

type CreateUserResponse = {
  user_id: string
}

const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')
  const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

  if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
    return new Response(JSON.stringify({ error: 'Server misconfigured' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const authHeader = req.headers.get('Authorization') || ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice('Bearer '.length) : null
  if (!token) {
    return new Response(JSON.stringify({ error: 'Missing Authorization bearer token' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  let payload: CreateUserRequest
  try {
    payload = (await req.json()) as CreateUserRequest
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const email = (payload.email || '').trim().toLowerCase()
  const password = payload.password || ''
  const full_name = (payload.full_name || '').trim()
  const phone = payload.phone ?? null
  const primary_role = (payload.primary_role || '').trim()
  const department_id = payload.department_id ?? null

  if (!email || !password || !full_name || !primary_role) {
    return new Response(JSON.stringify({ error: 'email, password, full_name, primary_role are required' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // Client bound to caller JWT (for authn)
  const authedClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
    auth: {
      persistSession: false,
    },
  })

  const { data: callerData, error: callerError } = await authedClient.auth.getUser()
  if (callerError || !callerData?.user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const callerId = callerData.user.id

  // Service role client (for privileged operations)
  const service = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      persistSession: false,
    },
  })

  // Authorize: must have create_delete_admins permission (or be super_admin via has_permission)
  const { data: canCreate, error: permError } = await service.rpc('has_permission', {
    user_id: callerId,
    permission_name: 'create_delete_admins',
  })

  if (permError) {
    return new Response(JSON.stringify({ error: `Permission check failed: ${permError.message}` }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  if (!canCreate) {
    return new Response(JSON.stringify({ error: 'Forbidden' }), {
      status: 403,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // Create Auth user
  const { data: created, error: createError } = await service.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name,
      phone,
      primary_role,
    },
  })

  if (createError || !created?.user) {
    return new Response(JSON.stringify({ error: createError?.message || 'Failed to create user' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const newUserId = created.user.id

  // Update profile
  const { error: profileError } = await service
    .from('profiles')
    .update({
      full_name,
      phone,
      primary_role,
      status: 'active',
      department_id,
    })
    .eq('id', newUserId)

  if (profileError) {
    return new Response(JSON.stringify({ error: `Profile update failed: ${profileError.message}` }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // Add to student/teacher tables if applicable
  if (primary_role === 'student' && department_id) {
    const { error } = await service.from('students').insert({ id: newUserId, department_id })
    if (error) {
      return new Response(JSON.stringify({ error: `Failed to create student row: ${error.message}` }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
  } else if (
    ['subject_teacher', 'class_teacher', 'mentor', 'coordinator', 'hod'].includes(primary_role) &&
    department_id
  ) {
    const { error } = await service.from('teachers').insert({ id: newUserId, department_id })
    if (error) {
      return new Response(JSON.stringify({ error: `Failed to create teacher row: ${error.message}` }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
  }

  // Assign role in user_roles
  const { data: roleRow, error: roleError } = await service
    .from('roles')
    .select('id')
    .eq('name', primary_role)
    .single()

  if (roleError || !roleRow?.id) {
    return new Response(JSON.stringify({ error: `Role not found: ${primary_role}` }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const { error: userRoleError } = await service.from('user_roles').insert({
    user_id: newUserId,
    role_id: roleRow.id,
    assigned_by: callerId,
  })

  if (userRoleError) {
    return new Response(JSON.stringify({ error: `Failed to assign role: ${userRoleError.message}` }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const resp: CreateUserResponse = { user_id: newUserId }
  return new Response(JSON.stringify(resp), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
