import React, { useState } from 'react';
import ConfirmationDialog from './ConfirmationDialog';
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
import { AxiosError } from 'axios';
// Ensure UserProfile has an id property
export interface ExtendedUserProfile extends UserProfile {
  id: string;
}


interface FormData {
  title: string;
  description: string;
  image: File | null;
  topic: string;
  genre: string;
  questions: Question[];
  numberOfQuestions: number;
}

const initialFormState: FormData = {
  title: '',
  description: '',
  image: null,
  topic: '',
  genre: '',
  questions: [],
  numberOfQuestions: 10,
};

interface AdventureCreationProps {
  isOpen: boolean;
  onClose: () => void;
  onAdventureCreated: () => void;
  userProfile: ExtendedUserProfile;
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

const BasicInformationStep: React.FC<{
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
  errors: { [key: string]: string };
}> = ({ formData, setFormData, errors }) => {
  return (
    <>
      <div>
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          className={errors.title ? 'border-red-500' : ''}
        />
        {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
      </div>
      <div>
        <Label htmlFor="description">Description</Label>
        <Input
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className={errors.description ? 'border-red-500' : ''}
        />
        {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
      </div>
      <div>
        <Label htmlFor="image">Image</Label>
        <ImageUpload
          onImageChange={(file: File | null) => setFormData({ ...formData, image: file })}
        />
        {errors.image && <p className="text-red-500 text-sm mt-1">{errors.image}</p>}
      </div>
      <div>
        <Label htmlFor="genre">Genre</Label>
        <Select
          value={formData.genre}
          onValueChange={(value: string) => setFormData({ ...formData, genre: value })}
        >
          <SelectTrigger className={errors.genre ? 'border-red-500' : ''}>
            <SelectValue placeholder="Select genre" />
          </SelectTrigger>
          <SelectContent>
            {GENRES.map((genre) => (
              <SelectItem key={genre} value={genre}>{genre}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.genre && <p className="text-red-500 text-sm mt-1">{errors.genre}</p>}
      </div>
    </>
  );
};

const AIQuestionGenerationStep: React.FC<{
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
  errors: { [key: string]: string };
  handleGenerateQuestions: () => void;
  isLoading: boolean;
}> = ({ formData, setFormData, errors, handleGenerateQuestions, isLoading }) => {
  return (
    <>
      <div>
        <Label htmlFor="topic">Topic for AI Question Generation</Label>
        <Input
          id="topic"
          value={formData.topic}
          onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
          className={errors.topic ? 'border-red-500' : ''}
        />
        {errors.topic && <p className="text-red-500 text-sm mt-1">{errors.topic}</p>}
      </div>
      <div>
        <Label htmlFor="numberOfQuestions">Number of Questions</Label>
        <Input
          id="numberOfQuestions"
          type="number"
          min="5"
          max="30"
          value={formData.numberOfQuestions}
          onChange={(e) => setFormData({ ...formData, numberOfQuestions: parseInt(e.target.value) })}
          className={errors.numberOfQuestions ? 'border-red-500' : ''}
        />
        {errors.numberOfQuestions && <p className="text-red-500 text-sm mt-1">{errors.numberOfQuestions}</p>}
      </div>
      <Button onClick={handleGenerateQuestions} disabled={isLoading}>
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Generating Questions
          </>
        ) : (
          'Generate Questions'
        )}
      </Button>
    </>
  );
};

const ManualQuestionCreationStep: React.FC<{
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
  errors: { [key: string]: string };
  handleQuestionChange: (index: number, updatedQuestion: Question) => void;
  handleRemoveQuestion: (index: number) => void;
  addNewQuestion: () => void;
}> = ({ formData, errors, handleQuestionChange, handleRemoveQuestion, addNewQuestion }) => {
  return (
    <>
      {formData.questions.map((question, index) => (
        <QuestionForm
          key={question.id}
          index={index}
          question={question}
          onChange={(index: number, updatedQuestion: Question) => handleQuestionChange(index, updatedQuestion)}
          onRemove={() => handleRemoveQuestion(index)}
          errors={errors}
        />
      ))}
      <Button onClick={addNewQuestion} variant="outline" className="w-full">
        <PlusCircle className="mr-2 h-4 w-4" />
        Add New Question
      </Button>
    </>
  );
};

const AdventureCreation: React.FC<AdventureCreationProps> = ({ isOpen, onClose, onAdventureCreated, userProfile }) => {
  const [formData, setFormData] = useState<FormData>(initialFormState);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [alertInfo, setAlertInfo] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [currentStage, setCurrentStage] = useState<'validating' | 'checking' | 'saving' | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  const steps = [
    { number: 1, title: "Basic Information" },
    { number: 2, title: "AI Question Generation" },
    { number: 3, title: "Manual Question Creation" },
  ];

  const handleCloseAlert = () => {
    setAlertInfo(null);
  };

  const handleGenerateQuestions = async () => {
    setIsLoading(true);
    setErrors({});
    try {
      if (!formData.topic) {
        throw new Error('Topic is required');
      }
      if (formData.numberOfQuestions < 5 || formData.numberOfQuestions > 30) {
        throw new Error('Number of questions must be between 5 and 30');
      }
      const response = await api.generateQuiz({
        prompt: formData.topic,
        questionCount: formData.numberOfQuestions,
      });
      setFormData(prevData => ({
        ...prevData,
        questions: response.data.questions.map((q: any) => ({
          ...q,
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9)
        })),
      }));
      setAlertInfo({ type: 'success', message: 'Questions generated successfully!' });
    } catch (error) {
      setAlertInfo({ type: 'error', message: error instanceof Error ? error.message : 'Failed to generate questions. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuestionChange = (index: number, updatedQuestion: Question) => {
    const updatedQuestions = [...formData.questions];
    updatedQuestions[index] = updatedQuestion;
    setFormData(prevData => ({
      ...prevData,
      questions: updatedQuestions,
    }));
  };

  const handleRemoveQuestion = (index: number) => {
    setFormData(prevData => ({
      ...prevData,
      questions: prevData.questions.filter((_, i) => i !== index),
    }));
  };

  const handlePreviousStep = () => {
    setCurrentStep(prev => Math.max(1, prev - 1));
  };

  const handleNextStep = () => {
    setCurrentStep(prev => Math.min(steps.length, prev + 1));
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (!formData.image) newErrors.image = 'Image is required';
    if (!formData.genre) newErrors.genre = 'Genre is required';
    if (formData.questions.length === 0) newErrors.questions = 'At least one question is required';
    formData.questions.forEach((question, index) => {
      if (!question.question.trim()) newErrors[`question${index}`] = 'Question text is required';
      if (question.options.some(option => !option.trim())) newErrors[`question${index}`] = 'All options must be filled';
      if (!question.correctAnswer.trim()) newErrors[`question${index}`] = 'Correct answer is required';
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreateAdventure = () => {
    if (validateForm()) {
      setShowConfirmation(true);
    }
  };

const handleConfirmedCreate = async () => {
  setShowConfirmation(false);
  setIsLoading(true);
  setCurrentStage('saving');
  try {
    const formDataToSend = new FormData();
    formDataToSend.append('title', formData.title);
    formDataToSend.append('description', formData.description);
    let imageBase64 = '';
    if (formData.image) {
      const reader = new FileReader();
      imageBase64 = await new Promise((resolve) => {
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.readAsDataURL(formData.image!);
      });
    }
    formDataToSend.append('questions', JSON.stringify(formData.questions));
    formDataToSend.append('createdBy', userProfile.id || '');

    await api.createAdventure({
      name: formData.title,
      description: formData.description,
      image: imageBase64,
      questions: formData.questions,
      createdBy: userProfile?.id,
      genre: formData.genre
    }).then(response => {
      if(response.status === 200) {
        setAlertInfo({ type: 'success', message: 'Adventure created successfully!' });
        onAdventureCreated();
        resetForm();
        onClose(); // Close the modal on success
      } else {
        setAlertInfo({ type: 'error', message: response.data?.error || 'Failed to create adventure. Please try again.' });
      }
    })
    .catch(error => {
      setAlertInfo({ type: 'error', message: error.response?.data?.message || 'Failed to create adventure. Please try again.' });
    });
  } catch (error) {
    if (error instanceof AxiosError) {
      setAlertInfo({ type: 'error', message: error.response?.data?.message || 'Failed to create adventure. Please try again.' });
    } else {
      setAlertInfo({ type: 'error', message: 'An unexpected error occurred. Please try again.' });
    }
    // Don't close the modal on error
  } finally {
    setIsLoading(false);
    setCurrentStage(null);
  }
};

const resetForm = () => {
  setFormData(initialFormState);
  setErrors({});
  setCurrentStep(1);
  setAlertInfo(null); // Clear any existing alerts
};

  const addNewQuestion = () => {
    setFormData(prevData => ({
      ...prevData,
      questions: [
        ...prevData.questions,
        { id: Date.now().toString(), question: '', options: ['', '', '', ''], correctAnswer: '' }
      ]
    }));
  };

  return (
    <Dialog 
      open={isOpen} 
      onOpenChange={(open) => {
        if (!open && alertInfo?.type !== 'error') {
          resetForm();
          onClose();
        }
      }}
    >
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
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
              <Alert variant={alertInfo.type === 'error' ? 'destructive' : 'default'} className="mb-4">
                <AlertTitle>{alertInfo.type === 'error' ? 'Error' : 'Success'}</AlertTitle>
                <AlertDescription>{alertInfo.message}</AlertDescription>
                <Button onClick={handleCloseAlert} variant="outline" className="mt-2">
                  Close
                </Button>
              </Alert>
            </motion.div>
          )}
        </AnimatePresence>
        <div className="space-y-4">
          {currentStep === 1 && (
            <BasicInformationStep
              formData={formData}
              setFormData={setFormData}
              errors={errors}
            />
          )}
          {currentStep === 2 && (
            <AIQuestionGenerationStep
              formData={formData}
              setFormData={setFormData}
              errors={errors}
              handleGenerateQuestions={handleGenerateQuestions}
              isLoading={isLoading}
            />
          )}
          {currentStep === 3 && (
            <ManualQuestionCreationStep
              formData={formData}
              setFormData={setFormData}
              errors={errors}
              handleQuestionChange={handleQuestionChange}
              handleRemoveQuestion={handleRemoveQuestion}
              addNewQuestion={addNewQuestion}
            />
          )}
        </div>
        <DialogFooter>
          <div className="w-full flex justify-between items-center">
            {currentStep > 1 && (
              <Button onClick={handlePreviousStep} variant="outline">
                Previous
              </Button>
            )}
            {currentStep < steps.length && (
              <Button onClick={handleNextStep}>
                Next
              </Button>
            )}
            {currentStep === steps.length && (
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
            )}
          </div>
          <ProgressIndicator currentStage={currentStage} />
        </DialogFooter>
      </DialogContent>
      <ConfirmationDialog
        isOpen={showConfirmation}
        onClose={() => setShowConfirmation(false)}
        onConfirm={handleConfirmedCreate}
      />
    </Dialog>
  );
};

export default AdventureCreation;
