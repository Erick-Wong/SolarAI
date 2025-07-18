-- Create storage buckets for file management
INSERT INTO storage.buckets (id, name, public) VALUES 
  ('documents', 'documents', false),
  ('photos', 'photos', false),
  ('reports', 'reports', false);

-- Create documents table to track file metadata
CREATE TABLE public.documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT,
  file_type TEXT NOT NULL,
  document_type TEXT NOT NULL, -- 'contract', 'permit', 'report', 'photo', 'other'
  related_entity_type TEXT, -- 'customer', 'lead', 'installation', 'quote'
  related_entity_id UUID,
  title TEXT,
  description TEXT,
  upload_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create installation_photos table for progress tracking
CREATE TABLE public.installation_photos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  installation_id UUID NOT NULL,
  user_id UUID NOT NULL,
  document_id UUID NOT NULL,
  photo_stage TEXT NOT NULL, -- 'before', 'during', 'after', 'inspection'
  caption TEXT,
  taken_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  FOREIGN KEY (installation_id) REFERENCES installations(id) ON DELETE CASCADE,
  FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
);

-- Enable RLS on documents table
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- Create policies for documents
CREATE POLICY "Users can view their own documents" 
ON public.documents 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own documents" 
ON public.documents 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own documents" 
ON public.documents 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own documents" 
ON public.documents 
FOR DELETE 
USING (auth.uid() = user_id);

-- Enable RLS on installation_photos table
ALTER TABLE public.installation_photos ENABLE ROW LEVEL SECURITY;

-- Create policies for installation_photos
CREATE POLICY "Users can view their own installation photos" 
ON public.installation_photos 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own installation photos" 
ON public.installation_photos 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own installation photos" 
ON public.installation_photos 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own installation photos" 
ON public.installation_photos 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create storage policies for documents bucket
CREATE POLICY "Users can view their own documents in storage" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload their own documents" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own documents" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own documents" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create storage policies for photos bucket
CREATE POLICY "Users can view their own photos in storage" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload their own photos" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own photos" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own photos" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'photos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create storage policies for reports bucket
CREATE POLICY "Users can view their own reports in storage" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'reports' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload their own reports" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'reports' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own reports" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'reports' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own reports" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'reports' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create indexes for better performance
CREATE INDEX idx_documents_user_id ON public.documents(user_id);
CREATE INDEX idx_documents_document_type ON public.documents(document_type);
CREATE INDEX idx_documents_related_entity ON public.documents(related_entity_type, related_entity_id);
CREATE INDEX idx_installation_photos_installation_id ON public.installation_photos(installation_id);
CREATE INDEX idx_installation_photos_photo_stage ON public.installation_photos(photo_stage);

-- Add trigger for updating timestamps
CREATE TRIGGER update_documents_updated_at
BEFORE UPDATE ON public.documents
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();