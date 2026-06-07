const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = "https://qwjmfjizkirtxdddsyty.supabase.co";
const supabaseAnonKey = "sb_publishable_TclbiXZhYzg9tq4zAtNtlQ__x3uS2VF";
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  const rpcs = ['run_sql', 'exec_sql', 'execute_sql', 'query'];
  for (const rpc of rpcs) {
    console.log(`Testing RPC: ${rpc}`);
    const { data, error } = await supabase.rpc(rpc, { sql: 'SELECT 1;' });
    if (error) {
      console.log(`- Error: ${error.message} (Code: ${error.code})`);
    } else {
      console.log(`- Success! Response:`, data);
    }
  }
}

run();
