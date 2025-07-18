import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { Checkbox } from "@/components/ui/checkbox";
import { FileBarChart, Download, Calendar, Users, Zap, DollarSign } from "lucide-react";
import { format } from "date-fns";
import { DateRange } from "react-day-picker";

interface ReportOptions {
  type: string;
  dateRange: DateRange | undefined;
  includeCustomers: boolean;
  includeLeads: boolean;
  includeInstallations: boolean;
  includeQuotes: boolean;
  format: 'pdf' | 'csv' | 'xlsx';
}

const reportTypes = [
  { value: "summary", label: "Business Summary Report", description: "Overview of all business activities" },
  { value: "sales", label: "Sales Performance Report", description: "Detailed sales metrics and trends" },
  { value: "installations", label: "Installation Progress Report", description: "Status and timeline of installations" },
  { value: "leads", label: "Lead Conversion Report", description: "Lead pipeline and conversion rates" },
  { value: "financial", label: "Financial Report", description: "Revenue, costs, and financial metrics" }
];

export function ReportGenerator() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [generating, setGenerating] = useState(false);
  const [options, setOptions] = useState<ReportOptions>({
    type: "",
    dateRange: undefined,
    includeCustomers: true,
    includeLeads: true,
    includeInstallations: true,
    includeQuotes: true,
    format: 'pdf'
  });

  const generateReport = async () => {
    if (!user || !options.type) {
      toast({
        title: "Missing information",
        description: "Please select a report type and date range",
        variant: "destructive"
      });
      return;
    }

    setGenerating(true);

    try {
      // Create report metadata in database
      const reportTitle = reportTypes.find(t => t.value === options.type)?.label || "Business Report";
      const fileName = `${reportTitle.replace(/\s+/g, '_').toLowerCase()}_${format(new Date(), 'yyyy-MM-dd')}.${options.format}`;
      
      // For now, we'll create a placeholder report
      // In a real implementation, you would call an edge function to generate the actual report
      const reportContent = await generateReportContent();
      
      // Create a blob and upload it
      const blob = new Blob([reportContent], { type: 'text/plain' });
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('reports')
        .upload(filePath, blob);

      if (uploadError) throw uploadError;

      // Save report metadata
      const { data: document, error: dbError } = await supabase
        .from('documents')
        .insert({
          user_id: user.id,
          file_name: fileName,
          file_path: filePath,
          file_size: blob.size,
          file_type: 'application/pdf',
          document_type: 'report',
          title: reportTitle,
          description: `Generated on ${format(new Date(), 'MMMM d, yyyy')}`
        })
        .select()
        .single();

      if (dbError) throw dbError;

      toast({
        title: "Report generated successfully",
        description: `${reportTitle} has been created and saved to your documents.`
      });

      // Download the report
      downloadReport(filePath, fileName);

    } catch (error: any) {
      console.error('Report generation error:', error);
      toast({
        title: "Report generation failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setGenerating(false);
    }
  };

  const generateReportContent = async (): Promise<string> => {
    // This is a placeholder implementation
    // In a real system, you would fetch data and generate a proper report
    const reportType = reportTypes.find(t => t.value === options.type);
    const dateRange = options.dateRange;
    
    let content = `${reportType?.label}\n`;
    content += `Generated on: ${format(new Date(), 'MMMM d, yyyy')}\n`;
    content += `Report Period: ${dateRange?.from ? format(dateRange.from, 'MMMM d, yyyy') : 'All time'}`;
    content += ` to ${dateRange?.to ? format(dateRange.to, 'MMMM d, yyyy') : 'Present'}\n\n`;
    
    content += "SUMMARY\n";
    content += "=======\n";
    content += "This is a placeholder report. In a production environment, this would contain:\n\n";
    
    if (options.includeCustomers) {
      content += "• Customer data and analytics\n";
    }
    if (options.includeLeads) {
      content += "• Lead generation and conversion metrics\n";
    }
    if (options.includeInstallations) {
      content += "• Installation progress and completion rates\n";
    }
    if (options.includeQuotes) {
      content += "• Quote generation and acceptance rates\n";
    }
    
    content += "\nThis report would be formatted as a proper business document with charts, graphs, and detailed analytics.";
    
    return content;
  };

  const downloadReport = async (filePath: string, fileName: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('reports')
        .download(filePath);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error: any) {
      console.error('Download error:', error);
      toast({
        title: "Download failed",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  return (
    <Card className="bg-gradient-card border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileBarChart className="w-5 h-5" />
          Generate Reports
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        <div>
          <Label htmlFor="reportType">Report Type *</Label>
          <Select value={options.type} onValueChange={(value) => setOptions(prev => ({ ...prev, type: value }))}>
            <SelectTrigger>
              <SelectValue placeholder="Select report type" />
            </SelectTrigger>
            <SelectContent>
              {reportTypes.map(type => (
                <SelectItem key={type.value} value={type.value}>
                  <div>
                    <div className="font-medium">{type.label}</div>
                    <div className="text-sm text-muted-foreground">{type.description}</div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Date Range</Label>
          <DatePickerWithRange
            date={options.dateRange}
            onDateChange={(dateRange) => setOptions(prev => ({ ...prev, dateRange }))}
          />
        </div>

        <div>
          <Label className="text-base font-medium">Include Data Sections</Label>
          <div className="grid grid-cols-2 gap-4 mt-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="customers"
                checked={options.includeCustomers}
                onCheckedChange={(checked) => 
                  setOptions(prev => ({ ...prev, includeCustomers: !!checked }))
                }
              />
              <Label htmlFor="customers" className="flex items-center gap-2 text-sm">
                <Users className="w-4 h-4" />
                Customers
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="leads"
                checked={options.includeLeads}
                onCheckedChange={(checked) => 
                  setOptions(prev => ({ ...prev, includeLeads: !!checked }))
                }
              />
              <Label htmlFor="leads" className="flex items-center gap-2 text-sm">
                <Users className="w-4 h-4" />
                Leads
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="installations"
                checked={options.includeInstallations}
                onCheckedChange={(checked) => 
                  setOptions(prev => ({ ...prev, includeInstallations: !!checked }))
                }
              />
              <Label htmlFor="installations" className="flex items-center gap-2 text-sm">
                <Zap className="w-4 h-4" />
                Installations
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="quotes"
                checked={options.includeQuotes}
                onCheckedChange={(checked) => 
                  setOptions(prev => ({ ...prev, includeQuotes: !!checked }))
                }
              />
              <Label htmlFor="quotes" className="flex items-center gap-2 text-sm">
                <DollarSign className="w-4 h-4" />
                Quotes
              </Label>
            </div>
          </div>
        </div>

        <div>
          <Label htmlFor="format">Export Format</Label>
          <Select 
            value={options.format} 
            onValueChange={(value: 'pdf' | 'csv' | 'xlsx') => 
              setOptions(prev => ({ ...prev, format: value }))
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pdf">PDF Document</SelectItem>
              <SelectItem value="csv">CSV Spreadsheet</SelectItem>
              <SelectItem value="xlsx">Excel Workbook</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button
          onClick={generateReport}
          disabled={generating || !options.type}
          className="w-full bg-gradient-primary hover:shadow-primary transition-smooth"
        >
          {generating ? (
            "Generating Report..."
          ) : (
            <>
              <Download className="w-4 h-4 mr-2" />
              Generate & Download Report
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}