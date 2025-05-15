import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { saveFile, deleteFile } from '@/utils/localFileStorage';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Upload, X, FileIcon, File } from 'lucide-react';

interface FileUploaderProps {
  onFileUploaded?: (fileId: string, metadata: any) => void;
  onFileDeleted?: (fileId: string) => void;
  accept?: string;
  maxSize?: number; // in bytes
  directory?: string;
  label?: string;
  description?: string;
}

const FileUploader: React.FC<FileUploaderProps> = ({
  onFileUploaded,
  onFileDeleted,
  accept = '*',
  maxSize = 5 * 1024 * 1024, // 5MB default
  directory = 'uploads',
  label = 'Upload File',
  description = 'Upload a file (max 5MB)'
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<{ id: string; name: string; size: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file size
    if (file.size > maxSize) {
      toast({
        title: 'File too large',
        description: `The file exceeds the maximum size of ${Math.round(maxSize / 1024 / 1024)}MB.`,
        variant: 'destructive'
      });
      return;
    }

    setIsUploading(true);

    try {
      // Save file using our local storage utility
      const result = await saveFile(file, directory);

      if (result.error || !result.metadata) {
        throw new Error(result.error || 'Failed to upload file');
      }

      // Set the uploaded file state
      setUploadedFile({
        id: result.metadata.id,
        name: result.metadata.name,
        size: result.metadata.size
      });

      // Call the callback if provided
      if (onFileUploaded) {
        onFileUploaded(result.metadata.id, result.metadata);
      }

      toast({
        title: 'File uploaded',
        description: 'Your file has been uploaded successfully.',
      });
    } catch (error: any) {
      console.error('Error uploading file:', error);
      toast({
        title: 'Upload failed',
        description: error.message || 'Failed to upload file. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!uploadedFile) return;

    try {
      const result = await deleteFile(uploadedFile.id);

      if (!result.success) {
        throw new Error(result.error || 'Failed to delete file');
      }

      // Reset the uploaded file state
      setUploadedFile(null);

      // Call the callback if provided
      if (onFileDeleted) {
        onFileDeleted(uploadedFile.id);
      }

      toast({
        title: 'File deleted',
        description: 'Your file has been deleted successfully.',
      });
    } catch (error: any) {
      console.error('Error deleting file:', error);
      toast({
        title: 'Delete failed',
        description: error.message || 'Failed to delete file. Please try again.',
        variant: 'destructive'
      });
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' bytes';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="file-upload">{label}</Label>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>

      {!uploadedFile ? (
        <div className="flex items-center gap-4">
          <Input
            id="file-upload"
            type="file"
            accept={accept}
            onChange={handleFileChange}
            disabled={isUploading}
            ref={fileInputRef}
            className="hidden"
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="w-full"
          >
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Choose File
              </>
            )}
          </Button>
        </div>
      ) : (
        <div className="flex items-center justify-between p-3 border rounded-md bg-muted/50">
          <div className="flex items-center gap-3">
            <FileIcon className="h-8 w-8 text-primary" />
            <div>
              <p className="font-medium text-sm">{uploadedFile.name}</p>
              <p className="text-xs text-muted-foreground">{formatFileSize(uploadedFile.size)}</p>
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleDelete}
            className="h-8 w-8 text-destructive"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default FileUploader;
