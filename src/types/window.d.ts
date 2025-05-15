interface Window {
  electron?: {
    showSaveDialog: (options: any) => Promise<any>;
    showOpenDialog: (options: any) => Promise<any>;
    saveFile: (filePath: string, data: string) => Promise<any>;
    readFile: (filePath: string) => Promise<any>;
    onMenuExportData: (callback: any) => void;
    onMenuImportData: (callback: any) => void;
    onMenuNewInvoice: (callback: any) => void;
    onMenuViewInvoices: (callback: any) => void;
    onUpdateAvailable: (callback: any) => void;
    onUpdateDownloaded: (callback: any) => void;
    installUpdate: () => void;
    removeAllListeners: (channel: string) => void;
  };
  firebaseAuth?: {
    signUp: (email: string, password: string) => Promise<any>;
    signIn: (email: string, password: string) => Promise<any>;
    signOut: () => Promise<any>;
    getCurrentUser: () => any;
    onAuthStateChanged: (callback: any) => any;
  };
  firebaseFirestore?: {
    addDocument: (collection: string, data: any) => Promise<any>;
    setDocument: (collection: string, id: string, data: any) => Promise<any>;
    getDocument: (collection: string, id: string) => Promise<any>;
    getDocuments: (collection: string, constraints?: any[]) => Promise<any>;
    updateDocument: (collection: string, id: string, data: any) => Promise<any>;
    deleteDocument: (collection: string, id: string) => Promise<any>;
  };
}
