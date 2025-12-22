// Supabase Edge Function: admin-manage-user
// Privileged user management operations: set status, set primary role, delete user.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.1'

type Action = 'set_status' | 'set_role' | 'delete_user'

type RequestBody =
  | {
      action: 'set_status'
      target_user_id: string
      status: 'active' | 'inactive' | 'suspended' | 'pending'
    }
  | {
      action: 'set_role'
      target_user_id: string
      primary_role: string
    }
  | {
      action: 'delete_user'
      target_user_id: string
    }

type ErrorResponse = { error: string }

type OkResponse = {
  ok: true
}

const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function json(status: number, body: OkResponse | ErrorResponse) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return json(405, { error: 'Method not allowed' })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')
  const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

  if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
    return json(500, { error: 'Server misconfigured' })
  }

  const authHeader = req.headers.get('Authorization') || ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice('Bearer '.length) : null
  if (!token) {
    return json(401, { error: 'Missing Authorization bearer token' })
  }

  let payload: RequestBody
  try {
    payload = (await req.json()) as RequestBody
  } catch {
    return json(400, { error: 'Invalid JSON body' })
  }

  // Client bound to caller JWT (authn)
  const authedClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false },
  })

  const { data: callerData, error: callerError } = await authedClient.auth.getUser()
  if (callerError || !callerData?.user) {
    return json(401, { error: 'Unauthorized' })
  }

  const callerId = callerData.user.id

  // Service client for privileged operations
  const service = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: { persistSession: false },
  })

  const targetUserId = (payload as any).target_user_id
  if (!targetUserId) {
    return json(400, { error: 'target_user_id is required' })
  }

  if (targetUserId === callerId) {
    return json(400, { error: 'Refusing to modify the currently signed-in user' })
  }

  // Fetch caller + target profile for dept-scoping decisions
  const [{ data: callerProfile, error: callerProfileErr }, { data: targetProfile, error: targetProfileErr }] =
    await Promise.all([
      service.from('profiles').select('id, department_id').eq('id', callerId).maybeSingle(),
      service.from('profiles').select('id, department_id, status, primary_role').eq('id', targetUserId).maybeSingle(),
    ])

  if (callerProfileErr) {
    return json(500, { error: `Failed to load caller profile: ${callerProfileErr.message}` })
  }
  if (targetProfileErr) {
    return json(500, { error: `Failed to load target profile: ${targetProfileErr.message}` })
  }
  if (!targetProfile?.id) {
    return json(404, { error: 'Target user not found' })
  }

  const callerDept = callerProfile?.department_id ?? null
  const targetDept = targetProfile?.department_id ?? null

  const checkPermission = async (permissionName: string) => {
    const { data, error } = await service.rpc('has_permission', {
      user_id: callerId,
      permission_name: permissionName,
    })

    if (error) {
      return { allowed: false, error: `Permission check failed: ${error.message}` }
    }

    return { allowed: !!data as boolean, error: null as string | null }
  }

  const insertAudit = async (action: string, table: string, recordId: string, oldValues?: any, newValues?: any) => {
    await service.from('audit_logs').insert({
      user_id: callerId,
      action,
      table_name: table,
      record_id: recordId,
      old_values: oldValues ?? null,
      new_values: newValues ?? null,
    })
  }

  if (payload.action === 'set_status') {
    const status = payload.status

    const allCheck = await checkPermission('block_unblock_users')
    if (allCheck.error) return json(500, { error: allCheck.error })

    let allowed = allCheck.allowed

    if (!allowed) {
      const deptCheck = await checkPermission('block_dept_users')
      if (deptCheck.error) return json(500, { error: deptCheck.error })
      allowed = deptCheck.allowed && !!callerDept && callerDept === targetDept
    }

    if (!allowed) {
      return json(403, { error: 'Forbidden' })
    }

    const oldValues = { status: targetProfile.status }
    const newValues = { status }

    const { error: updateError } = await service.from('profiles').update({ status }).eq('id', targetUserId)
    if (updateError) {
      return json(500, { error: `Failed to update status: ${updateError.message}` })
    }

    await insertAudit('update_status', 'profiles', targetUserId, oldValues, newValues)

    return json(200, { ok: true })
  }

  if (payload.action === 'set_role') {
    const roleName = (payload.primary_role || '').trim()
    if (!roleName) {
      return json(400, { error: 'primary_role is required' })
    }

    const perm = await checkPermission('create_delete_admins')
    if (perm.error) return json(500, { error: perm.error })
    if (!perm.allowed) return json(403, { error: 'Forbidden' })

    const { data: roleRow, error: roleErr } = await service.from('roles').select('id').eq('name', roleName).single()
    if (roleErr || !roleRow?.id) {
      return json(400, { error: `Role not found: ${roleName}` })
    }

    const oldValues = { primary_role: targetProfile.primary_role }
    const newValues = { primary_role: roleName }

    const { error: profileError } = await service.from('profiles').update({ primary_role: roleName }).eq('id', targetUserId)
    if (profileError) {
      return json(500, { error: `Failed to update primary_role: ${profileError.message}` })
    }

    // Ensure user has an active user_roles row for the role (global assignment with department_id NULL)
    const { data: existing, error: existingErr } = await service
      .from('user_roles')
      .select('id')
      .eq('user_id', targetUserId)
      .eq('role_id', roleRow.id)
      .is('department_id', null)
      .limit(1)

    if (existingErr) {
      return json(500, { error: `Failed to check existing role assignment: ${existingErr.message}` })
    }

    if (existing && existing.length > 0) {
      const { error: updErr } = await service
        .from('user_roles')
        .update({ is_active: true, assigned_by: callerId, assigned_at: new Date().toISOString() })
        .eq('id', existing[0].id)

      if (updErr) {
        return json(500, { error: `Failed to update role assignment: ${updErr.message}` })
      }
    } else {
      const { error: insErr } = await service.from('user_roles').insert({
        user_id: targetUserId,
        role_id: roleRow.id,
        department_id: null,
        assigned_by: callerId,
        is_active: true,
      })

      if (insErr) {
        return json(500, { error: `Failed to assign role: ${insErr.message}` })
      }
    }

    await insertAudit('update_role', 'profiles', targetUserId, oldValues, newValues)

    return json(200, { ok: true })
  }

  if (payload.action === 'delete_user') {
    const perm = await checkPermission('create_delete_admins')
    if (perm.error) return json(500, { error: perm.error })
    if (!perm.allowed) return json(403, { error: 'Forbidden' })

    // Capture some context before deleting
    const oldValues = {
      status: targetProfile.status,
      primary_role: targetProfile.primary_role,
    }

    const { error: delErr } = await service.auth.admin.deleteUser(targetUserId)
    if (delErr) {
      return json(500, { error: `Failed to delete user: ${delErr.message}` })
    }

    await insertAudit('delete_user', 'auth.users', targetUserId, oldValues, null)

    return json(200, { ok: true })
  }

  return json(400, { error: 'Unknown action' })
})
