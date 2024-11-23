import React from 'react';
import { motion } from 'framer-motion';
import { fadeIn, transition } from '../../styles/theme';

interface GameCardProps {
  children: React.ReactNode;
  className?: string;
}

const GameCard: React.FC<GameCardProps> = ({ children, className = '' }) => {
  return (
    <motion.div
      variants={fadeIn}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={transition}
      className={`
        bg-white rounded-lg shadow-lg overflow-hidden
        border-2 border-indigo-500/20
        hover:border-indigo-500/40 transition-colors
        backdrop-blur-sm bg-white/90
        ${className}
      `}
    >
      {children}
    </motion.div>
  );
};

export default GameCard;