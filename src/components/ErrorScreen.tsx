import React from 'react';
import { AlertCircle } from 'lucide-react';
import { Button } from './ui/Button';

interface ErrorScreenProps {
  onRetry?: () => void;
}

const ErrorScreen: React.FC<ErrorScreenProps> = ({ onRetry }) => (
  <div className="flex flex-col items-center justify-center h-[calc(100vh-120px)]">
    <AlertCircle className="h-12 w-12 text-red-600 mb-4" />
    <h2 className="text-2xl font-bold text-gray-800 mb-2">Oops! Something went wrong</h2>
    <p className="text-lg text-gray-600 mb-6">Error loading questions. Please try again.</p>
    {onRetry && (
      <Button onClick={onRetry} className="bg-indigo-600 hover:bg-indigo-700">
        Retry
      </Button>
    )}
  </div>
);

export default ErrorScreen;