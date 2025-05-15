import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import FileUploader from './FileUploader';
import FileViewer from './FileViewer';
import { Button } from './ui/button';
import { Separator } from './ui/separator';
import { Badge } from './ui/badge';
import { Info } from 'lucide-react';

const FileStorageDemo: React.FC = () => {
  const [uploadedFiles, setUploadedFiles] = useState<Array<{ id: string; name: string; size: number }>>([]);
  const [activeTab, setActiveTab] = useState('upload');
  const isElectron = typeof window !== 'undefined' && window.electron !== undefined;

  const handleFileUploaded = (fileId: string, metadata: any) => {
    setUploadedFiles(prev => [...prev, { id: fileId, name: metadata.name, size: metadata.size }]);
    // Switch to the view tab after upload
    setActiveTab('view');
  };

  const handleFileDeleted = (fileId: string) => {
    setUploadedFiles(prev => prev.filter(file => file.id !== fileId));
  };

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Local File Storage Demo</CardTitle>
            <CardDescription>
              Upload and view files using local storage
            </CardDescription>
          </div>
          <Badge variant={isElectron ? 'default' : 'outline'}>
            {isElectron ? 'Electron App' : 'Web Browser'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="bg-muted/50 rounded-md p-4 mb-6 flex items-start gap-3">
          <Info className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
          <div className="text-sm">
            <p className="font-medium">About this demo</p>
            <p className="text-muted-foreground mt-1">
              This demo shows how to use local file storage in both Electron and web environments.
              In Electron, files are stored on the filesystem. In web browsers, files are stored in IndexedDB.
              No files are uploaded to the cloud, keeping your data private and avoiding storage costs.
            </p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upload">Upload Files</TabsTrigger>
            <TabsTrigger value="view">
              View Files
              {uploadedFiles.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {uploadedFiles.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="upload" className="py-4">
            <FileUploader
              onFileUploaded={handleFileUploaded}
              directory="invoicing-genius/attachments"
              label="Upload Invoice Attachment"
              description="Upload a file to attach to your invoice (PDF, images, etc.)"
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx"
            />
          </TabsContent>
          
          <TabsContent value="view" className="py-4">
            {uploadedFiles.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No files uploaded yet</p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => setActiveTab('upload')}
                >
                  Upload a File
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                {uploadedFiles.map((file, index) => (
                  <div key={file.id}>
                    {index > 0 && <Separator className="my-6" />}
                    <div className="mb-2">
                      <h3 className="font-medium">{file.name}</h3>
                    </div>
                    <FileViewer
                      fileId={file.id}
                      fileName={file.name}
                      showPreview={true}
                      allowDownload={true}
                    />
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default FileStorageDemo;
