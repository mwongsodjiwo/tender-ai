import { createClient } from '@supabase/supabase-js';

const client = createClient(
  'https://hrdjmxzebppdevwhcpng.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhyZGpteHplYnBwZGV2d2hjcG5nIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDQ4MjkzMCwiZXhwIjoyMDg2MDU4OTMwfQ.UZdFnlHwe0J_R4xyfTi4U-5giujcvkzsivoEWl7dXIg'
);

const PROJECT_ID = '53232f04-d83a-4709-b078-9eb39cf4455f';

// Get one artifact
const { data: artifacts } = await client.from('artifacts')
  .select('id, title, project_id')
  .eq('project_id', PROJECT_ID)
  .limit(1);

if (!artifacts || artifacts.length === 0) {
  console.log('No artifacts found');
  process.exit(1);
}

const art = artifacts[0];
console.log('Test artifact:', art.id, '-', art.title);

// Test exact query from +page.server.ts
const { data: artifact, error: artError } = await client
  .from('artifacts')
  .select('*, document_type:document_types(id, name, slug)')
  .eq('id', art.id)
  .eq('project_id', PROJECT_ID)
  .single();

if (artError) {
  console.log('Artifact query ERROR:', JSON.stringify(artError, null, 2));
} else {
  console.log('Artifact loaded OK:', artifact.title);
  console.log('document_type:', JSON.stringify(artifact.document_type));
}

// Check project query
const { data: project, error: projError } = await client
  .from('projects')
  .select('id, name, briefing_data, organization_id')
  .eq('id', PROJECT_ID)
  .is('deleted_at', null)
  .single();

if (projError) {
  console.log('Project query ERROR:', JSON.stringify(projError, null, 2));
} else {
  console.log('Project loaded OK:', project.name);
}

// Check RLS on artifacts
const { data: rlsData, error: rlsError } = await client.rpc('get_policies', {}).maybeSingle();
console.log('RLS check:', rlsError ? rlsError.message : 'no rpc');

// Check if is_project_member function exists
const { data: memberCheck } = await client.from('project_members')
  .select('id, profile_id')
  .eq('project_id', PROJECT_ID);
console.log('Project members:', memberCheck?.length, memberCheck?.map(m => m.profile_id));

// Check document_types slug column exists
const { data: dtData, error: dtError } = await client.from('document_types')
  .select('id, name, slug')
  .limit(1);
if (dtError) {
  console.log('document_types slug ERROR:', JSON.stringify(dtError, null, 2));
} else {
  console.log('document_types slug OK:', dtData);
}
