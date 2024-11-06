import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Button } from './ui/Button';

interface QuestionProps {
  question: string;
  options: string[];
}

const Question: React.FC<QuestionProps> = ({ question, options }) => {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-xl">{question}</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {options.map((option, index) => (
            <li key={index}>
              <Button
                variant="outline"
                className="w-full justify-start text-left hover:bg-gray-100"
              >
                <span className="font-semibold mr-2">{String.fromCharCode(65 + index)}.</span>
                {option}
              </Button>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
};

export default Question;
