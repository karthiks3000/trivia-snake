import React, { useState, useEffect } from 'react';
import { UserProfile } from '../App';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "./ui/Card";
import { Button } from "./ui/Button";
import { Plus, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "./ui/Dialog";
import { Input } from "./ui/Input";
import { Label } from "./ui/Label";
import api from '../api';
import { Alert, AlertDescription, AlertTitle } from "./ui/Alert";
import QuestionForm from './QuestionForm';
import ImageUpload from './ImageUpload';

export interface TriviaQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
}

export interface Adventure {
  id?: string;
  name: string;
  description: string;
  image_url: string;
  questions: TriviaQuestion[];
  createdBy?: string;
}

interface AdventureSelectionProps {
  userProfile: UserProfile | undefined;
  onAdventureSelect: (adventure: Adventure) => void;
}

const AdventureSelection: React.FC<AdventureSelectionProps> = ({ userProfile, onAdventureSelect }) => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newAdventureName, setNewAdventureName] = useState('');
  const [newAdventureDescription, setNewAdventureDescription] = useState('');
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [questions, setQuestions] = useState<TriviaQuestion[]>([]);
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

  const handleCreateAdventure = async () => {
    if (!coverImage) {
      setError('Please upload a cover image.');
      return;
    }
    if (questions.length === 0) {
      setError('Please add at least one question.');
      return;
    }
    try {
      setIsLoading(true);
      
      // // Upload image to S3
      // const imageUploadResponse = await api.uploadImage(coverImage);
      // const imageUrl = imageUploadResponse.data.imageUrl;

      // Create adventure object
      let imageBase64 = '';
      if (coverImage) {
        const reader = new FileReader();
        imageBase64 = await new Promise((resolve) => {
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.readAsDataURL(coverImage);
        });
      }

      const newAdventure = {
        name: newAdventureName,
        description: newAdventureDescription,
        image: imageBase64,
        questions: questions,
        createdBy: userProfile?.userId
      };

      // Send adventure data to API
      await api.createAdventure(newAdventure);
      
      setIsCreateModalOpen(false);
      setNewAdventureName('');
      setNewAdventureDescription('');
      setCoverImage(null);
      setQuestions([]);
      await fetchAdventures();
    } catch (err) {
      setError('Failed to create adventure. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuestionChange = (index: number, updatedQuestion: TriviaQuestion) => {
    const newQuestions = [...questions];
    newQuestions[index] = updatedQuestion;
    setQuestions(newQuestions);
  };

  const handleRemoveQuestion = (index: number) => {
    const newQuestions = questions.filter((_, i) => i !== index);
    setQuestions(newQuestions);
  };

  const addNewQuestion = () => {
    setQuestions([...questions, { question: '', options: ['', ''], correctAnswer: '' }]);
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
              <Button className="w-full" onClick={() => onAdventureSelect(adventure)}>
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
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Create Custom Adventure</DialogTitle>
            <DialogDescription>
              Enter a name, description, upload an image, and add questions for your custom adventure.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Adventure Name
              </Label>
              <Input
                id="name"
                value={newAdventureName}
                onChange={(e) => setNewAdventureName(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                Description
              </Label>
              <Input
                id="description"
                value={newAdventureDescription}
                onChange={(e) => setNewAdventureDescription(e.target.value)}
                className="col-span-3"
              />
            </div>
            <ImageUpload onImageChange={setCoverImage} />
            <div className="space-y-4">
              {questions.map((question, index) => (
                <Card key={index} className="p-4">
                  <QuestionForm
                    question={question}
                    index={index}
                    onChange={handleQuestionChange}
                    onRemove={handleRemoveQuestion}
                  />
                </Card>
              ))}
              <Button type="button" onClick={addNewQuestion} className="w-full">
                Add Question
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleCreateAdventure} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Adventure
                </>
              ) : (
                'Create Adventure'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdventureSelection;