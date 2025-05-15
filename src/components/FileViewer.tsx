import React, { useState, useEffect } from 'react';
import { getFile } from '@/utils/localFileStorage';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Download, FileIcon, Eye, ExternalLink } from 'lucide-react';

interface FileViewerProps {
  fileId: string;
  fileName?: string;
  showPreview?: boolean;
  allowDownload?: boolean;
  className?: string;
}

const FileViewer: React.FC<FileViewerProps> = ({
  fileId,
  fileName,
  showPreview = true,
  allowDownload = true,
  className = ''
}) => {
  const [file, setFile] = useState<Blob | null>(null);
  const [metadata, setMetadata] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const loadFile = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await getFile(fileId);

        if (result.error || !result.file) {
          throw new Error(result.error || 'Failed to load file');
        }

        setFile(result.file);
        setMetadata(result.metadata);
        
        // Create object URL for preview
        if (showPreview) {
          const url = URL.createObjectURL(result.file);
          setObjectUrl(url);
        }
      } catch (error: any) {
        console.error('Error loading file:', error);
        setError(error.message || 'Failed to load file');
        toast({
          title: 'Error',
          description: error.message || 'Failed to load file',
          variant: 'destructive'
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (fileId) {
      loadFile();
    }

    // Cleanup object URL when component unmounts
    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [fileId, showPreview, toast]);

  const handleDownload = () => {
    if (!file || !metadata) return;

    const downloadUrl = objectUrl || URL.createObjectURL(file);
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = fileName || metadata.name || 'download';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    // If we created a new object URL for download, revoke it
    if (!objectUrl) {
      URL.revokeObjectURL(downloadUrl);
    }
  };

  const renderPreview = () => {
    if (!file || !objectUrl) return null;

    const fileType = metadata?.type || file.type;

    // Image preview
    if (fileType.startsWith('image/')) {
      return (
        <div className="relative w-full h-48 bg-muted rounded-md overflow-hidden">
          <img
            src={objectUrl}
            alt={fileName || metadata?.name || 'Preview'}
            className="w-full h-full object-contain"
          />
        </div>
      );
    }

    // PDF preview
    if (fileType === 'application/pdf') {
      return (
        <div className="relative w-full h-48 bg-muted rounded-md overflow-hidden">
          <iframe
            src={objectUrl}
            title={fileName || metadata?.name || 'PDF Preview'}
            className="w-full h-full"
          />
          <Button
            variant="outline"
            size="sm"
            className="absolute top-2 right-2"
            onClick={() => window.open(objectUrl, '_blank')}
          >
            <ExternalLink className="h-4 w-4 mr-1" />
            Open
          </Button>
        </div>
      );
    }

    // Default file icon for other types
    return (
      <div className="flex flex-col items-center justify-center w-full h-48 bg-muted rounded-md">
        <FileIcon className="h-16 w-16 text-primary mb-2" />
        <p className="text-sm font-medium">{fileName || metadata?.name || 'File'}</p>
        {metadata?.size && (
          <p className="text-xs text-muted-foreground">
            {formatFileSize(metadata.size)}
          </p>
        )}
      </div>
    );
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' bytes';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center h-48 bg-muted rounded-md ${className}`}>
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex flex-col items-center justify-center h-48 bg-muted rounded-md ${className}`}>
        <p className="text-destructive font-medium">Failed to load file</p>
        <p className="text-sm text-muted-foreground">{error}</p>
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {showPreview && renderPreview()}
      
      {allowDownload && file && (
        <Button
          variant="outline"
          size="sm"
          onClick={handleDownload}
          className="w-full"
        >
          <Download className="h-4 w-4 mr-2" />
          Download
        </Button>
      )}
    </div>
  );
};

export default FileViewer;
