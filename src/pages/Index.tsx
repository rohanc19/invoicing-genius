
import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { ReceiptText, FileBarChart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AppHeader from '@/components/AppHeader';

const Index = () => {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded shadow-md max-w-md w-full">
          <h2 className="text-2xl font-bold mb-4 text-gray-800">Welcome to Invoicing Genius</h2>
          <p className="text-gray-700 mb-6">
            Please sign in to access your invoices and estimates.
          </p>
          <div className="flex gap-4 flex-col sm:flex-row">
            <Link to="/sign-in" className="bg-primary text-white py-2 px-4 rounded hover:bg-primary/80 transition-colors text-center">
              Sign In
            </Link>
            <Link to="/sign-up" className="bg-secondary text-white py-2 px-4 rounded hover:bg-secondary/80 transition-colors text-center">
              Sign Up
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />
      
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Welcome to Invoicing Genius</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Streamline your invoicing process with our powerful, yet simple to use platform.
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-md p-8 border border-gray-100 hover:shadow-lg transition-shadow">
            <div className="text-primary mb-4">
              <ReceiptText className="h-12 w-12" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Invoices</h2>
            <p className="text-gray-600 mb-6">
              Create, manage, and track all your invoices in one place. Send professional invoices to your clients easily.
            </p>
            <Button asChild>
              <Link to="/invoices">Manage Invoices</Link>
            </Button>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-8 border border-gray-100 hover:shadow-lg transition-shadow">
            <div className="text-primary mb-4">
              <FileBarChart className="h-12 w-12" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Estimates</h2>
            <p className="text-gray-600 mb-6">
              Create detailed estimates for your clients. Convert approved estimates to invoices with one click.
            </p>
            <Button asChild>
              <Link to="/estimates">Manage Estimates</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
