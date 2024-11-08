import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "./ui/Dialog";
import { Input } from "./ui/Input";
import { Label } from "./ui/Label";
import { Button } from "./ui/Button";
import { Loader2, PlusCircle } from 'lucide-react';
import { UserProfile } from '../App';
import QuestionForm, { Question } from './QuestionForm';
import ImageUpload from './ImageUpload';
import api from '../api';

interface AdventureCreationProps {
  isOpen: boolean;
  onClose: () => void;
  onAdventureCreated: () => void;
  userProfile: UserProfile | undefined;
}

const AdventureCreation: React.FC<AdventureCreationProps> = ({ isOpen, onClose, onAdventureCreated, userProfile }) => {
  const [newAdventureName, setNewAdventureName] = useState('');
  const [newAdventureDescription, setNewAdventureDescription] = useState('');
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    if (!newAdventureName.trim()) newErrors.name = 'Adventure name is required';
    if (!newAdventureDescription.trim()) newErrors.description = 'Description is required';
    if (!coverImage) newErrors.image = 'Cover image is required';
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

    try {
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
        createdBy: userProfile?.userId
      };

      await api.createAdventure(newAdventure);
      
      onClose();
      setNewAdventureName('');
      setNewAdventureDescription('');
      setCoverImage(null);
      setQuestions([]);
      setErrors({});
      onAdventureCreated();
    } catch (err) {
      setErrors({ submit: 'Failed to create adventure. Please try again.' });
    } finally {
      setIsLoading(false);
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