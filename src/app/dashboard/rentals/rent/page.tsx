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
import { format } from "date-fns";
import React, { useContext, useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { AppContext, Tool } from "@/context/AppContext";

type RentalItem = {
    id: number;
    toolId: string;
    quantity: number;
    tool: Tool | undefined;
};

export default function RentToolPage() {
  const { tools, customers, sites, addRental } = useContext(AppContext);
  const router = useRouter();
  const { toast } = useToast();
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [selectedSiteId, setSelectedSiteId] = useState<string>("");
  const [rentalItems, setRentalItems] = useState<RentalItem[]>([
    { id: Date.now(), toolId: "", quantity: 1, tool: undefined }
  ]);

  const handleItemChange = (id: number, field: 'toolId' | 'quantity', value: string) => {
    setRentalItems(items => items.map(item => {
        if (item.id === id) {
            if (field === 'toolId') {
                const selectedTool = tools.find(t => t.id === parseInt(value));
                return { ...item, toolId: value, tool: selectedTool, quantity: 1 }; // Reset quantity when tool changes
            }
            if (field === 'quantity') {
                 const newQuantity = parseInt(value) || 0;
                 const maxQuantity = item.tool?.available_quantity || 1;
                 // Ensure quantity is at least 1 and not more than available
                 if (newQuantity < 1) return { ...item, quantity: 1};
                 return { ...item, quantity: Math.min(newQuantity, maxQuantity) };
            }
        }
        return item;
    }));
  };
  
  const addRentalItem = () => {
    setRentalItems(items => [...items, { id: Date.now(), toolId: "", quantity: 1, tool: undefined }]);
  }

  const removeRentalItem = (id: number) => {
    setRentalItems(items => items.filter(item => item.id !== id));
  }


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId || !selectedSiteId || rentalItems.some(item => !item.toolId)) {
        toast({
            title: "Error",
            description: "Please select a customer, a site, and a tool for each item.",
            variant: "destructive"
        });
        return;
    }
    
    addRental(
        rentalItems.map(item => ({
            tool_id: parseInt(item.toolId),
            quantity: item.quantity,
            rate: item.tool!.rate
        })),
        {
            customer_id: parseInt(selectedCustomerId),
            site_id: parseInt(selectedSiteId),
            issue_date: format(date || new Date(), "yyyy-MM-dd"),
        }
    );

    toast({
        title: "Success!",
        description: "Tools have been rented and invoice generated.",
    });
    router.push("/dashboard/rentals");
  };

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>Rent Tools</CardTitle>
          <CardDescription>Fill out the form to create a new rental order.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6">
           <div className="grid gap-6 md:grid-cols-2">
                 <div className="space-y-2">
                    <Label htmlFor="customer">Customer</Label>
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
                        {date ? format(date, "PPP") : <span>Pick a date</span>}
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
                    <Input id="manual-book-ref" type="text" placeholder="HD-101" className="font-code" />
                </div>
            </div>

            <hr/>
            
            <div className="space-y-4">
                 <Label className="text-lg font-medium">Tools</Label>
                {rentalItems.map((item, index) => (
                    <div key={item.id} className="grid grid-cols-[1fr_auto_auto_auto] items-end gap-4 p-4 border rounded-md">
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
                                    {tools.map(tool => (
                                    <SelectItem key={tool.id} value={String(tool.id)} disabled={tool.available_quantity === 0}>
                                        {tool.name} (Available: {tool.available_quantity})
                                    </SelectItem>
                                    ))}
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
                                max={item.tool?.available_quantity} 
                                value={item.quantity} 
                                disabled={!item.tool}
                                onChange={(e) => handleItemChange(item.id, 'quantity', e.target.value)} />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor={`rate-${item.id}`}>Daily Rate ($)</Label>
                            <Input id={`rate-${item.id}`} type="number" value={item.tool?.rate ?? 0} readOnly />
                        </div>
                        {rentalItems.length > 1 && (
                            <Button variant="ghost" size="icon" onClick={() => removeRentalItem(item.id)} className="text-destructive hover:bg-destructive/10">
                                <Trash2 className="h-4 w-4"/>
                            </Button>
                        )}
                    </div>
                ))}
                <Button type="button" variant="outline" onClick={addRentalItem}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Add Another Tool
                </Button>
            </div>
          
          <div className="md:col-span-2 flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" type="button" onClick={() => router.back()}>Cancel</Button>
            <Button type="submit">Rent Tools & Generate Invoice</Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
