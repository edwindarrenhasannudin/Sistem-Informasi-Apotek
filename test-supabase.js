import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hqyjnaarkkntayiufdlc.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhxeWpuYWFya2tudGF5aXVmZGxjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI2NTM0NjIsImV4cCI6MjA5ODIyOTQ2Mn0.duIJJSj5HXMRciYaIUCMLMnwANrPMWPeqDkyFMffzEA';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testLogin() {
  const email = `testuser1782882734117@apotek.com`;
  console.log('Logging in', email);
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password: 'password123',
  });
  if (error) {
    console.error('Login failed:', error.message);
  } else {
    console.log('Login success:', data.user?.id);
  }
}
testLogin();
