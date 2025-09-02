
'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { AppContext } from "@/context/AppContext";
import { useContext, useState, useRef } from "react";
import { Download, Upload, ShieldAlert } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

export default function BackupPage() {
    const { tools, customers, sites, rentals, isLoading } = useContext(AppContext);
    const { toast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleBackup = () => {
        const backupData = {
            tools,
            customers,
            sites,
            rentals,
        };
        const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        const date = new Date().toISOString().split('T')[0];
        link.download = `fbm-tools-backup-${date}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        toast({
            title: "Backup Created",
            description: "Your data has been downloaded successfully.",
        });
    };

    const handleRestore = async () => {
        const file = fileInputRef.current?.files?.[0];
        if (!file) {
            toast({
                title: "No file selected",
                description: "Please select a backup file to restore.",
                variant: "destructive",
            });
            return;
        }

        try {
            const fileContent = await file.text();
            const backupData = JSON.parse(fileContent);

            // Basic validation
            if (!backupData.tools || !backupData.customers || !backupData.sites || !backupData.rentals) {
                throw new Error("Invalid backup file format.");
            }

            await fetch('/api/data', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(backupData)
            });
            
            toast({
                title: "Restore Successful",
                description: "Your data has been restored. The page will now reload.",
            });

            // Reload the page to reflect the new state from the server
            setTimeout(() => {
                window.location.reload();
            }, 1500);

        } catch (error) {
            console.error("Restore failed:", error);
            toast({
                title: "Restore Failed",
                description: "The selected file is not a valid backup file or an error occurred.",
                variant: "destructive",
            });
        }
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Backup Data</CardTitle>
                    <CardDescription>Download all your application data into a single JSON file for safekeeping.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Button onClick={handleBackup} disabled={isLoading}>
                        <Download className="mr-2 h-4 w-4" /> Download Backup File
                    </Button>
                </CardContent>
            </Card>

             <Card className="border-destructive">
                <CardHeader>
                    <CardTitle className="text-destructive flex items-center gap-2">
                        <ShieldAlert /> Restore Data
                    </CardTitle>
                    <CardDescription>
                        Restore your application data from a backup file. This action is irreversible and will overwrite all current data.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="backup-file">Backup File (.json)</Label>
                        <Input id="backup-file" type="file" accept=".json" ref={fileInputRef} />
                    </div>
                     <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="destructive" disabled={isLoading}>
                                <Upload className="mr-2 h-4 w-4" /> Restore from File
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This will permanently overwrite all existing data in the application with the data from the selected backup file. This action cannot be undone.
                            </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                                className="bg-destructive hover:bg-destructive/90"
                                onClick={handleRestore}
                            >
                                Yes, Overwrite and Restore
                            </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </CardContent>
            </Card>
        </div>
    );
}
