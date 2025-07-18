import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { FileUpload } from "./FileUpload";
import { Camera, Calendar, MapPin, Plus } from "lucide-react";
import { format } from "date-fns";

interface InstallationPhoto {
  id: string;
  installation_id: string;
  photo_stage: string;
  caption: string | null;
  taken_at: string;
  document: {
    id: string;
    file_name: string;
    file_path: string;
    title: string;
    file_type: string;
  };
}

interface InstallationPhotosProps {
  installationId: string;
  installationAddress?: string;
}

const photoStages = [
  { value: "before", label: "Before Installation", color: "bg-blue-500" },
  { value: "during", label: "During Installation", color: "bg-yellow-500" },
  { value: "after", label: "After Installation", color: "bg-green-500" },
  { value: "inspection", label: "Inspection", color: "bg-purple-500" }
];

export function InstallationPhotos({ installationId, installationAddress }: InstallationPhotosProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [photos, setPhotos] = useState<InstallationPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [selectedStage, setSelectedStage] = useState<string>("");
  const [caption, setCaption] = useState("");

  const fetchPhotos = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('installation_photos')
        .select(`
          *,
          document:documents(
            id,
            file_name,
            file_path,
            title,
            file_type
          )
        `)
        .eq('installation_id', installationId)
        .eq('user_id', user.id)
        .order('taken_at', { ascending: false });

      if (error) throw error;

      setPhotos(data || []);
    } catch (error: any) {
      console.error('Error fetching photos:', error);
      toast({
        title: "Failed to load photos",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPhotos();
  }, [installationId, user]);

  const handlePhotoUpload = async (documentId: string) => {
    if (!selectedStage) {
      toast({
        title: "Please select a stage",
        description: "You must select when this photo was taken",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('installation_photos')
        .insert({
          installation_id: installationId,
          user_id: user!.id,
          document_id: documentId,
          photo_stage: selectedStage,
          caption: caption || null
        });

      if (error) throw error;

      toast({
        title: "Photo added successfully",
        description: "Installation photo has been uploaded and categorized."
      });

      setShowUploadDialog(false);
      setSelectedStage("");
      setCaption("");
      fetchPhotos();
    } catch (error: any) {
      console.error('Error linking photo:', error);
      toast({
        title: "Failed to categorize photo",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const getPhotoUrl = async (filePath: string) => {
    const { data } = await supabase.storage
      .from('photos')
      .createSignedUrl(filePath, 3600); // 1 hour expiry
    return data?.signedUrl;
  };

  const getStageInfo = (stage: string) => {
    return photoStages.find(s => s.value === stage) || { label: stage, color: "bg-gray-500" };
  };

  const groupedPhotos = photos.reduce((acc, photo) => {
    const stage = photo.photo_stage;
    if (!acc[stage]) acc[stage] = [];
    acc[stage].push(photo);
    return acc;
  }, {} as Record<string, InstallationPhoto[]>);

  if (loading) {
    return (
      <Card className="bg-gradient-card border-border/50">
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">Loading photos...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-card border-border/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Camera className="w-5 h-5" />
                Installation Photos
              </CardTitle>
              {installationAddress && (
                <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                  <MapPin className="w-4 h-4" />
                  {installationAddress}
                </div>
              )}
            </div>
            
            <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-primary hover:shadow-primary transition-smooth">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Photo
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Upload Installation Photo</DialogTitle>
                  <DialogDescription>
                    Upload a photo and categorize it by installation stage
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="stage">Installation Stage *</Label>
                    <Select value={selectedStage} onValueChange={setSelectedStage}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select when this photo was taken" />
                      </SelectTrigger>
                      <SelectContent>
                        {photoStages.map(stage => (
                          <SelectItem key={stage.value} value={stage.value}>
                            {stage.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="caption">Caption (Optional)</Label>
                    <Textarea
                      id="caption"
                      value={caption}
                      onChange={(e) => setCaption(e.target.value)}
                      placeholder="Add a description for this photo..."
                      rows={3}
                    />
                  </div>

                  <FileUpload
                    bucket="photos"
                    documentType="photo"
                    relatedEntityType="installation"
                    relatedEntityId={installationId}
                    acceptedTypes="image/*"
                    onUploadSuccess={handlePhotoUpload}
                    maxSize={50 * 1024 * 1024} // 50MB for photos
                  />
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>

        <CardContent className="p-6 pt-0">
          {photos.length === 0 ? (
            <div className="text-center text-muted-foreground py-12">
              <Camera className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg mb-2">No photos uploaded yet</p>
              <p className="text-sm">Document your installation progress by uploading photos</p>
            </div>
          ) : (
            <div className="space-y-8">
              {photoStages.map(stage => {
                const stagePhotos = groupedPhotos[stage.value] || [];
                if (stagePhotos.length === 0) return null;

                return (
                  <div key={stage.value} className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${stage.color}`} />
                      <h3 className="text-lg font-semibold">{stage.label}</h3>
                      <Badge variant="secondary">{stagePhotos.length} photos</Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {stagePhotos.map((photo) => (
                        <Card key={photo.id} className="overflow-hidden hover:shadow-primary transition-smooth">
                          <div className="aspect-video bg-muted/20 relative">
                            <img
                              src={`https://opecyhihtyusvhhivhcw.supabase.co/storage/v1/object/public/photos/${photo.document.file_path}`}
                              alt={photo.document.title}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                // Fallback to signed URL if public access fails
                                getPhotoUrl(photo.document.file_path).then(url => {
                                  if (url) (e.target as HTMLImageElement).src = url;
                                });
                              }}
                            />
                          </div>
                          <CardContent className="p-4">
                            <h4 className="font-medium mb-1">{photo.document.title}</h4>
                            {photo.caption && (
                              <p className="text-sm text-muted-foreground mb-2">{photo.caption}</p>
                            )}
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Calendar className="w-3 h-3" />
                              {format(new Date(photo.taken_at), 'MMM d, yyyy h:mm a')}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}