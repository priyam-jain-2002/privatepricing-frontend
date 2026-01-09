import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, File as FileIcon, Loader2, Crop as CropIcon, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { uploadAsset } from '@/lib/api';
import { toast } from 'sonner';
import Cropper from 'react-easy-crop';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"

interface FileUploadProps {
    onUploadComplete: (url: string) => void;
    allowedTypes?: string[]; // e.g. ['image/*', 'application/pdf']
    maxSize?: number; // in bytes
    className?: string;
    value?: string; // Current URL
    resetOnSuccess?: boolean;
}

// Helper to create the cropped image
const getCroppedImg = async (imageSrc: string, pixelCrop: any, mimeType: string): Promise<Blob> => {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.addEventListener('load', () => resolve(img));
        img.addEventListener('error', (error) => reject(error));
        img.setAttribute('crossOrigin', 'anonymous');
        img.src = imageSrc;
    });

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
        throw new Error('No 2d context');
    }

    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

    ctx.drawImage(
        image,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        pixelCrop.width,
        pixelCrop.height
    );

    return new Promise((resolve, reject) => {
        canvas.toBlob((blob) => {
            if (!blob) {
                reject(new Error('Canvas is empty'));
                return;
            }
            resolve(blob);
        }, mimeType);
    });
};

export function FileUpload({
    onUploadComplete,
    allowedTypes = ['image/*', 'application/pdf'],
    maxSize = 5 * 1024 * 1024, // 5MB
    className,
    value,
    resetOnSuccess = false
}: FileUploadProps) {
    const [isUploading, setIsUploading] = useState(false);
    const [preview, setPreview] = useState<string | null>(value || null);

    // Crop State
    const [cropOpen, setCropOpen] = useState(false);
    const [imgSrc, setImgSrc] = useState<string | null>(null);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
    const [currentFile, setCurrentFile] = useState<File | null>(null);

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        const file = acceptedFiles[0];
        if (!file) return;

        if (file.size > maxSize) {
            toast.error('File is too large');
            return;
        }

        // Check if image for cropping
        if (file.type.startsWith('image/')) {
            setCurrentFile(file);
            const reader = new FileReader();
            reader.addEventListener('load', () => {
                setImgSrc(reader.result as string);
                setCropOpen(true);
            });
            reader.readAsDataURL(file);
        } else {
            // Direct upload for non-images (PDFs)
            handleUpload(file);
        }
    }, [maxSize]);

    const handleUpload = async (file: File | Blob) => {
        try {
            setIsUploading(true);
            // If it's a blob from cropper, we need to make it look like a File for the API logic if needed,
            // but our api receives Blob/File fine in FormData.
            // However, we might want to preserve original name if it was cropped.
            let uploadFile = file;
            if (file instanceof Blob && !(file instanceof File) && currentFile) {
                uploadFile = new File([file], currentFile.name, { type: currentFile.type });
            } else if (file instanceof Blob && !(file instanceof File)) {
                uploadFile = new File([file], "cropped-image.webp", { type: "image/webp" });
            }

            const asset = await uploadAsset(uploadFile as File);
            onUploadComplete(asset.publicUrl);

            if (resetOnSuccess) {
                setPreview(null);
            } else {
                setPreview(asset.publicUrl);
            }
            toast.success('File uploaded successfully');
        } catch (error: any) {
            toast.error(error.message || 'Upload failed');
            setPreview(null);
        } finally {
            setIsUploading(false);
            setCropOpen(false);
            setImgSrc(null);
            setCurrentFile(null);
        }
    };

    const onCropComplete = useCallback((croppedArea: any, croppedAreaPixels: any) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    const handleCropSave = async () => {
        if (!imgSrc || !croppedAreaPixels || !currentFile) return;
        try {
            const croppedBlob = await getCroppedImg(imgSrc, croppedAreaPixels, currentFile.type || 'image/jpeg');
            await handleUpload(croppedBlob);
        } catch (e) {
            console.error(e);
            toast.error('Failed to crop image');
        }
    };

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: allowedTypes.reduce((acc, type) => ({ ...acc, [type]: [] }), {}),
        maxFiles: 1,
    });

    const clearFile = (e: React.MouseEvent) => {
        e.stopPropagation();
        setPreview(null);
        onUploadComplete('');
    };

    return (
        <>
            <div className={cn("w-full", className)}>
                <div
                    {...getRootProps()}
                    className={cn(
                        "border-2 border-dashed rounded-lg p-6 cursor-pointer transition-colors flex flex-col items-center justify-center gap-2",
                        isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50",
                        preview ? "border-solid" : ""
                    )}
                >
                    <input {...getInputProps()} />

                    {isUploading ? (
                        <div className="flex flex-col items-center gap-2">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            <p className="text-sm text-muted-foreground">Uploading...</p>
                        </div>
                    ) : preview ? (
                        <div className="relative w-full flex items-center justify-center">
                            {/* If it's an image, show preview. If PDF, show icon. */}
                            {preview.match(/\.(jpeg|jpg|png|webp|gif)$/i) || preview.startsWith('blob:') ? (
                                <img
                                    src={preview}
                                    alt="Preview"
                                    className="max-h-64 rounded-md object-contain"
                                />
                            ) : (
                                <div className="flex flex-col items-center gap-2 p-4 bg-muted rounded-md">
                                    <FileIcon className="h-10 w-10 text-primary" />
                                    <span className="text-xs text-muted-foreground max-w-[200px] truncate">{preview.split('/').pop()}</span>
                                </div>
                            )}

                            <button
                                onClick={clearFile}
                                className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 hover:bg-destructive/90 shadow-sm"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    ) : (
                        <>
                            <div className="p-3 bg-background rounded-full shadow-sm border">
                                <Upload className="h-5 w-5 text-muted-foreground" />
                            </div>
                            <div className="text-center">
                                <p className="text-sm font-medium">Click to upload or drag and drop</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                    SVG, PNG, JPG or PDF (max {Math.round(maxSize / 1024 / 1024)}MB)
                                </p>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Crop Dialog */}
            <Dialog open={cropOpen} onOpenChange={(open) => {
                if (!open && !isUploading) {
                    setCropOpen(false);
                    setImgSrc(null);
                    setCurrentFile(null);
                }
            }}>
                <DialogContent className="max-w-xl">
                    <DialogHeader>
                        <DialogTitle>Crop Image</DialogTitle>
                    </DialogHeader>
                    <div className="relative w-full h-80 bg-black/5 rounded-md mt-4 overflow-hidden">
                        {imgSrc && (
                            <Cropper
                                image={imgSrc}
                                crop={crop}
                                zoom={zoom}
                                aspect={1} // Enforce 1:1 aspect ratio
                                onCropChange={setCrop}
                                onCropComplete={onCropComplete}
                                onZoomChange={setZoom}
                            />
                        )}
                    </div>
                    <div className="py-4 space-y-2">
                        <Label>Zoom</Label>
                        <Slider
                            value={[zoom]}
                            min={1}
                            max={3}
                            step={0.1}
                            onValueChange={(val) => setZoom(val[0])}
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setCropOpen(false)}>Cancel</Button>
                        <Button onClick={handleCropSave} disabled={isUploading}>
                            {isUploading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Apply & Upload
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
