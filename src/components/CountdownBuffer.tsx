import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import '../styles/countdown-animations.css';
import { Card, CardContent } from './ui/Card';

interface CountdownBufferProps {
  preText: string;
  onComplete: () => void;
}

const CountdownBuffer: React.FC<CountdownBufferProps> = ({ preText, onComplete }) => {
  const [count, setCount] = useState(3);
  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    if (count > 0) {
      
      timer = setTimeout(() => {
        setCount(count - 1);
      }, 1000);
    } else {
      onComplete();
    }

    return () => clearTimeout(timer);
  }, [count, onComplete]);

  return (
    <div className="flex justify-center items-center min-h-screen">
      <Card className="w-full max-w-2xl border-zinc-700/50 !bg-zinc-900">
        <CardContent className="space-y-6 mt-4 !text-white">
          <div className="countdown-text">
            <div className="pre-text text-2xl font-bold text-center mb-4">{preText}</div>
            <AnimatePresence mode="wait">
              <motion.div
                key={count}
                className="countdown-number text-6xl font-bold text-center"
              >
                {count}
              </motion.div>
            </AnimatePresence>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
export default CountdownBuffer;
