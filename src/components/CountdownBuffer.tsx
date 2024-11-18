// CountdownBuffer.tsx
import React, { useState, useEffect, useCallback } from 'react';

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
  }, [count]); // Only depend on count

  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-4xl font-bold">{preText} {count}</div>
    </div>
  );
};

export default CountdownBuffer;
