const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = "https://qwjmfjizkirtxdddsyty.supabase.co";
const supabaseAnonKey = "sb_publishable_TclbiXZhYzg9tq4zAtNtlQ__x3uS2VF";
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  const email = `test_schema_${Math.floor(Math.random() * 100000)}@student.utem.edu.my`;
  const password = "TestPassword123!";
  let userId = null;
  let rideId = null;

  try {
    // 1. Sign up user
    console.log('Signing up user:', email);
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) {
      console.error('Auth Sign Up Error:', authError);
      return;
    }

    userId = authData.user.id;
    console.log('User signed up. ID:', userId);

    // 2. Insert profile
    console.log('Inserting profile...');
    const { error: profileError } = await supabase.from('profiles').insert({
      id: userId,
      full_name: 'Schema Inspector',
      email,
      role: 'driver'
    });

    if (profileError) {
      console.error('Profile Insert Error:', profileError);
      return;
    }
    console.log('Profile inserted successfully.');

    // 3. Insert ride
    console.log('Inserting ride...');
    const { data: insertedRides, error: rideError } = await supabase
      .from('rides')
      .insert({
        driver_id: userId,
        pickup_location: 'UTeM Main Campus',
        destination: 'Melaka Sentral',
        departure_time: new Date().toISOString(),
        available_seats: 4,
        cost_per_person: 5,
        status: 'active'
      })
      .select();

    if (rideError) {
      console.error('Ride Insert Error:', rideError);
      return;
    }

    const row = insertedRides[0];
    rideId = row.id;
    console.log('\n========================================');
    console.log('RIDES TABLE COLUMNS:');
    console.log(Object.keys(row));
    console.log('Row details:', row);
    console.log('========================================\n');

    // 4. Clean up ride
    console.log('Deleting ride...');
    await supabase.from('rides').delete().eq('id', rideId);
    console.log('Ride deleted.');

    // 5. Clean up profile
    console.log('Deleting profile...');
    await supabase.from('profiles').delete().eq('id', userId);
    console.log('Profile deleted.');

  } catch (err) {
    console.error('Failed:', err);
  }
}

run();
