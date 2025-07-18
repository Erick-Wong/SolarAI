import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { FileUpload } from "@/components/files/FileUpload";
import { FileList } from "@/components/files/FileList";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  FileText, 
  Upload, 
  Image, 
  FileBarChart, 
  FolderOpen,
  Plus 
} from "lucide-react";

const DocumentsPage = () => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [activeTab, setActiveTab] = useState("all");
  const [showUpload, setShowUpload] = useState(false);

  const handleUploadSuccess = () => {
    setRefreshTrigger(prev => prev + 1);
    setShowUpload(false);
  };

  const documentTypes = [
    { id: "all", label: "All Files", icon: FolderOpen, description: "View all uploaded files" },
    { id: "contract", label: "Contracts", icon: FileText, description: "Customer contracts and agreements" },
    { id: "permit", label: "Permits", icon: FileBarChart, description: "Installation permits and approvals" },
    { id: "photo", label: "Photos", icon: Image, description: "Installation progress photos" },
    { id: "report", label: "Reports", icon: FileBarChart, description: "Generated reports and documents" }
  ];

  const getDocumentTypeConfig = (type: string) => {
    switch (type) {
      case "contract":
        return {
          bucket: "documents" as const,
          acceptedTypes: ".pdf,.doc,.docx",
          description: "Upload contracts, agreements, and legal documents"
        };
      case "permit":
        return {
          bucket: "documents" as const,
          acceptedTypes: ".pdf,.jpg,.jpeg,.png,.doc,.docx",
          description: "Upload permits, approvals, and regulatory documents"
        };
      case "photo":
        return {
          bucket: "photos" as const,
          acceptedTypes: "image/*",
          description: "Upload installation photos and progress images"
        };
      case "report":
        return {
          bucket: "reports" as const,
          acceptedTypes: ".pdf,.xlsx,.csv,.doc,.docx",
          description: "Upload reports and analytics documents"
        };
      default:
        return {
          bucket: "documents" as const,
          acceptedTypes: "*/*",
          description: "Upload any type of document"
        };
    }
  };

  const activeDocumentType = documentTypes.find(type => type.id === activeTab);
  const config = getDocumentTypeConfig(activeTab);

  return (
    <DashboardLayout
      title="Document Management"
      description="Upload, organize, and manage your business documents"
      showBackButton
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {documentTypes.map((type) => {
              const Icon = type.icon;
              return (
                <Card 
                  key={type.id}
                  className={`cursor-pointer transition-all hover:shadow-primary bg-gradient-card border-border/50 ${
                    activeTab === type.id ? "ring-2 ring-primary" : ""
                  }`}
                  onClick={() => {
                    setActiveTab(type.id);
                    setShowUpload(false);
                  }}
                >
                  <CardContent className="p-4 text-center">
                    <Icon className="w-8 h-8 mx-auto mb-2 text-primary" />
                    <h3 className="font-medium text-sm">{type.label}</h3>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <Button
            onClick={() => setShowUpload(!showUpload)}
            className="bg-gradient-primary hover:shadow-primary transition-smooth"
          >
            <Plus className="w-4 h-4 mr-2" />
            {showUpload ? "Cancel Upload" : "Upload Files"}
          </Button>
        </div>

        {showUpload && (
          <div className="space-y-4">
            <Card className="bg-gradient-card border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="w-5 h-5" />
                  Upload {activeDocumentType?.label}
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  {config.description}
                </p>
              </CardHeader>
              <CardContent>
                <FileUpload
                  bucket={config.bucket}
                  documentType={activeTab === "all" ? "document" : activeTab}
                  acceptedTypes={config.acceptedTypes}
                  onUploadSuccess={handleUploadSuccess}
                />
              </CardContent>
            </Card>
          </div>
        )}

        <div className="space-y-4">
          <div className="flex items-center gap-3">
            {activeDocumentType && (
              <>
                <activeDocumentType.icon className="w-6 h-6 text-primary" />
                <div>
                  <h2 className="text-xl font-semibold">{activeDocumentType.label}</h2>
                  <p className="text-sm text-muted-foreground">{activeDocumentType.description}</p>
                </div>
              </>
            )}
          </div>

          <FileList
            documentType={activeTab === "all" ? undefined : activeTab}
            refreshTrigger={refreshTrigger}
          />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DocumentsPage;