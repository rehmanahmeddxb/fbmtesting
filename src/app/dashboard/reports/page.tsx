
'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileDown, MoreHorizontal } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import React, { useContext, useState, useMemo } from "react";
import { AppContext, Rental } from "@/context/AppContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { format, parseISO, isWithinInterval } from "date-fns";
import FilterBar from "@/components/filter-bar";
import { DateRange } from "react-day-picker";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import Link from "next/link";

type ExportColumn = {
  id: keyof Rental | 'tool' | 'customer' | 'site';
  label: string;
}

const exportColumns: ExportColumn[] = [
    { id: 'invoice_number', label: 'Invoice #' },
    { id: 'tool', label: 'Tool' },
    { id: 'quantity', label: 'Qty' },
    { id: 'customer', label: 'Customer' },
    { id: 'site', label: 'Site' },
    { id: 'issue_date', label: 'Issue Date' },
    { id: 'return_date', label: 'Return Date' },
    { id: 'total_fee', label: 'Total Fee' },
    { id: 'status', label: 'Status' },
    { id: 'comment', label: 'Comment' },
];


export default function ReportsPage() {
  const { rentals, tools, customers, sites } = useContext(AppContext);
  const [isPdfExportDialogOpen, setIsPdfExportDialogOpen] = useState(false);
  const [selectedPdfColumns, setSelectedPdfColumns] = useState<Set<ExportColumn['id']>>(new Set(exportColumns.map(c => c.id)));

  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [selectedSiteId, setSelectedSiteId] = useState<string | null>(null);
  const [selectedToolId, setSelectedToolId] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);

  const getToolName = (id: number) => tools.find(t => t.id === id)?.name || 'Unknown Tool';
  const getCustomerName = (id: number) => customers.find(c => c.id === id)?.name || 'Unknown Customer';
  const getSiteName = (id: number) => sites.find((s) => s.id === id)?.name || 'Unknown Site';
  
  const filteredRentals = useMemo(() => {
    return rentals.filter(rental => {
      const issueDate = parseISO(rental.issue_date);
      const isDateInRange = !dateRange?.from || isWithinInterval(issueDate, { start: dateRange.from, end: dateRange.to || dateRange.from });
      const isCustomerMatch = !selectedCustomerId || rental.customer_id === parseInt(selectedCustomerId);
      const isSiteMatch = !selectedSiteId || rental.site_id === parseInt(selectedSiteId);
      const isToolMatch = !selectedToolId || rental.tool_id === parseInt(selectedToolId);
      const isStatusMatch = !selectedStatus || rental.status === selectedStatus;

      return isDateInRange && isCustomerMatch && isSiteMatch && isToolMatch && isStatusMatch;
    }).sort((a, b) => new Date(b.issue_date).getTime() - new Date(a.issue_date).getTime());
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

  const handlePdfColumnToggle = (columnId: ExportColumn['id'], checked: boolean) => {
    const newSelected = new Set(selectedPdfColumns);
    if (checked) {
      newSelected.add(columnId);
    } else {
      newSelected.delete(columnId);
    }
    setSelectedPdfColumns(newSelected);
  };

  const handleGeneratePdf = () => {
    const doc = new jsPDF();
    const tableHeaders = exportColumns
      .filter(col => selectedPdfColumns.has(col.id))
      .map(col => col.label);
    
    const tableData = filteredRentals.map(rental => {
        return exportColumns
            .filter(col => selectedPdfColumns.has(col.id))
            .map(col => {
                switch(col.id) {
                    case 'tool': return getToolName(rental.tool_id);
                    case 'customer': return getCustomerName(rental.customer_id);
                    case 'site': return getSiteName(rental.site_id);
                    case 'issue_date': return format(parseISO(rental.issue_date), "dd-M-yyyy");
                    case 'return_date': return rental.return_date ? format(parseISO(rental.return_date), "dd-M-yyyy") : 'N/A';
                    case 'total_fee': return rental.total_fee ? `$${rental.total_fee.toFixed(2)}` : 'N/A';
                    case 'comment': return rental.comment || 'N/A';
                    default: return rental[col.id as keyof Rental];
                }
            });
    });

    (doc as any).autoTable({
        head: [tableHeaders],
        body: tableData,
        startY: 20,
        didDrawPage: (data: any) => {
            doc.setFontSize(16);
            doc.text("Full Rental Report", 14, 15);
        }
    });

    doc.save("full_rental_report.pdf");
    setIsPdfExportDialogOpen(false);
  };

  const handleGenerateCsv = () => {
    const headers = exportColumns.map(col => col.label);
    const data = filteredRentals.map(rental => {
      return exportColumns.map(col => {
         let value: any;
         switch(col.id) {
            case 'tool': value = getToolName(rental.tool_id); break;
            case 'customer': value = getCustomerName(rental.customer_id); break;
            case 'site': value = getSiteName(rental.site_id); break;
            case 'issue_date': value = format(parseISO(rental.issue_date), "dd-M-yyyy"); break;
            case 'return_date': value = rental.return_date ? format(parseISO(rental.return_date), "dd-M-yyyy") : 'N/A'; break;
            case 'total_fee': value = rental.total_fee ? `${rental.total_fee.toFixed(2)}` : 'N/A'; break;
            case 'comment': value = rental.comment || 'N/A'; break;
            default: value = rental[col.id as keyof Rental];
        }
        return typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value;
      }).join(',');
    });

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...data].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "rental_report.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>Rental Reports</CardTitle>
              <CardDescription>A detailed report of all rental transactions.</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleGenerateCsv}>
                <FileDown className="mr-2 h-4 w-4" /> Export as CSV
              </Button>
              <Button variant="outline" onClick={() => setIsPdfExportDialogOpen(true)}>
                <FileDown className="mr-2 h-4 w-4" /> Export as PDF
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
                <TableHead>Tool</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Site</TableHead>
                <TableHead>Comment / History</TableHead>
                <TableHead className="text-center">Qty</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-right">Issue Date</TableHead>
                <TableHead className="text-right">Return Date</TableHead>
                <TableHead className="text-right">Total Fee</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRentals.map((rental) => (
                <TableRow key={rental.id}>
                  <TableCell className="font-mono">{rental.invoice_number}</TableCell>
                  <TableCell className="font-medium">{getToolName(rental.tool_id)}</TableCell>
                  <TableCell>{getCustomerName(rental.customer_id)}</TableCell>
                  <TableCell>{getSiteName(rental.site_id)}</TableCell>
                  <TableCell className="text-muted-foreground">{rental.comment || "N/A"}</TableCell>
                  <TableCell className="text-center">{rental.quantity}</TableCell>
                  <TableCell className="text-center">
                    {getStatusBadge(rental.status)}
                  </TableCell>
                  <TableCell className="text-right">{format(parseISO(rental.issue_date), "dd-M-yyyy")}</TableCell>
                  <TableCell className="text-right">{rental.return_date ? format(parseISO(rental.return_date), "dd-M-yyyy") : 'N/A'}</TableCell>
                  <TableCell className="text-right">
                    {rental.total_fee ? `$${rental.total_fee.toFixed(2)}` : 'N/A'}
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
                          <Link href={`/dashboard/rentals/${rental.invoice_number}`}>View Invoice</Link>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
              {rentals.length > 0 && filteredRentals.length === 0 && (
                 <TableRow>
                    <TableCell colSpan={11} className="text-center h-24">
                       No results found for the selected filters.
                    </TableCell>
                </TableRow>
            )}
              {rentals.length === 0 && (
                  <TableRow>
                      <TableCell colSpan={11} className="text-center h-24">
                          No reports found.
                      </TableCell>
                  </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      {/* PDF Export Dialog */}
      <Dialog open={isPdfExportDialogOpen} onOpenChange={setIsPdfExportDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Export Report to PDF</DialogTitle>
            <DialogDescription>
              Select the columns you want to include in the PDF report.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4 max-h-60 overflow-y-auto">
            {exportColumns.map(column => (
                <div key={column.id} className="flex items-center space-x-2">
                    <Checkbox
                        id={`export-${column.id}`}
                        checked={selectedPdfColumns.has(column.id)}
                        onCheckedChange={(checked) => handlePdfColumnToggle(column.id, !!checked)}
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
             <Button variant="outline" onClick={() => setIsPdfExportDialogOpen(false)}>Cancel</Button>
            <Button type="submit" onClick={handleGeneratePdf}>
              Generate PDF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

    
