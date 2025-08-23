import React, { useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  index: number;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, description, index }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(cardRef, { once: true, margin: "-100px" });
  const [isHovered, setIsHovered] = useState(false);

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        duration: 0.6,
        delay: index * 0.1,
        ease: [0.43, 0.13, 0.23, 0.96]
      }
    }
  };

  return (
    <motion.div 
      ref={cardRef}
      variants={cardVariants}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`
        relative bg-white rounded-xl p-6
        transform transition-all duration-300
        hover:shadow-xl hover:-translate-y-1
        group cursor-pointer h-full flex flex-col
      `}
    >
      {/* Gradient border */}
      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary-400 via-accent-400 to-secondary-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10 blur"></div>
      
      {/* Background with glass effect */}
      <div className="absolute inset-[1px] rounded-xl bg-white"></div>
      
      {/* Content */}
      <div className="relative flex flex-col h-full">
        {/* Decorative background circle */}
        <motion.div
          animate={{
            scale: isHovered ? 1.2 : 1,
            rotate: isHovered ? 90 : 0
          }}
          transition={{ duration: 0.3 }}
          className="absolute -right-4 -top-4 w-24 h-24 bg-gradient-to-br from-gray-200 to-gray-300 rounded-full opacity-20 blur-xl"
        />

        {/* Icon with animation */}
        <motion.div
          animate={{ 
            rotate: isHovered ? 360 : 0,
            scale: isHovered ? 1.1 : 1
          }}
          transition={{ duration: 0.3 }}
          className="relative z-10 self-start mb-4"
        >
          {/* Icon container */}
          <div className={`
            bg-gray-100 rounded-full w-12 h-12 flex items-center justify-center 
            transition-all duration-500 group-hover:bg-gray-200 group-hover:scale-110 
            group-hover:rotate-12
          `}>
            {icon}
          </div>
        </motion.div>
        
        {/* Text content */}
        <div className="flex flex-col flex-grow">
          {/* Title */}
          <motion.h3 
            animate={{ 
              color: isHovered ? 'rgb(64, 64, 64)' : 'rgb(26, 26, 26)',
              y: isHovered ? -2 : 0
            }}
            transition={{ duration: 0.2 }}
            className="text-lg font-bold mb-2 relative z-10"
          >
            {title}
          </motion.h3>
          
          {/* Description */}
          <motion.p 
            animate={{ opacity: isHovered ? 0.9 : 0.7 }}
            transition={{ duration: 0.2 }}
            className="text-gray-600 relative z-10 flex-grow"
          >
            {description}
          </motion.p>
        </div>
      </div>
    </motion.div>
  );
};

export default FeatureCard; 