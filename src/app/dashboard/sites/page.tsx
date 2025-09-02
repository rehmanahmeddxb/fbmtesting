'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, PlusCircle, Search, FileDown } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useContext, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
import { AppContext, Site } from "@/context/AppContext";
import Link from "next/link";
import jsPDF from "jspdf";
import "jspdf-autotable";

export default function SitesPage() {
  const { sites, addSite, editSite, deleteSite } = useContext(AppContext);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [selectedSite, setSelectedSite] = useState<Site | null>(null);
  const [siteName, setSiteName] = useState('');
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  const filteredSites = useMemo(() => {
    if (!searchTerm) {
      return sites;
    }
    return sites.filter(site => 
      site.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [sites, searchTerm]);

  const handleAddSite = () => {
    addSite({ id: Date.now(), name: siteName });
    toast({ title: "Success!", description: "New site has been added." });
    setIsAddDialogOpen(false);
    setSiteName('');
  };

  const handleEditSite = () => {
    if (selectedSite) {
      editSite({ ...selectedSite, name: siteName });
      toast({ title: "Success!", description: "Site has been updated." });
    }
    setIsEditDialogOpen(false);
    setSelectedSite(null);
  };
  
  const handleDeleteSite = () => {
    if (selectedSite) {
        deleteSite(selectedSite.id);
        toast({ title: "Success!", description: "Site has been deleted.", variant: "destructive" });
    }
    setIsDeleteDialogOpen(false);
    setSelectedSite(null);
  };

  const handleGeneratePdf = () => {
    const doc = new jsPDF();
    const tableHeaders = ['Site Name'];
    const tableData = filteredSites.map(site => [site.name]);

    (doc as any).autoTable({
        head: [tableHeaders],
        body: tableData,
        startY: 20,
        didDrawPage: (data: any) => {
            doc.setFontSize(16);
            doc.text("Sites Report", 14, 15);
        }
    });

    doc.save("sites_report.pdf");
    setIsExportDialogOpen(false);
    toast({ title: "Success!", description: "Your PDF report has been generated." });
  };
  
  const handleGenerateCsv = () => {
    const headers = ['Site Name'];
    const data = filteredSites.map(site => `"${site.name}"`);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...data].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "sites_report.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: "Success!", description: "Your CSV report has been generated." });
  };


  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>Sites</CardTitle>
              <CardDescription>Manage rental sites. View, add, or remove site locations.</CardDescription>
            </div>
            <div className="flex gap-2">
                <Button variant="outline" onClick={handleGenerateCsv}>
                  <FileDown className="mr-2 h-4 w-4" /> Export CSV
                </Button>
                <Button variant="outline" onClick={handleGeneratePdf}>
                  <FileDown className="mr-2 h-4 w-4" /> Export PDF
                </Button>
                <Button onClick={() => { setSelectedSite(null); setSiteName(''); setIsAddDialogOpen(true); }}>
                  <PlusCircle className="mr-2 h-4 w-4" /> Add Site
                </Button>
            </div>
          </div>
          <div className="relative pt-4">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground mt-2" />
            <Input
              type="search"
              placeholder="Search for sites..."
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
                <TableHead>Site Name</TableHead>
                <TableHead><span className="sr-only">Actions</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSites.map((site) => (
                <TableRow key={site.id}>
                  <TableCell className="font-medium">{site.name}</TableCell>
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
                        <DropdownMenuItem asChild><Link href={`/dashboard/sites/${site.id}`}>View Details</Link></DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => { setSelectedSite(site); setSiteName(site.name); setIsEditDialogOpen(true); }}>Edit</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10" onSelect={() => { setSelectedSite(site); setIsDeleteDialogOpen(true); }}>Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
              {sites.length > 0 && filteredSites.length === 0 && (
                <TableRow>
                    <TableCell colSpan={2} className="text-center h-24">
                        No sites found matching "{searchTerm}".
                    </TableCell>
                </TableRow>
              )}
               {sites.length === 0 && (
                <TableRow>
                    <TableCell colSpan={2} className="text-center h-24">
                        No sites found.
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
            <DialogTitle>{selectedSite ? 'Edit Site' : 'Add Site'}</DialogTitle>
            <DialogDescription>
              {selectedSite ? 'Update the name of the existing site.' : 'Enter the name for the new site.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">Name</Label>
              <Input id="name" value={siteName} onChange={(e) => setSiteName(e.target.value)} className="col-span-3" required />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" onClick={selectedSite ? handleEditSite : handleAddSite}>
                {selectedSite ? 'Save Changes' : 'Add Site'}
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
              This action cannot be undone. This will permanently delete the site.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedSite(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteSite} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
