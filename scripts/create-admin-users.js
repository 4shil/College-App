const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Use anon key - we'll create users via public API
const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
);

// SECURITY WARNING: These are default setup passwords for initial deployment.
// IMMEDIATELY change these passwords in production after running this script!
// You can override passwords via environment variables:
// - ADMIN_SUPER_PASSWORD, ADMIN_PRINCIPAL_PASSWORD, etc.
const adminUsers = [
  {
    email: 'superadmin@college.com',
    password: process.env.ADMIN_SUPER_PASSWORD || 'Super@2024',
    full_name: 'Robert Johnson',
    phone: '+1234567890',
    primary_role: 'super_admin',
    role_id: 'super_admin'
  },
  {
    email: 'principal@college.com',
    password: process.env.ADMIN_PRINCIPAL_PASSWORD || 'Principal@2024',
    full_name: 'Dr. Sarah Williams',
    phone: '+1234567891',
    primary_role: 'principal',
    role_id: 'principal'
  },
  {
    email: 'examadmin@college.com',
    password: process.env.ADMIN_EXAM_PASSWORD || 'Exam@2024',
    full_name: 'Michael Brown',
    phone: '+1234567892',
    primary_role: 'exam_cell_admin',
    role_id: 'exam_cell_admin'
  },
  {
    email: 'librarian@college.com',
    password: process.env.ADMIN_LIBRARY_PASSWORD || 'Library@2024',
    full_name: 'Emily Davis',
    phone: '+1234567893',
    primary_role: 'library_admin',
    role_id: 'library_admin'
  },
  {
    email: 'financeadmin@college.com',
    password: 'Finance@2024',
    full_name: 'David Martinez',
    phone: '+1234567894',
    primary_role: 'finance_admin',
    role_id: 'finance_admin'
  },
  {
    email: 'hod@college.com',
    password: 'Hod@2024',
    full_name: 'Dr. Jennifer Taylor',
    phone: '+1234567895',
    primary_role: 'hod',
    role_id: 'hod'
  },
  {
    email: 'deptadmin@college.com',
    password: 'Dept@2024',
    full_name: 'James Anderson',
    phone: '+1234567896',
    primary_role: 'department_admin',
    role_id: 'department_admin'
  },
  {
    email: 'busadmin@college.com',
    password: 'Bus@2024',
    full_name: 'Patricia Wilson',
    phone: '+1234567897',
    primary_role: 'bus_admin',
    role_id: 'bus_admin'
  },
  {
    email: 'canteenadmin@college.com',
    password: 'Canteen@2024',
    full_name: 'Christopher Moore',
    phone: '+1234567898',
    primary_role: 'canteen_admin',
    role_id: 'canteen_admin'
  }
];

async function createAdminUsers() {
  console.log('🚀 Creating admin users...\n');

  // First, get role IDs
  const { data: roles, error: rolesError } = await supabase
    .from('roles')
    .select('id, name');

  if (rolesError) {
    console.error('❌ Error fetching roles:', rolesError);
    return;
  }

  const roleMap = {};
  roles.forEach(role => {
    roleMap[role.name] = role.id;
  });

  const credentials = [];

  for (const admin of adminUsers) {
    try {
      console.log(`Creating ${admin.full_name} (${admin.email})...`);

      // Create auth user via signup
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: admin.email,
        password: admin.password,
        options: {
          data: {
            full_name: admin.full_name,
            phone: admin.phone,
            primary_role: admin.primary_role
          }
        }
      });

      if (authError) {
        console.error(`  ❌ Auth error: ${authError.message}`);
        continue;
      }

      if (!authData.user) {
        console.error(`  ❌ No user created`);
        continue;
      }

      // Wait a bit for profile trigger to complete
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Update profile with role
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          primary_role: admin.primary_role,
          status: 'active'
        })
        .eq('id', authData.user.id);

      if (profileError) {
        console.error(`  ⚠️  Profile update error: ${profileError.message}`);
      }

      // Assign role in user_roles table
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: authData.user.id,
          role_id: roleMap[admin.role_id]
        });

      if (roleError) {
        console.error(`  ⚠️  Role assignment error: ${roleError.message}`);
      }

      credentials.push({
        name: admin.full_name,
        role: admin.primary_role,
        email: admin.email,
        password: admin.password
      });

      console.log(`  ✅ Created successfully`);
    } catch (error) {
      console.error(`  ❌ Error:`, error.message);
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log('📋 ADMIN CREDENTIALS\n');
  console.log('='.repeat(80));
  
  credentials.forEach(cred => {
    console.log(`\n${cred.name} (${cred.role.toUpperCase()})`);
    console.log(`  Email:    ${cred.email}`);
    console.log(`  Password: ${cred.password}`);
  });
  
  console.log('\n' + '='.repeat(80));
  console.log(`\n✅ Created ${credentials.length} admin users successfully!`);
  console.log('\n💡 You can now login with any of these credentials to test RBAC.');
}

createAdminUsers()
  .then(() => {
    console.log('\n✅ Script completed!');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });
