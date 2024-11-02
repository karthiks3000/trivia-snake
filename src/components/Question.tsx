import React from 'react';

interface QuestionProps {
  question: {
    question: string;
    options: string[];
  };
}

const Question: React.FC<QuestionProps> = ({ question }) => {
  return (
    <div className="bg-white shadow-md rounded px-4 py-4">
      <h2 className="text-xl font-bold mb-4">{question.question}</h2>
      <ul className="list-none">
        {question.options.map((option, index) => (
          <li key={index} className="mb-2 p-2 bg-gray-100 rounded hover:bg-gray-200 cursor-pointer">
            {String.fromCharCode(65 + index)}. {option}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Question;
