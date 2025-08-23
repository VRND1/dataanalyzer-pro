import React from 'react';
import { motion, useInView } from 'framer-motion';
import { 
  Database, 
  BarChart3, 
  Brain, 
  TrendingUp, 
  Share2,
  ArrowRight,
  Play,
  CheckCircle,
  Zap
} from 'lucide-react';

const HowItWorks: React.FC = () => {
  const sectionRef = React.useRef<HTMLDivElement>(null);
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });
  const [isPlaying, setIsPlaying] = React.useState(false);

  const handleVideoPlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        videoRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  const handleVideoEnded = () => {
    setIsPlaying(false);
  };

  const steps = [
    {
      icon: <Database className="h-12 w-12 text-white" />,
      title: "Connect & Import Data",
      description: "Seamlessly connect to 100+ data sources including SQL databases, CSV files, Excel spreadsheets, APIs, and cloud storage. Our intelligent data connector handles formats from CRM systems to financial databases.",
      color: "bg-gradient-to-br from-blue-600 to-blue-800",
      number: "01",
      features: ["SQL, NoSQL, APIs", "CSV, Excel, JSON", "Real-time sync"]
    },
    {
      icon: <Brain className="h-12 w-12 text-white" />,
      title: "AI-Powered Analysis",
      description: "Advanced machine learning algorithms automatically detect patterns, outliers, and correlations in your data. Get statistical insights, predictive models, and automated data quality assessments.",
      color: "bg-gradient-to-br from-purple-600 to-purple-800",
      number: "02",
      features: ["Pattern detection", "Predictive modeling", "Data quality checks"]
    },
    {
      icon: <BarChart3 className="h-12 w-12 text-white" />,
      title: "Interactive Visualizations",
      description: "Create stunning, interactive dashboards with 50+ chart types. From simple bar charts to complex heat maps and scatter plots. All visualizations are automatically optimized for your data types.",
      color: "bg-gradient-to-br from-green-600 to-green-800",
      number: "03",
      features: ["50+ chart types", "Interactive filters", "Custom styling"]
    },
    {
      icon: <TrendingUp className="h-12 w-12 text-white" />,
      title: "Generate Insights",
      description: "AI automatically generates business insights, trend analysis, and forecasts. Get natural language explanations of your data with actionable recommendations for decision making.",
      color: "bg-gradient-to-br from-orange-600 to-orange-800",
      number: "04",
      features: ["Trend forecasting", "Natural language insights", "Business recommendations"]
    }
  ];

  const capabilities = [
    "Statistical Analysis & Hypothesis Testing",
    "Time Series Forecasting",
    "Customer Segmentation & Clustering",
    "A/B Testing & Experimentation",
    "Regression & Classification Models",
    "Automated Report Generation"
  ];

  return (
    <section 
      id="how-it-works" 
      className="py-20 bg-gradient-to-br from-slate-50 via-white to-blue-50 relative overflow-hidden"
      ref={sectionRef}
    >
      {/* Animated background elements */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={isInView ? { scale: 1, opacity: 0.1 } : {}}
        transition={{ duration: 2, delay: 0.2 }}
        className="absolute top-20 -right-20 w-96 h-96 bg-blue-400 rounded-full blur-3xl"
      />
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={isInView ? { scale: 1, opacity: 0.1 } : {}}
        transition={{ duration: 2, delay: 0.4 }}
        className="absolute bottom-20 -left-20 w-96 h-96 bg-purple-400 rounded-full blur-3xl"
      />
      
      {/* Floating data elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-blue-400 rounded-full opacity-20"
            initial={{ 
              x: Math.random() * window.innerWidth, 
              y: Math.random() * window.innerHeight 
            }}
            animate={{ 
              y: [0, -20, 0],
              opacity: [0.2, 0.5, 0.2]
            }}
            transition={{ 
              duration: 3 + Math.random() * 2, 
              repeat: Infinity,
              delay: Math.random() * 2
            }}
          />
        ))}
      </div>

      <div className="container mx-auto px-4 md:px-6 relative z-20">
        {/* Header */}
        <motion.div 
          className="max-w-4xl mx-auto text-center mb-20"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <motion.div 
            className="flex items-center justify-center gap-2 mb-4"
            initial={{ opacity: 0, y: 10 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Zap className="h-5 w-5 text-blue-600" />
            <span className="text-blue-600 font-semibold tracking-wider uppercase text-sm">
              Data Analysis Workflow
            </span>
          </motion.div>
          
          <motion.h2 
            className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent mt-3 mb-6"
            initial={{ opacity: 0, y: 10 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            From Raw Data to Strategic Insights
          </motion.h2>
          
          <motion.p 
            className="text-xl text-slate-600 leading-relaxed"
            initial={{ opacity: 0, y: 10 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            Transform your data into powerful business intelligence with our comprehensive analytics platform. 
            No SQL knowledge required - just connect, analyze, and discover insights that drive growth.
          </motion.p>
        </motion.div>

        {/* Process Steps */}
        <div className="relative">
          {/* Connection Flow Line */}
          <motion.div 
            className="hidden lg:block absolute top-1/2 left-8 right-8 h-0.5 bg-gradient-to-r from-blue-200 via-purple-200 via-green-200 to-orange-200 -translate-y-1/2"
            initial={{ scaleX: 0 }}
            animate={isInView ? { scaleX: 1 } : {}}
            transition={{ duration: 2, delay: 0.8 }}
          />
          
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <motion.div 
                key={index} 
                className="relative group"
                initial={{ opacity: 0, y: 30 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.7, delay: 0.2 + index * 0.15 }}
              >
                {/* Large background number */}
                <motion.div 
                  className="absolute -top-8 left-1/2 transform -translate-x-1/2 text-[140px] font-black bg-gradient-to-br from-slate-100 to-slate-200 bg-clip-text text-transparent select-none opacity-30 group-hover:opacity-50 transition-opacity duration-500"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={isInView ? { opacity: 0.3, scale: 1 } : {}}
                  transition={{ duration: 1, delay: 0.4 + index * 0.15 }}
                >
                  {step.number}
                </motion.div>
                
                <div className="relative z-10 bg-white rounded-2xl p-6 shadow-lg border border-slate-100 hover:shadow-2xl transition-all duration-500 group-hover:-translate-y-2">
                  {/* Icon */}
                  <motion.div 
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    transition={{ type: "spring", stiffness: 300 }}
                    className={`
                      flex items-center justify-center w-16 h-16 rounded-xl 
                      ${step.color} shadow-lg mb-6 mx-auto
                      group-hover:shadow-xl transition-shadow duration-300
                    `}
                  >
                    {step.icon}
                  </motion.div>
                  
                  {/* Content */}
                  <div className="text-center">
                    <h3 className="text-xl font-bold text-slate-800 mb-3 group-hover:text-slate-900 transition-colors">
                      {step.title}
                    </h3>
                    <p className="text-slate-600 text-sm leading-relaxed mb-4 group-hover:text-slate-700 transition-colors">
                      {step.description}
                    </p>
                    
                    {/* Features */}
                    <div className="space-y-2">
                      {step.features.map((feature, featureIndex) => (
                        <motion.div
                          key={featureIndex}
                          className="flex items-center justify-center gap-2 text-xs text-slate-500"
                          initial={{ opacity: 0, x: -10 }}
                          animate={isInView ? { opacity: 1, x: 0 } : {}}
                          transition={{ duration: 0.5, delay: 0.6 + index * 0.1 + featureIndex * 0.1 }}
                        >
                          <CheckCircle className="h-3 w-3 text-green-500" />
                          {feature}
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Analytics Capabilities */}
        <motion.div
          className="mt-20 bg-white rounded-3xl p-8 shadow-xl border border-slate-100"
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 1 }}
        >
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-slate-800 mb-4">
              Advanced Analytics Capabilities
            </h3>
            <p className="text-slate-600">
              Professional-grade statistical analysis tools at your fingertips
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {capabilities.map((capability, index) => (
              <motion.div
                key={index}
                className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-slate-50 to-blue-50 border border-slate-100 hover:border-blue-200 transition-all duration-300 hover:shadow-md"
                initial={{ opacity: 0, x: -20 }}
                animate={isInView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.6, delay: 1.2 + index * 0.1 }}
                whileHover={{ scale: 1.02 }}
              >
                <div className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-slate-700 font-medium text-sm">{capability}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Demo Dashboard */}
        <motion.div 
          className="mt-24 text-center relative"
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 1.4 }}
        >
          <div className="mb-8">
            <h3 className="text-2xl font-bold text-slate-800 mb-4">
              See DataAnalyzer Pro in Action
            </h3>
            <p className="text-slate-600 max-w-2xl mx-auto">
              Watch how easy it is to transform complex datasets into beautiful, 
              interactive dashboards that reveal the stories hidden in your data.
            </p>
          </div>
          
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/20 to-purple-500/20 rounded-3xl blur-xl group-hover:blur-2xl transition-all duration-300"></div>
            <div className="relative bg-white p-4 rounded-3xl shadow-2xl border border-slate-200 group-hover:shadow-3xl transition-shadow duration-500">
              <div className="relative overflow-hidden rounded-2xl">
                <video 
                  ref={videoRef}
                  className="w-full h-[800px] object-cover transform transition-transform duration-700 group-hover:scale-105"
                  poster="/images/data-cover-web.jpg"
                  preload="metadata"
                  onEnded={handleVideoEnded}
                >
                  <source src="/videos/IMG_8037.MP4" type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
                {/* Play button overlay */}
                <div 
                  className={`absolute inset-0 bg-black/20 transition-opacity duration-300 flex items-center justify-center ${
                    isPlaying ? 'opacity-0' : 'opacity-100 group-hover:opacity-100'
                  }`}
                  onClick={handleVideoPlay}
                >
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="bg-white/90 backdrop-blur-sm rounded-full p-6 cursor-pointer shadow-xl"
                  >
                    <Play className="h-8 w-8 text-blue-600 ml-1" />
                  </motion.div>
                </div>
              </div>
            </div>
          </div>
          
          {/* CTA Buttons */}
          <div className="mt-12 flex flex-col sm:flex-row gap-4 justify-center">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-blue-600 text-white px-8 py-4 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2 group"
            >
              Start Free Analysis
              <ArrowRight className="h-5 w-5 transform transition-transform duration-300 group-hover:translate-x-1" />
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-white text-slate-700 px-8 py-4 rounded-xl font-semibold border-2 border-slate-200 hover:border-blue-300 transition-all duration-300 flex items-center justify-center gap-2 group"
            >
              <Share2 className="h-5 w-5" />
              Schedule Demo
            </motion.button>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default HowItWorks;