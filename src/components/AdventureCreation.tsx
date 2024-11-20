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
import { Alert, AlertTitle, AlertDescription } from "./ui/Alert";
import { AnimatePresence, motion } from "framer-motion";
import ProgressIndicator from './ProgressIndicator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/Select';

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
  const initialFormState = {
    adventureName: '',
    adventureDescription: '',
    genre: '',
    coverImage: null as File | null,
    questions: [] as Question[],
    topic: '',
    questionCount: 10,
  };

  const [formData, setFormData] = useState(initialFormState);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [alertInfo, setAlertInfo] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [currentStage, setCurrentStage] = useState<'validating' | 'checking' | 'saving' | null>(null);

  const resetForm = () => {
    setFormData(initialFormState);
    setErrors({});
    setAlertInfo(null);
  };
  

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    if (!formData.adventureName.trim()) newErrors.name = 'Adventure name is required';
    if (!formData.adventureDescription.trim()) newErrors.description = 'Description is required';
    if (!formData.coverImage) newErrors.image = 'Cover image is required';
    if (!formData.genre) newErrors.genre = 'Genre is required';
    if (formData.questions.length === 0) newErrors.questions = 'At least one question is required';
    if (formData.topic && formData.topic.length > 20) newErrors.topic = 'Topic must be 20 characters or less';
    if (formData.topic && (formData.questionCount < 5 || formData.questionCount > 30)) newErrors.questionCount = 'Question count must be between 5 and 30';
    formData.questions.forEach((q, index) => {
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
    setCurrentStage('validating');
    
    let imageBase64 = '';
    if (formData.coverImage) {
      const reader = new FileReader();
      imageBase64 = await new Promise((resolve) => {
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.readAsDataURL(formData.coverImage!);
      });
    }

    const newAdventure = {
      name: formData.adventureName,
      description: formData.adventureDescription,
      image: imageBase64,
      questions: formData.questions,
      genre: formData.genre,
      createdBy: userProfile?.userId
    };

    try {
      setCurrentStage('checking');
      const response = await api.createAdventure(newAdventure);
      if (response.status === 201) {
        setAlertInfo({ type: 'success', message: response.data.message || 'Adventure created successfully. It will be available after verification.' });
        resetForm();
        onAdventureCreated();
      } else {
        setAlertInfo({ type: 'error', message: response.data.error || 'Failed to create adventure. Please check your input and try again.' });
      }
    } catch (error ) {
      setAlertInfo({ type: 'error', message: (error as Error).message || 'Failed to create adventure. Please try again.' });
    } finally {
      setIsLoading(false);
      setCurrentStage(null);
    };
  };

  const handleCloseAlert = () => {
    setAlertInfo(null);
  };

  const handleQuestionChange = (index: number, updatedQuestion: Question) => {
    const newQuestions = [...formData.questions];
    newQuestions[index] = updatedQuestion;
    setFormData({...formData, questions: newQuestions});
  };

  const handleGenerateQuestions = async () => {
    if (!formData.topic) {
      setErrors({ ...errors, topic: 'Topic is required for AI generation' });
      return;
    }
    if (formData.questionCount < 5 || formData.questionCount > 30) {
      setErrors({ ...errors, questionCount: 'Question count must be between 5 and 30' });
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.generateQuiz({ prompt: formData.topic, questionCount: formData.questionCount });
      if (response.status === 200) {
        setFormData({...formData, questions: response.data.questions});
        setAlertInfo({ type: 'success', message: 'Questions generated successfully! You can now edit them if needed.' });
      } else {
        setAlertInfo({ type: 'error', message: response.data.error || 'Failed to generate questions' });
      }
    } catch (error) {
      setAlertInfo({ type: 'error', message: 'Failed to generate questions. Please try again.' });
    }
    setIsLoading(false);
  };

  const handleRemoveQuestion = (index: number) => {
    const newQuestions = formData.questions.filter((_, i) => i !== index);
    setFormData({...formData, questions: newQuestions});
  };

  const addNewQuestion = () => {
    setFormData({
      ...formData,
      questions: [...formData.questions, { id: Date.now().toString(), question: '', options: ['', ''], correctAnswer: '' }]
    });
  };

  return (
    <Dialog 
      open={isOpen} 
      onOpenChange={(open) => {
        if (!open) {
          resetForm();
          onClose();
        }
      }}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" ref={(ref) => {
        // Scroll to top when alert message appears
        if (ref && alertInfo) {
          ref.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }}>
        <DialogHeader>
          <DialogTitle>Create Adventure</DialogTitle>
          <DialogDescription>
            Enter adventure details below. You can manually create questions or use AI to generate them based on a topic.
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
            <div className="flex gap-3">
                <div>
                <Label htmlFor="topic">Topic for AI Generation</Label>
                <Input
                  id="topic"
                  value={formData.topic}
                  onChange={(e) => setFormData({...formData, topic: e.target.value.slice(0, 20)})}
                  placeholder="Enter topic for generating questions"
                  maxLength={20}
                  className={errors.topic ? 'border-red-500' : ''}
                />
                <p className="text-sm text-gray-500 mt-1">{formData.topic.length}/20</p>
                {errors.topic && <p className="text-red-500 text-sm mt-1">{errors.topic}</p>}
                </div>
                <div>
                <Label htmlFor="questionCount">Number of Questions</Label>
                <Input
                  id="questionCount"
                  type="number"
                  min={5}
                  max={30}
                  value={formData.questionCount}
                  onChange={(e) => setFormData({...formData, questionCount: parseInt(e.target.value) || 10})}
                  className={errors.questionCount ? 'border-red-500' : ''}
                />
                {errors.questionCount && <p className="text-red-500 text-sm mt-1">{errors.questionCount}</p>}
                </div>
                <div className="py-5">
                  <Button 
                    onClick={handleGenerateQuestions} 
                    disabled={isLoading} 
                    variant="outline"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating
                      </>
                    ) : (
                      'Generate Questions'
                    )}
                  </Button>
                </div>
            </div>
            <div>
              <Label htmlFor="name">Adventure Name *</Label>
              <Input
                id="name"
                value={formData.adventureName}
                onChange={(e) => setFormData({...formData, adventureName: e.target.value.slice(0, 100)})}
                placeholder="Enter adventure name"
                maxLength={100}
                className={errors.name ? 'border-red-500' : ''}
              />
              <p className="text-sm text-gray-500 mt-1">{formData.adventureName.length}/100</p>
              {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
            </div>
            <div>
              <Label htmlFor="description">Description *</Label>
              <Input
                id="description"
                value={formData.adventureDescription}
                onChange={(e) => setFormData({...formData, adventureDescription: e.target.value.slice(0, 500)})}
                placeholder="Enter adventure description"
                maxLength={500}
                className={errors.description ? 'border-red-500' : ''}
              />
              <p className="text-sm text-gray-500 mt-1">{formData.adventureDescription.length}/500</p>
              {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
            </div>
            <div>
              <Label htmlFor="genre">Genre *</Label>
              <Select onValueChange={(value) => setFormData({...formData, genre: value})} value={formData.genre}>
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
            <ImageUpload onImageChange={(image) => setFormData({...formData, coverImage: image})} />
            {errors.image && <p className="text-red-500 text-sm mt-1">{errors.image}</p>}
          </div>
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Questions *</h3>
            {formData.questions.map((question, index) => (
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
          <div className="w-full flex flex-col items-center gap-2">
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
            <ProgressIndicator currentStage={currentStage} />
          </div>
        </DialogFooter>
        {errors.submit && <p className="text-red-500 text-sm mt-2">{errors.submit}</p>}
      </DialogContent>
    </Dialog>
  );
};

export default AdventureCreation;