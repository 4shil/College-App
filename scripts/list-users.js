const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function listUsers() {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, full_name, primary_role, status')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log(`\nFound ${data.length} users:\n`);
  data.forEach((user, i) => {
    console.log(`${i + 1}. ${user.email || 'No email'}`);
    console.log(`   Name: ${user.full_name || 'N/A'}`);
    console.log(`   Role: ${user.primary_role || 'None'}`);
    console.log(`   Status: ${user.status}`);
    console.log(`   ID: ${user.id}\n`);
  });
}

listUsers();
