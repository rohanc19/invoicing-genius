
import React from "react";
import { InvoiceDetails } from "../types/invoice";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import ClientSelector from "./ClientSelector";

interface InvoiceHeaderProps {
  details: InvoiceDetails;
  setDetails: React.Dispatch<React.SetStateAction<InvoiceDetails>>;
}

const InvoiceHeader: React.FC<InvoiceHeaderProps> = ({ details, setDetails }) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setDetails(prev => ({ ...prev, [name]: value }));
  };

  const handleClientSelect = (clientDetails: { 
    client_name: string; 
    client_email: string; 
    client_address: string;
  }) => {
    setDetails(prev => ({
      ...prev,
      clientName: clientDetails.client_name,
      clientEmail: clientDetails.client_email,
      clientAddress: clientDetails.client_address,
    }));
  };

  return (
    <Card className="mb-6">
      <CardContent className="pt-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Hide the company information section since we're using CompanySelector */}
          <div className="space-y-4 hidden">
            <div>
              <Label htmlFor="yourCompany">Your Company</Label>
              <Input
                id="yourCompany"
                name="yourCompany"
                value={details.yourCompany}
                onChange={handleChange}
                placeholder="Your Company Name"
              />
            </div>
            <div>
              <Label htmlFor="yourEmail">Your Email</Label>
              <Input
                id="yourEmail"
                name="yourEmail"
                type="email"
                value={details.yourEmail}
                onChange={handleChange}
                placeholder="your@email.com"
              />
            </div>
            <div>
              <Label htmlFor="yourAddress">Your Address</Label>
              <Input
                id="yourAddress"
                name="yourAddress"
                value={details.yourAddress}
                onChange={handleChange}
                placeholder="Your Address"
              />
            </div>
          </div>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="invoiceNumber">Invoice #</Label>
                <Input
                  id="invoiceNumber"
                  name="invoiceNumber"
                  value={details.invoiceNumber}
                  onChange={handleChange}
                  placeholder="INV-001"
                />
              </div>
              <div>
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  name="date"
                  type="date"
                  value={details.date}
                  onChange={handleChange}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="dueDate">Due Date</Label>
              <Input
                id="dueDate"
                name="dueDate"
                type="date"
                value={details.dueDate}
                onChange={handleChange}
              />
            </div>
          </div>
          <div className="space-y-4">
            <ClientSelector 
              onClientSelect={handleClientSelect}
              currentClient={{
                client_name: details.clientName,
                client_email: details.clientEmail,
                client_address: details.clientAddress
              }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default InvoiceHeader;
