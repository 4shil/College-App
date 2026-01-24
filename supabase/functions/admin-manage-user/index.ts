// Supabase Edge Function: admin-manage-user
// Privileged user management operations: set status, set primary role, delete user.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.1'

type Action = 'set_status' | 'set_role' | 'assign_role' | 'revoke_role' | 'delete_user'

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
      action: 'assign_role'
      target_user_id: string
      role_id: string
    }
  | {
      action: 'revoke_role'
      target_user_id: string
      role_id: string
    }
  | {
      action: 'delete_user'
      target_user_id: string
    }

type ErrorResponse = { error: string }

type OkResponse = {
  ok: true
}

// SECURITY: Restrict CORS to specific origins in production
// Add your production domain here
const ALLOWED_ORIGINS = [
  'http://localhost:8081',
  'http://localhost:19006',
  'https://jpmcollege.app',
  'exp://localhost:8081',
];

function getCorsHeaders(origin: string | null): Record<string, string> {
  const allowedOrigin = origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };
}

function json(status: number, body: OkResponse | ErrorResponse, origin: string | null = null) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...getCorsHeaders(origin), 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (req) => {
  const origin = req.headers.get('Origin');
  
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: getCorsHeaders(origin) })
  }

  if (req.method !== 'POST') {
    return json(405, { error: 'Method not allowed' }, origin)
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')
  const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

  if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
    return json(500, { error: 'Server misconfigured' }, origin)
  }

  const authHeader = req.headers.get('Authorization') || ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice('Bearer '.length) : null
  if (!token) {
    return json(401, { error: 'Missing Authorization bearer token' }, origin)
  }

  let payload: RequestBody
  try {
    payload = (await req.json()) as RequestBody
  } catch {
    return json(400, { error: 'Invalid JSON body' }, origin)
  }

  // Client bound to caller JWT (authn)
  const authedClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false },
  })

  const { data: callerData, error: callerError } = await authedClient.auth.getUser()
  if (callerError || !callerData?.user) {
    return json(401, { error: 'Unauthorized' }, origin)
  }

  const callerId = callerData.user.id

  // Service client for privileged operations
  const service = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: { persistSession: false },
  })

  const targetUserId = (payload as any).target_user_id
  if (!targetUserId) {
    return json(400, { error: 'target_user_id is required' }, origin)
  }

  if (targetUserId === callerId) {
    return json(400, { error: 'Refusing to modify the currently signed-in user' }, origin)
  }

  // Fetch caller + target profile for dept-scoping decisions
  const [{ data: callerProfile, error: callerProfileErr }, { data: targetProfile, error: targetProfileErr }] =
    await Promise.all([
      service.from('profiles').select('id, department_id').eq('id', callerId).maybeSingle(),
      service.from('profiles').select('id, department_id, status, primary_role').eq('id', targetUserId).maybeSingle(),
    ])

  if (callerProfileErr) {
    return json(500, { error: `Failed to load caller profile: ${callerProfileErr.message}` }, origin)
  }
  if (targetProfileErr) {
    return json(500, { error: `Failed to load target profile: ${targetProfileErr.message}` }, origin)
  }
  if (!targetProfile?.id) {
    return json(404, { error: 'Target user not found' }, origin)
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
    if (allCheck.error) return json(500, { error: allCheck.error }, origin)

    let allowed = allCheck.allowed

    if (!allowed) {
      const deptCheck = await checkPermission('block_dept_users')
      if (deptCheck.error) return json(500, { error: deptCheck.error }, origin)
      allowed = deptCheck.allowed && !!callerDept && callerDept === targetDept
    }

    if (!allowed) {
      return json(403, { error: 'Forbidden' }, origin)
    }

    const oldValues = { status: targetProfile.status }
    const newValues = { status }

    const { error: updateError } = await service.from('profiles').update({ status }).eq('id', targetUserId)
    if (updateError) {
      return json(500, { error: `Failed to update status: ${updateError.message}` }, origin)
    }

    await insertAudit('update_status', 'profiles', targetUserId, oldValues, newValues)

    return json(200, { ok: true }, origin)
  }

  if (payload.action === 'set_role') {
    const roleName = (payload.primary_role || '').trim()
    if (!roleName) {
      return json(400, { error: 'primary_role is required' }, origin)
    }

    const perm = await checkPermission('create_delete_admins')
    if (perm.error) return json(500, { error: perm.error }, origin)
    if (!perm.allowed) return json(403, { error: 'Forbidden' }, origin)

    const { data: roleRow, error: roleErr } = await service.from('roles').select('id').eq('name', roleName).single()
    if (roleErr || !roleRow?.id) {
      return json(400, { error: `Role not found: ${roleName}` }, origin)
    }

    const oldValues = { primary_role: targetProfile.primary_role }
    const newValues = { primary_role: roleName }

    const { error: profileError } = await service.from('profiles').update({ primary_role: roleName }).eq('id', targetUserId)
    if (profileError) {
      return json(500, { error: `Failed to update primary_role: ${profileError.message}` }, origin)
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
      return json(500, { error: `Failed to check existing role assignment: ${existingErr.message}` }, origin)
    }

    if (existing && existing.length > 0) {
      const { error: updErr } = await service
        .from('user_roles')
        .update({ is_active: true, assigned_by: callerId, assigned_at: new Date().toISOString() })
        .eq('id', existing[0].id)

      if (updErr) {
        return json(500, { error: `Failed to update role assignment: ${updErr.message}` }, origin)
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
        return json(500, { error: `Failed to assign role: ${insErr.message}` }, origin)
      }
    }

    await insertAudit('update_role', 'profiles', targetUserId, oldValues, newValues)

    return json(200, { ok: true }, origin)
  }

  if (payload.action === 'assign_role') {
    const roleId = (payload.role_id || '').trim()
    if (!roleId) {
      return json(400, { error: 'role_id is required' }, origin)
    }

    const perm = await checkPermission('create_delete_admins')
    if (perm.error) return json(500, { error: perm.error }, origin)
    if (!perm.allowed) return json(403, { error: 'Forbidden' }, origin)

    const { data: roleRow, error: roleErr } = await service.from('roles').select('id, name').eq('id', roleId).single()
    if (roleErr || !roleRow?.id) {
      return json(400, { error: 'Role not found' }, origin)
    }

    // Ensure an active user_roles row exists (global assignment with department_id NULL)
    const { data: existing, error: existingErr } = await service
      .from('user_roles')
      .select('id, is_active')
      .eq('user_id', targetUserId)
      .eq('role_id', roleRow.id)
      .is('department_id', null)
      .limit(1)

    if (existingErr) {
      return json(500, { error: `Failed to check existing role assignment: ${existingErr.message}` }, origin)
    }

    if (existing && existing.length > 0) {
      const oldValues = { is_active: existing[0].is_active }
      const newValues = { is_active: true }

      const { error: updErr } = await service
        .from('user_roles')
        .update({ is_active: true, assigned_by: callerId, assigned_at: new Date().toISOString() })
        .eq('id', existing[0].id)

      if (updErr) {
        return json(500, { error: `Failed to update role assignment: ${updErr.message}` }, origin)
      }

      await insertAudit('assign_role', 'user_roles', existing[0].id, oldValues, newValues)
    } else {
      const { data: insData, error: insErr } = await service
        .from('user_roles')
        .insert({
          user_id: targetUserId,
          role_id: roleRow.id,
          department_id: null,
          assigned_by: callerId,
          is_active: true,
        })
        .select('id')
        .single()

      if (insErr) {
        return json(500, { error: `Failed to assign role: ${insErr.message}` }, origin)
      }

      await insertAudit('assign_role', 'user_roles', insData?.id ?? `${targetUserId}:${roleRow.id}`, null, { is_active: true })
    }

    return json(200, { ok: true }, origin)
  }

  if (payload.action === 'revoke_role') {
    const roleId = (payload.role_id || '').trim()
    if (!roleId) {
      return json(400, { error: 'role_id is required' }, origin)
    }

    const perm = await checkPermission('create_delete_admins')
    if (perm.error) return json(500, { error: perm.error }, origin)
    if (!perm.allowed) return json(403, { error: 'Forbidden' }, origin)

    const { data: roleRow, error: roleErr } = await service.from('roles').select('id, name').eq('id', roleId).single()
    if (roleErr || !roleRow?.id) {
      return json(400, { error: 'Role not found' }, origin)
    }

    // Safety: don't revoke the role that is currently set as the user's primary_role
    if ((targetProfile.primary_role || '').trim() && targetProfile.primary_role === roleRow.name) {
      return json(400, { error: 'Cannot revoke the user\'s primary role. Change primary role first.' }, origin)
    }

    const { data: existing, error: existingErr } = await service
      .from('user_roles')
      .select('id, is_active')
      .eq('user_id', targetUserId)
      .eq('role_id', roleRow.id)
      .is('department_id', null)
      .limit(1)

    if (existingErr) {
      return json(500, { error: `Failed to find role assignment: ${existingErr.message}` }, origin)
    }

    if (!existing || existing.length === 0) {
      return json(404, { error: 'Role assignment not found' }, origin)
    }

    const oldValues = { is_active: existing[0].is_active }
    const newValues = { is_active: false }

    const { error: updErr } = await service
      .from('user_roles')
      .update({ is_active: false, assigned_by: callerId, assigned_at: new Date().toISOString() })
      .eq('id', existing[0].id)

    if (updErr) {
      return json(500, { error: `Failed to revoke role: ${updErr.message}` }, origin)
    }

    await insertAudit('revoke_role', 'user_roles', existing[0].id, oldValues, newValues)

    return json(200, { ok: true }, origin)
  }

  if (payload.action === 'delete_user') {
    const perm = await checkPermission('create_delete_admins')
    if (perm.error) return json(500, { error: perm.error }, origin)
    if (!perm.allowed) return json(403, { error: 'Forbidden' }, origin)

    // Capture some context before deleting
    const oldValues = {
      status: targetProfile.status,
      primary_role: targetProfile.primary_role,
    }

    const { error: delErr } = await service.auth.admin.deleteUser(targetUserId)
    if (delErr) {
      return json(500, { error: `Failed to delete user: ${delErr.message}` }, origin)
    }

    await insertAudit('delete_user', 'auth.users', targetUserId, oldValues, null)

    return json(200, { ok: true }, origin)
  }

  return json(400, { error: 'Unknown action' }, origin)
})
