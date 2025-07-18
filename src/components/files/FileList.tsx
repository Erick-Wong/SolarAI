import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { 
  FileText, 
  Image, 
  Download, 
  Trash2, 
  MoreVertical, 
  Search,
  Calendar,
  Eye
} from "lucide-react";
import { format } from "date-fns";

interface Document {
  id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  file_type: string;
  document_type: string;
  title: string;
  description: string | null;
  upload_date: string;
  related_entity_type: string | null;
  related_entity_id: string | null;
}

interface FileListProps {
  bucket?: 'documents' | 'photos' | 'reports';
  documentType?: string;
  relatedEntityType?: string;
  relatedEntityId?: string;
  refreshTrigger?: number;
}

export function FileList({
  bucket,
  documentType,
  relatedEntityType,
  relatedEntityId,
  refreshTrigger
}: FileListProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const fetchDocuments = async () => {
    if (!user) return;

    try {
      let query = supabase
        .from('documents')
        .select('*')
        .eq('user_id', user.id)
        .order('upload_date', { ascending: false });

      if (documentType) {
        query = query.eq('document_type', documentType);
      }

      if (relatedEntityType && relatedEntityId) {
        query = query.eq('related_entity_type', relatedEntityType);
        query = query.eq('related_entity_id', relatedEntityId);
      }

      const { data, error } = await query;

      if (error) throw error;

      setDocuments(data || []);
    } catch (error: any) {
      console.error('Error fetching documents:', error);
      toast({
        title: "Failed to load files",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [user, documentType, relatedEntityType, relatedEntityId, refreshTrigger]);

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) {
      return <Image className="w-5 h-5 text-primary" />;
    }
    return <FileText className="w-5 h-5 text-muted-foreground" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const downloadFile = async (document: Document) => {
    try {
      const bucketName = document.file_type.startsWith('image/') ? 'photos' : 
                        document.document_type === 'report' ? 'reports' : 'documents';
      
      const { data, error } = await supabase.storage
        .from(bucketName)
        .download(document.file_path);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = window.document.createElement('a');
      a.href = url;
      a.download = document.file_name;
      window.document.body.appendChild(a);
      a.click();
      window.document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Download started",
        description: `${document.file_name} is being downloaded.`
      });
    } catch (error: any) {
      console.error('Download error:', error);
      toast({
        title: "Download failed",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const deleteFile = async (document: Document) => {
    try {
      const bucketName = document.file_type.startsWith('image/') ? 'photos' : 
                        document.document_type === 'report' ? 'reports' : 'documents';

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from(bucketName)
        .remove([document.file_path]);

      if (storageError) throw storageError;

      // Delete from database
      const { error: dbError } = await supabase
        .from('documents')
        .delete()
        .eq('id', document.id);

      if (dbError) throw dbError;

      setDocuments(docs => docs.filter(d => d.id !== document.id));
      setDeleteConfirmId(null);

      toast({
        title: "File deleted",
        description: `${document.file_name} has been deleted.`
      });
    } catch (error: any) {
      console.error('Delete error:', error);
      toast({
        title: "Delete failed",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.file_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === "all" || doc.document_type === typeFilter;
    return matchesSearch && matchesType;
  });

  const uniqueTypes = Array.from(new Set(documents.map(doc => doc.document_type)));

  if (loading) {
    return (
      <Card className="bg-gradient-card border-border/50">
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">Loading files...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="bg-gradient-card border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Files ({filteredDocuments.length})
          </CardTitle>
          
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search files..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            {uniqueTypes.length > 1 && (
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {uniqueTypes.map(type => (
                    <SelectItem key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-6 pt-0">
          {filteredDocuments.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              {searchTerm || typeFilter !== "all" 
                ? "No files match your criteria" 
                : "No files uploaded yet"
              }
            </div>
          ) : (
            <div className="space-y-3">
              {filteredDocuments.map((document) => (
                <div
                  key={document.id}
                  className="flex items-center gap-4 p-4 bg-muted/20 rounded-lg border border-border/30 hover:bg-muted/30 transition-colors"
                >
                  {getFileIcon(document.file_type)}
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium text-foreground truncate">{document.title}</p>
                      <Badge variant="secondary" className="text-xs">
                        {document.document_type}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">{document.file_name}</p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                      <span>{formatFileSize(document.file_size)}</span>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {format(new Date(document.upload_date), 'MMM d, yyyy')}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => downloadFile(document)}
                    >
                      <Download className="w-4 h-4" />
                    </Button>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => downloadFile(document)}>
                          <Download className="w-4 h-4 mr-2" />
                          Download
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => setDeleteConfirmId(document.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete File</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this file? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                const doc = documents.find(d => d.id === deleteConfirmId);
                if (doc) deleteFile(doc);
              }}
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}