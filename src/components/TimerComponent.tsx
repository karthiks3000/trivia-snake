import React from 'react';

interface TimerProps {
  timeRemaining: number;
}

const Timer: React.FC<TimerProps> = ({ timeRemaining }) => {
  return (
    <div className="text-xl font-bold text-center p-4 bg-gray-100 rounded-lg shadow">
      Time Remaining: {timeRemaining} seconds
    </div>
  );
};

export default Timer;