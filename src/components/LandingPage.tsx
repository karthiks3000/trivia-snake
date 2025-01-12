import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from './ui/Button';

const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 to-purple-100 flex flex-col justify-center items-center p-4 sm:p-6">
      <motion.h1 
        className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 sm:mb-6 md:mb-8 text-indigo-700 text-center"
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        Welcome to Trivia Snake
      </motion.h1>
      <motion.div 
        className="w-full max-w-4xl mb-4 sm:mb-6 md:mb-8"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <img
          src="/gameplay.gif"
          alt="Trivia Snake Gameplay"
          className="w-full h-auto object-cover rounded-lg shadow-2xl"
        />
      </motion.div>
      <motion.p 
        className="text-base sm:text-lg md:text-xl mb-4 sm:mb-6 md:mb-8 text-center max-w-2xl text-indigo-800 px-2 sm:px-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        Challenge your knowledge and reflexes in this exciting fusion of trivia and the classic snake game!
      </motion.p>
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
      >
        <Link to="/signin">
          <Button size="lg" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-full shadow-lg transition duration-300 ease-in-out transform hover:scale-105 text-base sm:text-lg">
            Let's Go!
          </Button>
        </Link>
      </motion.div>
    </div>
  );
};

export default LandingPage;