import React from 'react';
import { Link } from 'react-router-dom';

const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col justify-center items-center">
      <h1 className="text-4xl font-bold mb-8">Welcome to Trivia Snake</h1>
      <div className="w-full max-w-4xl">
        <img
          src="/gameplay.gif"
          alt="Trivia Snake Gameplay"
          className="w-full h-full object-cover rounded-lg shadow-lg"
        />
      </div>
      <br></br>
      <p className="text-xl mb-8 text-center max-w-2xl">
        Challenge your knowledge and reflexes in this exciting fusion of trivia and the classic snake game!
      </p>
      <div className="space-x-4">
        <Link
          to="/signin"
          className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
        >
          Lets Go!
        </Link>
      </div>
    </div>
  );
};

export default LandingPage;