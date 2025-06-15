import React, { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Upload, FileText, X, AlertCircle, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export interface FileUploadSectionProps {
  file: File | null;
  onFileChange: (uploadedFile: File | null) => void;
  isLoading: boolean;
}

type DisplayedFileStatus = {
  name: string;
  type: string;
  size: number;
};

const FileUploadSection: React.FC<FileUploadSectionProps> = ({ file, onFileChange, isLoading }) => {
  const { toast } = useToast();
  const [isDragging, setIsDragging] = useState(false);

  const isValidFileType = (file: File) => {
    const acceptedTypes = ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "text/plain"];
    return acceptedTypes.includes(file.type);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
       const selectedFile = e.target.files[0];
       if (isValidFileType(selectedFile)) {
           onFileChange(selectedFile);
            toast({
                title: "File selected",
                description: `${selectedFile.name} is ready to upload.`,
            });
       } else {
           toast({
                title: "Invalid file type",
                description: `${selectedFile.name} is not a supported file type. Please upload PDF, DOCX or TXT files.`,
                variant: "destructive",
           });
            onFileChange(null);
       }
    } else {
       onFileChange(null);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
       const droppedFile = e.dataTransfer.files[0];
       if (isValidFileType(droppedFile)) {
           onFileChange(droppedFile);
            toast({
                title: "File selected",
                description: `${droppedFile.name} is ready to upload.`,
            });
       } else {
            toast({
                title: "Invalid file type",
                description: `${droppedFile.name} is not a supported file type. Please upload PDF, DOCX or TXT files.`,
                variant: "destructive",
            });
             onFileChange(null);
       }
    } else {
       onFileChange(null);
    }
  };

  const removeFile = () => {
    onFileChange(null);
     toast({
        title: "File removed",
        description: `${file?.name} has been removed.`,
     });
  };

  const getFileIcon = (fileType?: string) => {
    if (fileType === "application/pdf") {
      return <FileText className="text-red-500" />;
    } else if (fileType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
      return <FileText className="text-blue-500" />;
    } else if (fileType === "text/plain") {
      return <FileText className="text-gray-500" />;
    }
    return <FileText className="text-gray-400" />;
  };

  const getStatusIcon = (hasFile: boolean) => {
    if (hasFile) {
        return null;
    }
    return null;
  };

  const formatFileSize = (bytes?: number) => {
    if (bytes === undefined || bytes === null) return "N/A";
    if (bytes < 1024) return bytes + " bytes";
    else if (bytes < 1048567) return (bytes / 1024).toFixed(1) + " KB";
    else return (bytes / 1048576).toFixed(1) + " MB";
  };

  return (
    <div className="space-y-4">
      <div
        className={cn(
          "flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-12 text-center transition-colors",
          file ? "pb-6" : "pb-12",
          isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/20"
        )}
         onDragOver={handleDragOver}
         onDragLeave={handleDragLeave}
         onDrop={handleDrop}
      >
        <div className="mb-4">
          {file ? getFileIcon(file.type) : <Upload className="h-12 w-12 mx-auto text-gray-400" />}
        </div>
        <div className="flex text-sm text-gray-600">
          <label
            htmlFor="file-upload-input"
            className="relative cursor-pointer rounded-md font-medium text-primary hover:text-primary/90 focus-within:outline-none"
          >
            <span>{file ? "Replace file" : "Upload product files"}</span>
            <input
              id="file-upload-input"
              name="file-upload"
              type="file"
              className="sr-only"
              onChange={handleFileInputChange}
              accept=".pdf,.docx,.txt"
              disabled={isLoading}
            />
          </label>
          {!file && <p className="pl-1">or drag and drop</p>}
        </div>
        <p className="text-xs text-gray-500 mt-2">PDF, DOCX, TXT up to 10MB</p>
        {file && (
          <div className="flex items-center justify-between w-full max-w-xs mx-auto mt-4 p-2 border rounded-md bg-muted/50">
              <div className="flex items-center space-x-2">
                   {getFileIcon(file.type)}
                   <div className="flex flex-col text-left">
                       <span className="text-sm font-medium">{file.name}</span>
                       <span className="text-xs text-gray-500">{formatFileSize(file.size)}</span>
                   </div>
              </div>
               <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={removeFile}
                          disabled={isLoading}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Remove file</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
          </div>
        )}
      </div>
    </div>
  );
};

export default FileUploadSection;
