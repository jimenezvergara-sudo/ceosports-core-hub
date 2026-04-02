
-- Make club-documentos bucket public so logos and files can be accessed
UPDATE storage.buckets SET public = true WHERE id = 'club-documentos';

-- Add UPDATE policy for storage objects (needed for upsert/overwrite)
CREATE POLICY "Authenticated can update club doc files"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'club-documentos' AND auth.role() = 'authenticated');
