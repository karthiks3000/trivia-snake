import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "./ui/Dialog";
import { Input } from "./ui/Input";
import { Label } from "./ui/Label";
import { Button } from "./ui/Button";
import { Loader2, PlusCircle } from 'lucide-react';
import QuestionForm from './QuestionForm';
import ImageUpload from './ImageUpload';
import api from '../api';
import { Alert, AlertTitle, AlertDescription } from "./ui/Alert";
import { AnimatePresence, motion } from "framer-motion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/Select';
import { Question, UserProfile } from '../interface';

interface AdventureCreationProps {
  isOpen: boolean;
  onClose: () => void;
  onAdventureCreated: () => void;
  userProfile: UserProfile | undefined;
}

export const GENRES = [
  "Arts & Literature",
  "History & Politics",
  "Science & Nature",
  "Movies & TV Shows",
  "Music & Entertainment",
  "Sports & Games",
  "Geography & Travel",
  "Food & Drink",
  "Technology & Computing",
  "Mythology & Folklore",
  "Pop Culture",
  "Business & Economics",
  "Animals & Wildlife",
  "Space & Astronomy",
  "Language & Words",
  "Comics & Animation",
  "Video Games",
  "Ancient Civilizations",
  "Medical & Health",
  "Other"
];

const AdventureCreation: React.FC<AdventureCreationProps> = ({ isOpen, onClose, onAdventureCreated, userProfile }) => {
  const [newAdventureName, setNewAdventureName] = useState('');
  const [newAdventureDescription, setNewAdventureDescription] = useState('');
  const [genre, setGenre] = useState('');

  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [alertInfo, setAlertInfo] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    if (!newAdventureName.trim()) newErrors.name = 'Adventure name is required';
    if (!newAdventureDescription.trim()) newErrors.description = 'Description is required';
    if (!coverImage) newErrors.image = 'Cover image is required';
    if (!genre) newErrors.genre = 'Genre is required';
    if (questions.length === 0) newErrors.questions = 'At least one question is required';
    questions.forEach((q, index) => {
      if (!q.question.trim()) newErrors[`question-${index}`] = 'Question is required';
      if (q.options.some(o => !o.trim())) newErrors[`options-${index}`] = 'All options must be filled';
      if (!q.correctAnswer) newErrors[`correctAnswer-${index}`] = 'Correct answer must be selected';
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreateAdventure = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    
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
      genre: genre,
      createdBy: userProfile?.userId
    };

    const response = await api.createAdventure(newAdventure);
    
    if (response.status === 400) {
      setAlertInfo({ type: 'error', message: response.data.error || 'Failed to create adventure. Please check your input and try again.' });
    } else if (response.status === 201) {
      setAlertInfo({ type: 'success', message: response.data.message || 'Adventure created successfully. It will be available after verification.' });
      setNewAdventureName('');
      setNewAdventureDescription('');
      setCoverImage(null);
      setQuestions([]);
      setErrors({});
      onAdventureCreated();
    } else {
      setAlertInfo({ type: 'error', message: 'Failed to create adventure. Please try again.' });
    }
    setIsLoading(false);
  };

  const handleCloseAlert = () => {
    setAlertInfo(null);
    if (alertInfo?.type === 'success') {
      onClose();
    }
  };

  const handleQuestionChange = (index: number, updatedQuestion: Question) => {
    const newQuestions = [...questions];
    newQuestions[index] = updatedQuestion;
    setQuestions(newQuestions);
  };

  const handleRemoveQuestion = (index: number) => {
    const newQuestions = questions.filter((_, i) => i !== index);
    setQuestions(newQuestions);
  };

  const addNewQuestion = () => {
    setQuestions([...questions, { id: Date.now().toString(), question: '', options: ['', ''], correctAnswer: '' }]);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Custom Adventure</DialogTitle>
          <DialogDescription>
            Enter a name, description, upload an image, and add questions for your custom adventure.
          </DialogDescription>
        </DialogHeader>
        <AnimatePresence>
          {alertInfo && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Alert
                variant={alertInfo.type === 'error' ? 'destructive' : 'default'}
                className="mb-4"
              >
                <AlertTitle>{alertInfo.type === 'error' ? 'Error' : 'Success'}</AlertTitle>
                <AlertDescription>{alertInfo.message}</AlertDescription>
                <Button
                  onClick={handleCloseAlert}
                  variant="outline"
                  className="mt-2"
                  aria-label={`Close ${alertInfo.type === 'error' ? 'error' : 'success'} message`}
                >
                  Close
                </Button>
              </Alert>
            </motion.div>
          )}
        </AnimatePresence>
        <div className="grid gap-6 py-4">
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Adventure Name *</Label>
              <Input
                id="name"
                value={newAdventureName}
                onChange={(e) => setNewAdventureName(e.target.value.slice(0, 100))}
                placeholder="Enter adventure name"
                maxLength={100}
                className={errors.name ? 'border-red-500' : ''}
              />
              <p className="text-sm text-gray-500 mt-1">{newAdventureName.length}/100</p>
              {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
            </div>
            <div>
              <Label htmlFor="description">Description *</Label>
              <Input
                id="description"
                value={newAdventureDescription}
                onChange={(e) => setNewAdventureDescription(e.target.value.slice(0, 500))}
                placeholder="Enter adventure description"
                maxLength={500}
                className={errors.description ? 'border-red-500' : ''}
              />
              <p className="text-sm text-gray-500 mt-1">{newAdventureDescription.length}/500</p>
              {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
            </div>
            <div>
              <Label htmlFor="genre">Genre *</Label>
              <Select onValueChange={setGenre} value={genre}>
                <SelectTrigger className={errors.genre ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Select a genre" />
                </SelectTrigger>
                <SelectContent>
                  {GENRES.map((g) => (
                    <SelectItem key={g} value={g}>{g}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.genre && <p className="text-red-500 text-sm mt-1">{errors.genre}</p>}
            </div>
            <ImageUpload onImageChange={setCoverImage} />
            {errors.image && <p className="text-red-500 text-sm mt-1">{errors.image}</p>}
          </div>
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Questions *</h3>
            {questions.map((question, index) => (
              <QuestionForm
                key={question.id}
                question={question}
                index={index}
                onChange={handleQuestionChange}
                onRemove={handleRemoveQuestion}
                errors={{
                  question: errors[`question-${index}`],
                  options: errors[`options-${index}`],
                  correctAnswer: errors[`correctAnswer-${index}`]
                }}
              />
            ))}
            <Button type="button" onClick={addNewQuestion} variant="outline" className="w-full">
              <PlusCircle className="h-4 w-4 mr-2" /> Add Question
            </Button>
            {errors.questions && <p className="text-red-500 text-sm mt-1">{errors.questions}</p>}
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
        {errors.submit && <p className="text-red-500 text-sm mt-2">{errors.submit}</p>}
      </DialogContent>
    </Dialog>
  );
};

export default AdventureCreation;