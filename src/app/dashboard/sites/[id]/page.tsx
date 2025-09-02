
'use client';

import { useContext } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AppContext } from '@/context/AppContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format, parseISO } from 'date-fns';

export default function SiteDetailPage() {
  const { sites, rentals, tools, customers } = useContext(AppContext);
  const params = useParams();
  const router = useRouter();
  const siteId = parseInt(params.id as string);

  const site = sites.find((s) => s.id === siteId);
  const siteRentals = rentals.filter((r) => r.site_id === siteId && r.status === 'Rented');
  
  const getToolName = (id: number) => tools.find((t) => t.id === id)?.name || 'Unknown Tool';
  const getCustomerName = (id: number) => customers.find((c) => c.id === id)?.name || 'Unknown Customer';


  if (!site) {
    return (
      <div className="flex items-center justify-center h-full">
        <p>Site not found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
       <Button variant="outline" onClick={() => router.back()}>
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Sites
      </Button>
      <Card>
        <CardHeader>
          <CardTitle>{site.name}</CardTitle>
          <CardDescription>
            A list of all tools currently active at this site.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tool</TableHead>
                 <TableHead>Customer</TableHead>
                <TableHead className="text-right">Quantity</TableHead>
                <TableHead className="text-right">Issue Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {siteRentals.map((rental) => (
                <TableRow key={rental.id}>
                  <TableCell>{getToolName(rental.tool_id)}</TableCell>
                  <TableCell>{getCustomerName(rental.customer_id)}</TableCell>
                  <TableCell className="text-right">{rental.quantity}</TableCell>
                  <TableCell className="text-right">{format(parseISO(rental.issue_date), "dd-M-yyyy")}</TableCell>
                </TableRow>
              ))}
               {siteRentals.length === 0 && (
                 <TableRow>
                    <TableCell colSpan={4} className="text-center h-24">
                       No active rentals at this site.
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
