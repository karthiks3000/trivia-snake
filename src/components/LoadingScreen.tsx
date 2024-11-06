import React from 'react';
import { Loader2 } from 'lucide-react';

const LoadingScreen: React.FC = () => (
  <div className="flex flex-col items-center justify-center h-[calc(100vh-120px)]">
    <Loader2 className="h-12 w-12 animate-spin text-indigo-600 mb-4" />
    <p className="text-lg font-semibold text-gray-700">Loading questions...</p>
  </div>
);

export default LoadingScreen;