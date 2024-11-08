import React from 'react';
import { Input } from "./ui/Input";
import { Button } from "./ui/Button";
import { Label } from "./ui/Label";
import { TriviaQuestion } from './AdventureSelection';

interface QuestionFormProps {
  question: TriviaQuestion;
  index: number;
  onChange: (index: number, question: TriviaQuestion) => void;
  onRemove: (index: number) => void;
}

const QuestionForm: React.FC<QuestionFormProps> = ({ question, index, onChange, onRemove }) => {
  const handleQuestionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(index, { ...question, question: e.target.value });
  };

  const handleOptionChange = (optionIndex: number, value: string) => {
    const newOptions = [...question.options];
    newOptions[optionIndex] = value;
    onChange(index, { ...question, options: newOptions });
  };

  const handleCorrectAnswerChange = (option: string) => {
    onChange(index, { ...question, correctAnswer: option });
  };

  const addOption = () => {
    onChange(index, { ...question, options: [...question.options, ''] });
  };

  return (
    <div className="grid grid-cols-4 items-center gap-4 mb-4">
      <Label htmlFor={`question-${index}`} className="text-right">
        Question {index + 1}
      </Label>
      <div className="col-span-3">
        <Input
          id={`question-${index}`}
          value={question.question}
          onChange={handleQuestionChange}
          className="mb-2"
        />
        {question.options.map((option, optionIndex) => (
          <div key={optionIndex} className="flex items-center mb-2">
            <Input
              value={option}
              onChange={(e) => handleOptionChange(optionIndex, e.target.value)}
              className="mr-2"
            />
            <Button
              type="button"
              onClick={() => handleCorrectAnswerChange(option)}
              variant={question.correctAnswer === option ? "default" : "outline"}
            >
              Correct
            </Button>
          </div>
        ))}
        <Button type="button" onClick={addOption} className="mr-2">
          Add Option
        </Button>
        <Button type="button" variant="destructive" onClick={() => onRemove(index)}>
          Remove Question
        </Button>
      </div>
    </div>
  );
};

export default QuestionForm;