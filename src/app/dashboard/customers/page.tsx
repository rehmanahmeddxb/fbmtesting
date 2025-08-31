'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, PlusCircle, Search } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
  } from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect, useContext, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
import { AppContext, Customer } from "@/context/AppContext";
import Link from "next/link";

export default function CustomersPage() {
  const { customers, addCustomer, editCustomer, deleteCustomer } = useContext(AppContext);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerData, setCustomerData] = useState({ name: '', phone: '', address: '' });
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();
  
  const filteredCustomers = useMemo(() => {
    if (!searchTerm) {
      return customers;
    }
    return customers.filter(customer => 
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.phone.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.address.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [customers, searchTerm]);

  useEffect(() => {
    if (selectedCustomer) {
      setCustomerData({
        name: selectedCustomer.name,
        phone: selectedCustomer.phone,
        address: selectedCustomer.address,
      });
    } else {
      setCustomerData({ name: '', phone: '', address: '' });
    }
  }, [selectedCustomer]);

  const handleAddCustomer = () => {
    addCustomer({ ...customerData, id: Date.now() });
    toast({ title: "Success!", description: "New customer has been added." });
    setIsAddDialogOpen(false);
    setCustomerData({ name: '', phone: '', address: '' });
  };

  const handleEditCustomer = () => {
    if (selectedCustomer) {
      editCustomer({ ...selectedCustomer, ...customerData });
      toast({ title: "Success!", description: "Customer details have been updated." });
    }
    setIsEditDialogOpen(false);
    setSelectedCustomer(null);
  };

  const handleDeleteCustomer = () => {
    if (selectedCustomer) {
        deleteCustomer(selectedCustomer.id);
        toast({ title: "Success!", description: "Customer has been deleted.", variant: "destructive" });
    }
    setIsDeleteDialogOpen(false);
    setSelectedCustomer(null);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>Customers</CardTitle>
              <CardDescription>Manage customer profiles. View, add, or edit customer details.</CardDescription>
            </div>
            <Button onClick={() => { setSelectedCustomer(null); setIsAddDialogOpen(true); }}>
              <PlusCircle className="mr-2 h-4 w-4" /> Add Customer
            </Button>
          </div>
           <div className="relative pt-4">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground mt-2" />
            <Input
              type="search"
              placeholder="Search for customers..."
              className="pl-8 w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Address</TableHead>
                <TableHead><span className="sr-only">Actions</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCustomers.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell className="font-medium">{customer.name}</TableCell>
                  <TableCell>{customer.phone}</TableCell>
                  <TableCell>{customer.address}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button aria-haspopup="true" size="icon" variant="ghost">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Toggle menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem asChild><Link href={`/dashboard/customers/${customer.id}`}>View Details</Link></DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => { setSelectedCustomer(customer); setIsEditDialogOpen(true); }}>Edit</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10" onSelect={() => { setSelectedCustomer(customer); setIsDeleteDialogOpen(true); }}>Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
               {customers.length > 0 && filteredCustomers.length === 0 && (
                <TableRow>
                    <TableCell colSpan={4} className="text-center h-24">
                        No customers found matching "{searchTerm}".
                    </TableCell>
                </TableRow>
              )}
              {customers.length === 0 && (
                <TableRow>
                    <TableCell colSpan={4} className="text-center h-24">
                        No customers found.
                    </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
       <Dialog open={isAddDialogOpen || isEditDialogOpen} onOpenChange={isAddDialogOpen ? setIsAddDialogOpen : setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{selectedCustomer ? 'Edit Customer' : 'Add Customer'}</DialogTitle>
            <DialogDescription>
              {selectedCustomer ? 'Update the details of the existing customer.' : 'Fill in the details to add a new customer.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">Name</Label>
              <Input id="name" value={customerData.name} onChange={(e) => setCustomerData({...customerData, name: e.target.value})} className="col-span-3" required />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="phone" className="text-right">Phone</Label>
              <Input id="phone" value={customerData.phone} onChange={(e) => setCustomerData({...customerData, phone: e.target.value})} className="col-span-3" required />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="address" className="text-right">Address</Label>
              <Input id="address" value={customerData.address} onChange={(e) => setCustomerData({...customerData, address: e.target.value})} className="col-span-3" required />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" onClick={selectedCustomer ? handleEditCustomer : handleAddCustomer}>
                {selectedCustomer ? 'Save Changes' : 'Add Customer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the customer record.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedCustomer(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteCustomer} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
