import React from 'react';

const LoadingIndicator: React.FC = () => {
  const dotStyle: React.CSSProperties = {
    width: '30px',
    height: '30px',
    backgroundColor: '#4CAF50',
    borderRadius: '50%',
    display: 'inline-block',
    margin: '0 15px',
  };

  const containerStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    width: '200px',
    height: '200px',
    animation: 'rotate 2s linear infinite',
  };

  return (
    <div className="flex justify-center items-center h-screen">
      <div style={containerStyle}>
        {[...Array(3)].map((_, index) => (
          <div
            key={index}
            style={{
              ...dotStyle,
              animation: `pulse 0.8s ${index * 0.2}s infinite alternate`,
            }}
          />
        ))}
      </div>
    </div>
  );
};

const rotateKeyframes = `
  @keyframes rotate {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const pulseKeyframes = `
  @keyframes pulse {
    0% { transform: scale(0.8); }
    100% { transform: scale(1.2); }
  }
`;

const style = document.createElement('style');
style.textContent = rotateKeyframes + pulseKeyframes;
document.head.appendChild(style);

export default LoadingIndicator;
