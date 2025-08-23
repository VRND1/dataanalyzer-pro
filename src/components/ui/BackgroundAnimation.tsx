import React from 'react';

const NUM_BUBBLES = 8; // Reduced from previous dynamic creation

const BackgroundAnimation: React.FC = () => {
  return (
    <div className="floating-elements">
      {Array.from({ length: NUM_BUBBLES }).map((_, i) => {
        const size = Math.random() * 80 + 40;
        const startX = Math.random() * 100;
        const hue = Math.random() * 60 - 30;
        const duration = 8 + Math.random() * 4;
        const delay = Math.random() * 4;
        
        return (
          <div
            key={i}
            className="absolute"
            style={{
              left: `${startX}%`,
              bottom: '-100px',
              width: size,
              height: size,
              borderRadius: '50%',
              background: `linear-gradient(
                45deg,
                hsl(${220 + hue}, 100%, 97%),
                hsl(${240 + hue}, 100%, 97%)
              )`,
              backdropFilter: 'blur(8px)',
              animation: `floatingBubble ${duration}s cubic-bezier(0.4, 0, 0.2, 1) ${delay}s infinite`,
              transform: `translate(${(Math.random() - 0.5) * 300}px, ${-Math.random() * 300}px)`,
            }}
          />
        );
      })}
    </div>
  );
};

export default BackgroundAnimation; 