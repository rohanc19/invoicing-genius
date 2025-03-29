
import React from "react";
import { EstimateDetails } from "../types/estimate";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface EstimateHeaderProps {
  details: EstimateDetails;
  setDetails: React.Dispatch<React.SetStateAction<EstimateDetails>>;
}

const EstimateHeader: React.FC<EstimateHeaderProps> = ({ details, setDetails }) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setDetails((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Estimate Information</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <div className="space-y-4">
              <div>
                <Label htmlFor="estimateNumber">Estimate Number</Label>
                <Input
                  id="estimateNumber"
                  name="estimateNumber"
                  value={details.estimateNumber}
                  onChange={handleChange}
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
              <div>
                <Label htmlFor="dueDate">Expiry Date</Label>
                <Input
                  id="dueDate"
                  name="dueDate"
                  type="date"
                  value={details.dueDate}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="clientName">Client Name</Label>
              <Input
                id="clientName"
                name="clientName"
                value={details.clientName}
                onChange={handleChange}
                placeholder="Client Name"
              />
            </div>
            <div>
              <Label htmlFor="clientEmail">Client Email</Label>
              <Input
                id="clientEmail"
                name="clientEmail"
                type="email"
                value={details.clientEmail}
                onChange={handleChange}
                placeholder="client@example.com"
              />
            </div>
            <div>
              <Label htmlFor="clientAddress">Client Address</Label>
              <Textarea
                id="clientAddress"
                name="clientAddress"
                value={details.clientAddress}
                onChange={handleChange}
                placeholder="Client Address"
                rows={3}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default EstimateHeader;
