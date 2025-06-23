import { SheetHeader, SheetTitle, SheetContent } from "@/components/ui/sheet";
import { FileText, Download, Image as ImageIcon } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ProductDetailsProps {
  data: {
    name: string;
    description: string;
    categoryId: string;
    categoryName: string;
    createdAt: string;
    fileUrl?: string;
    fileName?: string;
  };
}

const ProductDetails = ({
  data
}: ProductDetailsProps) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getFileExtension = (filename?: string) => {
    if (!filename) return "";
    return filename.split(".").pop()?.toLowerCase() || "";
  };

  // Enhanced file preview with icons, image preview, and better layout
  const renderFilePreview = (url?: string, filename?: string) => {
    const ext = getFileExtension(filename);
    if (!url) return null;

    // Image preview
    if (["png", "jpg", "jpeg", "gif", "webp"].includes(ext)) {
      return (
        <div className="flex items-center gap-4">
          <img
            src={url}
            alt={filename}
            className="w-24 h-24 object-cover rounded border"
          />
          <div>
            <p className="font-medium break-all">{filename}</p>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-blue-600 underline text-sm mt-1"
            >
              <ImageIcon className="w-4 h-4" />
              View Image
            </a>
          </div>
        </div>
      );
    }

    // PDF preview
    if (["pdf"].includes(ext)) {
      return (
        <div className="flex items-center gap-4 rounded p-4 border border-gray-300">
          <div className="flex flex-col items-center justify-center w-16 h-16 rounded bg-red-50 border border-red-200">
            <FileText className="w-8 h-8 text-red-600" />
            <span className="text-xs text-red-600 mt-1 font-bold">{ext.toUpperCase()}</span>
          </div>
          <div>
            <p className="font-medium break-all text-red-700">{filename}</p>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-gray-600 underline text-sm mt-1 hover:text-gray-800"
            >
              <Download className="w-4 h-4" />
              View / Download PDF
            </a>
          </div>
        </div>
      );
    }

    // Word doc preview
    if (["doc", "docx"].includes(ext)) {
      return (
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-center justify-center w-16 h-16 rounded bg-blue-50 border border-blue-200">
            <FileText className="w-8 h-8 text-blue-600" />
            <span className="text-xs text-blue-600 mt-1">{ext.toUpperCase()}</span>
          </div>
          <div>
            <p className="font-medium break-all text-blue-700">{filename}</p>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-blue-600 underline text-sm mt-1 hover:text-gray-800"
            >
              <Download className="w-4 h-4" />
              View / Download DOC
            </a>
          </div>
        </div>
      );
    }

    // Default file preview
    return (
      <div className="flex items-center gap-4">
        <div className="flex items-center justify-center w-16 h-16 rounded bg-gray-50 border border-gray-200">
          <FileText className="w-8 h-8 text-gray-600" />
        </div>
        <div>
          <p className="font-medium break-all">{filename}</p>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-gray-600 underline text-sm mt-1"
          >
            <Download className="w-4 h-4" />
            View / Download File
          </a>
        </div>
      </div>
    );
  };

  return (
    <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
      <SheetHeader className="pb-4">
        <SheetTitle>Product Details</SheetTitle>
      </SheetHeader>
      <div className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-muted-foreground text-sm">Name</Label>
              <p className="text-base font-medium">{data.name}</p>
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground text-sm">Category</Label>
              <p className="text-base font-medium">{data.categoryName}</p>
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground text-sm">Description</Label>
              <p className="text-base font-medium">{data.description || "-"}</p>
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground text-sm">Created At</Label>
              <p className="text-base font-medium">{formatDate(data.createdAt)}</p>
            </div>
          </CardContent>
        </Card>
        {/* File Information */}
        {data.fileUrl && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Attached File</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {renderFilePreview(data.fileUrl, data.fileName)}
            </CardContent>
          </Card>
        )}
      </div>
    </SheetContent>
  );
};

export default ProductDetails;
