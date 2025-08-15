'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DateRangePicker } from "@/components/date-range-picker";
import { useState, useContext, useMemo } from "react";
import { DateRange } from "react-day-picker";
import { addDays, isWithinInterval, parseISO, differenceInCalendarDays } from "date-fns";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts"
import { AppContext, Rental } from "@/context/AppContext";

export default function FinancialsPage() {
    const { rentals } = useContext(AppContext);
    const [date, setDate] = useState<DateRange | undefined>({
        from: addDays(new Date(), -30),
        to: new Date(),
    })

    const calculateFee = (rental: Rental) => {
        const issueDate = new Date(rental.issue_date);
        // If the item is returned, use the return date. Otherwise, use today for pending fees.
        const endDate = rental.return_date ? new Date(rental.return_date) : new Date();
        // Rental period should be at least 1 day.
        const daysRented = Math.max(1, differenceInCalendarDays(endDate, issueDate) + 1);
        return rental.rate * rental.quantity * daysRented;
    }

    const filteredRentals = useMemo(() => {
        if (!date?.from) return [];
        const interval = { start: date.from, end: date.to || date.from };
        // We filter based on issue date to see what was rented out in the period.
        return rentals.filter(rental => {
            const issueDate = parseISO(rental.issue_date);
            return isWithinInterval(issueDate, interval);
        });
    }, [rentals, date]);

    const totalRentalValue = useMemo(() => {
        return filteredRentals.reduce((sum, rental) => {
            // For returned items, use the final calculated fee. For rented items, calculate the fee up to today.
            return sum + (rental.total_fee || calculateFee(rental));
        }, 0);
    }, [filteredRentals]);
    
    const totalReceived = useMemo(() => {
         return filteredRentals
            .filter(r => r.status === 'Returned')
            .reduce((sum, rental) => sum + (rental.total_fee || 0), 0);
    }, [filteredRentals]);

    const totalPending = useMemo(() => {
        return filteredRentals
            .filter(r => r.status === 'Rented')
            .reduce((sum, rental) => sum + calculateFee(rental), 0);
    }, [filteredRentals]);

    const monthlyData = useMemo(() => {
        const data = Array.from({ length: 12 }, (_, i) => ({
          name: new Date(0, i).toLocaleString('default', { month: 'short' }),
          total: 0,
        }));
    
        // Only count completed (returned) rentals for historical revenue.
        rentals.forEach(rental => {
          if (rental.status === 'Returned' && rental.total_fee) {
            const month = parseISO(rental.issue_date).getMonth();
            data[month].total += rental.total_fee;
          }
        });
    
        return data;
      }, [rentals]);

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <CardTitle>Financial Summary</CardTitle>
                            <CardDescription>Track rental income and payments within a date range.</CardDescription>
                        </div>
                        <DateRangePicker date={date} setDate={setDate} />
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-6 md:grid-cols-3">
                        <Card>
                            <CardHeader>
                                <CardTitle>Total Rental Value</CardTitle>
                                <CardDescription>Estimated value of rentals issued in the period.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <p className="text-4xl font-bold">${totalRentalValue.toFixed(2)}</p>
                            </CardContent>
                        </Card>
                         <Card>
                            <CardHeader>
                                <CardTitle>Total Received</CardTitle>
                                 <CardDescription>Revenue collected from rentals issued in the period.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <p className="text-4xl font-bold text-green-600">${totalReceived.toFixed(2)}</p>
                            </CardContent>
                        </Card>
                         <Card>
                            <CardHeader>
                                <CardTitle>Total Pending</CardTitle>
                                 <CardDescription>Estimated value of active rentals yet to be returned.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <p className="text-4xl font-bold text-red-600">${totalPending.toFixed(2)}</p>
                            </CardContent>
                        </Card>
                    </div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Revenue Overview</CardTitle>
                    <CardDescription>Monthly rental revenue from completed rentals.</CardDescription>
                </CardHeader>
                <CardContent>
                     <ResponsiveContainer width="100%" height={350}>
                        <BarChart data={monthlyData}>
                            <XAxis
                                dataKey="name"
                                stroke="#888888"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                            />
                            <YAxis
                                stroke="#888888"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(value) => `$${value}`}
                            />
                            <Tooltip
                                cursor={{ fill: 'hsl(var(--background))' }}
                                contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                            />
                            <Bar dataKey="total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        </div>
    );
}
