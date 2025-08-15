'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DateRangePicker } from "@/components/date-range-picker";
import { useState, useContext, useMemo } from "react";
import { DateRange } from "react-day-picker";
import { addDays, isWithinInterval, parseISO } from "date-fns";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts"
import { AppContext } from "@/context/AppContext";

export default function FinancialsPage() {
    const { rentals } = useContext(AppContext);
    const [date, setDate] = useState<DateRange | undefined>({
        from: addDays(new Date(), -30),
        to: new Date(),
    })

    const filteredRentals = useMemo(() => {
        if (!date?.from) return [];
        const interval = { start: date.from, end: date.to || date.from };
        return rentals.filter(rental => {
            const issueDate = parseISO(rental.issue_date);
            return isWithinInterval(issueDate, interval);
        });
    }, [rentals, date]);

    const totalRentalValue = useMemo(() => {
        return filteredRentals.reduce((sum, rental) => sum + (rental.total_fee || 0), 0);
    }, [filteredRentals]);
    
    const totalReceived = useMemo(() => {
         return filteredRentals.filter(r => r.status === 'Returned').reduce((sum, rental) => sum + (rental.total_fee || 0), 0);
    }, [filteredRentals]);

    const totalPending = useMemo(() => {
        const pendingRentals = filteredRentals.filter(r => r.status === 'Rented');
        const pendingValue = pendingRentals.reduce((sum, rental) => {
             const issueDate = new Date(rental.issue_date);
             const today = new Date();
             const daysRented = Math.ceil((today.getTime() - issueDate.getTime()) / (1000 * 3600 * 24)) || 1;
             return sum + (rental.rate * rental.quantity * daysRented);
        }, 0);
        return pendingValue;
    }, [filteredRentals]);

    const monthlyData = useMemo(() => {
        const data = Array.from({ length: 12 }, (_, i) => ({
          name: new Date(0, i).toLocaleString('default', { month: 'short' }),
          total: 0,
        }));
    
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
                            </CardHeader>
                            <CardContent>
                                <p className="text-4xl font-bold">${totalRentalValue.toFixed(2)}</p>
                            </CardContent>
                        </Card>
                         <Card>
                            <CardHeader>
                                <CardTitle>Total Received</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-4xl font-bold text-green-600">${totalReceived.toFixed(2)}</p>
                            </CardContent>
                        </Card>
                         <Card>
                            <CardHeader>
                                <CardTitle>Total Pending</CardTitle>
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
                    <CardDescription>Monthly rental revenue.</CardDescription>
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
