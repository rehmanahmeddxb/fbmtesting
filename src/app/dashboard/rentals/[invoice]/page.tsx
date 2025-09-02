
'use client';

import React, { useContext, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AppContext, Rental } from '@/context/AppContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Printer, CheckCircle, Undo2, MoreHorizontal } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format, parseISO } from 'date-fns';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";


export default function RentalDetailPage() {
  const { customers, rentals, tools, sites, returnTool, confirmReturn, undoReturn } = useContext(AppContext);
  const params = useParams();
  const router = useRouter();
  const invoiceNumber = params.invoice as string;
  const { toast } = useToast();

  const [isReturnDialogOpen, setIsReturnDialogOpen] = useState(false);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [isUndoDialogOpen, setIsUndoDialogOpen] = useState(false);
  const [selectedRental, setSelectedRental] = useState<Rental | null>(null);
  const [returnQuantity, setReturnQuantity] = useState(1);

  const invoiceRentals = rentals.filter((r) => r.invoice_number === invoiceNumber);
  const firstRental = invoiceRentals[0];

  if (!firstRental) {
    return (
      <div className="flex items-center justify-center h-full">
        <p>Rental invoice not found.</p>
      </div>
    );
  }

  const customer = customers.find((c) => c.id === firstRental.customer_id);
  const site = sites.find((s) => s.id === firstRental.site_id);
  const getToolName = (id: number) => tools.find((t) => t.id === id)?.name || 'Unknown Tool';
  
  const totalInvoiceFee = invoiceRentals.reduce((acc, rental) => {
    return acc + (rental.total_fee || 0);
  }, 0);

  const getStatusBadge = (status: string) => {
    switch (status) {
        case 'Rented':
            return <Badge variant="default" className="bg-accent text-accent-foreground">{status}</Badge>;
        case 'Returned':
            return <Badge variant="secondary">{status}</Badge>;
        case 'Returned Pending':
            return <Badge variant="destructive">{status}</Badge>;
        default:
            return <Badge>{status}</Badge>;
    }
  }

  const openReturnDialog = (rental: Rental) => {
    setSelectedRental(rental);
    setReturnQuantity(rental.quantity); // Default to full quantity
    setIsReturnDialogOpen(true);
  }
  
  const openConfirmDialog = (rental: Rental) => {
    setSelectedRental(rental);
    setIsConfirmDialogOpen(true);
  }

  const openUndoDialog = (rental: Rental) => {
    setSelectedRental(rental);
    setIsUndoDialogOpen(true);
  }

  const handleReturnTool = () => {
    if (selectedRental && returnQuantity > 0) {
      if (returnQuantity > selectedRental.quantity) {
          toast({
              title: "Error",
              description: "Return quantity cannot be greater than the rented quantity.",
              variant: "destructive"
          });
          return;
      }
      returnTool(selectedRental.id, returnQuantity);
      toast({
          title: "Pending Return",
          description: "Tool return is now pending confirmation."
      });
      setIsReturnDialogOpen(false);
      setSelectedRental(null);
    }
  }

  const handleConfirmReturn = () => {
    if (selectedRental) {
        confirmReturn(selectedRental.id);
        toast({
            title: "Success",
            description: "Tool return has been confirmed."
        });
        setIsConfirmDialogOpen(false);
        setSelectedRental(null);
    }
  }

  const handleUndoReturn = () => {
    if (selectedRental) {
        undoReturn(selectedRental.id);
        toast({
            title: "Return Undone",
            description: "The tool has been reverted to 'Rented' status.",
            variant: "destructive"
        });
        setIsUndoDialogOpen(false);
        setSelectedRental(null);
    }
  }


  return (
    <>
    <div className="space-y-6">
       <Button variant="outline" onClick={() => router.back()}>
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Rentals
      </Button>
      
      <Card>
        <CardHeader>
          <div className='flex justify-between items-start'>
            <div>
              <CardTitle>Invoice {invoiceNumber}</CardTitle>
              <CardDescription>
                Details for this rental invoice issued on {format(parseISO(firstRental.issue_date), "dd-M-yyyy")}.
              </CardDescription>
            </div>
             <Button variant="outline" onClick={() => window.print()}>
                <Printer className="mr-2 h-4 w-4" />
                Print Invoice
             </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
                <div>
                    <h3 className="font-semibold mb-2">Customer Details</h3>
                    <p className="text-muted-foreground">
                        <span className="font-medium text-foreground">Name:</span> {customer?.name || 'N/A'}
                    </p>
                    <p className="text-muted-foreground">
                        <span className="font-medium text-foreground">Phone:</span> {customer?.phone || 'N/A'}
                    </p>
                    <p className="text-muted-foreground">
                        <span className="font-medium text-foreground">Address:</span> {customer?.address || 'N/A'}
                    </p>
                </div>
                 <div>
                    <h3 className="font-semibold mb-2">Site Details</h3>
                    <p className="text-muted-foreground">
                         <span className="font-medium text-foreground">Site:</span> {site?.name || 'N/A'}
                    </p>
                </div>
            </div>
        
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tool</TableHead>
                <TableHead>Comments</TableHead>
                <TableHead className="text-center">Quantity</TableHead>
                <TableHead className="text-center">Daily Rate</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-right">Return Date</TableHead>
                <TableHead className="text-right">Total Fee</TableHead>
                 <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoiceRentals.map((rental) => (
                <TableRow key={rental.id}>
                  <TableCell className="font-medium">{getToolName(rental.tool_id)}</TableCell>
                  <TableCell className="text-muted-foreground max-w-[200px] truncate">{rental.comment || 'N/A'}</TableCell>
                  <TableCell className="text-center">{rental.quantity}</TableCell>
                   <TableCell className="text-center">${rental.rate.toFixed(2)}</TableCell>
                   <TableCell className="text-center">
                        {getStatusBadge(rental.status)}
                   </TableCell>
                  <TableCell className="text-right">{rental.return_date ? format(parseISO(rental.return_date), "dd-M-yyyy") : 'N/A'}</TableCell>
                  <TableCell className="text-right">${rental.total_fee?.toFixed(2) || '0.00'}</TableCell>
                  <TableCell className="text-right">
                    {rental.status === 'Rented' && (
                        <Button variant="outline" size="sm" onClick={() => openReturnDialog(rental)}>Return</Button>
                    )}
                    {rental.status === 'Returned Pending' && (
                         <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                                <DropdownMenuItem onClick={() => openConfirmDialog(rental)} className="text-green-600 focus:text-green-700">
                                    <CheckCircle className="mr-2 h-4 w-4" /> Confirm Return
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => openUndoDialog(rental)} className="text-red-600 focus:text-red-700">
                                    <Undo2 className="mr-2 h-4 w-4" /> Undo Return
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                         </DropdownMenu>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
         <CardFooter className="justify-end bg-muted/50 p-6">
            <div className="flex flex-col items-end">
                <p className="text-muted-foreground">Total Invoice Amount</p>
                <p className="text-2xl font-bold">${totalInvoiceFee.toFixed(2)}</p>
            </div>
        </CardFooter>
      </Card>
    </div>

    {/* Return Tool Dialog */}
    <Dialog open={isReturnDialogOpen} onOpenChange={setIsReturnDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Return Tool</DialogTitle>
            <DialogDescription>
              Enter the quantity of '{selectedRental ? getToolName(selectedRental.tool_id) : ''}' to return. This will mark the return as pending.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="return-quantity" className="text-right">
                Quantity
              </Label>
              <Input
                id="return-quantity"
                type="number"
                value={returnQuantity}
                onChange={(e) => setReturnQuantity(parseInt(e.target.value))}
                min="1"
                max={selectedRental?.quantity}
                className="col-span-3"
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsReturnDialogOpen(false)}>Cancel</Button>
            <Button type="submit" onClick={handleReturnTool}>Submit Return</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    {/* Confirm Return Dialog */}
    <AlertDialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Confirm Return?</AlertDialogTitle>
                <AlertDialogDescription>
                    This will finalize the return of {selectedRental?.quantity}x '{selectedRental ? getToolName(selectedRental.tool_id) : ''}'. This action cannot be undone.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setSelectedRental(null)}>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleConfirmReturn}>Confirm</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>

    {/* Undo Return Dialog */}
    <AlertDialog open={isUndoDialogOpen} onOpenChange={setIsUndoDialogOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Undo Return?</AlertDialogTitle>
                <AlertDialogDescription>
                    This will revert the return of {selectedRental?.quantity}x '{selectedRental ? getToolName(selectedRental.tool_id) : ''}' and move it back to 'Rented' status.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setSelectedRental(null)}>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleUndoReturn} className="bg-destructive hover:bg-destructive/90">Undo Return</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>

    </>
  );
}
