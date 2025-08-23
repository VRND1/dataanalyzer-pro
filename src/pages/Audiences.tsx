import React from 'react';
import { motion, useInView } from 'framer-motion';
import { Briefcase, TrendingUp, PieChart, ShoppingBag, GraduationCap, Heart, ArrowRight, Sparkles } from 'lucide-react';

const AudienceCard: React.FC<{
  icon: React.ReactNode;
  title: string;
  description: string;
  useCases: string[];
  index: number;
  gradient: string;
}> = ({ icon, title, description, useCases, index, gradient }) => {
  const cardRef = React.useRef<HTMLDivElement>(null);
  const isCardInView = useInView(cardRef, { once: true, margin: "-50px" });
  const [isHovered, setIsHovered] = React.useState(false);

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ 
        opacity: isCardInView ? 1 : 0,
        y: isCardInView ? 0 : 30,
        scale: isCardInView ? 1 : 0.95,
        transition: { 
          duration: 0.7, 
          delay: index * 0.15,
          ease: [0.25, 0.46, 0.45, 0.94]
        }
      }}
      whileHover={{ 
        y: -12,
        scale: 1.02,
        transition: { duration: 0.3, ease: "easeOut" }
      }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="group relative overflow-hidden"
    >
      {/* Enhanced glass morphism background */}
      <div className="absolute inset-0 bg-white/80 backdrop-blur-xl rounded-2xl border border-white/20 shadow-lg"></div>
      
      {/* Dynamic gradient border */}
      <motion.div
        className={`absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${gradient}`}
        style={{ padding: '2px' }}
        animate={{
          background: isHovered ? 
            'linear-gradient(45deg, #667eea 0%, #764ba2 25%, #f093fb 50%, #f5576c 75%, #4facfe 100%)' :
            'transparent'
        }}
      >
        <div className="w-full h-full bg-white rounded-2xl"></div>
      </motion.div>
      
      <div className="relative p-8 z-10">
        {/* Enhanced icon container */}
        <motion.div
          className="relative mb-6"
          animate={{
            scale: isHovered ? 1.1 : 1,
            rotate: isHovered ? [0, -5, 5, 0] : 0
          }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
        >
          <div className={`w-16 h-16 rounded-2xl ${gradient} flex items-center justify-center relative overflow-hidden`}>
            <motion.div
              className="absolute inset-0 opacity-20"
              animate={{
                scale: isHovered ? [1, 1.2, 1] : 1,
                rotate: isHovered ? 360 : 0
              }}
              transition={{ duration: 2, repeat: isHovered ? Infinity : 0 }}
            >
              <Sparkles className="w-full h-full" />
            </motion.div>
            <motion.div
              animate={{
                rotate: isHovered ? 360 : 0,
                scale: isHovered ? 1.1 : 1
              }}
              transition={{ duration: 0.8, ease: "easeInOut" }}
              className="relative z-10"
            >
              {icon}
            </motion.div>
          </div>
        </motion.div>

        {/* Enhanced typography */}
        <motion.h3 
          animate={{ 
            y: isHovered ? -3 : 0,
            color: isHovered ? '#1f2937' : '#111827'
          }}
          className="text-2xl font-bold mb-4 leading-tight"
        >
          {title}
        </motion.h3>

        <motion.p 
          animate={{ 
            opacity: isHovered ? 1 : 0.8,
            y: isHovered ? -2 : 0
          }}
          className="text-gray-600 mb-6 leading-relaxed text-base"
        >
          {description}
        </motion.p>

        {/* Enhanced use cases list */}
        <motion.div 
          className="space-y-3 mb-8"
          animate={{ x: isHovered ? 6 : 0 }}
          transition={{ duration: 0.3 }}
        >
          {useCases.map((useCase, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: -20 }}
              animate={{ 
                opacity: isCardInView ? 1 : 0,
                x: isCardInView ? 0 : -20
              }}
              transition={{ delay: 0.3 + idx * 0.1, duration: 0.5 }}
              className="flex items-center group/item"
            >
              <motion.div
                className="w-2 h-2 rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600 mr-3 flex-shrink-0"
                whileHover={{ scale: 1.5 }}
                transition={{ duration: 0.2 }}
              />
              <motion.span 
                className="text-gray-700 font-medium group-hover/item:text-gray-900 transition-colors duration-200"
                whileHover={{ x: 2 }}
              >
                {useCase}
              </motion.span>
            </motion.div>
          ))}
        </motion.div>

        {/* Enhanced CTA button */}
        <motion.button
          className="group/btn relative overflow-hidden bg-gradient-to-r from-slate-800 to-slate-900 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl w-full"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300"
            initial={false}
          />
          <span className="relative z-10 flex items-center justify-center gap-2">
            Explore Solutions
            <motion.div
              animate={{ x: isHovered ? 4 : 0 }}
              transition={{ duration: 0.3 }}
            >
              <ArrowRight className="w-4 h-4" />
            </motion.div>
          </span>
        </motion.button>
      </div>
    </motion.div>
  );
};

const Audiences: React.FC = () => {
  const sectionRef = React.useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });

  const audiences = [
    {
      icon: <Briefcase className="w-7 h-7 text-white" />,
      title: "Business Executives",
      description: "Transform raw data into strategic insights that drive executive decision-making and business growth.",
      useCases: [
        "Real-time KPI dashboards",
        "Predictive performance forecasting",
        "Comprehensive competitive analysis"
      ],
      gradient: "bg-gradient-to-br from-blue-500 to-blue-700"
    },
    {
      icon: <TrendingUp className="w-7 h-7 text-white" />,
      title: "Marketing Teams",
      description: "Unlock customer behavior patterns and campaign performance metrics to maximize marketing ROI.",
      useCases: [
        "Multi-channel campaign analytics",
        "Advanced customer segmentation",
        "Attribution modeling & optimization"
      ],
      gradient: "bg-gradient-to-br from-purple-500 to-purple-700"
    },
    {
      icon: <PieChart className="w-7 h-7 text-white" />,
      title: "Financial Analysts",
      description: "Streamline financial modeling, risk assessment, and scenario planning with powerful analytics tools.",
      useCases: [
        "Dynamic financial forecasting",
        "Automated risk assessment",
        "Real-time anomaly detection"
      ],
      gradient: "bg-gradient-to-br from-emerald-500 to-emerald-700"
    },
    {
      icon: <ShoppingBag className="w-7 h-7 text-white" />,
      title: "Sales Teams",
      description: "Optimize sales processes and identify high-value opportunities with data-driven sales intelligence.",
      useCases: [
        "AI-powered lead scoring",
        "Accurate sales forecasting",
        "Territory & resource optimization"
      ],
      gradient: "bg-gradient-to-br from-orange-500 to-orange-700"
    },
    {
      icon: <GraduationCap className="w-7 h-7 text-white" />,
      title: "Research Teams",
      description: "Accelerate research workflows with automated data processing and statistical analysis capabilities.",
      useCases: [
        "Intelligent data exploration",
        "Automated hypothesis testing",
        "Advanced trend analysis"
      ],
      gradient: "bg-gradient-to-br from-indigo-500 to-indigo-700"
    },
    {
      icon: <Heart className="w-7 h-7 text-white" />,
      title: "Healthcare Providers",
      description: "Enhance patient care and operational efficiency through healthcare analytics and insights.",
      useCases: [
        "Patient risk stratification",
        "Treatment outcome optimization",
        "Resource allocation planning"
      ],
      gradient: "bg-gradient-to-br from-red-500 to-red-700"
    }
  ];

  return (
    <section 
      id="audiences"
      className="py-24 relative overflow-hidden"
      ref={sectionRef}
      style={{
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)'
      }}
    >
      {/* Enhanced background elements */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={isInView ? { scale: 1, opacity: 0.1 } : {}}
        transition={{ duration: 2, delay: 0.2 }}
        className="absolute top-20 -right-32 w-96 h-96 bg-gradient-to-r from-blue-400 to-purple-600 rounded-full blur-3xl"
      />
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={isInView ? { scale: 1, opacity: 0.1 } : {}}
        transition={{ duration: 2, delay: 0.6 }}
        className="absolute bottom-20 -left-32 w-96 h-96 bg-gradient-to-r from-emerald-400 to-blue-600 rounded-full blur-3xl"
      />
      
      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 20 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-white/30 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [-20, -100, -20],
              opacity: [0, 1, 0],
              scale: [0, 1, 0]
            }}
            transition={{
              duration: Math.random() * 3 + 2,
              repeat: Infinity,
              delay: Math.random() * 2
            }}
          />
        ))}
      </div>

      <div className="container mx-auto px-6 md:px-8 max-w-7xl relative z-10">
        {/* Enhanced header */}
        <motion.div 
          className="max-w-4xl mx-auto text-center mb-20"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          <motion.span 
            className="inline-block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 font-bold tracking-wider uppercase text-sm mb-4"
            animate={{ backgroundPosition: isInView ? ['0%', '100%', '0%'] : '0%' }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            ✨ Who It's Built For
          </motion.span>
          
          <motion.h2 
            className="text-4xl md:text-6xl font-bold mb-8 leading-tight"
            style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}
            animate={{ backgroundPosition: ['0%', '100%', '0%'] }}
            transition={{ duration: 5, repeat: Infinity }}
          >
            Empowering Every Team
            <br />
            <span className="text-gray-800">with Data Intelligence</span>
          </motion.h2>
          
          <motion.p 
            className="text-xl md:text-2xl text-gray-600 leading-relaxed max-w-3xl mx-auto"
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : {}}
            transition={{ delay: 0.3, duration: 0.8 }}
          >
            DataAnalyzer Pro democratizes advanced analytics, making powerful data insights accessible to professionals across every industry and skill level.
          </motion.p>
        </motion.div>

        {/* Enhanced grid */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 lg:gap-10"
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
        >
          {audiences.map((audience, index) => (
            <AudienceCard
              key={index}
              icon={audience.icon}
              title={audience.title}
              description={audience.description}
              useCases={audience.useCases}
              index={index}
              gradient={audience.gradient}
            />
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default Audiences;