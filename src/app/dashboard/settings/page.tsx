'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";
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
import React, { useContext } from "react";
import { AppContext } from "@/context/AppContext";

export default function SettingsPage() {
    const { toast } = useToast();
    const { resetData } = useContext(AppContext);
    const [isResetDialogOpen, setIsResetDialogOpen] = React.useState(false);


    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        toast({
            title: "Settings Saved",
            description: "Your changes have been saved successfully.",
        });
    };

    const handleReset = () => {
        resetData();
        toast({
            title: "Application Reset",
            description: "All data has been cleared.",
            variant: "destructive",
        })
        setIsResetDialogOpen(false);
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
                                <Button variant="destructive">Reset All Application Data</Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This action cannot be undone. This will permanently delete all of
                                    your tools, customers, sites, and rental history.
                                </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                    className="bg-destructive hover:bg-destructive/90"
                                    onClick={handleReset}
                                >
                                    Yes, delete all data
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
