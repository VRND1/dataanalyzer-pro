import React from 'react';

interface TextContainerProps {
  children: React.ReactNode;
  maxLines?: number;
  className?: string;
}

export function TextContainer({ children, maxLines = 3, className = '' }: TextContainerProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [hasOverflow, setHasOverflow] = React.useState(false);

  React.useEffect(() => {
    const checkOverflow = () => {
      if (containerRef.current) {
        const element = containerRef.current;
        setHasOverflow(
          element.scrollHeight > element.clientHeight ||
          element.scrollWidth > element.clientWidth
        );
      }
    };

    const resizeObserver = new ResizeObserver(checkOverflow);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => resizeObserver.disconnect();
  }, []);

  return (
    <div
      ref={containerRef}
      className={`
        relative
        ${maxLines ? 'line-clamp-' + maxLines : ''}
        ${hasOverflow ? 'has-overflow' : ''}
        ${className}
      `}
      style={{
        display: '-webkit-box',
        WebkitLineClamp: maxLines,
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden'
      }}
    >
      {children}
      {hasOverflow && (
        <button 
          className="absolute bottom-0 right-0 px-2 py-1 text-xs text-teal-600 bg-white/90 hover:bg-white rounded shadow-sm"
          onClick={() => setHasOverflow(false)}
        >
          Read More
        </button>
      )}
    </div>
  );
}