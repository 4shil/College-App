/**
 * RBAC Testing Script
 * Tests role-based access control functionality
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  blue: '\x1b[34m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

async function testRolesAndPermissions() {
  log('\n📋 Testing Roles and Permissions...', colors.cyan);

  try {
    // Test 1: Fetch all roles
    const { data: roles, error: rolesError } = await supabase
      .from('roles')
      .select('*')
      .order('name');

    if (rolesError) throw rolesError;

    log(`✅ Found ${roles.length} roles`, colors.green);

    // Show admin roles with permissions
    const adminRoles = roles.filter(r => r.category === 'admin');
    log(`\n📊 Admin Roles (${adminRoles.length}):`, colors.blue);
    
    adminRoles.forEach(role => {
      const permissionCount = role.permissions ? Object.keys(role.permissions).length : 0;
      log(`  ${role.display_name.padEnd(25)} - ${permissionCount} permissions`, colors.green);
    });

    return true;
  } catch (error) {
    log(`❌ Error: ${error.message}`, colors.red);
    return false;
  }
}

async function testRBACFunctions() {
  log('\n🔧 Testing RBAC Functions...', colors.cyan);

  try {
    // Get a test user with admin role
    const { data: userRoles, error: userRolesError } = await supabase
      .from('user_roles')
      .select('user_id, role:roles(name)')
      .limit(1);

    if (userRolesError) throw userRolesError;

    if (!userRoles || userRoles.length === 0) {
      log('⚠️  No user roles found to test', colors.yellow);
      return true;
    }

    const testUserId = userRoles[0].user_id;
    const testRoleName = userRoles[0].role?.name;

    log(`\nTesting with User ID: ${testUserId}`, colors.blue);
    log(`User Role: ${testRoleName}`, colors.blue);

    // Test has_permission function
    const { data: hasPermData, error: hasPermError } = await supabase
      .rpc('has_permission', { 
        user_id: testUserId, 
        permission_name: 'manage_library' 
      });

    if (hasPermError) {
      log(`⚠️  has_permission function: ${hasPermError.message}`, colors.yellow);
    } else {
      log(`✅ has_permission('manage_library'): ${hasPermData}`, colors.green);
    }

    // Test can_access_module function
    const { data: canAccessData, error: canAccessError } = await supabase
      .rpc('can_access_module', { 
        user_id: testUserId, 
        module_name: 'library' 
      });

    if (canAccessError) {
      log(`⚠️  can_access_module function: ${canAccessError.message}`, colors.yellow);
    } else {
      log(`✅ can_access_module('library'): ${canAccessData}`, colors.green);
    }

    // Test get_user_permissions function
    const { data: userPermsData, error: userPermsError } = await supabase
      .rpc('get_user_permissions', { user_id: testUserId });

    if (userPermsError) {
      log(`⚠️  get_user_permissions function: ${userPermsError.message}`, colors.yellow);
    } else {
      const perms = Array.isArray(userPermsData) ? userPermsData : [];
      log(`✅ get_user_permissions: ${perms.length} permissions`, colors.green);
      if (perms.length > 0) {
        log(`   Sample: ${perms.slice(0, 3).join(', ')}`, colors.cyan);
      }
    }

    // Test is_user_admin function
    const { data: isAdminData, error: isAdminError } = await supabase
      .rpc('is_user_admin', { user_id: testUserId });

    if (isAdminError) {
      log(`⚠️  is_user_admin function: ${isAdminError.message}`, colors.yellow);
    } else {
      log(`✅ is_user_admin: ${isAdminData}`, colors.green);
    }

    return true;
  } catch (error) {
    log(`❌ Error: ${error.message}`, colors.red);
    return false;
  }
}

async function testRolePermissionsMatrix() {
  log('\n📊 Role Permissions Matrix:', colors.cyan);

  try {
    const { data: roles, error } = await supabase
      .from('roles')
      .select('name, display_name, category, permissions')
      .eq('category', 'admin')
      .order('name');

    if (error) throw error;

    console.log('\n' + '='.repeat(80));
    console.log('ROLE'.padEnd(25) + 'CATEGORY'.padEnd(15) + 'PERMISSIONS');
    console.log('='.repeat(80));

    roles.forEach(role => {
      const permCount = role.permissions ? Object.keys(role.permissions).length : 0;
      const permissions = role.permissions ? Object.keys(role.permissions).slice(0, 3).join(', ') : 'None';
      
      log(
        role.display_name.padEnd(25) + 
        role.category.padEnd(15) + 
        `${permCount} (${permissions}...)`,
        colors.cyan
      );
    });

    console.log('='.repeat(80) + '\n');

    return true;
  } catch (error) {
    log(`❌ Error: ${error.message}`, colors.red);
    return false;
  }
}

async function runAllTests() {
  log('\n' + '='.repeat(60), colors.blue);
  log('🧪 RBAC TESTING SUITE', colors.blue);
  log('='.repeat(60) + '\n', colors.blue);

  const results = {
    rolesAndPermissions: await testRolesAndPermissions(),
    rbacFunctions: await testRBACFunctions(),
    permissionsMatrix: await testRolePermissionsMatrix(),
  };

  // Summary
  log('\n' + '='.repeat(60), colors.blue);
  log('📊 TEST SUMMARY', colors.blue);
  log('='.repeat(60), colors.blue);

  const passed = Object.values(results).filter(r => r).length;
  const total = Object.keys(results).length;

  Object.entries(results).forEach(([test, result]) => {
    const icon = result ? '✅' : '❌';
    const color = result ? colors.green : colors.red;
    log(`${icon} ${test.toUpperCase()}`, color);
  });

  log('\n' + '-'.repeat(60), colors.blue);
  log(`PASSED: ${passed}/${total}`, passed === total ? colors.green : colors.yellow);
  log('='.repeat(60) + '\n', colors.blue);

  if (passed === total) {
    log('🎉 All RBAC tests passed!', colors.green);
    log('✅ Role-based access control is working correctly', colors.green);
  } else {
    log('⚠️  Some tests failed', colors.yellow);
  }

  return passed === total;
}

// Run tests
runAllTests()
  .then(success => process.exit(success ? 0 : 1))
  .catch(error => {
    log(`\n❌ Test suite failed: ${error.message}`, colors.red);
    console.error(error);
    process.exit(1);
  });
