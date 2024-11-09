import React, { useState, useEffect } from 'react';
import { UserProfile } from '../App';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "./ui/Card";
import { Button } from "./ui/Button";
import { Plus, Loader2 } from 'lucide-react';
import api from '../api';
import { Alert, AlertDescription, AlertTitle } from "./ui/Alert";
import AdventureCreation from './AdventureCreation';
import { Question } from './QuestionForm';

export interface Adventure {
  id?: string;
  name: string;
  description: string;
  image_url: string;
  questions: Question[];
  createdBy?: string;
  verificationStatus?: string;
}

interface AdventureSelectionProps {
  userProfile: UserProfile | undefined;
  onAdventureSelect: (adventure: Adventure) => void;
}

const AdventureSelection: React.FC<AdventureSelectionProps> = ({ userProfile, onAdventureSelect }) => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [adventures, setAdventures] = useState<Adventure[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAdventures();
  }, []);

  const fetchAdventures = async () => {
    try {
      setIsLoading(true);
      const response = await api.getAdventures();
      setAdventures(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch adventures. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderAdventureStatus = (adventure: Adventure) => {
    if (adventure.verificationStatus === 'pending') {
      return <span className="text-yellow-500">Pending Verification</span>;
    } else if (adventure.verificationStatus === 'rejected') {
      return <span className="text-red-500">Rejected</span>;
    }
    return null;
  };

  const handleAdventureCreated = () => {
    setIsCreateModalOpen(false);
    fetchAdventures();
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="text-center">
      <h1 className="text-3xl font-bold mb-6">Choose Your Adventure</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {adventures.map((adventure) => (
          <Card key={adventure.id} className="overflow-hidden hover:shadow-lg transition-shadow duration-300 flex flex-col min-h-[400px]">
            <CardHeader className="p-0">
              <img src={adventure.image_url} alt={adventure.name} className="w-full h-48 object-cover" />
            </CardHeader>
            <CardContent className="pt-6 flex-grow flex flex-col justify-center">
              <CardTitle className="flex items-center justify-center gap-2 text-xl mb-2">
                {adventure.name}
              </CardTitle>
              {renderAdventureStatus(adventure)}
            </CardContent>
            <CardFooter className="p-4">
              <Button 
                className="w-full" 
                onClick={() => onAdventureSelect(adventure)}
                disabled={adventure.verificationStatus !== 'verified'}
              >
                {adventure.verificationStatus === 'verified' ? 'Start Adventure' : 'Not Available'}
              </Button>
            </CardFooter>
          </Card>
        ))}
        <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-300 flex flex-col min-h-[400px]">
          <CardHeader className="p-0">
            <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
              <Plus className="h-12 w-12 text-gray-400" />
            </div>
          </CardHeader>
          <CardContent className="flex-grow flex items-center justify-center">
            <CardTitle className="text-xl text-center">Create Custom Adventure</CardTitle>
          </CardContent>
          <CardFooter className="p-4">
            <Button 
              onClick={() => setIsCreateModalOpen(true)} 
              className="w-full flex items-center justify-center gap-2"
            >
              <Plus className="h-6 w-6" />
              Create
            </Button>
          </CardFooter>
        </Card>
      </div>

      <AdventureCreation
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onAdventureCreated={handleAdventureCreated}
        userProfile={userProfile}
      />
    </div>
  );
};

export default AdventureSelection;