import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { Plus, Trash2, Calculator } from "lucide-react";

interface Customer {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
}

interface Equipment {
  id: string;
  name: string;
  category: string;
  unit_price: number;
  description?: string;
}

interface QuoteFormProps {
  customers: Customer[];
  equipment: Equipment[];
  onSuccess: () => void;
  generateQuoteNumber: () => string;
}

interface QuoteItem {
  description: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  equipment_id?: string;
}

export function QuoteForm({ customers, equipment, onSuccess, generateQuoteNumber }: QuoteFormProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [quoteForm, setQuoteForm] = useState({
    quote_number: generateQuoteNumber(),
    customer_id: "",
    system_size: 0,
    installation_address: "",
    notes: "",
    valid_until: "",
  });

  const [quoteItems, setQuoteItems] = useState<QuoteItem[]>([
    { description: "", quantity: 1, unit_price: 0, total_price: 0, equipment_id: "" }
  ]);

  const addQuoteItem = () => {
    setQuoteItems([
      ...quoteItems,
      { description: "", quantity: 1, unit_price: 0, total_price: 0, equipment_id: "" }
    ]);
  };

  const removeQuoteItem = (index: number) => {
    setQuoteItems(quoteItems.filter((_, i) => i !== index));
  };

  const updateQuoteItem = (index: number, field: keyof QuoteItem, value: any) => {
    const updatedItems = [...quoteItems];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    
    // Auto-calculate total price
    if (field === 'quantity' || field === 'unit_price') {
      updatedItems[index].total_price = updatedItems[index].quantity * updatedItems[index].unit_price;
    }
    
    // Auto-populate from equipment
    if (field === 'equipment_id' && value) {
      const selectedEquipment = equipment.find(eq => eq.id === value);
      if (selectedEquipment) {
        updatedItems[index].description = selectedEquipment.name;
        updatedItems[index].unit_price = selectedEquipment.unit_price;
        updatedItems[index].total_price = updatedItems[index].quantity * selectedEquipment.unit_price;
      }
    }
    
    setQuoteItems(updatedItems);
  };

  const calculateTotal = () => {
    return quoteItems.reduce((sum, item) => sum + item.total_price, 0);
  };

  const calculateTax = (subtotal: number) => {
    return subtotal * 0.08; // 8% tax rate
  };

  const calculateGrandTotal = () => {
    const subtotal = calculateTotal();
    const tax = calculateTax(subtotal);
    return subtotal + tax;
  };

  const createQuote = async () => {
    if (!quoteForm.customer_id) {
      toast({
        title: "Error",
        description: "Please select a customer.",
        variant: "destructive",
      });
      return;
    }

    if (quoteItems.length === 0 || !quoteItems.some(item => item.description)) {
      toast({
        title: "Error",
        description: "Please add at least one quote item.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Create the quote
      const { data: quote, error: quoteError } = await supabase
        .from('quotes')
        .insert({
          quote_number: quoteForm.quote_number,
          customer_id: quoteForm.customer_id,
          user_id: user?.id,
          system_size: quoteForm.system_size || null,
          installation_address: quoteForm.installation_address || null,
          notes: quoteForm.notes || null,
          valid_until: quoteForm.valid_until || null,
          total_amount: calculateGrandTotal(),
          status: 'draft',
        })
        .select()
        .single();

      if (quoteError) throw quoteError;

      // Create quote items
      const itemsToInsert = quoteItems
        .filter(item => item.description)
        .map(item => ({
          quote_id: quote.id,
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: item.total_price,
          equipment_id: item.equipment_id || null,
        }));

      const { error: itemsError } = await supabase
        .from('quote_items')
        .insert(itemsToInsert);

      if (itemsError) throw itemsError;

      toast({
        title: "Success",
        description: "Quote created successfully.",
      });

      onSuccess();
    } catch (error) {
      console.error('Error creating quote:', error);
      toast({
        title: "Error",
        description: "Failed to create quote.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Quote Header */}
      <Card>
        <CardHeader>
          <CardTitle>Quote Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quote_number">Quote Number</Label>
              <Input
                id="quote_number"
                value={quoteForm.quote_number}
                onChange={(e) => setQuoteForm(prev => ({ ...prev, quote_number: e.target.value }))}
                placeholder="Quote number"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customer">Customer *</Label>
              <Select
                value={quoteForm.customer_id}
                onValueChange={(value) => setQuoteForm(prev => ({ ...prev, customer_id: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select customer" />
                </SelectTrigger>
                <SelectContent className="bg-background border border-border">
                  {customers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.first_name} {customer.last_name} ({customer.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="system_size">System Size (kW)</Label>
              <Input
                id="system_size"
                type="number"
                step="0.1"
                value={quoteForm.system_size || ""}
                onChange={(e) => setQuoteForm(prev => ({ ...prev, system_size: parseFloat(e.target.value) || 0 }))}
                placeholder="System size in kW"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="valid_until">Valid Until</Label>
              <Input
                id="valid_until"
                type="date"
                value={quoteForm.valid_until}
                onChange={(e) => setQuoteForm(prev => ({ ...prev, valid_until: e.target.value }))}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="installation_address">Installation Address</Label>
            <Input
              id="installation_address"
              value={quoteForm.installation_address}
              onChange={(e) => setQuoteForm(prev => ({ ...prev, installation_address: e.target.value }))}
              placeholder="Installation address"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={quoteForm.notes}
              onChange={(e) => setQuoteForm(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Additional notes..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Quote Items */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Quote Items</CardTitle>
            <Button type="button" variant="outline" onClick={addQuoteItem}>
              <Plus className="mr-2 h-4 w-4" />
              Add Item
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {quoteItems.map((item, index) => (
            <div key={index} className="grid grid-cols-1 md:grid-cols-6 gap-4 p-4 border rounded-lg">
              <div className="space-y-2">
                <Label>Equipment</Label>
                <Select
                  value={item.equipment_id}
                  onValueChange={(value) => updateQuoteItem(index, 'equipment_id', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select equipment" />
                  </SelectTrigger>
                  <SelectContent className="bg-background border border-border">
                    <SelectItem value="custom">Custom Item</SelectItem>
                    {equipment.map((eq) => (
                      <SelectItem key={eq.id} value={eq.id}>
                        {eq.name} - ${eq.unit_price}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Description *</Label>
                <Input
                  value={item.description}
                  onChange={(e) => updateQuoteItem(index, 'description', e.target.value)}
                  placeholder="Item description"
                />
              </div>
              <div className="space-y-2">
                <Label>Quantity</Label>
                <Input
                  type="number"
                  min="1"
                  value={item.quantity}
                  onChange={(e) => updateQuoteItem(index, 'quantity', parseInt(e.target.value) || 1)}
                />
              </div>
              <div className="space-y-2">
                <Label>Unit Price ($)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={item.unit_price}
                  onChange={(e) => updateQuoteItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                />
              </div>
              <div className="space-y-2">
                <Label>Total ($)</Label>
                <Input
                  value={item.total_price.toFixed(2)}
                  disabled
                  className="bg-muted"
                />
              </div>
              <div className="space-y-2">
                <Label>&nbsp;</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => removeQuoteItem(index)}
                  disabled={quoteItems.length === 1}
                  className="w-full"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Quote Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Quote Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>${calculateTotal().toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Tax (8%):</span>
              <span>${calculateTax(calculateTotal()).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold border-t pt-2">
              <span>Total:</span>
              <span>${calculateGrandTotal().toFixed(2)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end space-x-2">
        <Button variant="outline" onClick={onSuccess}>
          Cancel
        </Button>
        <Button onClick={createQuote} disabled={loading}>
          {loading ? "Creating..." : "Create Quote"}
        </Button>
      </div>
    </div>
  );
}