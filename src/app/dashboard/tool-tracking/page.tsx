
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import React, { useContext, useMemo, useState } from "react";
import { AppContext, Rental } from "@/context/AppContext";
import { DateRange } from "react-day-picker";
import { isWithinInterval, parseISO } from "date-fns";
import FilterBar from "@/components/filter-bar";
import { Button } from "@/components/ui/button";
import { FileDown, ArrowRightLeft } from "lucide-react";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

type AggregatedRental = {
    customerId: number;
    toolId: number;
    status: 'Rented' | 'Returned' | 'Returned Pending';
    totalQuantity: number;
    // Add original rental IDs to track for transfer
    rentalIds: number[]; 
};

type TransferDetails = {
    rentalIds: number[];
    toolId: number;
    currentCustomerId: number;
    quantityToTransfer: number;
    newCustomerId: string;
    newSiteId: string;
}

type ExportColumn = {
  id: keyof AggregatedRental | 'customer' | 'tool';
  label: string;
};

const exportColumns: ExportColumn[] = [
    { id: 'customer', label: 'Customer' },
    { id: 'tool', label: 'Tool' },
    { id: 'totalQuantity', label: 'Total Quantity' },
    { id: 'status', label: 'Status' },
];

export default function ToolTrackingPage() {
    const { rentals, tools, customers, sites, transferTool } = useContext(AppContext);
    const { toast } = useToast();
    
    const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
    const [selectedSiteId, setSelectedSiteId] = useState<string | null>(null);
    const [selectedToolId, setSelectedToolId] = useState<string | null>(null);
    const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
    const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
    const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
    const [isTransferDialogOpen, setIsTransferDialogOpen] = useState(false);
    const [selectedExportColumns, setSelectedExportColumns] = useState<Set<ExportColumn['id']>>(new Set(exportColumns.map(c => c.id)));
    const [transferDetails, setTransferDetails] = useState<TransferDetails | null>(null);


    const getToolName = (id: number) => tools.find(t => t.id === id)?.name || 'Unknown Tool';
    const getCustomerName = (id: number) => customers.find(c => c.id === id)?.name || 'Unknown Customer';

    const aggregatedData = useMemo(() => {
        const filtered = rentals.filter(rental => {
            const issueDate = parseISO(rental.issue_date);
            const isDateInRange = !dateRange?.from || isWithinInterval(issueDate, { start: dateRange.from, end: dateRange.to || dateRange.from });
            const isCustomerMatch = !selectedCustomerId || rental.customer_id === parseInt(selectedCustomerId);
            const isSiteMatch = !selectedSiteId || rental.site_id === parseInt(selectedSiteId);
            const isToolMatch = !selectedToolId || rental.tool_id === parseInt(selectedToolId);
            const isStatusMatch = !selectedStatus || rental.status === selectedStatus;

            return isDateInRange && isCustomerMatch && isSiteMatch && isToolMatch && isStatusMatch;
        });

        const aggregation = filtered.reduce<Record<string, AggregatedRental>>((acc, rental) => {
            const key = `${rental.customer_id}-${rental.tool_id}-${rental.status}`;
            if (!acc[key]) {
                acc[key] = {
                    customerId: rental.customer_id,
                    toolId: rental.tool_id,
                    status: rental.status,
                    totalQuantity: 0,
                    rentalIds: []
                };
            }
            acc[key].totalQuantity += rental.quantity;
            acc[key].rentalIds.push(rental.id);
            return acc;
        }, {});

        return Object.values(aggregation);

    }, [rentals, dateRange, selectedCustomerId, selectedSiteId, selectedToolId, selectedStatus]);

    const handleResetFilters = () => {
        setSelectedCustomerId(null);
        setSelectedSiteId(null);
        setSelectedToolId(null);
        setSelectedStatus(null);
        setDateRange(undefined);
    };

    const openTransferDialog = (item: AggregatedRental) => {
        setTransferDetails({
            rentalIds: item.rentalIds,
            toolId: item.toolId,
            currentCustomerId: item.customerId,
            quantityToTransfer: item.totalQuantity,
            newCustomerId: "",
            newSiteId: ""
        });
        setIsTransferDialogOpen(true);
    };

    const handleTransfer = () => {
        if (!transferDetails) return;
        const { rentalIds, toolId, quantityToTransfer, newCustomerId, newSiteId } = transferDetails;

        if (!newCustomerId || !newSiteId || !quantityToTransfer || quantityToTransfer <= 0) {
            toast({ title: "Error", description: "Please fill all transfer details.", variant: "destructive"});
            return;
        }

        const success = transferTool(rentalIds, toolId, quantityToTransfer, parseInt(newCustomerId), parseInt(newSiteId));

        if (success) {
            toast({ title: "Success", description: "Tools have been transferred." });
            setIsTransferDialogOpen(false);
            setTransferDetails(null);
        } else {
            toast({ title: "Error", description: "Transfer quantity exceeds the amount rented.", variant: "destructive"});
        }
    };


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

    const handleExportColumnToggle = (columnId: ExportColumn['id'], checked: boolean) => {
      const newSelected = new Set(selectedExportColumns);
      if (checked) {
        newSelected.add(columnId);
      } else {
        newSelected.delete(columnId);
      }
      setSelectedExportColumns(newSelected);
    };

    const handleGeneratePdf = () => {
      const doc = new jsPDF();
      const tableHeaders = exportColumns
        .filter(col => selectedExportColumns.has(col.id))
        .map(col => col.label);
    
      const tableData = aggregatedData.map(item => {
        return exportColumns
          .filter(col => selectedExportColumns.has(col.id))
          .map(col => {
            switch(col.id) {
              case 'customer': return getCustomerName(item.customerId);
              case 'tool': return getToolName(item.toolId);
              default: return item[col.id as keyof AggregatedRental];
            }
          });
      });
    
      (doc as any).autoTable({
        head: [tableHeaders],
        body: tableData,
        startY: 20,
        didDrawPage: (data: any) => {
          doc.setFontSize(16);
          doc.text("Tool Tracking Report", 14, 15);
        }
      });
    
      doc.save("tool_tracking_report.pdf");
      setIsExportDialogOpen(false);
    };

    const handleGenerateCsv = () => {
        const headers = exportColumns
            .filter(col => selectedExportColumns.has(col.id))
            .map(col => col.label);
        
        const data = aggregatedData.map(item => {
            return exportColumns
                .filter(col => selectedExportColumns.has(col.id))
                .map(col => {
                    let value: any;
                    switch(col.id) {
                        case 'customer': value = getCustomerName(item.customerId); break;
                        case 'tool': value = getToolName(item.toolId); break;
                        default: value = item[col.id as keyof AggregatedRental];
                    }
                    return typeof value === 'string' && value.includes(',') ? `"${value}"` : value;
                }).join(',');
        });

        const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...data].join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "tool_tracking_report.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };


    return (
        <>
            <Card>
                <CardHeader>
                    <div className="flex flex-wrap justify-between items-start gap-4">
                        <div>
                            <CardTitle>Tool Tracking Summary</CardTitle>
                            <CardDescription>Aggregated view of tools rented by each customer. You can transfer rented tools from here.</CardDescription>
                        </div>
                        <Button variant="outline" onClick={() => setIsExportDialogOpen(true)}>
                            <FileDown className="mr-2 h-4 w-4" /> Export
                        </Button>
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
                        dateRange={dateRange}
                        setDateRange={setDateRange}
                        selectedStatus={selectedStatus}
                        setSelectedStatus={setSelectedStatus}
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
                                <TableHead>Customer</TableHead>
                                <TableHead>Tool</TableHead>
                                <TableHead className="text-center">Total Quantity</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {aggregatedData.map((item, index) => (
                                <TableRow key={`${item.customerId}-${item.toolId}-${item.status}-${index}`}>
                                    <TableCell className="font-medium">{getCustomerName(item.customerId)}</TableCell>
                                    <TableCell>{getToolName(item.toolId)}</TableCell>
                                    <TableCell className="text-center">{item.totalQuantity}</TableCell>
                                    <TableCell>
                                        {getStatusBadge(item.status)}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {item.status === 'Rented' && (
                                            <Button variant="outline" size="sm" onClick={() => openTransferDialog(item)}>
                                                <ArrowRightLeft className="mr-2 h-4 w-4" />
                                                Transfer
                                            </Button>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                            {rentals.length > 0 && aggregatedData.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center h-24">
                                        No results found for the selected filters.
                                    </TableCell>
                                </TableRow>
                            )}
                            {rentals.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center h-24">
                                        No rental data to aggregate.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

             {/* Export Dialog */}
            <Dialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}>
                <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Export Tool Tracking</DialogTitle>
                    <DialogDescription>
                        Select columns for PDF export. CSV will include all columns.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    {exportColumns.map(column => (
                        <div key={column.id} className="flex items-center space-x-2">
                            <Checkbox
                                id={`export-${column.id}`}
                                checked={selectedExportColumns.has(column.id)}
                                onCheckedChange={(checked) => handleExportColumnToggle(column.id, !!checked)}
                            />
                            <label
                                htmlFor={`export-${column.id}`}
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                                {column.label}
                            </label>
                        </div>
                    ))}
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setIsExportDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleGenerateCsv}>Export CSV</Button>
                    <Button onClick={handleGeneratePdf}>
                        Export PDF
                    </Button>
                </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Transfer Dialog */}
            <Dialog open={isTransferDialogOpen} onOpenChange={setIsTransferDialogOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Transfer Tool</DialogTitle>
                        <DialogDescription>
                            Transfer '{transferDetails ? getToolName(transferDetails.toolId) : ''}' from '{transferDetails ? getCustomerName(transferDetails.currentCustomerId) : ''}' to another customer/site.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="new-customer">Transfer to Customer</Label>
                            <Select 
                                value={transferDetails?.newCustomerId || ''} 
                                onValueChange={(value) => setTransferDetails(d => d ? {...d, newCustomerId: value} : null)}
                            >
                                <SelectTrigger id="new-customer">
                                    <SelectValue placeholder="Select new customer" />
                                </SelectTrigger>
                                <SelectContent>
                                    {customers
                                        .filter(c => c.id !== transferDetails?.currentCustomerId)
                                        .map(c => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="new-site">Transfer to Site</Label>
                             <Select
                                value={transferDetails?.newSiteId || ''} 
                                onValueChange={(value) => setTransferDetails(d => d ? {...d, newSiteId: value} : null)}
                            >
                                <SelectTrigger id="new-site">
                                    <SelectValue placeholder="Select new site" />
                                </SelectTrigger>
                                <SelectContent>
                                    {sites.map(s => <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="transfer-quantity">Quantity to Transfer</Label>
                            <Input
                                id="transfer-quantity"
                                type="number"
                                value={transferDetails?.quantityToTransfer ?? ''}
                                onChange={(e) => setTransferDetails(d => d ? {...d, quantityToTransfer: parseInt(e.target.value) || 0} : null)}
                                min="1"
                                max={transferDetails?.quantityToTransfer}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsTransferDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleTransfer}>Confirm Transfer</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
