'use client';

import { useContext } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AppContext } from '@/context/AppContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function CustomerDetailPage() {
  const { customers, rentals, tools, sites } = useContext(AppContext);
  const params = useParams();
  const router = useRouter();
  const customerId = parseInt(params.id as string);

  const customer = customers.find((c) => c.id === customerId);
  const customerRentals = rentals.filter((r) => r.customer_id === customerId);
  const getToolName = (id: number) => tools.find((t) => t.id === id)?.name || 'Unknown Tool';
  const getSiteName = (id: number) => sites.find((s) => s.id === id)?.name || 'Unknown Site';

  if (!customer) {
    return (
      <div className="flex items-center justify-center h-full">
        <p>Customer not found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
       <Button variant="outline" onClick={() => router.back()}>
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Customers
      </Button>
      <Card>
        <CardHeader>
          <CardTitle>{customer.name}</CardTitle>
          <CardDescription>
            Contact details and rental history for this customer.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold">Contact Information</h3>
            <p className="text-muted-foreground">Phone: {customer.phone}</p>
            <p className="text-muted-foreground">Address: {customer.address}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Active Rentals</CardTitle>
          <CardDescription>
            All tools currently rented by {customer.name}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tool</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Issue Date</TableHead>
                <TableHead>Site</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customerRentals.filter(r => r.status === 'Rented').map((rental) => (
                <TableRow key={rental.id}>
                  <TableCell>{getToolName(rental.tool_id)}</TableCell>
                  <TableCell>{rental.quantity}</TableCell>
                  <TableCell>{rental.issue_date}</TableCell>
                   <TableCell>{getSiteName(rental.site_id)}</TableCell>
                </TableRow>
              ))}
               {customerRentals.filter(r => r.status === 'Rented').length === 0 && (
                 <TableRow>
                    <TableCell colSpan={4} className="text-center h-24">
                       No active rentals for this customer.
                    </TableCell>
                </TableRow>
               )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
       <Card>
        <CardHeader>
          <CardTitle>Rental History</CardTitle>
          <CardDescription>
            All tools previously rented by {customer.name}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tool</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Issue Date</TableHead>
                <TableHead>Return Date</TableHead>
                 <TableHead>Total Fee</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customerRentals.filter(r => r.status === 'Returned').map((rental) => (
                <TableRow key={rental.id}>
                  <TableCell>{getToolName(rental.tool_id)}</TableCell>
                  <TableCell>{rental.quantity}</TableCell>
                  <TableCell>{rental.issue_date}</TableCell>
                  <TableCell>{rental.return_date}</TableCell>
                  <TableCell>${rental.total_fee?.toFixed(2)}</TableCell>
                </TableRow>
              ))}
               {customerRentals.filter(r => r.status === 'Returned').length === 0 && (
                 <TableRow>
                    <TableCell colSpan={5} className="text-center h-24">
                       No rental history for this customer.
                    </TableCell>
                </TableRow>
               )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
