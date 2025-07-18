import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Upload, FileText, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileUploadProps {
  bucket: 'documents' | 'photos' | 'reports';
  documentType: string;
  relatedEntityType?: string;
  relatedEntityId?: string;
  onUploadSuccess?: (documentId: string) => void;
  acceptedTypes?: string;
  maxSize?: number;
}

export function FileUpload({
  bucket,
  documentType,
  relatedEntityType,
  relatedEntityId,
  onUploadSuccess,
  acceptedTypes = "*/*",
  maxSize = 10 * 1024 * 1024 // 10MB
}: FileUploadProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (file: File) => {
    if (file.size > maxSize) {
      toast({
        title: "File too large",
        description: `File size must be less than ${maxSize / 1024 / 1024}MB`,
        variant: "destructive"
      });
      return;
    }

    setSelectedFile(file);
    if (!title) setTitle(file.name.split('.')[0]);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const uploadFile = async () => {
    if (!selectedFile || !user) return;

    setUploading(true);

    try {
      // Create unique file path
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      // Upload file to storage
      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, selectedFile);

      if (uploadError) throw uploadError;

      // Save file metadata to database
      const { data: document, error: dbError } = await supabase
        .from('documents')
        .insert({
          user_id: user.id,
          file_name: selectedFile.name,
          file_path: filePath,
          file_size: selectedFile.size,
          file_type: selectedFile.type || 'application/octet-stream',
          document_type: documentType,
          related_entity_type: relatedEntityType,
          related_entity_id: relatedEntityId,
          title: title || selectedFile.name,
          description: description || null
        })
        .select()
        .single();

      if (dbError) throw dbError;

      toast({
        title: "File uploaded successfully",
        description: `${selectedFile.name} has been uploaded.`
      });

      // Reset form
      setSelectedFile(null);
      setTitle("");
      setDescription("");
      if (fileInputRef.current) fileInputRef.current.value = "";

      onUploadSuccess?.(document.id);

    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload file",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card className="bg-gradient-card border-border/50">
      <CardContent className="p-6">
        <div className="space-y-4">
          {!selectedFile ? (
            <div
              className={cn(
                "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
                dragOver ? "border-primary bg-primary/5" : "border-border/50 hover:border-border"
              )}
              onDrop={handleDrop}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg font-medium mb-2">Drop files here or click to browse</p>
              <p className="text-sm text-muted-foreground">
                Maximum file size: {maxSize / 1024 / 1024}MB
              </p>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept={acceptedTypes}
                onChange={handleFileInputChange}
              />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-muted/20 rounded-lg">
                <FileText className="w-8 h-8 text-primary" />
                <div className="flex-1">
                  <p className="font-medium">{selectedFile.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedFile(null);
                    setTitle("");
                    setDescription("");
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <div className="space-y-3">
                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter file title"
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Enter file description"
                    rows={3}
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={uploadFile}
                  disabled={uploading || !title.trim()}
                  className="bg-gradient-primary hover:shadow-primary transition-smooth"
                >
                  {uploading ? "Uploading..." : "Upload File"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedFile(null);
                    setTitle("");
                    setDescription("");
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                  disabled={uploading}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}