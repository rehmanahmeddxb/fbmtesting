'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
  } from "@/components/ui/alert-dialog"
import React, { useContext, useState } from "react";
import { AppContext } from "@/context/AppContext";

type ResetOptions = {
    tools: boolean;
    customers: boolean;
    sites: boolean;
    rentals: boolean;
}

export default function SettingsPage() {
    const { toast } = useToast();
    const { resetData } = useContext(AppContext);
    const [isResetDialogOpen, setIsResetDialogOpen] = React.useState(false);
    const [resetOptions, setResetOptions] = useState<ResetOptions>({
        tools: false,
        customers: false,
        sites: false,
        rentals: false,
    })

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        toast({
            title: "Settings Saved",
            description: "Your changes have been saved successfully.",
        });
    };

    const handleReset = () => {
        if (Object.values(resetOptions).every(v => !v)) {
            toast({
                title: "No selection",
                description: "Please select at least one data type to reset.",
                variant: "destructive",
            });
            return;
        }
        resetData(resetOptions);
        toast({
            title: "Application Reset",
            description: "The selected data has been cleared.",
            variant: "destructive",
        })
        setIsResetDialogOpen(false);
        setResetOptions({ tools: false, customers: false, sites: false, rentals: false });
    }

    return (
        <form onSubmit={handleSubmit}>
            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Profile</CardTitle>
                        <CardDescription>Update your personal information.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="username">Username</Label>
                            <Input id="username" defaultValue="user" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" type="email" defaultValue="user@example.com" />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="password">New Password</Label>
                            <Input id="password" type="password" placeholder="Enter new password" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Notifications</CardTitle>
                        <CardDescription>Manage your notification preferences.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                       <div className="flex items-center justify-between">
                            <Label htmlFor="email-notifications" className="flex flex-col space-y-1">
                                <span>Email Notifications</span>
                                <span className="font-normal leading-snug text-muted-foreground">
                                    Receive notifications about rentals and returns via email.
                                </span>
                            </Label>
                            <Switch id="email-notifications" defaultChecked />
                        </div>
                         <div className="flex items-center justify-between">
                            <Label htmlFor="sms-notifications" className="flex flex-col space-y-1">
                                <span>SMS Notifications</span>
                                <span className="font-normal leading-snug text-muted-foreground">
                                    Receive important alerts via text message.
                                </span>
                            </Label>
                            <Switch id="sms-notifications" />
                        </div>
                    </CardContent>
                </Card>
                
                <Card className="border-destructive">
                    <CardHeader>
                        <CardTitle className="text-destructive">Danger Zone</CardTitle>
                        <CardDescription>These actions are irreversible. Please be certain.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <AlertDialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
                            <AlertDialogTrigger asChild>
                                <Button variant="destructive">Reset Application Data</Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                <AlertDialogTitle>Reset Application Data</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Select the data you want to permanently delete. This action cannot be undone.
                                </AlertDialogDescription>
                                </AlertDialogHeader>
                                <div className="space-y-4 py-4">
                                    <div className="items-top flex space-x-2">
                                        <Checkbox id="reset-tools" checked={resetOptions.tools} onCheckedChange={(checked) => setResetOptions(o => ({...o, tools: !!checked}))} />
                                        <div className="grid gap-1.5 leading-none">
                                            <label htmlFor="reset-tools" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                                Inventory
                                            </label>
                                            <p className="text-sm text-muted-foreground">
                                                Deletes all tool records.
                                            </p>
                                        </div>
                                    </div>
                                    <div className="items-top flex space-x-2">
                                        <Checkbox id="reset-customers" checked={resetOptions.customers} onCheckedChange={(checked) => setResetOptions(o => ({...o, customers: !!checked}))} />
                                        <div className="grid gap-1.5 leading-none">
                                            <label htmlFor="reset-customers" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                                Customers
                                            </label>
                                            <p className="text-sm text-muted-foreground">
                                                Deletes all customer profiles.
                                            </p>
                                        </div>
                                    </div>
                                     <div className="items-top flex space-x-2">
                                        <Checkbox id="reset-sites" checked={resetOptions.sites} onCheckedChange={(checked) => setResetOptions(o => ({...o, sites: !!checked}))} />
                                        <div className="grid gap-1.5 leading-none">
                                            <label htmlFor="reset-sites" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                                Sites
                                            </label>
                                            <p className="text-sm text-muted-foreground">
                                                Deletes all site locations.
                                            </p>
                                        </div>
                                    </div>
                                    <div className="items-top flex space-x-2">
                                        <Checkbox id="reset-rentals" checked={resetOptions.rentals} onCheckedChange={(checked) => setResetOptions(o => ({...o, rentals: !!checked}))} />
                                        <div className="grid gap-1.5 leading-none">
                                            <label htmlFor="reset-rentals" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                                Rental History
                                            </label>
                                            <p className="text-sm text-muted-foreground">
                                               Deletes all rental records and transactions.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                    className="bg-destructive hover:bg-destructive/90"
                                    onClick={handleReset}
                                >
                                    Delete Selected Data
                                </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </CardContent>
                </Card>

                 <div className="flex justify-end">
                    <Button type="submit">Save Changes</Button>
                </div>
            </div>
        </form>
    );
}
