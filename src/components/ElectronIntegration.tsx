import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';
import { exportAllData, importData } from '@/utils/exportImportUtils';
import { useAuth } from '@/contexts/AuthContext';

// Define the window interface with electron API
declare global {
  interface Window {
    electron?: {
      showSaveDialog: (options: any) => Promise<any>;
      showOpenDialog: (options: any) => Promise<any>;
      saveFile: (filePath: string, data: string) => Promise<any>;
      readFile: (filePath: string) => Promise<any>;
      onMenuExportData: (callback: () => void) => void;
      onMenuImportData: (callback: () => void) => void;
      onMenuNewInvoice: (callback: () => void) => void;
      onMenuViewInvoices: (callback: () => void) => void;
      onUpdateAvailable: (callback: () => void) => void;
      onUpdateDownloaded: (callback: () => void) => void;
      installUpdate: () => void;
      removeAllListeners: (channel: string) => void;
    };
  }
}

/**
 * Component to handle Electron integration
 * This component doesn't render anything but sets up event listeners
 * for Electron menu actions and updates
 */
const ElectronIntegration: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Check if running in Electron
  const isElectron = !!window.electron;
  
  useEffect(() => {
    if (!isElectron) return;
    
    // Handle menu actions
    window.electron?.onMenuExportData(() => {
      handleExportData();
    });
    
    window.electron?.onMenuImportData(() => {
      handleImportData();
    });
    
    window.electron?.onMenuNewInvoice(() => {
      navigate('/create-invoice');
    });
    
    window.electron?.onMenuViewInvoices(() => {
      navigate('/invoices');
    });
    
    // Handle updates
    window.electron?.onUpdateAvailable(() => {
      toast({
        title: "Update Available",
        description: "A new version is downloading in the background.",
      });
    });
    
    window.electron?.onUpdateDownloaded(() => {
      toast({
        title: "Update Ready",
        description: "A new version has been downloaded. Restart the application to apply the updates.",
        action: (
          <button 
            onClick={() => window.electron?.installUpdate()}
            className="bg-primary text-white px-3 py-1 rounded-md text-sm"
          >
            Restart Now
          </button>
        ),
        duration: 0, // Don't auto-dismiss
      });
    });
    
    // Cleanup function
    return () => {
      if (isElectron) {
        window.electron?.removeAllListeners('menu-export-data');
        window.electron?.removeAllListeners('menu-import-data');
        window.electron?.removeAllListeners('menu-new-invoice');
        window.electron?.removeAllListeners('menu-view-invoices');
        window.electron?.removeAllListeners('update-available');
        window.electron?.removeAllListeners('update-downloaded');
      }
    };
  }, [navigate]);
  
  // Handle exporting data through Electron
  const handleExportData = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to export data.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      // Get export data
      const exportData = await exportAllData(user.id, {
        includeInvoices: true,
        includeEstimates: true,
        includeClients: true,
        includeRecurringInvoices: true,
        includeProfile: true,
      });
      
      // Show save dialog
      const { canceled, filePath } = await window.electron?.showSaveDialog({
        title: 'Export Data',
        defaultPath: `invoicing-genius-export-${new Date().toISOString().split('T')[0]}.json`,
        filters: [
          { name: 'JSON Files', extensions: ['json'] }
        ]
      });
      
      if (canceled || !filePath) return;
      
      // Save file
      const result = await window.electron?.saveFile(filePath, JSON.stringify(exportData, null, 2));
      
      if (result.success) {
        toast({
          title: "Export Successful",
          description: "Your data has been exported successfully.",
        });
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      toast({
        title: "Export Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };
  
  // Handle importing data through Electron
  const handleImportData = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to import data.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      // Show open dialog
      const { canceled, filePaths } = await window.electron?.showOpenDialog({
        title: 'Import Data',
        filters: [
          { name: 'JSON Files', extensions: ['json'] }
        ],
        properties: ['openFile']
      });
      
      if (canceled || !filePaths || filePaths.length === 0) return;
      
      // Read file
      const result = await window.electron?.readFile(filePaths[0]);
      
      if (!result.success) {
        throw new Error(result.error);
      }
      
      // Parse data
      const importedData = JSON.parse(result.data);
      
      // Import data
      await importData(importedData, user.id, {
        overwriteExisting: true,
        importInvoices: true,
        importEstimates: true,
        importClients: true,
        importRecurringInvoices: true,
        importProfile: true,
      });
      
      toast({
        title: "Import Successful",
        description: "Your data has been imported successfully.",
      });
      
      // Refresh the current page
      window.location.reload();
    } catch (error: any) {
      toast({
        title: "Import Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };
  
  // This component doesn't render anything
  return null;
};

export default ElectronIntegration;
