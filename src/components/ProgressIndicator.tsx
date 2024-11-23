import React from 'react';
import { Loader2 } from 'lucide-react';

export type Stage = 'validating' | 'checking' | 'saving' | null;

interface ProgressIndicatorProps {
  currentStage: Stage;
}

const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({ currentStage }) => {
  const stages = {
    validating: 'Validating schema',
    checking: 'Checking for profanity',
    saving: 'Saving to the database'
  };

  if (!currentStage) return null;

  return (
    <div className="flex items-center gap-2 mt-4">
      <Loader2 className="h-4 w-4 animate-spin text-indigo-600" />
      <span className="text-sm text-gray-700">
        {stages[currentStage]}...
      </span>
    </div>
  );
};

export default ProgressIndicator;