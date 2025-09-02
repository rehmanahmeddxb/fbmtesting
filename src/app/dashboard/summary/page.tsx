"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { PieChart, Pie, Cell } from "recharts";
import { useContext } from "react";
import { AppContext } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import { FileDown } from "lucide-react";
import jsPDF from "jspdf";
import "jspdf-autotable";

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

    const handleGeneratePdf = () => {
        const doc = new jsPDF();

        doc.setFontSize(18);
        doc.text("Inventory Summary Report", 14, 22);

        doc.setFontSize(12);
        doc.text(`Total Tools: ${totalTools}`, 14, 40);
        doc.text(`Rented Tools: ${rentedTools}`, 14, 48);
        doc.text(`Available Tools: ${availableTools}`, 14, 56);

        const tableHeaders = ["Tool Name", "Total Quantity", "Available Quantity", "Rented Quantity"];
        const tableData = tools.map(tool => [
            tool.name,
            tool.total_quantity,
            tool.available_quantity,
            tool.total_quantity - tool.available_quantity
        ]);

        (doc as any).autoTable({
            head: [tableHeaders],
            body: tableData,
            startY: 70,
        });

        doc.save("inventory_summary.pdf");
    };

    const handleGenerateCsv = () => {
        const headers = ["Tool Name", "Total Quantity", "Available Quantity", "Rented Quantity"];
        const data = tools.map(tool => [
            `"${tool.name}"`,
            tool.total_quantity,
            tool.available_quantity,
            tool.total_quantity - tool.available_quantity
        ].join(','));

        const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...data].join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "inventory_summary.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <div>
                            <CardTitle>Inventory Summary</CardTitle>
                            <CardDescription>A quick overview of your entire tool inventory status.</CardDescription>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={handleGenerateCsv}>
                                <FileDown className="mr-2 h-4 w-4" /> Export CSV
                            </Button>
                            <Button variant="outline" onClick={handleGeneratePdf}>
                                <FileDown className="mr-2 h-4 w-4" /> Export PDF
                            </Button>
                        </div>
                    </div>
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
