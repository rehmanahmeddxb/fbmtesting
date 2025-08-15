import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileDown } from "lucide-react";
import { rentals, tools, customers } from "@/lib/placeholder-data";
import { Badge } from "@/components/ui/badge";

const getToolName = (id: number) => tools.find(t => t.id === id)?.name || 'Unknown Tool';
const getCustomerName = (id: number) => customers.find(c => c.id === id)?.name || 'Unknown Customer';

export default function ReportsPage() {
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>Rental Reports</CardTitle>
            <CardDescription>A detailed report of all rental transactions.</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <FileDown className="mr-2 h-4 w-4" /> Export as CSV
            </Button>
            <Button variant="outline">
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
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
