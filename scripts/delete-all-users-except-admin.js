const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase credentials');
  console.error('Required: EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function deleteAllUsersExceptAdmin() {
  try {
    console.log('🔑 Signing in as admin...');
    
    // Try different admin accounts
    let authData;
    const adminAccounts = [
      { email: 'admin@jpmcollege.edu', password: 'admin123' },
      { email: 'superadmin@college.com', password: 'Super@2024' },
      { email: 'principal@college.com', password: 'Principal@2024' }
    ];

    for (const account of adminAccounts) {
      const { data, error } = await supabase.auth.signInWithPassword(account);
      if (!error && data.user) {
        authData = data;
        console.log(`✓ Signed in as: ${data.user.email}`);
        break;
      }
    }

    if (!authData || !authData.user) {
      console.error('❌ Failed to sign in with any admin account');
      console.error('Available accounts to try:');
      adminAccounts.forEach(acc => console.error(`  - ${acc.email}`));
      process.exit(1);
    }

    const adminId = authData.user.id;
    const adminEmail = authData.user.email;

    console.log(`🔍 Finding all users except ${adminEmail}...`);

    // Get all other users
    const { data: allUsers, error: listError } = await supabase
      .from('profiles')
      .select('id, email, full_name')
      .neq('id', adminId);

    if (listError) {
      console.error('❌ Error fetching users:', listError);
      process.exit(1);
    }

    console.log(`\n📋 Found ${allUsers.length} users to delete (excluding admin)`);

    if (allUsers.length === 0) {
      console.log('✓ No users to delete');
      return;
    }

    console.log('\n⚠️  WARNING: This will delete all users from profiles table.');
    console.log('Note: Auth users can only be deleted via Supabase Dashboard > Authentication.');
    
    // Delete from profiles only (RLS policies should allow this)
    let successCount = 0;
    let failCount = 0;

    for (const user of allUsers) {
      try {
        console.log(`\n🗑️  Deleting: ${user.email || user.full_name} (${user.id})`);
        
        // Delete from profiles
        const { error: profileError } = await supabase
          .from('profiles')
          .delete()
          .eq('id', user.id);
        
        if (profileError) {
          console.error(`   ❌ Profile deletion failed:`, profileError.message);
          failCount++;
        } else {
          console.log(`   ✓ Profile deleted`);
          successCount++;
        }
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 50));
      } catch (err) {
        console.error(`   ❌ Error:`, err.message);
        failCount++;
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 DELETION SUMMARY');
    console.log('='.repeat(60));
    console.log(`✓ Successfully deleted: ${successCount} users`);
    console.log(`❌ Failed to delete: ${failCount} users`);
    console.log(`✓ Admin preserved: admin@jpmcollege.edu`);
    console.log('='.repeat(60));

    // Verify final count
    const { count } = await supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true });
    
    console.log(`\n✓ Total users remaining in database: ${count}`);
    console.log('   (Should be 1 - admin@jpmcollege.edu only)');

  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

deleteAllUsersExceptAdmin();
