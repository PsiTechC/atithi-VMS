// app/client-dashboard/users/new/page.tsx
"use client";

import Link from "next/link";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Save, Upload } from "lucide-react";

export default function NewUserPage() {
    const [submitting, setSubmitting] = useState(false);
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setSubmitting(true);
        const formData = new FormData(e.currentTarget);

        try {
            const token = localStorage.getItem("accessToken"); // or read cookie if you prefer
            const res = await fetch("/api/client/users", {
                method: "POST",
                headers: token ? { Authorization: `Bearer ${token}` } : undefined,
                body: formData,
            });
            const data = await res.json();
            if (!res.ok) {
                alert(data.error || "Failed to invite user");
                setSubmitting(false);
                return;
            }
            window.location.href = "/client-dashboard/users";
        } catch (err) {
            alert("An error occurred while inviting the user.");
            setSubmitting(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold text-foreground">Invite User</h1>
                    <p className="text-muted-foreground">Create a user under your client account</p>
                </div>
                <Button asChild variant="outline">
                    <Link href="/client-dashboard/users">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Users
                    </Link>
                </Button>
            </div>

            <Card className="border">
                <CardHeader>
                    <CardTitle>User Information</CardTitle>
                    <CardDescription>Fields marked * are required.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} encType="multipart/form-data" className="space-y-8">
                        <div className="grid gap-6 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="name">Full Name *</Label>
                                <Input id="name" name="name" required />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="email">Email *</Label>
                                <Input id="email" name="email" type="email" required />
                            </div>

                            <div className="space-y-2">
                                <Label>Role *</Label>
                                <Select name="role" defaultValue="client-user">
                                    <SelectTrigger><SelectValue placeholder="Select a role" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="client-user">User</SelectItem>
                                        <SelectItem value="client-admin">Admin</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="photo">Photo (optional)</Label>
                                <Input
                                    id="photo"
                                    name="photo"
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => {
                                        const f = e.target.files?.[0];
                                        if (!f) return setPhotoPreview(null);
                                        setPhotoPreview(URL.createObjectURL(f));
                                    }}
                                />
                                {photoPreview ? (
                                    <div className="h-20 w-20 rounded border overflow-hidden mt-2">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img src={photoPreview} alt="Preview" className="h-full w-full object-cover" />
                                    </div>
                                ) : (
                                    <div className="text-xs text-muted-foreground flex items-center gap-2 mt-2">
                                        <Upload className="h-4 w-4" /> No file selected
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-3">
                            <Button asChild variant="outline"><Link href="/client-dashboard/users">Cancel</Link></Button>
                            <Button type="submit" disabled={submitting} className="min-w-32">
                                <Save className="h-4 w-4 mr-2" />
                                {submitting ? "Inviting..." : "Invite User"}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
