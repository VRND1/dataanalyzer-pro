import React, { useRef, useState } from 'react';
import { motion, useInView, useMotionValue, useTransform } from 'framer-motion';
import { 
  Zap, 
  LineChart, 
  PieChart, 
  FlaskConical, 
  FileQuestion, 
  Users, 
  Lock, 
  CloudCog,
  Sparkles,
  ArrowRight,
  Star,
  Layers,
  Orbit
} from 'lucide-react';

// Ultra-modern FeatureCard with 3D effects
interface FeatureCardProps {
  icon: React.ReactElement;
  title: string;
  description: string;
  index: number;
}

const FeatureCard = ({ icon, title, description, index }: FeatureCardProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  
  const rotateX = useTransform(mouseY, [-100, 100], [10, -10]);
  const rotateY = useTransform(mouseX, [-100, 100], [-10, 10]);

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    mouseX.set(event.clientX - centerX);
    mouseY.set(event.clientY - centerY);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 100, rotateX: -15 }}
      whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
      transition={{ 
        duration: 0.8, 
        delay: index * 0.15,
        type: "spring",
        stiffness: 100,
        damping: 15
      }}
      viewport={{ once: true, margin: "-50px" }}
      className="relative group perspective-1000"
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <motion.div
        style={{ rotateX, rotateY }}
        whileHover={{ z: 50, scale: 1.05 }}
        className="relative bg-gradient-to-br from-white/95 via-white/90 to-white/85 backdrop-blur-2xl rounded-3xl p-8 shadow-2xl hover:shadow-4xl transition-all duration-700 border border-white/30 overflow-hidden h-full transform-gpu"
      >
        {/* Animated background mesh */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10" />
          <div className="absolute top-0 left-0 w-full h-full bg-mesh-pattern opacity-20" />
        </div>

        {/* Floating light orb */}
        <motion.div
          animate={isHovered ? { 
            scale: [1, 1.2, 1], 
            opacity: [0.3, 0.6, 0.3],
            rotate: [0, 180, 360]
          } : {}}
          transition={{ duration: 3, repeat: Infinity }}
          className="absolute top-4 right-4 w-16 h-16 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full blur-xl opacity-0 group-hover:opacity-30"
        />

        {/* Premium icon container */}
        <motion.div 
          className="relative mb-8 z-10"
          whileHover={{ rotateY: 180 }}
          transition={{ duration: 0.6 }}
        >
          <div className="relative w-20 h-20 mx-auto">
            {/* Main icon background */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 rounded-2xl shadow-xl group-hover:shadow-2xl transition-all duration-500 transform group-hover:rotate-6" />
            
            {/* Glowing border */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 rounded-2xl blur-md opacity-0 group-hover:opacity-75 transition-opacity duration-500" />
            
            {/* Icon */}
            <div className="relative w-full h-full flex items-center justify-center text-white z-10 rounded-2xl overflow-hidden">
              {/* Shimmer effect */}
              <motion.div 
                animate={{ x: [-100, 200] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-12 opacity-0 group-hover:opacity-100"
              />
              <motion.div
                whileHover={{ scale: 1.1 }}
                className="relative z-10"
              >
                {React.cloneElement(icon, { size: 28 })}
              </motion.div>
            </div>

            {/* Orbiting particles */}
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={i}
                animate={isHovered ? {
                  rotate: [0, 360],
                  scale: [0.5, 1, 0.5]
                } : {}}
                transition={{
                  duration: 4,
                  delay: i * 0.5,
                  repeat: Infinity,
                  ease: "linear"
                }}
                className="absolute w-2 h-2 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full opacity-0 group-hover:opacity-100"
                style={{
                  top: '50%',
                  left: '50%',
                  transform: `translate(-50%, -50%) translateX(${40 + i * 8}px)`
                }}
              />
            ))}
          </div>
        </motion.div>

        {/* Content */}
        <div className="relative z-10">
          <motion.h3 
            className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-4 group-hover:from-blue-600 group-hover:to-purple-600 transition-all duration-500"
            whileHover={{ scale: 1.05 }}
          >
            {title}
          </motion.h3>
          
          <p className="text-gray-600 leading-relaxed mb-6 group-hover:text-gray-700 transition-colors duration-300">
            {description}
          </p>
          
          {/* Enhanced CTA */}
          <motion.div 
            className="flex items-center justify-between opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-y-4 group-hover:translate-y-0"
            whileHover={{ scale: 1.02 }}
          >
            <div className="flex items-center text-blue-600 font-semibold cursor-pointer">
              <span>Explore</span>
              <motion.div
                whileHover={{ x: 5 }}
                className="ml-2"
              >
                <ArrowRight className="w-4 h-4" />
              </motion.div>
            </div>
            <div className="flex space-x-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-3 h-3 fill-yellow-400 text-yellow-400" />
              ))}
            </div>
          </motion.div>
        </div>

        {/* Interactive corner decoration */}
        <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-blue-500/20 to-transparent rounded-bl-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <div className="absolute bottom-0 left-0 w-16 h-16 bg-gradient-to-tr from-purple-500/20 to-transparent rounded-tr-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      </motion.div>
    </motion.div>
  );
};

const Features = () => {
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });
  
  const features = [
    {
      icon: <Zap />,
      title: "AI Data Interpreter",
      description: "Our AI automatically interprets complex data patterns and presents findings in plain language anyone can understand."
    },
    {
      icon: <LineChart />,
      title: "Predictive Analytics",
      description: "Forecast future trends with our predictive models that learn from your historical data."
    },
    {
      icon: <PieChart />,
      title: "Visual Dashboard",
      description: "Create beautiful, interactive visualizations without writing a single line of code."
    },
    {
      icon: <FileQuestion />,
      title: "Natural Language Queries",
      description: "Ask questions about your data in plain English and get instant answers."
    },
    {
      icon: <FlaskConical />,
      title: "Automated Insights",
      description: "Receive automated insights about your data without having to hunt for them."
    },
    {
      icon: <Users />,
      title: "Collaboration Tools",
      description: "Share insights with your team and collaborate on analysis in real-time."
    },
    {
      icon: <Lock />,
      title: "Enterprise Security",
      description: "Bank-grade encryption and compliance with major security standards to keep your data safe."
    },
    {
      icon: <CloudCog />,
      title: "Integration Ecosystem",
      description: "Connect with 200+ data sources and export to your favorite tools seamlessly."
    }
  ];

  return (
    <section 
      id="features" 
      className="relative min-h-screen py-32 overflow-hidden"
    >
      {/* Ultra-modern animated background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        {/* Animated mesh gradient */}
        <div className="absolute inset-0 opacity-70">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/30 via-purple-600/30 to-pink-600/30 animate-pulse" />
        </div>
        
        {/* Dynamic floating elements */}
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={i}
            animate={{
              y: [0, -100, 0],
              x: [0, 50, 0],
              rotate: [0, 180, 360],
              scale: [1, 1.2, 1]
            }}
            transition={{
              duration: 8 + i * 2,
              repeat: Infinity,
              delay: i * 0.5,
              ease: "easeInOut"
            }}
            className="absolute w-2 h-2 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full opacity-60"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`
            }}
          />
        ))}

        {/* Large floating orbs */}
        <motion.div
          animate={{ 
            scale: [1, 1.3, 1],
            opacity: [0.1, 0.3, 0.1],
            rotate: [0, 360]
          }}
          transition={{ duration: 20, repeat: Infinity }}
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full blur-3xl"
        />
        
        <motion.div
          animate={{ 
            scale: [1.2, 1, 1.2],
            opacity: [0.1, 0.2, 0.1],
            rotate: [360, 0]
          }}
          transition={{ duration: 25, repeat: Infinity }}
          className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gradient-to-r from-pink-500/20 to-blue-500/20 rounded-full blur-3xl"
        />
      </div>

      <div className="container mx-auto px-4 md:px-6 relative z-10">
        {/* Hero header with advanced animations */}
        <motion.div 
          ref={sectionRef}
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          className="max-w-6xl mx-auto text-center mb-24 relative"
        >
          {/* Floating decorative elements */}
          <motion.div
            animate={{ 
              rotate: [0, 360],
              scale: [1, 1.1, 1]
            }}
            transition={{ duration: 10, repeat: Infinity }}
            className="absolute -top-20 -left-20 text-blue-400/30"
          >
            <Orbit size={120} />
          </motion.div>
          
          <motion.div
            animate={{ 
              rotate: [360, 0],
              scale: [1.1, 1, 1.1]
            }}
            transition={{ duration: 12, repeat: Infinity }}
            className="absolute -top-16 -right-24 text-purple-400/30"
          >
            <Layers size={100} />
          </motion.div>

          {/* Premium badge */}
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.8 }}
            animate={isInView ? { opacity: 1, y: 0, scale: 1 } : {}}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="inline-flex items-center bg-gradient-to-r from-blue-600/20 to-purple-600/20 backdrop-blur-xl px-6 py-3 rounded-full border border-white/20 mb-8"
          >
            <Sparkles className="w-4 h-4 text-yellow-400 mr-2" />
            <span className="text-white font-semibold tracking-wider text-sm uppercase">
              Next-Gen Features
            </span>
            <div className="ml-2 px-2 py-1 bg-gradient-to-r from-yellow-400 to-orange-400 text-black text-xs font-bold rounded-full">
              NEW
            </div>
          </motion.div>

          {/* Main heading with text effects */}
          <motion.h2 
            initial={{ opacity: 0, y: 50 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 1, delay: 0.4 }}
            className="text-5xl md:text-8xl font-black mb-8 leading-tight"
          >

          </motion.h2>

          
        </motion.div>

        {/* Premium features grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8 mb-20">
          {features.map((feature, index) => (
            <FeatureCard
              key={index}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
              index={index}
            />
          ))}
        </div>

        
      </div>
    </section>
  );
};

export default Features;