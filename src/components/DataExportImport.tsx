import React, { useState, useRef } from "react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { 
  Download, 
  Upload, 
  FileJson, 
  AlertTriangle, 
  Loader2 
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { exportAllData, importData } from "@/utils/exportImportUtils";
import { useAuth } from "@/contexts/AuthContext";

const DataExportImport: React.FC = () => {
  const { user } = useAuth();
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  // Export options
  const [exportOptions, setExportOptions] = useState({
    includeInvoices: true,
    includeEstimates: true,
    includeClients: true,
    includeRecurringInvoices: true,
    includeProfile: true,
  });
  
  // Import options
  const [importOptions, setImportOptions] = useState({
    importInvoices: true,
    importEstimates: true,
    importClients: true,
    importRecurringInvoices: true,
    importProfile: true,
    overwriteExisting: false,
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Handle export
  const handleExport = async () => {
    if (!user) {
      toast({
        title: "Not authenticated",
        description: "You must be logged in to export data",
        variant: "destructive",
      });
      return;
    }
    
    setIsExporting(true);
    
    try {
      const success = await exportAllData(
        user.id,
        exportOptions.includeInvoices,
        exportOptions.includeEstimates,
        exportOptions.includeClients,
        exportOptions.includeRecurringInvoices,
        exportOptions.includeProfile
      );
      
      if (success) {
        toast({
          title: "Export successful",
          description: "Your data has been exported successfully",
        });
        setIsExportDialogOpen(false);
      }
    } catch (error: any) {
      toast({
        title: "Export failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };
  
  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };
  
  // Handle import
  const handleImport = async () => {
    if (!user) {
      toast({
        title: "Not authenticated",
        description: "You must be logged in to import data",
        variant: "destructive",
      });
      return;
    }
    
    if (!selectedFile) {
      toast({
        title: "No file selected",
        description: "Please select a file to import",
        variant: "destructive",
      });
      return;
    }
    
    setIsImporting(true);
    
    try {
      const success = await importData(
        selectedFile,
        user.id,
        importOptions
      );
      
      if (success) {
        toast({
          title: "Import successful",
          description: "Your data has been imported successfully",
        });
        setIsImportDialogOpen(false);
        setSelectedFile(null);
        
        // Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    } catch (error: any) {
      toast({
        title: "Import failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Data Export & Import</CardTitle>
        <CardDescription>
          Export your data for backup or import data from a previous export
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <FileJson className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-medium">Export Data</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Export your invoices, estimates, clients, and settings to a JSON file for backup or transfer.
            </p>
            <Dialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Download className="mr-2 h-4 w-4" />
                  Export Data
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Export Data</DialogTitle>
                  <DialogDescription>
                    Select what data you want to export
                  </DialogDescription>
                </DialogHeader>
                
                <div className="grid gap-4 py-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="includeInvoices"
                      checked={exportOptions.includeInvoices}
                      onCheckedChange={(checked) => 
                        setExportOptions(prev => ({ ...prev, includeInvoices: !!checked }))
                      }
                    />
                    <Label htmlFor="includeInvoices">Include Invoices</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="includeEstimates"
                      checked={exportOptions.includeEstimates}
                      onCheckedChange={(checked) => 
                        setExportOptions(prev => ({ ...prev, includeEstimates: !!checked }))
                      }
                    />
                    <Label htmlFor="includeEstimates">Include Estimates</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="includeClients"
                      checked={exportOptions.includeClients}
                      onCheckedChange={(checked) => 
                        setExportOptions(prev => ({ ...prev, includeClients: !!checked }))
                      }
                    />
                    <Label htmlFor="includeClients">Include Clients</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="includeRecurringInvoices"
                      checked={exportOptions.includeRecurringInvoices}
                      onCheckedChange={(checked) => 
                        setExportOptions(prev => ({ ...prev, includeRecurringInvoices: !!checked }))
                      }
                    />
                    <Label htmlFor="includeRecurringInvoices">Include Recurring Invoices</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="includeProfile"
                      checked={exportOptions.includeProfile}
                      onCheckedChange={(checked) => 
                        setExportOptions(prev => ({ ...prev, includeProfile: !!checked }))
                      }
                    />
                    <Label htmlFor="includeProfile">Include Profile Settings</Label>
                  </div>
                </div>
                
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsExportDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleExport} disabled={isExporting}>
                    {isExporting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Exporting...
                      </>
                    ) : (
                      <>
                        <Download className="mr-2 h-4 w-4" />
                        Export
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-medium">Import Data</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Import data from a previously exported JSON file.
            </p>
            <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Upload className="mr-2 h-4 w-4" />
                  Import Data
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Import Data</DialogTitle>
                  <DialogDescription>
                    Select a file and import options
                  </DialogDescription>
                </DialogHeader>
                
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="file">Select File</Label>
                    <input
                      ref={fileInputRef}
                      type="file"
                      id="file"
                      accept=".json"
                      onChange={handleFileChange}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-primary/90"
                    />
                    {selectedFile && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Selected: {selectedFile.name}
                      </p>
                    )}
                  </div>
                  
                  <div className="pt-4">
                    <h4 className="text-sm font-medium mb-2">Import Options</h4>
                    
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="importInvoices"
                          checked={importOptions.importInvoices}
                          onCheckedChange={(checked) => 
                            setImportOptions(prev => ({ ...prev, importInvoices: !!checked }))
                          }
                        />
                        <Label htmlFor="importInvoices">Import Invoices</Label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="importEstimates"
                          checked={importOptions.importEstimates}
                          onCheckedChange={(checked) => 
                            setImportOptions(prev => ({ ...prev, importEstimates: !!checked }))
                          }
                        />
                        <Label htmlFor="importEstimates">Import Estimates</Label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="importClients"
                          checked={importOptions.importClients}
                          onCheckedChange={(checked) => 
                            setImportOptions(prev => ({ ...prev, importClients: !!checked }))
                          }
                        />
                        <Label htmlFor="importClients">Import Clients</Label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="importRecurringInvoices"
                          checked={importOptions.importRecurringInvoices}
                          onCheckedChange={(checked) => 
                            setImportOptions(prev => ({ ...prev, importRecurringInvoices: !!checked }))
                          }
                        />
                        <Label htmlFor="importRecurringInvoices">Import Recurring Invoices</Label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="importProfile"
                          checked={importOptions.importProfile}
                          onCheckedChange={(checked) => 
                            setImportOptions(prev => ({ ...prev, importProfile: !!checked }))
                          }
                        />
                        <Label htmlFor="importProfile">Import Profile Settings</Label>
                      </div>
                    </div>
                  </div>
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <div className="flex items-center space-x-2 pt-2">
                        <Checkbox
                          id="overwriteExisting"
                          checked={importOptions.overwriteExisting}
                          onCheckedChange={(checked) => 
                            setImportOptions(prev => ({ ...prev, overwriteExisting: !!checked }))
                          }
                        />
                        <Label htmlFor="overwriteExisting" className="flex items-center">
                          Overwrite existing data
                          <AlertTriangle className="h-4 w-4 text-amber-500 ml-2" />
                        </Label>
                      </div>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Overwriting existing data will delete all your current data before importing. This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => setImportOptions(prev => ({ ...prev, overwriteExisting: true }))}
                        >
                          Yes, overwrite data
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
                
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsImportDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleImport} disabled={isImporting || !selectedFile}>
                    {isImporting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Importing...
                      </>
                    ) : (
                      <>
                        <Upload className="mr-2 h-4 w-4" />
                        Import
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DataExportImport;
