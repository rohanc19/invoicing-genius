
import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Users, UserPlus, ChevronDown } from "lucide-react";

interface ClientProfile {
  id: string;
  client_name: string;
  client_email: string;
  client_address: string;
}

interface ClientSelectorProps {
  onClientSelect: (clientDetails: { 
    client_name: string; 
    client_email: string; 
    client_address: string;
  }) => void;
  currentClient: {
    client_name: string;
    client_email: string;
    client_address: string;
  };
}

const ClientSelector: React.FC<ClientSelectorProps> = ({ 
  onClientSelect, 
  currentClient 
}) => {
  const { user } = useAuth();
  const [clients, setClients] = useState<ClientProfile[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [newClient, setNewClient] = useState({
    client_name: "",
    client_email: "",
    client_address: ""
  });

  useEffect(() => {
    const fetchClients = async () => {
      if (!user) return;
      
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from("clients")
          .select("*")
          .eq("user_id", user.id)
          .order("client_name");
          
        if (error) {
          throw error;
        }
        
        if (data) {
          setClients(data);
        }
      } catch (error: any) {
        console.error("Error fetching clients:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchClients();
  }, [user]);

  const handleClientChange = (clientId: string) => {
    const selectedClient = clients.find(c => c.id === clientId);
    if (selectedClient) {
      onClientSelect({
        client_name: selectedClient.client_name,
        client_email: selectedClient.client_email || "",
        client_address: selectedClient.client_address || "",
      });
      
      toast({
        title: "Client selected",
        description: `Using ${selectedClient.client_name} for this invoice.`,
      });
    }
  };

  const handleNewClientChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewClient(prev => ({ ...prev, [name]: value }));
  };

  const handleAddClient = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to add a client.",
        variant: "destructive",
      });
      return;
    }
    
    if (!newClient.client_name.trim()) {
      toast({
        title: "Client name required",
        description: "Please provide a name for the client.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const { data, error } = await supabase
        .from("clients")
        .insert({
          user_id: user.id,
          client_name: newClient.client_name,
          client_email: newClient.client_email,
          client_address: newClient.client_address
        })
        .select()
        .single();
        
      if (error) throw error;
      
      if (data) {
        // Add new client to the local state
        setClients(prev => [...prev, data]);
        
        // Select the newly created client
        onClientSelect({
          client_name: data.client_name,
          client_email: data.client_email || "",
          client_address: data.client_address || "",
        });
        
        // Reset the form
        setNewClient({
          client_name: "",
          client_email: "",
          client_address: ""
        });
        
        setShowAddForm(false);
        
        toast({
          title: "Client added",
          description: `${data.client_name} has been added to your clients.`,
        });
      }
    } catch (error: any) {
      toast({
        title: "Error adding client",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Client Information</span>
          
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <UserPlus className="h-4 w-4 mr-2" />
                Add Client
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Client</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="client_name">Client Name</Label>
                  <Input 
                    id="client_name" 
                    name="client_name" 
                    value={newClient.client_name}
                    onChange={handleNewClientChange}
                    placeholder="Client Name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="client_email">Client Email</Label>
                  <Input 
                    id="client_email" 
                    name="client_email" 
                    type="email"
                    value={newClient.client_email}
                    onChange={handleNewClientChange}
                    placeholder="client@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="client_address">Client Address</Label>
                  <Input 
                    id="client_address" 
                    name="client_address" 
                    value={newClient.client_address}
                    onChange={handleNewClientChange}
                    placeholder="Client Address"
                  />
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Cancel</Button>
                </DialogClose>
                <Button onClick={handleAddClient}>Save Client</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
        
        {clients.length > 0 ? (
          <Select onValueChange={handleClientChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select a client" />
            </SelectTrigger>
            <SelectContent>
              {clients.map((client) => (
                <SelectItem key={client.id} value={client.id}>
                  {client.client_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <div className="text-sm text-muted-foreground flex items-center gap-2 p-2 border rounded-md">
            <Users className="h-4 w-4" />
            {isLoading ? "Loading clients..." : "No clients yet. Add your first client."}
          </div>
        )}
      </div>
      
      {currentClient.client_name && (
        <div className="p-3 border rounded-md bg-muted/50">
          <div className="font-medium">{currentClient.client_name}</div>
          {currentClient.client_email && <div className="text-sm text-muted-foreground">{currentClient.client_email}</div>}
          {currentClient.client_address && <div className="text-sm text-muted-foreground">{currentClient.client_address}</div>}
        </div>
      )}
    </div>
  );
};

export default ClientSelector;
