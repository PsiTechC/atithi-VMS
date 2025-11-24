"use client"

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Camera } from "lucide-react"
import React, { useRef, useState, useEffect } from "react"

type Field =
    | { type: "text" | "email" | "tel" |"array" | "date" | "datetime-local"; name: string; label: string; required?: boolean }
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
    const [showCameraModal, setShowCameraModal] = useState(false)
    const [photoPreview, setPhotoPreview] = useState<string | null>(null)
    const videoRef = useRef<HTMLVideoElement | null>(null)
    const canvasRef = useRef<HTMLCanvasElement | null>(null)
    const [stream, setStream] = useState<MediaStream | null>(null)
    const [cameraError, setCameraError] = useState("")
   

    useEffect(() => {
        if (showCameraModal) {
            setCameraError("")
            navigator.mediaDevices
                .getUserMedia({ video: true })
                .then((mediaStream) => {
                    setStream(mediaStream)
                    if (videoRef.current) {
                        videoRef.current.srcObject = mediaStream
                        videoRef.current.play()
                    }
                })
                .catch((err) => {
                    setCameraError("Unable to access camera: " + err.message)
                })
        } else {
            if (stream) {
                stream.getTracks().forEach((track) => track.stop())
                setStream(null)
            }
        }
        // Cleanup on unmount
        return () => {
            if (stream) {
                stream.getTracks().forEach((track) => track.stop())
            }
        }
    }, [showCameraModal])

    return (
        <>
        <Dialog open={open} onOpenChange={() => setEntity(null)}>
            <DialogContent className="max-w-lg w-full md:max-w-2xl !p-6 max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-black">{title}</DialogTitle>
                    <DialogDescription className="font-semibold">{description}</DialogDescription>
                </DialogHeader>

                {entity && (
                    <form onSubmit={onSubmit}>
                     {/* <form ref={formRef} onSubmit={onSubmit}> */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {fields.map((field) => {
                                // if (field.type === "text" || field.type === "email" || field.type === "tel") {
                                if (field.type === "text" || field.type === "email" || field.type === "tel" || field.type === "date" || field.type === "datetime-local") {
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

                                if (field.type === "array") {
                                    const arrayValue = (entity as any)[field.name] || [""];
                                    return (
                                        <div className="space-y-2 md:col-span-1" key={field.name}>
                                            <Label className="text-sm font-medium text-black">{field.label}</Label>
                                            {arrayValue.map((item: string, idx: number) => (
                                                <div key={idx} className="flex items-center gap-2">
                                                    <Input
                                                        type="tel"
                                                        value={item}
                                                        onChange={(e) => {
                                                            const updated = [...arrayValue];
                                                            updated[idx] = e.target.value;
                                                            setEntity({ ...(entity as any), [field.name]: updated });
                                                        }}
                                                        placeholder={`${field.label} #${idx + 1}`}
                                                        className="flex-1 px-2 py-1 text-sm border border-black/60 rounded text-black placeholder:text-gray-400 focus:outline-none focus:ring-0 focus:border-black"
                                                    />
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => {
                                                            const updated = arrayValue.filter((_: any, i: number) => i !== idx);
                                                            setEntity({ ...(entity as any), [field.name]: updated.length > 0 ? updated : [""] });
                                                        }}
                                                        className="text-xs"
                                                    >
                                                        Remove
                                                    </Button>
                                                </div>
                                            ))}
                                            <Button
                                                type="button"
                                                size="sm"
                                                onClick={() => {
                                                    setEntity({ ...(entity as any), [field.name]: [...arrayValue, ""] });
                                                }}
                                                className="text-xs"
                                            >
                                                + Add {field.label}
                                            </Button>
                                        </div>
                                    );
                                }

                                if (field.type === "file") {
                                    return (
                                        <div className="space-y-4 md:col-span-2" key={field.name}>
                                            <Label className="text-sm font-medium text-black">{field.label}</Label>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={() => setShowCameraModal(true)}
                                                className="h-10 px-4 text-sm font-medium bg-blue-50 border-blue-200 hover:border-blue-400 hover:bg-blue-100 rounded transition-all duration-200"
                                            >
                                                <Camera className="h-4 w-4 mr-2 text-blue-600" />
                                                Take Photo
                                            </Button>

                                            {(entity as any)[field.name] && (
                                                <div className="relative flex flex-col items-center p-4 bg-gray-50 rounded-2xl border-2 border-gray-100">
                                                    <div className="relative">
                                                        <img
                                                            src={(entity as any)[field.name]}
                                                            alt="Photo Preview"
                                                            className="w-32 h-32 object-cover rounded-2xl border-4 border-white shadow-lg"
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setEntity({ ...(entity as any), [field.name]: null });
                                                                setPhotoPreview(null);
                                                            }}
                                                            className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-2 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-110"
                                                            aria-label="Remove photo"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path
                                                                    strokeLinecap="round"
                                                                    strokeLinejoin="round"
                                                                    strokeWidth={2}
                                                                    d="M6 18L18 6M6 6l12 12"
                                                                />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                    <span className="text-xs text-gray-600 mt-2 font-medium bg-white px-2 py-1 rounded-full">
                                                        Photo Preview
                                                    </span>
                                                </div>
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

        {/* Camera Modal */}
        <Dialog open={showCameraModal} onOpenChange={setShowCameraModal}>
            <DialogContent className="max-w-lg rounded-3xl border-2 border-gray-100 shadow-2xl bg-white">
                <DialogHeader className="text-center space-y-3">
                    <DialogTitle className="text-2xl font-bold text-gray-800 flex items-center justify-center gap-3">
                        <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl">
                            <Camera className="h-6 w-6 text-white" />
                        </div>
                        Capture Photo
                    </DialogTitle>
                    <DialogDescription className="text-gray-600">
                        Allow camera access and click Capture to take a photo.
                    </DialogDescription>
                </DialogHeader>
                {cameraError ? (
                    <Alert variant="destructive" className="rounded-xl border-2">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{cameraError}</AlertDescription>
                    </Alert>
                ) : (
                    <div className="flex flex-col items-center space-y-6">
                        <div className="relative">
                            <video
                                ref={videoRef}
                                className="w-80 h-60 bg-black rounded-2xl shadow-lg border-4 border-gray-200"
                                autoPlay
                                playsInline
                            />
                            <div className="absolute inset-0 rounded-2xl border-2 border-dashed border-blue-300 pointer-events-none"></div>
                        </div>
                        <canvas ref={canvasRef} className="hidden" width={320} height={240} />
                        <div className="flex gap-4">
                            <Button
                                type="button"
                                onClick={async () => {
                                    if (videoRef.current && canvasRef.current) {
                                        const ctx = canvasRef.current.getContext("2d")
                                        if (ctx) {
                                            ctx.drawImage(
                                                videoRef.current,
                                                0,
                                                0,
                                                canvasRef.current.width,
                                                canvasRef.current.height,
                                            )
                                            canvasRef.current.toBlob(async (blob) => {
                                                if (blob) {
                                                        const file = new File([blob], "visitor-photo.png", { type: "image/png" })
                                                        try {
                                                            // Upload to backend API
                                                            const passId = (entity as any).passId;
                                                            const formData = new FormData();
                                                            formData.append("photo", file);

                                                            const res = await fetch(`/api/visitor-pass/${passId}`, {
                                                                method: "PUT",
                                                                body: formData,
                                                            });

                                                            if (!res.ok) throw new Error("Upload failed");

                                                            const { url } = await res.json();

                                                            // Save public URL in entity
                                                            setEntity({ ...(entity as any), photo: url });
                                                            setPhotoPreview(URL.createObjectURL(blob));
                                                            // // Automatically submit the form to save to database
                                                            // formRef.current?.dispatchEvent(new Event('submit', { bubbles: true }));
                                                            // setShowCameraModal(false);
                                                        } catch (err) {
                                                            console.error("Image upload failed", err);
                                                            alert("Image upload failed. Please try again.");
                                                        }
                                                }
                                            }, "image/png")
                                        }
                                    }
                                }}
                                className="h-12 px-8 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow"
                            >
                                📸 Capture Photo
                            </Button>

                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setShowCameraModal(false)}
                                className="h-12 px-8 border-2 border-gray-300 hover:border-gray-400 rounded-xl font-semibold"
                            >
                                Cancel
                            </Button>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
        </>
    )
}
