
'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal, PlusCircle, FileDown, Pencil, CheckCircle, Undo2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
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
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useContext, useMemo, useState } from "react";
import { AppContext, Rental } from "@/context/AppContext";
import { DateRange } from "react-day-picker";
import { isWithinInterval, parseISO } from "date-fns";
import FilterBar from "@/components/filter-bar";
import { useToast } from "@/hooks/use-toast";

export default function RentalsPage() {
  const { rentals, tools, customers, sites, returnTool, confirmReturn, undoReturn } = useContext(AppContext);
  const { toast } = useToast();
  const router = useRouter();

  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [selectedSiteId, setSelectedSiteId] = useState<string | null>(null);
  const [selectedToolId, setSelectedToolId] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [isReturnDialogOpen, setIsReturnDialogOpen] = useState(false);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [isUndoDialogOpen, setIsUndoDialogOpen] = useState(false);
  const [selectedRental, setSelectedRental] = useState<Rental | null>(null);
  const [returnQuantity, setReturnQuantity] = useState(1);

  const getToolName = (id: number) => tools.find(t => t.id === id)?.name || 'Unknown Tool';
  const getCustomerName = (id: number) => customers.find(c => c.id === id)?.name || 'Unknown Customer';
  const getSiteName = (id: number) => sites.find(s => s.id === id)?.name || 'Unknown Site';

  const filteredRentals = useMemo(() => {
    return rentals.filter(rental => {
      const issueDate = parseISO(rental.issue_date);
      const isDateInRange = !dateRange?.from || isWithinInterval(issueDate, { start: dateRange.from, end: dateRange.to || dateRange.from });
      const isCustomerMatch = !selectedCustomerId || rental.customer_id === parseInt(selectedCustomerId);
      const isSiteMatch = !selectedSiteId || rental.site_id === parseInt(selectedSiteId);
      const isToolMatch = !selectedToolId || rental.tool_id === parseInt(selectedToolId);
      const isStatusMatch = !selectedStatus || rental.status === selectedStatus;

      return isDateInRange && isCustomerMatch && isSiteMatch && isToolMatch && isStatusMatch;
    }).sort((a, b) => {
        const dateA = new Date(a.issue_date).getTime();
        const dateB = new Date(b.issue_date).getTime();
        return dateB - dateA;
    });
  }, [rentals, dateRange, selectedCustomerId, selectedSiteId, selectedToolId, selectedStatus]);
  
  const groupedRentals = useMemo(() => {
    const groups = filteredRentals.reduce<Record<string, Rental[]>>((acc, rental) => {
        (acc[rental.invoice_number] = acc[rental.invoice_number] || []).push(rental);
        return acc;
    }, {});
    return Object.values(groups).map(group => {
        const isEditable = group.some(r => r.status === 'Rented');
        const firstRental = group[0];
        const overallStatus = group.every(r => r.status === 'Returned') 
                                ? 'Returned' 
                                : group.some(r => r.status === 'Rented')
                                ? 'Rented'
                                : 'Pending';

        return {
            ...firstRental,
            isEditable,
            itemCount: group.length,
            totalQuantity: group.reduce((sum, item) => sum + item.quantity, 0),
            overallStatus
        };
    }).sort((a, b) => new Date(b.issue_date).getTime() - new Date(a.issue_date).getTime());
  }, [filteredRentals]);


  const handleResetFilters = () => {
    setSelectedCustomerId(null);
    setSelectedSiteId(null);
    setSelectedToolId(null);
    setSelectedStatus(null);
    setDateRange(undefined);
  };
  
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

  const getStatusBadge = (status: string) => {
    switch (status) {
        case 'Rented':
            return <Badge variant="default" className="bg-accent text-accent-foreground">{status}</Badge>;
        case 'Returned':
            return <Badge variant="secondary">{status}</Badge>;
        case 'Returned Pending':
            return <Badge variant="destructive">{status}</Badge>;
        case 'Pending':
            return <Badge variant="outline">Mixed Status</Badge>;
        default:
            return <Badge>{status}</Badge>;
    }
  }


  return (
    <>
    <Card>
      <CardHeader>
        <div className="flex flex-wrap justify-between items-start gap-4">
          <div>
            <CardTitle>Rental Tracker</CardTitle>
            <CardDescription>Track all tool rentals, both active and returned.</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <FileDown className="mr-2 h-4 w-4" /> Export
            </Button>
            <Button asChild>
              <Link href="/dashboard/rentals/rent">
                <PlusCircle className="mr-2 h-4 w-4" /> New Rental
              </Link>
            </Button>
          </div>
        </div>
         <FilterBar
            customers={customers}
            sites={sites}
            tools={tools}
            selectedCustomerId={selectedCustomerId}
            setSelectedCustomerId={setSelectedCustomerId}
            selectedSiteId={selectedSiteId}
            setSelectedSiteId={setSelectedSiteId}
            selectedToolId={selectedToolId}
            setSelectedToolId={setSelectedToolId}
            selectedStatus={selectedStatus}
            setSelectedStatus={setSelectedStatus}
            dateRange={dateRange}
            setDateRange={setDateRange}
            onReset={handleResetFilters}
            statusOptions={[
                { value: 'Rented', label: 'Rented' },
                { value: 'Returned Pending', label: 'Returned Pending' },
                { value: 'Returned', label: 'Returned' },
            ]}
        />
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Invoice #</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Site</TableHead>
              <TableHead>Issue Date</TableHead>
              <TableHead>Items</TableHead>
              <TableHead>Total Qty</TableHead>
              <TableHead>Status</TableHead>
              <TableHead><span className="sr-only">Actions</span></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {groupedRentals.map((rentalGroup) => (
              <TableRow key={rentalGroup.invoice_number}>
                <TableCell className="font-code">{rentalGroup.invoice_number}</TableCell>
                <TableCell>{getCustomerName(rentalGroup.customer_id)}</TableCell>
                <TableCell>{getSiteName(rentalGroup.site_id)}</TableCell>
                <TableCell>{rentalGroup.issue_date}</TableCell>
                <TableCell>{rentalGroup.itemCount}</TableCell>
                <TableCell>{rentalGroup.totalQuantity}</TableCell>
                <TableCell>
                  {getStatusBadge(rentalGroup.overallStatus)}
                </TableCell>
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
                      <DropdownMenuItem asChild>
                        <Link href={`/dashboard/rentals/${rentalGroup.invoice_number}`}>View Details</Link>
                      </DropdownMenuItem>
                       {rentalGroup.isEditable && (
                        <DropdownMenuItem onSelect={() => router.push(`/dashboard/rentals/edit/${rentalGroup.invoice_number}`)}>
                           <Pencil className="mr-2 h-4 w-4" /> Edit
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuLabel>Individual Items</DropdownMenuLabel>
                       {rentals.filter(r => r.invoice_number === rentalGroup.invoice_number).map(r => (
                        <React.Fragment key={r.id}>
                           {r.status === 'Rented' && (
                             <DropdownMenuItem onClick={() => openReturnDialog(r)}>
                               Return '{getToolName(r.tool_id)}'
                             </DropdownMenuItem>
                           )}
                           {r.status === 'Returned Pending' && (
                            <>
                                <DropdownMenuItem onClick={() => openConfirmDialog(r)} className="text-green-600 focus:text-green-700">
                                    <CheckCircle className="mr-2 h-4 w-4" /> Confirm Return '{getToolName(r.tool_id)}'
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => openUndoDialog(r)} className="text-red-600 focus:text-red-700">
                                    <Undo2 className="mr-2 h-4 w-4" /> Undo Return '{getToolName(r.tool_id)}'
                                </DropdownMenuItem>
                            </>
                           )}
                        </React.Fragment>
                       ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
            {rentals.length > 0 && filteredRentals.length === 0 && (
                 <TableRow>
                    <TableCell colSpan={9} className="text-center h-24">
                       No results found for the selected filters.
                    </TableCell>
                </TableRow>
            )}
            {rentals.length === 0 && (
                <TableRow>
                    <TableCell colSpan={9} className="text-center h-24">
                        No rentals found.
                    </TableCell>
                </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>

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
