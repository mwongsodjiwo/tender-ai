-- Create storage bucket for organization logos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'organization-logos',
  'organization-logos',
  true,
  2097152, -- 2 MB
  ARRAY['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload logos for their organization
CREATE POLICY "Authenticated users can upload organization logos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'organization-logos');

-- Allow authenticated users to update (overwrite) logos
CREATE POLICY "Authenticated users can update organization logos"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'organization-logos');

-- Allow public read access to logos
CREATE POLICY "Public read access for organization logos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'organization-logos');
