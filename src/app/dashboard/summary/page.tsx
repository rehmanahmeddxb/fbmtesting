"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { PieChart, Pie, Cell } from "recharts";
import { useContext } from "react";
import { AppContext } from "@/context/AppContext";

const chartConfig = {
    value: {
        label: "Tools",
    },
    rented: {
        label: "Rented",
        color: "hsl(var(--accent))",
    },
    available: {
        label: "Available",
        color: "hsl(var(--primary))",
    },
}

export default function SummaryPage() {
    const { tools } = useContext(AppContext);

    const totalTools = tools.reduce((sum, tool) => sum + tool.total_quantity, 0);
    const rentedTools = tools.reduce((sum, tool) => sum + (tool.total_quantity - tool.available_quantity), 0);
    const availableTools = totalTools - rentedTools;

    const chartData = [
        { name: 'Rented', value: rentedTools, fill: 'hsl(var(--accent))' },
        { name: 'Available', value: availableTools, fill: 'hsl(var(--primary))' },
    ];

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Inventory Summary</CardTitle>
                    <CardDescription>A quick overview of your entire tool inventory status.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-6 md:grid-cols-3">
                        <Card>
                            <CardHeader>
                                <CardTitle>Total Tools</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-4xl font-bold">{totalTools}</p>
                            </CardContent>
                        </Card>
                         <Card>
                            <CardHeader>
                                <CardTitle>Rented Tools</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-4xl font-bold">{rentedTools}</p>
                            </CardContent>
                        </Card>
                         <Card>
                            <CardHeader>
                                <CardTitle>Available Tools</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-4xl font-bold">{availableTools}</p>
                            </CardContent>
                        </Card>
                    </div>
                </CardContent>
            </Card>
            <Card className="flex flex-col">
                <CardHeader>
                    <CardTitle>Inventory Distribution</CardTitle>
                    <CardDescription>Rented vs. Available tools.</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 pb-0">
                    <ChartContainer
                        config={chartConfig}
                        className="mx-auto aspect-square max-h-[300px]"
                    >
                        <PieChart>
                            <ChartTooltip
                                cursor={false}
                                content={<ChartTooltipContent hideLabel />}
                            />
                            <Pie
                                data={chartData}
                                dataKey="value"
                                nameKey="name"
                                innerRadius={60}
                                strokeWidth={5}
                            >
                                {chartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.fill} />
                                ))}
                            </Pie>
                        </PieChart>
                    </ChartContainer>
                </CardContent>
            </Card>
        </div>
    );
}
