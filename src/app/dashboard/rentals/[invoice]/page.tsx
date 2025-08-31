
'use client';

import { useContext } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AppContext } from '@/context/AppContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Printer } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format, parseISO } from 'date-fns';

export default function RentalDetailPage() {
  const { customers, rentals, tools, sites } = useContext(AppContext);
  const params = useParams();
  const router = useRouter();
  const invoiceNumber = params.invoice as string;

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


  return (
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
                Details for this rental invoice issued on {format(parseISO(firstRental.issue_date), "PPP")}.
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
                <TableHead className="text-center">Return Date</TableHead>
                <TableHead className="text-right">Total Fee</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoiceRentals.map((rental) => (
                <TableRow key={rental.id}>
                  <TableCell className="font-medium">{getToolName(rental.tool_id)}</TableCell>
                  <TableCell className="text-muted-foreground">{rental.comment || 'N/A'}</TableCell>
                  <TableCell className="text-center">{rental.quantity}</TableCell>
                   <TableCell className="text-center">${rental.rate.toFixed(2)}</TableCell>
                   <TableCell className="text-center">
                        <Badge variant={rental.status === 'Rented' ? 'default' : 'secondary'} className={rental.status === 'Rented' ? 'bg-accent text-accent-foreground' : ''}>
                          {rental.status}
                        </Badge>
                   </TableCell>
                  <TableCell className="text-center">{rental.return_date ? format(parseISO(rental.return_date), "PPP") : 'N/A'}</TableCell>
                  <TableCell className="text-right">${rental.total_fee?.toFixed(2) || '0.00'}</TableCell>
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
  );
}
