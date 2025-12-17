const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  console.error('Required: EXPO_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function deleteAllUsersExceptAdmin() {
  try {
    console.log('🔍 Finding admin@jpmcollege.edu...');
    
    // Get admin user ID
    const { data: adminProfile, error: adminError } = await supabase
      .from('profiles')
      .select('id, email')
      .eq('email', 'admin@jpmcollege.edu')
      .single();

    if (adminError || !adminProfile) {
      console.error('❌ Admin user not found:', adminError);
      process.exit(1);
    }

    console.log('✓ Found admin:', adminProfile.email, '- ID:', adminProfile.id);

    // Get all other users
    const { data: allUsers, error: listError } = await supabase
      .from('profiles')
      .select('id, email, full_name')
      .neq('email', 'admin@jpmcollege.edu');

    if (listError) {
      console.error('❌ Error fetching users:', listError);
      process.exit(1);
    }

    console.log(`\n📋 Found ${allUsers.length} users to delete (excluding admin@jpmcollege.edu)`);

    if (allUsers.length === 0) {
      console.log('✓ No users to delete');
      return;
    }

    // Delete from Auth and profiles
    let successCount = 0;
    let failCount = 0;

    for (const user of allUsers) {
      try {
        console.log(`\n🗑️  Deleting: ${user.email || user.full_name} (${user.id})`);
        
        // Delete from Auth (this cascades to profiles due to ON DELETE CASCADE)
        const { error: authError } = await supabase.auth.admin.deleteUser(user.id);
        
        if (authError) {
          console.error(`   ❌ Auth deletion failed:`, authError.message);
          
          // Try deleting from profiles directly if auth delete fails
          const { error: profileError } = await supabase
            .from('profiles')
            .delete()
            .eq('id', user.id);
          
          if (profileError) {
            console.error(`   ❌ Profile deletion failed:`, profileError.message);
            failCount++;
          } else {
            console.log(`   ✓ Profile deleted (auth delete failed but profile removed)`);
            successCount++;
          }
        } else {
          console.log(`   ✓ Deleted from Auth and profiles`);
          successCount++;
        }
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
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
