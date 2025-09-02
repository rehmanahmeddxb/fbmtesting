
'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, PlusCircle, Trash2 } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format, parseISO } from "date-fns";
import React, { useContext, useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { AppContext, Tool, Rental, Customer } from "@/context/AppContext";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";


type RentalItem = {
    id: number;
    toolId: string;
    quantity: string;
    comment: string;
    tool: Tool | undefined;
};

export default function EditRentalPage() {
  const { tools, customers, sites, rentals, editRental, addCustomer } = useContext(AppContext);
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const invoiceNumber = params.invoice as string;

  const [date, setDate] = useState<Date | undefined>(new Date());
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [selectedSiteId, setSelectedSiteId] = useState<string>("");
  const [manualBookRef, setManualBookRef] = useState<string>("");
  const [rentalItems, setRentalItems] = useState<RentalItem[]>([]);
  const [originalRentals, setOriginalRentals] = useState<Rental[]>([]);

  const [isAddCustomerDialogOpen, setIsAddCustomerDialogOpen] = useState(false);
  const [newCustomerData, setNewCustomerData] = useState({ name: '', phone: '', address: '' });


  useEffect(() => {
    const invoiceRentals = rentals.filter(r => r.invoice_number === invoiceNumber && r.status === 'Rented');
    if (invoiceRentals.length > 0) {
      const firstRental = invoiceRentals[0];
      setOriginalRentals(invoiceRentals);
      setDate(parseISO(firstRental.issue_date));
      setSelectedCustomerId(String(firstRental.customer_id));
      setSelectedSiteId(String(firstRental.site_id));
      setManualBookRef(firstRental.invoice_number);

      const items = invoiceRentals.map(r => ({
        id: r.id,
        toolId: String(r.tool_id),
        quantity: String(r.quantity),
        comment: r.comment || "",
        tool: tools.find(t => t.id === r.tool_id),
      }));
      setRentalItems(items);
    }
  }, [invoiceNumber, rentals, tools]);
  

  const handleItemChange = (id: number, field: 'toolId' | 'quantity' | 'comment', value: string) => {
    setRentalItems(items => items.map(item => {
        if (item.id === id) {
             if (field === 'toolId') {
                const selectedTool = tools.find(t => t.id === parseInt(value));
                return { ...item, toolId: value, tool: selectedTool, quantity: "1" };
            }
             if (field === 'quantity') {
                const newQuantity = parseInt(value);
                // For editing, available quantity is current rented amount + what's in stock
                const originalItem = originalRentals.find(r => r.id === id);
                const originalQuantity = originalItem ? originalItem.quantity : 0;
                const available = (item.tool?.available_quantity || 0) + originalQuantity;

                if (value === "" || (newQuantity > 0 && newQuantity <= available)) {
                    return { ...item, quantity: value };
                }
                toast({
                   title: "Invalid Quantity",
                   description: `You can rent up to ${available} items.`,
                   variant: "destructive"
                })
                return { ...item, quantity: String(available) };
            }
            if (field === 'comment') {
                return { ...item, comment: value };
            }
        }
        return item;
    }));
  };
  
  const addRentalItem = () => {
    setRentalItems(items => [...items, { id: Date.now(), toolId: "", quantity: "", comment: "", tool: undefined }]);
  }

  const removeRentalItem = (id: number) => {
    setRentalItems(items => items.filter(item => item.id !== id));
  }

  const handleAddCustomer = () => {
    if (!newCustomerData.name) {
        toast({ title: "Error", description: "Customer name is required.", variant: "destructive" });
        return;
    }
    const newCustomer = addCustomer(newCustomerData);
    if (newCustomer) {
        toast({ title: "Success!", description: "New customer has been added." });
        setSelectedCustomerId(String(newCustomer.id));
        setIsAddCustomerDialogOpen(false);
        setNewCustomerData({ name: '', phone: '', address: '' });
    }
  };


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId || !selectedSiteId || !manualBookRef || rentalItems.some(item => !item.toolId)) {
        toast({
            title: "Error",
            description: "Please fill all fields: customer, site, manual book ref, and select a tool for each item.",
            variant: "destructive"
        });
        return;
    }
    
    for (const item of rentalItems) {
        const quantity = parseInt(item.quantity);
        if (isNaN(quantity) || quantity <= 0) {
            toast({
                title: "Error",
                description: `Please enter a valid quantity for '${item.tool?.name}'.`,
                variant: "destructive"
            });
            return;
        }

        const originalItem = originalRentals.find(r => r.tool_id === item.tool?.id);
        const originalQuantity = originalItem ? originalItem.quantity : 0;
        const availableStock = (item.tool?.available_quantity || 0) + originalQuantity;

        if (quantity > availableStock) {
             toast({
                title: "Error",
                description: `Quantity for '${item.tool?.name}' exceeds total stock of ${availableStock}.`,
                variant: "destructive"
            });
            return;
        }
    }

    editRental(
        invoiceNumber,
        rentalItems.map(item => ({
            tool_id: parseInt(item.toolId),
            quantity: parseInt(item.quantity),
            rate: item.tool!.rate,
            comment: item.comment,
        })),
        {
            customer_id: parseInt(selectedCustomerId),
            site_id: parseInt(selectedSiteId),
            issue_date: format(date || new Date(), "yyyy-MM-dd"),
            invoice_number: manualBookRef,
        }
    );

    toast({
        title: "Success!",
        description: "Rental invoice has been updated.",
    });
    router.push("/dashboard/rentals");
  };

  if (!originalRentals.length) {
    return <div className="p-4">Loading rental details...</div>
  }

  return (
    <>
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>Edit Rental Order</CardTitle>
          <CardDescription>Update the details for invoice #{invoiceNumber}.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6">
           <div className="grid gap-6 md:grid-cols-2">
                 <div className="space-y-2">
                    <Label htmlFor="customer">Customer</Label>
                    <div className="flex gap-2">
                        <Select onValueChange={setSelectedCustomerId} required value={selectedCustomerId}>
                        <SelectTrigger id="customer">
                            <SelectValue placeholder="Select a customer" />
                        </SelectTrigger>
                        <SelectContent>
                            {customers.map(customer => (
                            <SelectItem key={customer.id} value={String(customer.id)}>
                                {customer.name}
                            </SelectItem>
                            ))}
                        </SelectContent>
                        </Select>
                        <Dialog open={isAddCustomerDialogOpen} onOpenChange={setIsAddCustomerDialogOpen}>
                            <DialogTrigger asChild>
                                <Button type="button" variant="outline">New</Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Add New Customer</DialogTitle>
                                    <DialogDescription>
                                        Quickly add a new customer profile.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="grid gap-4 py-4">
                                    <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="name" className="text-right">Name</Label>
                                    <Input id="name" value={newCustomerData.name} onChange={(e) => setNewCustomerData({...newCustomerData, name: e.target.value})} className="col-span-3" required />
                                    </div>
                                    <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="phone" className="text-right">Phone</Label>
                                    <Input id="phone" value={newCustomerData.phone} onChange={(e) => setNewCustomerData({...newCustomerData, phone: e.target.value})} className="col-span-3" />
                                    </div>
                                    <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="address" className="text-right">Address</Label>
                                    <Input id="address" value={newCustomerData.address} onChange={(e) => setNewCustomerData({...newCustomerData, address: e.target.value})} className="col-span-3" />
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button type="button" variant="outline" onClick={() => setIsAddCustomerDialogOpen(false)}>Cancel</Button>
                                    <Button type="button" onClick={handleAddCustomer}>Add Customer</Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="site">Site</Label>
                    <Select onValueChange={setSelectedSiteId} required value={selectedSiteId}>
                    <SelectTrigger id="site">
                        <SelectValue placeholder="Select a site" />
                    </SelectTrigger>
                    <SelectContent>
                        {sites.map(site => (
                        <SelectItem key={site.id} value={String(site.id)}>
                            {site.name}
                        </SelectItem>
                        ))}
                    </SelectContent>
                    </Select>
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="issue-date">Issue Date</Label>
                    <Popover>
                    <PopoverTrigger asChild>
                        <Button
                        id="issue-date"
                        variant={"outline"}
                        className={cn(
                            "w-full justify-start text-left font-normal",
                            !date && "text-muted-foreground"
                        )}
                        >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date ? format(date, "dd-MM-yyyy") : <span>Pick a date</span>}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                        <Calendar
                        mode="single"
                        selected={date}
                        onSelect={setDate}
                        initialFocus
                        />
                    </PopoverContent>
                    </Popover>
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="manual-book-ref">Manual Book Ref.</Label>
                    <Input 
                        id="manual-book-ref" 
                        type="text" 
                        placeholder="HD-101" 
                        className="font-code"
                        value={manualBookRef}
                        onChange={(e) => setManualBookRef(e.target.value)} 
                        required
                    />
                </div>
            </div>

            <hr/>
            
            <div className="space-y-4">
                 <Label className="text-lg font-medium">Tools</Label>
                {rentalItems.map((item, index) => (
                    <div key={item.id} className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr_2fr_auto] items-end gap-4 p-4 border rounded-md">
                        <div className="space-y-2">
                            <Label htmlFor={`tool-${item.id}`}>Tool</Label>
                            <Select 
                                value={item.toolId}
                                onValueChange={(value) => handleItemChange(item.id, 'toolId', value)}
                                required>
                                <SelectTrigger id={`tool-${item.id}`}>
                                    <SelectValue placeholder="Select a tool" />
                                </SelectTrigger>
                                <SelectContent>
                                    {tools.map(tool => {
                                      const originalItem = originalRentals.find(r => r.tool_id === tool.id);
                                      const originalQuantity = originalItem ? originalItem.quantity : 0;
                                      const stock = tool.available_quantity + (item.toolId === String(tool.id) ? originalQuantity : 0);
                                      
                                      return (
                                        <SelectItem key={tool.id} value={String(tool.id)} disabled={stock === 0 && item.toolId !== String(tool.id)}>
                                            {tool.name} (Available: {stock})
                                        </SelectItem>
                                      )
                                    })}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor={`quantity-${item.id}`}>Quantity</Label>
                            <Input 
                                id={`quantity-${item.id}`} 
                                type="number" 
                                placeholder="1" 
                                required 
                                min="1"
                                value={item.quantity} 
                                disabled={!item.tool}
                                onChange={(e) => handleItemChange(item.id, 'quantity', e.target.value)}
                            />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor={`rate-${item.id}`}>Daily Rate ($)</Label>
                            <Input id={`rate-${item.id}`} type="number" value={item.tool?.rate ?? 0} readOnly />
                        </div>
                        <div className="space-y-2">
                           <Label htmlFor={`comment-${item.id}`}>Comments (Condition)</Label>
                           <Textarea
                             id={`comment-${item.id}`}
                             placeholder="e.g., Minor scratches on handle"
                             value={item.comment}
                             onChange={(e) => handleItemChange(item.id, 'comment', e.target.value)}
                             className="h-[38px]"
                           />
                        </div>
                        <div className="flex items-center h-full">
                          {rentalItems.length > 1 && (
                              <Button variant="ghost" size="icon" onClick={() => removeRentalItem(item.id)} className="text-destructive hover:bg-destructive/10">
                                  <Trash2 className="h-4 w-4"/>
                              </Button>
                          )}
                          {index === 0 && rentalItems.length === 1 && <div className="w-10"></div>}
                        </div>
                    </div>
                ))}
                <Button type="button" variant="outline" onClick={addRentalItem}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Add Another Tool
                </Button>
            </div>
          
          <div className="md:col-span-2 flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" type="button" onClick={() => router.back()}>Cancel</Button>
            <Button type="submit">Save Changes</Button>
          </div>
        </CardContent>
      </Card>
    </form>
    </>
  );
}
