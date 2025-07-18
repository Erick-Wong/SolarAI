import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Download, Send, Printer } from "lucide-react";

interface Quote {
  id: string;
  quote_number: string;
  customer_id: string;
  status: 'draft' | 'sent' | 'approved' | 'rejected' | 'expired';
  total_amount: number;
  system_size: number;
  installation_address?: string;
  valid_until?: string;
  created_at: string;
  notes?: string;
  customers?: {
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
  };
  quote_items?: QuoteItem[];
}

interface QuoteItem {
  id: string;
  description: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface QuotePreviewProps {
  quote: Quote;
}

export function QuotePreview({ quote }: QuotePreviewProps) {
  const subtotal = quote.quote_items?.reduce((sum, item) => sum + item.total_price, 0) || 0;
  const tax = subtotal * 0.08; // 8% tax
  const total = subtotal + tax;

  const generatePDF = () => {
    // This would integrate with a PDF generation library
    console.log('Generating PDF for quote:', quote.quote_number);
    // Implementation would go here
  };

  const sendQuote = () => {
    // This would integrate with email service
    console.log('Sending quote:', quote.quote_number);
    // Implementation would go here
  };

  return (
    <div className="space-y-6">
      {/* Actions */}
      <div className="flex justify-end space-x-2 no-print">
        <Button variant="outline" onClick={generatePDF}>
          <Download className="mr-2 h-4 w-4" />
          Download PDF
        </Button>
        <Button variant="outline" onClick={() => window.print()}>
          <Printer className="mr-2 h-4 w-4" />
          Print
        </Button>
        <Button onClick={sendQuote}>
          <Send className="mr-2 h-4 w-4" />
          Send Quote
        </Button>
      </div>

      {/* Quote Document */}
      <Card className="print:shadow-none print:border-none">
        <CardContent className="p-8">
          {/* Header */}
          <div className="flex justify-between items-start mb-8">
            <div>
              <h1 className="text-2xl font-bold text-primary">SolarBiz</h1>
              <p className="text-muted-foreground">Solar Installation Solutions</p>
              <div className="mt-4 text-sm">
                <p>123 Solar Street</p>
                <p>Dallas, TX 75201</p>
                <p>Phone: (555) 123-4567</p>
                <p>Email: quotes@solarbiz.com</p>
              </div>
            </div>
            <div className="text-right">
              <h2 className="text-xl font-bold">QUOTE</h2>
              <p className="text-lg font-semibold">{quote.quote_number}</p>
              <Badge variant="outline" className="mt-2">
                {quote.status.charAt(0).toUpperCase() + quote.status.slice(1)}
              </Badge>
            </div>
          </div>

          {/* Quote Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div>
              <h3 className="font-semibold mb-2">Quote To:</h3>
              {quote.customers && (
                <div className="text-sm space-y-1">
                  <p className="font-medium">
                    {quote.customers.first_name} {quote.customers.last_name}
                  </p>
                  <p>{quote.customers.email}</p>
                  {quote.customers.phone && <p>{quote.customers.phone}</p>}
                  {quote.installation_address && (
                    <p className="mt-2">
                      <span className="font-medium">Installation Address:</span><br />
                      {quote.installation_address}
                    </p>
                  )}
                </div>
              )}
            </div>
            <div>
              <h3 className="font-semibold mb-2">Quote Details:</h3>
              <div className="text-sm space-y-1">
                <p><span className="font-medium">Quote Date:</span> {new Date(quote.created_at).toLocaleDateString()}</p>
                {quote.valid_until && (
                  <p><span className="font-medium">Valid Until:</span> {new Date(quote.valid_until).toLocaleDateString()}</p>
                )}
                {quote.system_size && (
                  <p><span className="font-medium">System Size:</span> {quote.system_size} kW</p>
                )}
              </div>
            </div>
          </div>

          {/* Quote Items */}
          <div className="mb-8">
            <h3 className="font-semibold mb-4">Quote Items</h3>
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr>
                    <th className="text-left p-3 font-medium">Description</th>
                    <th className="text-center p-3 font-medium">Qty</th>
                    <th className="text-right p-3 font-medium">Unit Price</th>
                    <th className="text-right p-3 font-medium">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {quote.quote_items?.map((item, index) => (
                    <tr key={index} className="border-t">
                      <td className="p-3">{item.description}</td>
                      <td className="p-3 text-center">{item.quantity}</td>
                      <td className="p-3 text-right">${item.unit_price.toFixed(2)}</td>
                      <td className="p-3 text-right">${item.total_price.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Totals */}
          <div className="flex justify-end mb-8">
            <div className="w-80">
              <div className="space-y-2 text-right">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax (8%):</span>
                  <span>${tax.toFixed(2)}</span>
                </div>
                <Separator className="my-2" />
                <div className="flex justify-between text-lg font-bold">
                  <span>Total:</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          {quote.notes && (
            <div className="mb-8">
              <h3 className="font-semibold mb-2">Notes</h3>
              <div className="bg-muted p-4 rounded-lg">
                <p className="text-sm whitespace-pre-wrap">{quote.notes}</p>
              </div>
            </div>
          )}

          {/* Terms */}
          <div className="text-xs text-muted-foreground space-y-2">
            <h3 className="font-semibold text-foreground">Terms & Conditions</h3>
            <p>1. This quote is valid for 30 days from the date of issue unless otherwise specified.</p>
            <p>2. Installation timeline will be confirmed upon contract execution and permit approval.</p>
            <p>3. Final pricing may vary based on site conditions discovered during installation.</p>
            <p>4. All warranties and guarantees are provided as per manufacturer specifications.</p>
            <p>5. Payment terms: 50% deposit upon contract signing, 50% upon completion.</p>
          </div>

          {/* Footer */}
          <div className="mt-8 pt-4 border-t text-center text-sm text-muted-foreground">
            <p>Thank you for considering SolarBiz for your solar installation needs!</p>
            <p>Contact us at (555) 123-4567 or quotes@solarbiz.com for any questions.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}