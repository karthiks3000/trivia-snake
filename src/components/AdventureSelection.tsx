import React, { useState, useEffect } from 'react';
import { UserProfile } from '../App';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "./ui/Card";
import { Button } from "./ui/Button";
import { Plus, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "./ui/Dialog";
import { Input } from "./ui/Input";
import { Label } from "./ui/Label";
import { Textarea } from "./ui/Textarea";
import api from '../api';
import { Alert, AlertDescription, AlertTitle } from "./ui/Alert";

interface AdventureSelectionProps {
  userProfile: UserProfile | undefined;
  onAdventureSelect: (adventure: string) => void;
}

export interface Adventure {
  id: string;
  name: string;
  image_url: string;
}

interface Question {
  question: string;
  options: string[];
  correctAnswer: string;
}

const AdventureSelection: React.FC<AdventureSelectionProps> = ({ userProfile, onAdventureSelect }) => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newAdventureName, setNewAdventureName] = useState('');
  const [newAdventurePrompt, setNewAdventurePrompt] = useState('');
  const [adventures, setAdventures] = useState<Adventure[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generatedQuestions, setGeneratedQuestions] = useState<Question[] | null>(null);
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);

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

  const handleCreateAdventure = async () => {
    try {
      setIsGeneratingQuiz(true);
      const response = await api.generateQuiz({ prompt: newAdventurePrompt });
      setGeneratedQuestions(response.data);
    } catch (err) {
      setError('Failed to generate quiz. Please try again.');
    } finally {
      setIsGeneratingQuiz(false);
    }
  };

  const handleAcceptQuiz = async () => {
    if (!generatedQuestions) return;

    try {
      setIsLoading(true);
      await api.createAdventure({
        name: newAdventureName,
        image_url: '/images/custom_adventure.jpg', // You might want to allow users to upload images
        questions: generatedQuestions
      });
      setIsCreateModalOpen(false);
      setNewAdventureName('');
      setNewAdventurePrompt('');
      setGeneratedQuestions(null);
      await fetchAdventures(); // Refresh the list of adventures
    } catch (err) {
      setError('Failed to create adventure. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegenerateQuiz = () => {
    setGeneratedQuestions(null);
    handleCreateAdventure();
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
          <Card key={adventure.id} className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
            <CardHeader className="p-0">
              <img src={adventure.image_url} alt={adventure.name} className="w-full h-48 object-cover" />
            </CardHeader>
            <CardContent className="pt-6">
              <CardTitle className="flex items-center justify-center gap-2 text-xl">
                {adventure.name}
              </CardTitle>
            </CardContent>
            <CardFooter>
              <Button className="w-full" onClick={() => onAdventureSelect(adventure.id)}>
                Start Adventure
              </Button>
            </CardFooter>
          </Card>
        ))}
        <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
          <CardContent className="flex items-center justify-center h-full">
            <Button onClick={() => setIsCreateModalOpen(true)} className="flex items-center gap-2">
              <Plus className="h-6 w-6" />
              Create Custom Adventure
            </Button>
          </CardContent>
        </Card>
      </div>

      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Create Custom Adventure</DialogTitle>
            <DialogDescription>
              Enter a name and prompt for your custom adventure. We'll use AI to generate a quiz based on your input.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                value={newAdventureName}
                onChange={(e) => setNewAdventureName(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="prompt" className="text-right">
                Prompt
              </Label>
              <Textarea
                id="prompt"
                value={newAdventurePrompt}
                onChange={(e) => setNewAdventurePrompt(e.target.value)}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            {!generatedQuestions ? (
              <Button onClick={handleCreateAdventure} disabled={isGeneratingQuiz}>
                {isGeneratingQuiz ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating Quiz
                  </>
                ) : (
                  'Generate Quiz'
                )}
              </Button>
            ) : (
              <>
                <Button onClick={handleRegenerateQuiz}>Regenerate Quiz</Button>
                <Button onClick={handleAcceptQuiz}>Accept Quiz</Button>
              </>
            )}
          </DialogFooter>
          {generatedQuestions && (
            <div className="mt-4">
              <h3 className="text-lg font-semibold mb-2">Generated Quiz Preview:</h3>
              <ul className="list-decimal pl-5">
                {generatedQuestions.slice(0, 3).map((q, index) => (
                  <li key={index} className="mb-2">{q.question}</li>
                ))}
              </ul>
              <p className="text-sm text-gray-500 mt-2">... and {generatedQuestions.length - 3} more questions</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdventureSelection;