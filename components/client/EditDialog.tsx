"use client"

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import React from "react"

type Field =
    | { type: "text" | "email" | "tel"; name: string; label: string; required?: boolean }
    | { type: "checkbox"; name: string; label: string }
    | { type: "select"; name: string; label: string; options: string[] }
    | { type: "file"; name: string; label: string } 

interface EditDialogProps<T> {
    open: boolean
    title: string
    description: string
    entity: T | null
    setEntity: (entity: T | null) => void
    onSubmit: (e: React.FormEvent) => void
    loading: boolean
    fields: Field[]
}

export function EditDialog<T>({
    open,
    title,
    description,
    entity,
    setEntity,
    onSubmit,
    loading,
    fields,
}: EditDialogProps<T>) {
    return (
        <Dialog open={open} onOpenChange={() => setEntity(null)}>
            <DialogContent className="max-w-lg w-full md:max-w-2xl !p-6">
                <DialogHeader>
                    <DialogTitle className="text-black">{title}</DialogTitle>
                    <DialogDescription className="font-semibold">{description}</DialogDescription>
                </DialogHeader>

                {entity && (
                    <form onSubmit={onSubmit}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {fields.map((field) => {
                                if (field.type === "text" || field.type === "email" || field.type === "tel") {
                                    return (
                                        <div className="space-y-1" key={field.name}>
                                            <Label className="text-sm font-medium text-black">{field.label}</Label>
                                            <Input
                                                type={field.type}
                                                value={(entity as any)[field.name] || ""}
                                                onChange={(e) => setEntity({ ...(entity as any), [field.name]: e.target.value })}
                                                required={field.required}
                                                className="w-44 md:w-56 px-2 py-1 text-sm border border-black/60 rounded text-black placeholder:text-gray-400 focus:outline-none focus:ring-0 focus:border-black"
                                            />
                                        </div>
                                    )
                                }

                                if (field.type === "checkbox") {
                                    return (
                                        <div className="flex items-center space-x-2 md:col-span-2" key={field.name}>
                                            <input
                                                type="checkbox"
                                                checked={(entity as any)[field.name] || false}
                                                onChange={(e) => setEntity({ ...(entity as any), [field.name]: e.target.checked })}
                                                className="rounded"
                                            />
                                            <Label className="text-sm text-black">{field.label}</Label>
                                        </div>
                                    )
                                }

                                if (field.type === "select") {
                                    return (
                                        <div className="space-y-1" key={field.name}>
                                            <Label className="text-sm font-medium text-black">{field.label}</Label>
                                            <select
                                                value={(entity as any)[field.name] || ""}
                                                onChange={(e) => setEntity({ ...(entity as any), [field.name]: e.target.value })}
                                                className="w-44 md:w-56 px-2 py-1 text-sm border border-black/60 rounded text-black placeholder:text-gray-400 focus:outline-none focus:ring-0 focus:border-black"
                                            >
                                                <option value="">Select</option>
                                                {field.options.map((opt) => (
                                                    <option key={opt} value={opt}>
                                                        {opt}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    )
                                }

                                if (field.type === "file") {
                                    return (
                                        <div className="space-y-1 md:col-span-2" key={field.name}>
                                            <Label className="text-sm font-medium text-black">{field.label}</Label>
                                            <Input
                                                type="file"
                                                accept="image/*"
                                                onChange={async (e) => {
                                                    const file = e.target.files?.[0];
                                                    if (file) {
                                                        try {
                                                            // Create FormData
                                                            const formData = new FormData();
                                                            formData.append("file", file);

                                                            // Upload to backend API
                                                            const res = await fetch("/api/upload", {
                                                                method: "POST",
                                                                body: formData,
                                                            });

                                                            if (!res.ok) throw new Error("Upload failed");

                                                            const { url } = await res.json();

                                                            // Save public URL in entity
                                                            setEntity({ ...(entity as any), [field.name]: url });
                                                        } catch (err) {
                                                            console.error("Image upload failed", err);
                                                            alert("Image upload failed. Please try again.");
                                                        }
                                                    }
                                                }}
                                                className="w-44 md:w-56 px-2 py-1 text-sm border border-black/60 rounded text-black placeholder:text-gray-400 focus:outline-none focus:ring-0 focus:border-black"
                                            />
                                            {(entity as any)[field.name] && (
                                                <img
                                                    src={(entity as any)[field.name]}
                                                    alt="Preview"
                                                    className="h-16 w-16 rounded-full object-cover mt-2"
                                                />
                                            )}
                                        </div>
                                    );
                                }

                                return null
                            })}
                        </div>
                        <DialogFooter className="mt-6">
                            <Button type="submit" disabled={loading} className="w-full md:w-auto">
                                {loading ? "Saving..." : "Save Changes"}
                            </Button>
                        </DialogFooter>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    )
}
