'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import React from "react";
import { tools, customers, sites } from "@/lib/placeholder-data";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";

export default function RentToolPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [date, setDate] = React.useState<Date | undefined>(new Date());
  const [selectedToolId, setSelectedToolId] = React.useState<string>("");

  const selectedTool = tools.find(tool => tool.id === parseInt(selectedToolId));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
        title: "Success!",
        description: "Tool has been rented and invoice generated.",
    });
    router.push("/dashboard/rentals");
  };

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>Rent a Tool</CardTitle>
          <CardDescription>Fill out the form to create a new rental record.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="tool">Tool</Label>
            <Select onValueChange={setSelectedToolId} required>
              <SelectTrigger id="tool">
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
            <Label htmlFor="customer">Customer</Label>
            <Select required>
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
            <Select required>
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
            <Label htmlFor="quantity">Quantity</Label>
            <Input id="quantity" type="number" placeholder="1" required min="1" max={selectedTool?.available_quantity} />
          </div>
           <div className="space-y-2">
            <Label htmlFor="rate">Daily Rate ($)</Label>
            <Input id="rate" type="number" placeholder="25.00" required step="0.01" defaultValue={selectedTool?.rate} />
          </div>
           <div className="space-y-2">
            <Label htmlFor="manual-book-ref">Manual Book Ref.</Label>
            <Input id="manual-book-ref" type="text" placeholder="HD-101" className="font-code" />
          </div>
           <div className="space-y-2">
            <Label htmlFor="comment">Comment</Label>
            <Textarea id="comment" placeholder="Any comments about the rental..." />
          </div>
          <div className="md:col-span-2 flex justify-end gap-2">
            <Button variant="outline" type="button" onClick={() => router.back()}>Cancel</Button>
            <Button type="submit">Rent Tool & Generate Invoice</Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
