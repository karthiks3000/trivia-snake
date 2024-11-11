import React from 'react';
import { Input } from "./ui/Input";
import { Button } from "./ui/Button";
import { Label } from "./ui/Label";
import { RadioGroup, RadioGroupItem } from "./ui/RadioGroup";
import { Trash2, PlusCircle } from 'lucide-react';
import { Question } from '../interface';


interface QuestionFormProps {
  question: Question;
  index: number;
  onChange: (index: number, question: Question) => void;
  onRemove: (index: number) => void;
  errors?: {
    question?: string;
    options?: string;
    correctAnswer?: string;
  };
}

const QuestionForm: React.FC<QuestionFormProps> = ({ question, index, onChange, onRemove, errors }) => {
  const handleQuestionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(index, { ...question, question: e.target.value.slice(0, 500) });
  };

  const handleOptionChange = (optionIndex: number, value: string) => {
    const newOptions = [...question.options];
    newOptions[optionIndex] = value.slice(0, 200);
    onChange(index, { ...question, options: newOptions });
  };

  const handleCorrectAnswerChange = (option: string) => {
    onChange(index, { ...question, correctAnswer: option });
  };

  const addOption = () => {
    if (question.options.length < 4) {
      onChange(index, { ...question, options: [...question.options, ''] });
    }
  };

  const removeOption = (optionIndex: number) => {
    if (question.options.length > 2) {
      const newOptions = question.options.filter((_, i) => i !== optionIndex);
      const newCorrectAnswer = question.correctAnswer === question.options[optionIndex] ? '' : question.correctAnswer;
      onChange(index, { ...question, options: newOptions, correctAnswer: newCorrectAnswer });
    }
  };

  return (
    <div className="border p-6 mb-6 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Question {index + 1}</h2>
        <Button type="button" variant="ghost" size="sm" onClick={() => onRemove(index)}>
          <Trash2 className="h-5 w-5" />
        </Button>
      </div>
      <div className="space-y-4">
        <div>
          <Label htmlFor={`question-${index}`}>Question</Label>
          <Input
            id={`question-${index}`}
            value={question.question}
            onChange={handleQuestionChange}
            placeholder="Enter your question here"
            maxLength={500}
          />
          <p className="text-sm text-gray-500 mt-1">{question.question.length}/500</p>
          {errors?.question && <p className="text-red-500 text-sm mt-1">{errors.question}</p>}
        </div>
        <div>
          <Label>Options</Label>
          <RadioGroup value={question.correctAnswer} onValueChange={handleCorrectAnswerChange}>
            {question.options.map((option, optionIndex) => (
              <div key={optionIndex} className="flex items-center space-x-2 mb-2">
                <RadioGroupItem value={option} id={`option-${index}-${optionIndex}`} />
                <Label htmlFor={`option-${index}-${optionIndex}`} className="flex-grow">
                  <Input
                    value={option}
                    onChange={(e) => handleOptionChange(optionIndex, e.target.value)}
                    className="flex-grow"
                    placeholder={`Option ${optionIndex + 1}`}
                    maxLength={200}
                  />
                </Label>
                <p className="text-sm text-gray-500 ml-2 w-16">{option.length}/200</p>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeOption(optionIndex)}
                  disabled={question.options.length <= 2}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </RadioGroup>
          <p className="text-sm text-gray-500 mt-2">Select the radio button next to the correct answer</p>
          {errors?.options && <p className="text-red-500 text-sm mt-1">{errors.options}</p>}
          {errors?.correctAnswer && <p className="text-red-500 text-sm mt-1">{errors.correctAnswer}</p>}
          <Button
            type="button"
            onClick={addOption}
            variant="outline"
            size="sm"
            className="mt-2"
            disabled={question.options.length >= 4}
          >
            <PlusCircle className="h-4 w-4 mr-2" /> Add Option
          </Button>
        </div>
      </div>
    </div>
  );
};

export default QuestionForm;