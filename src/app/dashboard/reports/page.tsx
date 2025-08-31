'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import React, { useContext, useState } from "react";
import { AppContext, Rental } from "@/context/AppContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import jsPDF from "jspdf";
import "jspdf-autotable";

type ExportColumn = {
  id: keyof Rental | 'tool' | 'customer';
  label: string;
}

const exportColumns: ExportColumn[] = [
    { id: 'invoice_number', label: 'Invoice #' },
    { id: 'tool', label: 'Tool' },
    { id: 'quantity', label: 'Qty' },
    { id: 'customer', label: 'Customer' },
    { id: 'issue_date', label: 'Issue Date' },
    { id: 'return_date', label: 'Return Date' },
    { id: 'total_fee', label: 'Total Fee' },
    { id: 'status', label: 'Status' },
];


export default function ReportsPage() {
  const { rentals, tools, customers } = useContext(AppContext);
  const [isPdfExportDialogOpen, setIsPdfExportDialogOpen] = useState(false);
  const [selectedPdfColumns, setSelectedPdfColumns] = useState<Set<ExportColumn['id']>>(new Set(exportColumns.map(c => c.id)));

  const getToolName = (id: number) => tools.find(t => t.id === id)?.name || 'Unknown Tool';
  const getCustomerName = (id: number) => customers.find(c => c.id === id)?.name || 'Unknown Customer';

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
    
    const tableData = rentals.map(rental => {
        return exportColumns
            .filter(col => selectedPdfColumns.has(col.id))
            .map(col => {
                switch(col.id) {
                    case 'tool': return getToolName(rental.tool_id);
                    case 'customer': return getCustomerName(rental.customer_id);
                    case 'return_date': return rental.return_date || 'N/A';
                    case 'total_fee': return rental.total_fee ? `$${rental.total_fee.toFixed(2)}` : 'N/A';
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
    const data = rentals.map(rental => {
      return exportColumns.map(col => {
         switch(col.id) {
            case 'tool': return getToolName(rental.tool_id);
            case 'customer': return getCustomerName(rental.customer_id);
            case 'return_date': return rental.return_date || 'N/A';
            case 'total_fee': return rental.total_fee ? `${rental.total_fee.toFixed(2)}` : 'N/A';
            default: return rental[col.id as keyof Rental];
        }
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
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice #</TableHead>
                <TableHead>Tool</TableHead>
                <TableHead>Qty</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Issue Date</TableHead>
                <TableHead>Return Date</TableHead>
                <TableHead className="text-right">Total Fee</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rentals.map((rental) => (
                <TableRow key={rental.id}>
                  <TableCell className="font-mono font-code">{rental.invoice_number}</TableCell>
                  <TableCell className="font-medium">{getToolName(rental.tool_id)}</TableCell>
                  <TableCell>{rental.quantity}</TableCell>
                  <TableCell>{getCustomerName(rental.customer_id)}</TableCell>
                  <TableCell>{rental.issue_date}</TableCell>
                  <TableCell>{rental.return_date || 'N/A'}</TableCell>
                  <TableCell className="text-right">
                    {rental.total_fee ? `$${rental.total_fee.toFixed(2)}` : 'N/A'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={rental.status === 'Rented' ? 'default' : 'secondary'} className={rental.status === 'Rented' ? 'bg-accent text-accent-foreground' : ''}>
                      {rental.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
              {rentals.length === 0 && (
                  <TableRow>
                      <TableCell colSpan={8} className="text-center h-24">
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
