import React from 'react';
import styled from 'styled-components';

const QuestionContainer = styled.div`
  background-color: #f0f0f0;
  border-radius: 10px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  padding: 1rem;
  height: 100%;
  display: flex;
  flex-direction: column;
`;

const QuestionText = styled.h2`
  margin-bottom: 1rem;
  color: #333;
  font-size: 1.2rem;
`;

const OptionsList = styled.ul`
  list-style-type: none;
  padding: 0;
  flex-grow: 1;
  overflow-y: auto;
`;

const OptionItem = styled.li`
  margin-bottom: 0.5rem;
  padding: 0.5rem;
  background-color: #fff;
  border-radius: 5px;
  cursor: pointer;
  transition: background-color 0.3s ease;
  font-size: 1rem;

  &:hover {
    background-color: #e0e0e0;
  }
`;

interface QuestionProps {
  question: {
    question: string;
    options: string[];
  };
}

const Question: React.FC<QuestionProps> = ({ question }) => {
    return (
      <QuestionContainer>
        <QuestionText>{question.question}</QuestionText>
        <OptionsList>
          {question.options.map((option, index) => (
            <OptionItem key={index}>
              {String.fromCharCode(65 + index)}. {option}
            </OptionItem>
          ))}
        </OptionsList>
      </QuestionContainer>
    );
  };
  
  export default Question;
  
