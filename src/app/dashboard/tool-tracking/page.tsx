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
import { FileDown } from "lucide-react";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";

type AggregatedRental = {
    customerId: number;
    toolId: number;
    status: 'Rented' | 'Returned' | 'Returned Pending';
    totalQuantity: number;
};

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
    const { rentals, tools, customers, sites } = useContext(AppContext);
    
    const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
    const [selectedSiteId, setSelectedSiteId] = useState<string | null>(null);
    const [selectedToolId, setSelectedToolId] = useState<string | null>(null);
    const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
    const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
    const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
    const [selectedExportColumns, setSelectedExportColumns] = useState<Set<ExportColumn['id']>>(new Set(exportColumns.map(c => c.id)));


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
                };
            }
            acc[key].totalQuantity += rental.quantity;
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


    return (
        <>
            <Card>
                <CardHeader>
                    <div className="flex flex-wrap justify-between items-start gap-4">
                        <div>
                            <CardTitle>Tool Tracking Summary</CardTitle>
                            <CardDescription>Aggregated view of tools rented by each customer.</CardDescription>
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
                                </TableRow>
                            ))}
                            {rentals.length > 0 && aggregatedData.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center h-24">
                                        No results found for the selected filters.
                                    </TableCell>
                                </TableRow>
                            )}
                            {rentals.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center h-24">
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
                    <DialogTitle>Export Tool Tracking to PDF</DialogTitle>
                    <DialogDescription>
                    Select the columns you want to include in the PDF report.
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
                    <Button type="submit" onClick={handleGeneratePdf}>
                    Generate PDF
                    </Button>
                </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
