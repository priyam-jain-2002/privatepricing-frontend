"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Upload, FileText, Eye, ListChecks, Download } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { uploadOrderDocument } from "@/lib/api";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

interface Document {
    id?: string;
    url: string;
    name: string;
    type?: "challan" | "grn";
    status?: "active" | "superseded" | "cancelled";
    createdAt?: Date;
}

interface DocumentUploadProps {
    storeId: string;
    orderId: string;
    invoices: Document[];
    receivings: Document[];
    onUploadSuccess: (type: string) => void;
    canUpload: boolean;
    requiredDocumentType?: string;
    userRole?: number;
}

export function DocumentUpload({
    storeId,
    orderId,
    invoices = [],
    receivings = [],
    onUploadSuccess,
    canUpload,
    requiredDocumentType,
    userRole,
}: DocumentUploadProps) {
    const { toast } = useToast();
    const [uploading, setUploading] = useState<string | null>(null);
    const [showOlderDocuments, setShowOlderDocuments] = useState(false);

    const [showOlderInvoices, setShowOlderInvoices] = useState(false);

    // Roles: Store Owner = 0, Store Manager = 4
    const canViewHistory = userRole === 0 || userRole === 4;

    const activeReceivings = receivings.filter(d => !d.status || d.status === 'active');
    const olderReceivings = receivings.filter(d => d.status === 'superseded' || d.status === 'cancelled');

    const activeInvoices = invoices.filter(d => !d.status || d.status === 'active');
    const olderInvoices = invoices.filter(d => d.status === 'superseded' || d.status === 'cancelled');

    const handleUpload = async (type: "invoice" | "challan" | "grn", file: File) => {
        if (!file) return;
        setUploading(type);

        try {
            await uploadOrderDocument(storeId, orderId, file, type);

            toast({
                title: "Upload Successful",
                description: `${type.toUpperCase()} uploaded successfully.`,
            });
            onUploadSuccess(type);
        } catch (error) {
            console.error(error);
            toast({
                title: "Upload Failed",
                description: "Failed to upload document. Please try again.",
                variant: "destructive",
            });
        } finally {
            setUploading(null);
        }
    };

    return (
        <div className="grid gap-6 md:grid-cols-2">
            {/* Invoices Section */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Invoices
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {activeInvoices.length > 0 ? (
                        <div className="space-y-2">
                            {activeInvoices.map((doc, idx) => (
                                <div key={idx} className="flex items-center justify-between p-2 border rounded-md bg-muted/50 gap-2">
                                    <div className="flex items-center gap-2 min-w-0 flex-1">
                                        <span className="text-sm truncate" title={doc.name}>{doc.name}</span>
                                    </div>
                                    <div className="flex items-center flex-shrink-0 gap-1">
                                        <Button variant="ghost" size="sm" asChild className="mr-1 h-8">
                                            <Link href={doc.url} target="_blank">
                                                <Eye className="h-4 w-4 mr-1" /> View
                                            </Link>
                                        </Button>
                                        <Button variant="ghost" size="sm" asChild className="mr-1 h-8">
                                            <Link href={doc.url} target="_blank" download>
                                                <Download className="h-4 w-4 mr-1" /> Download
                                            </Link>
                                        </Button>
                                    </div>
                                </div>
                            ))}
                            {canUpload && (
                                <p className="text-[10px] text-muted-foreground italic px-2 mt-2">
                                    * To update or change a document, please upload a new version.
                                </p>
                            )}
                        </div>
                    ) : (
                        <div className="text-sm text-muted-foreground p-4 bg-muted/20 border-dashed border rounded-md text-center">
                            No Active Invoices Uploaded
                        </div>
                    )}

                    {canViewHistory && olderInvoices.length > 0 && (
                        <div className="pt-2">
                            <button
                                onClick={() => setShowOlderInvoices(!showOlderInvoices)}
                                className="text-xs text-primary underline hover:text-primary/80 mb-2 flex items-center gap-1"
                            >
                                <ListChecks className="w-3 h-3" />
                                {showOlderInvoices ? "Hide Audit Trail" : "View Audit Trail (Edited Documents)"}
                            </button>

                            {showOlderInvoices && (
                                <div className="space-y-2 border-t pt-2">
                                    {olderInvoices.map((doc, idx) => (
                                        <div key={`old-inv-${idx}`} className="flex items-center justify-between p-2 border rounded-md bg-gray-50 opacity-75">
                                            <div className="flex flex-col gap-0.5 max-w-[150px]">
                                                <div className="flex items-center gap-2">
                                                    <Badge variant="secondary" className="uppercase text-[9px] px-1 bg-amber-100 text-amber-800 border-amber-200">
                                                        Superseded Invoice
                                                    </Badge>
                                                </div>
                                                <span className="text-sm text-gray-500 truncate mt-1" title={doc.name}>{doc.name}</span>
                                                {doc.createdAt && (
                                                    <span className="text-[10px] text-gray-400">
                                                        {new Date(doc.createdAt).toLocaleDateString()} {new Date(doc.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                )}
                                            </div>
                                            <Button variant="ghost" size="sm" asChild className="h-6 text-xs">
                                                <Link href={doc.url} target="_blank">
                                                    <Eye className="h-3 w-3 mr-1" /> View
                                                </Link>
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {canUpload && (
                        <div className="mt-4">
                            <Label htmlFor="invoice-upload" className="cursor-pointer">
                                <div className="border-2 border-dashed border-primary/20 hover:border-primary/50 rounded-md p-4 flex flex-col items-center justify-center transition-colors">
                                    {uploading === "invoice" ? (
                                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                                    ) : (
                                        <>
                                            <Upload className="h-6 w-6 text-primary mb-2" />
                                            <span className="text-sm font-medium">Upload Invoice</span>
                                            <span className="text-xs text-muted-foreground mt-1">PDF or Image</span>
                                        </>
                                    )}
                                </div>
                                <Input
                                    id="invoice-upload"
                                    type="file"
                                    accept="application/pdf,image/*"
                                    className="hidden"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) handleUpload("invoice", file);
                                    }}
                                    disabled={uploading !== null}
                                />
                            </Label>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Receivings Section */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Receiving Documents
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {activeReceivings.length > 0 ? (
                        <div className="space-y-2">
                            {activeReceivings.map((doc, idx) => (
                                <div key={idx} className="flex items-center justify-between p-2 border rounded-md bg-muted/50 gap-2">
                                    <div className="flex items-center gap-2 min-w-0 flex-1">
                                        <Badge variant="outline" className="uppercase text-[10px] flex-shrink-0">{doc.type}</Badge>
                                        <span className="text-sm truncate" title={doc.name}>{doc.name}</span>
                                    </div>
                                    <div className="flex items-center flex-shrink-0 gap-1">
                                        <Button variant="ghost" size="sm" asChild className="mr-1 h-8">
                                            <Link href={doc.url} target="_blank">
                                                <Eye className="h-4 w-4 mr-1" /> View
                                            </Link>
                                        </Button>
                                        <Button variant="ghost" size="sm" asChild className="mr-1 h-8">
                                            <Link href={doc.url} target="_blank" download>
                                                <Download className="h-4 w-4 mr-1" /> Download
                                            </Link>
                                        </Button>
                                    </div>
                                </div>
                            ))}
                            {canUpload && (
                                <p className="text-[10px] text-muted-foreground italic px-2 mt-2">
                                    * To update or change a document, please upload a new version.
                                </p>
                            )}
                        </div>
                    ) : (
                        <div className="text-sm text-muted-foreground p-4 bg-muted/20 border-dashed border rounded-md text-center">
                            No Active Receivings Uploaded
                        </div>
                    )}

                    {canViewHistory && olderReceivings.length > 0 && (
                        <div className="pt-2">
                            <button
                                onClick={() => setShowOlderDocuments(!showOlderDocuments)}
                                className="text-xs text-primary underline hover:text-primary/80 mb-2 flex items-center gap-1"
                            >
                                <ListChecks className="w-3 h-3" />
                                {showOlderDocuments ? "Hide Audit Trail" : "View Audit Trail (Edited Documents)"}
                            </button>

                            {showOlderDocuments && (
                                <div className="space-y-2 border-t pt-2">
                                    {olderReceivings.map((doc, idx) => (
                                        <div key={`old-${idx}`} className="flex items-center justify-between p-2 border rounded-md bg-gray-50 opacity-75">
                                            <div className="flex flex-col gap-0.5 max-w-[150px]">
                                                <div className="flex items-center gap-2">
                                                    <Badge variant="secondary" className="uppercase text-[9px] px-1 bg-amber-100 text-amber-800 border-amber-200">
                                                        Superseded {doc.type}
                                                    </Badge>
                                                </div>
                                                <span className="text-sm text-gray-500 truncate mt-1" title={doc.name}>{doc.name}</span>
                                                {doc.createdAt && (
                                                    <span className="text-[10px] text-gray-400">
                                                        {new Date(doc.createdAt).toLocaleDateString()} {new Date(doc.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                )}
                                            </div>
                                            <Button variant="ghost" size="sm" asChild className="h-6 text-xs">
                                                <Link href={doc.url} target="_blank">
                                                    <Eye className="h-3 w-3 mr-1" /> View
                                                </Link>
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {canUpload && (
                        <div className="grid grid-cols-2 gap-4 mt-4">
                            {/* Upload Challan */}
                            <Label htmlFor="challan-upload" className="cursor-pointer">
                                <div className={`border-2 border-dashed rounded-md p-4 flex flex-col items-center justify-center transition-colors h-full
                                    ${requiredDocumentType === 'challan'
                                        ? 'border-red-500 bg-red-50 hover:bg-red-100'
                                        : 'border-primary/20 hover:border-primary/50'}`}>
                                    {uploading === "challan" ? (
                                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                                    ) : (
                                        <>
                                            <Upload className={`h-6 w-6 mb-2 ${requiredDocumentType === 'challan' ? 'text-red-500' : 'text-primary'}`} />
                                            <span className={`text-sm font-medium text-center ${requiredDocumentType === 'challan' ? 'text-red-700' : ''}`}>
                                                {requiredDocumentType === 'challan' ? 'Upload Challan (Required)' : 'Upload Challan'}
                                            </span>
                                        </>
                                    )}
                                </div>
                                <Input
                                    id="challan-upload"
                                    type="file"
                                    accept="application/pdf,image/*"
                                    className="hidden"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) handleUpload("challan", file);
                                    }}
                                    disabled={uploading !== null}
                                />
                            </Label>

                            {/* Upload GRN */}
                            <Label htmlFor="grn-upload" className="cursor-pointer">
                                <div className={`border-2 border-dashed rounded-md p-4 flex flex-col items-center justify-center transition-colors h-full
                                    ${requiredDocumentType === 'grn'
                                        ? 'border-red-500 bg-red-50 hover:bg-red-100'
                                        : 'border-primary/20 hover:border-primary/50'}`}>
                                    {uploading === "grn" ? (
                                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                                    ) : (
                                        <>
                                            <Upload className={`h-6 w-6 mb-2 ${requiredDocumentType === 'grn' ? 'text-red-500' : 'text-primary'}`} />
                                            <span className={`text-sm font-medium text-center ${requiredDocumentType === 'grn' ? 'text-red-700' : ''}`}>
                                                {requiredDocumentType === 'grn' ? 'Upload GRN (Required)' : 'Upload GRN'}
                                            </span>
                                        </>
                                    )}
                                </div>
                                <Input
                                    id="grn-upload"
                                    type="file"
                                    accept="application/pdf,image/*"
                                    className="hidden"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) handleUpload("grn", file);
                                    }}
                                    disabled={uploading !== null}
                                />
                            </Label>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
