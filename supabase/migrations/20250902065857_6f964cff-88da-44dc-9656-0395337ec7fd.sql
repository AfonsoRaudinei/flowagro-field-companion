-- Add user_id column to documents table to establish ownership
ALTER TABLE documents ADD COLUMN user_id uuid REFERENCES auth.users(id);

-- Set existing documents to belong to the first available user (migration safety)
-- In production, you'd want a more sophisticated migration strategy
UPDATE documents 
SET user_id = (SELECT id FROM auth.users ORDER BY created_at LIMIT 1)
WHERE user_id IS NULL;

-- Make user_id required for new documents
ALTER TABLE documents ALTER COLUMN user_id SET NOT NULL;

-- Drop the insecure RLS policies for documents
DROP POLICY IF EXISTS "Users can view their own documents" ON documents;
DROP POLICY IF EXISTS "Users can insert their own documents" ON documents;
DROP POLICY IF EXISTS "Users can update their own documents" ON documents;
DROP POLICY IF EXISTS "Users can delete their own documents" ON documents;

-- Create secure RLS policies for documents
CREATE POLICY "Users can view their own documents" 
ON documents FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own documents" 
ON documents FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own documents" 
ON documents FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own documents" 
ON documents FOR DELETE 
USING (auth.uid() = user_id);

-- Drop the insecure RLS policies for document_chunks
DROP POLICY IF EXISTS "Users can view document chunks for their documents" ON document_chunks;
DROP POLICY IF EXISTS "Users can insert document chunks for their documents" ON document_chunks;
DROP POLICY IF EXISTS "Users can update document chunks for their documents" ON document_chunks;
DROP POLICY IF EXISTS "Users can delete document chunks for their documents" ON document_chunks;

-- Create secure RLS policies for document_chunks that properly check document ownership
CREATE POLICY "Users can view document chunks for their documents" 
ON document_chunks FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM documents 
  WHERE documents.id = document_chunks.document_id 
  AND documents.user_id = auth.uid()
));

CREATE POLICY "Users can insert document chunks for their documents" 
ON document_chunks FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM documents 
  WHERE documents.id = document_chunks.document_id 
  AND documents.user_id = auth.uid()
));

CREATE POLICY "Users can update document chunks for their documents" 
ON document_chunks FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM documents 
  WHERE documents.id = document_chunks.document_id 
  AND documents.user_id = auth.uid()
));

CREATE POLICY "Users can delete document chunks for their documents" 
ON document_chunks FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM documents 
  WHERE documents.id = document_chunks.document_id 
  AND documents.user_id = auth.uid()
));