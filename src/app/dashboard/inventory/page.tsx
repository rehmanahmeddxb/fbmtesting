
'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, PlusCircle, Search, FileDown } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useState, useEffect, useContext, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
import { AppContext, Tool } from "@/context/AppContext";
import jsPDF from "jspdf";
import "jspdf-autotable";

type ExportColumn = {
  id: keyof Tool | 'status';
  label: string;
}

const exportColumns: ExportColumn[] = [
    { id: 'name', label: 'Name' },
    { id: 'total_quantity', label: 'Total Qty' },
    { id: 'available_quantity', label: 'Available' },
    { id: 'rate', label: 'Daily Rate' },
    { id: 'status', label: 'Status' },
];


export default function InventoryPage() {
  const { tools, addTool, editTool, deleteTool } = useContext(AppContext);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null);
  const [toolData, setToolData] = useState({ name: '', total_quantity: 1, rate: 0 });
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedExportColumns, setSelectedExportColumns] = useState<Set<keyof Tool | 'status'>>(new Set(exportColumns.map(c => c.id)));
  const { toast } = useToast();

  const filteredTools = useMemo(() => {
    if (!searchTerm) {
      return tools;
    }
    return tools.filter(tool => 
      tool.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [tools, searchTerm]);


  useEffect(() => {
    if (selectedTool) {
      setToolData({
        name: selectedTool.name,
        total_quantity: selectedTool.total_quantity,
        rate: selectedTool.rate,
      });
    } else {
      setToolData({ name: '', total_quantity: 1, rate: 0 });
    }
  }, [selectedTool]);

  const handleAddTool = () => {
    const success = addTool({ ...toolData, id: Date.now(), available_quantity: toolData.total_quantity });
    if(success) {
        toast({ title: "Success!", description: "New tool has been added." });
        setIsAddDialogOpen(false);
        setToolData({ name: '', total_quantity: 1, rate: 0 });
    } else {
        toast({ title: "Error", description: `A tool with the name "${toolData.name}" already exists.`, variant: "destructive"});
    }
  };

  const handleEditTool = () => {
    if (selectedTool) {
      // Logic to calculate the new available quantity based on the change in total quantity.
      const quantityDifference = toolData.total_quantity - selectedTool.total_quantity;
      const newAvailableQuantity = selectedTool.available_quantity + quantityDifference;

      if(newAvailableQuantity < 0) {
        toast({ title: "Error", description: "Total quantity cannot be less than the number of tools currently rented out.", variant: "destructive"});
        return;
      }

      editTool({ 
        ...selectedTool, 
        ...toolData,
        available_quantity: newAvailableQuantity
      });
      toast({ title: "Success!", description: "Tool details have been updated." });
    }
    setIsEditDialogOpen(false);
    setSelectedTool(null);
  };

  const handleDeleteTool = () => {
    if (selectedTool) {
      const success = deleteTool(selectedTool.id);
      if (success) {
        toast({ title: "Success!", description: "Tool has been deleted.", variant: "destructive" });
      } else {
        toast({ title: "Error", description: "Cannot delete a tool that has active rentals. Please return all items first.", variant: "destructive" });
      }
    }
    setIsDeleteDialogOpen(false);
    setSelectedTool(null);
  };
  
  const handleExportColumnToggle = (columnId: keyof Tool | 'status', checked: boolean) => {
    const newSelected = new Set(selectedExportColumns);
    if (checked) {
      newSelected.add(columnId);
    } else {
      newSelected.delete(columnId);
    }
    setSelectedExportColumns(newSelected);
  };

  const handleGeneratePdf = () => {
    const doc = new jsPDF();
    const tableHeaders = exportColumns
        .filter(col => selectedExportColumns.has(col.id))
        .map(col => col.label);
    
    const tableData = filteredTools.map(tool => {
        return exportColumns
            .filter(col => selectedExportColumns.has(col.id))
            .map(col => {
                if (col.id === 'status') {
                    return tool.available_quantity > 0 ? "Available" : "Out of Stock";
                }
                if (col.id === 'rate') {
                    return `$${tool.rate.toFixed(2)}`;
                }
                return tool[col.id as keyof Tool];
            });
    });

    (doc as any).autoTable({
        head: [tableHeaders],
        body: tableData,
        startY: 20,
        didDrawPage: (data: any) => {
            doc.setFontSize(16);
            doc.text("Inventory Report", 14, 15);
        }
    });

    doc.save("inventory_report.pdf");
    setIsExportDialogOpen(false);
    toast({ title: "Success!", description: "Your PDF report has been generated." });
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>Inventory</CardTitle>
              <CardDescription>Manage your tool inventory. View, add, or edit tools.</CardDescription>
            </div>
            <div className="flex gap-2">
                <Button variant="outline" onClick={() => setIsExportDialogOpen(true)}>
                  <FileDown className="mr-2 h-4 w-4" /> Export
                </Button>
                <Button onClick={() => { setSelectedTool(null); setIsAddDialogOpen(true); }}>
                  <PlusCircle className="mr-2 h-4 w-4" /> Add Tool
                </Button>
            </div>
          </div>
          <div className="relative pt-4">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground mt-2" />
            <Input
              type="search"
              placeholder="Search for tools..."
              className="pl-8 w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead className="text-center">Total Qty</TableHead>
                <TableHead className="text-center">Available</TableHead>
                <TableHead className="text-right">Daily Rate</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead><span className="sr-only">Actions</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTools.map((tool) => (
                <TableRow key={tool.id}>
                  <TableCell className="font-medium">{tool.name}</TableCell>
                  <TableCell className="text-center">{tool.total_quantity}</TableCell>
                  <TableCell className="text-center">{tool.available_quantity}</TableCell>
                  <TableCell className="text-right">${tool.rate.toFixed(2)}</TableCell>
                  <TableCell className="text-center">
                    <Badge variant={tool.available_quantity > 0 ? "secondary" : "destructive"} className={tool.available_quantity > 0 ? "text-green-700 border-green-300" : ""}>
                      {tool.available_quantity > 0 ? "Available" : "Out of Stock"}
                    </Badge>
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
                        <DropdownMenuItem onSelect={() => { setSelectedTool(tool); setIsEditDialogOpen(true); }}>Edit</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10" onSelect={() => { setSelectedTool(tool); setIsDeleteDialogOpen(true); }}>Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
              {tools.length > 0 && filteredTools.length === 0 && (
                <TableRow>
                    <TableCell colSpan={6} className="text-center h-24">
                        No tools found matching "{searchTerm}".
                    </TableCell>
                </TableRow>
              )}
              {tools.length === 0 && (
                <TableRow>
                    <TableCell colSpan={6} className="text-center h-24">
                        No tools found.
                    </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      {/* Add/Edit Dialog */}
      <Dialog open={isAddDialogOpen || isEditDialogOpen} onOpenChange={isAddDialogOpen ? setIsAddDialogOpen : setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{selectedTool ? 'Edit Tool' : 'Add Tool'}</DialogTitle>
            <DialogDescription>
              {selectedTool ? 'Update the details of the existing tool.' : 'Fill in the details to add a new tool.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">Name</Label>
              <Input id="name" value={toolData.name} onChange={(e) => setToolData({ ...toolData, name: e.target.value })} className="col-span-3" required />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="total_quantity" className="text-right">Total Qty</Label>
              <Input id="total_quantity" type="number" min="1" value={toolData.total_quantity} onChange={(e) => setToolData({ ...toolData, total_quantity: parseInt(e.target.value) || 1 })} className="col-span-3" required />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="rate" className="text-right">Rate ($)</Label>
              <Input id="rate" type="number" step="0.01" value={toolData.rate} onChange={(e) => setToolData({ ...toolData, rate: parseFloat(e.target.value) || 0 })} className="col-span-3" required />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" onClick={selectedTool ? handleEditTool : handleAddTool}>
              {selectedTool ? 'Save Changes' : 'Add Tool'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the tool from your inventory.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedTool(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteTool} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Export Dialog */}
      <Dialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Export Inventory to PDF</DialogTitle>
            <DialogDescription>
              Select the columns you want to include in the PDF report.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {exportColumns.map(column => (
                <div key={column.id} className="flex items-center space-x-2">
                    <Checkbox
                        id={`export-${column.id}`}
                        checked={selectedExportColumns.has(column.id)}
                        onCheckedChange={(checked) => handleExportColumnToggle(column.id, !!checked)}
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
             <Button variant="outline" onClick={() => setIsExportDialogOpen(false)}>Cancel</Button>
            <Button type="submit" onClick={handleGeneratePdf}>
              Generate PDF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
