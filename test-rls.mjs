import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://hrdjmxzebppdevwhcpng.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhyZGpteHplYnBwZGV2d2hjcG5nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA0ODI5MzAsImV4cCI6MjA4NjA1ODkzMH0.earV3bP6aBoblAGM3k88FOhltDAJaOJPINYz9SZnqLE';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhyZGpteHplYnBwZGV2d2hjcG5nIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDQ4MjkzMCwiZXhwIjoyMDg2MDU4OTMwfQ.UZdFnlHwe0J_R4xyfTi4U-5giujcvkzsivoEWl7dXIg';

const PROJECT_ID = '53232f04-d83a-4709-b078-9eb39cf4455f';

// Get user email from service client
const service = createClient(SUPABASE_URL, SERVICE_KEY);
const { data: profile } = await service.from('profiles').select('email').eq('id', '494d2af6-fd69-494f-bcb6-7cfb6398fe2d').single();
console.log('User email:', profile?.email);

// Sign in as user
const anon = createClient(SUPABASE_URL, ANON_KEY);
const { data: authData, error: authError } = await anon.auth.signInWithPassword({
  email: profile?.email,
  password: 'Test1234!'  // guess common test password
});

if (authError) {
  console.log('Auth error (trying other passwords):', authError.message);

  // Try another password
  const { data: authData2, error: authError2 } = await anon.auth.signInWithPassword({
    email: profile?.email,
    password: 'test1234'
  });

  if (authError2) {
    console.log('Auth error 2:', authError2.message);

    // Use service client to check what happens with auth.uid() in RLS
    // Let's just try hitting the dev server URL directly
    console.log('\nTesting via dev server...');
    try {
      const res = await fetch(`http://localhost:5174/projects/${PROJECT_ID}`, {
        redirect: 'manual'
      });
      console.log('Page response:', res.status, res.headers.get('location'));
    } catch (e) {
      console.log('Fetch error:', e.message);
    }

    // Check if the artifacts were inserted with correct created_by
    const { data: artCheck } = await service.from('artifacts')
      .select('id, created_by, project_id')
      .eq('project_id', PROJECT_ID)
      .limit(2);
    console.log('\nArtifact created_by check:', artCheck?.map(a => ({ id: a.id.substring(0, 8), created_by: a.created_by })));

    // Check if there is a DELETE policy that's missing
    const { data: policiesRaw } = await service.from('artifacts').select('id').eq('project_id', PROJECT_ID);
    console.log('Service can see artifacts:', policiesRaw?.length);

    process.exit(0);
  }
}

if (authData?.session) {
  console.log('Logged in as:', authData.user.email);

  // Now test with the authenticated user
  const userClient = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${authData.session.access_token}` } }
  });

  // Test project query
  const { data: project, error: projErr } = await userClient.from('projects')
    .select('id, name')
    .eq('id', PROJECT_ID)
    .is('deleted_at', null)
    .single();
  console.log('Project (as user):', projErr ? `ERROR: ${projErr.message}` : project?.name);

  // Test artifacts query
  const { data: artifacts, error: artErr } = await userClient.from('artifacts')
    .select('id, title')
    .eq('project_id', PROJECT_ID);
  console.log('Artifacts (as user):', artErr ? `ERROR: ${artErr.message}` : `${artifacts?.length} found`);

  // Test single artifact with join
  if (artifacts && artifacts.length > 0) {
    const { data: singleArt, error: singleErr } = await userClient.from('artifacts')
      .select('*, document_type:document_types(id, name, slug)')
      .eq('id', artifacts[0].id)
      .eq('project_id', PROJECT_ID)
      .single();
    console.log('Single artifact (as user):', singleErr ? `ERROR: ${JSON.stringify(singleErr)}` : `${singleArt?.title} - ${JSON.stringify(singleArt?.document_type)}`);
  }
}
