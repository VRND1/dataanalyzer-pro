import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { 
  Menu, X, Hexagon, ArrowRight, Zap,
  Play, Users, TrendingUp, Brain, Target, Database, BarChart3
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../components/ui/button';
import Spline from '@splinetool/react-spline';

const trustBadges = [
  { icon: <Brain size={16} className="text-indigo-600" />, text: "Advanced Analytics", color: "from-indigo-500/20 to-purple-500/20" },
  { icon: <Database size={16} className="text-blue-600" />, text: "Data Processing", color: "from-blue-500/20 to-cyan-500/20" },
  { icon: <TrendingUp size={16} className="text-emerald-600" />, text: "Trend Analysis", color: "from-emerald-500/20 to-green-500/20" },
  { icon: <Target size={16} className="text-amber-600" />, text: "Predictive Models", color: "from-amber-500/20 to-orange-500/20" },
  { icon: <BarChart3 size={16} className="text-pink-600" />, text: "Visual Analytics", color: "from-pink-500/20 to-rose-500/20" },
  { icon: <Zap size={16} className="text-teal-600" />, text: "Real-time Insights", color: "from-teal-500/20 to-cyan-500/20" }
];

const slides = [
  {
    id: 1,
    title: "Transform Raw",
    titleHighlight: "Data",
    subtitle: "Into Insights",
    // emoji: "📊",
    description: "Advanced data analysis tools for modern data analysts and business intelligence teams.",
    gradient: "from-indigo-600 via-purple-600 to-pink-600",
    bgGradient: "from-indigo-50 via-purple-50 to-pink-50"
  },
  {
    id: 2,
    title: "Statistical",
    titleHighlight: "Analysis",
    subtitle: "Made Easy",
    // emoji: "📈",
    description: "Comprehensive statistical analysis with regression, correlation, and hypothesis testing.",
    gradient: "from-blue-600 via-cyan-600 to-teal-600",
    bgGradient: "from-blue-50 via-cyan-50 to-teal-50"
  },
  {
    id: 3,
    title: "Predictive",
    titleHighlight: "Modeling",
    subtitle: "& Forecasting",
    // emoji: "🔮",
    description: "Build predictive models and time series forecasts with machine learning algorithms.",
    gradient: "from-orange-600 via-red-600 to-pink-600",
    bgGradient: "from-orange-50 via-red-50 to-pink-50"
  },
  {
    id: 4,
    title: "Data",
    titleHighlight: "Visualization",
    subtitle: "& Reporting",
    // emoji: "📋",
    description: "Create interactive charts, dashboards, and comprehensive data reports.",
    gradient: "from-emerald-600 via-green-600 to-teal-600",
    bgGradient: "from-emerald-50 via-green-50 to-teal-50"
  }
];

const stats = [
  { value: "1M+", label: "Data Points Processed", icon: <Database className="w-6 h-6" />, color: "text-blue-600" },
  { value: "50K+", label: "Analyses Completed", icon: <BarChart3 className="w-6 h-6" />, color: "text-emerald-600" },
  { value: "99.9%", label: "Accuracy Rate", icon: <Target className="w-6 h-6" />, color: "text-purple-600" }
];

const Header: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);
  const statsRef = React.useRef<HTMLDivElement>(null);

  const toggleMenu = () => setIsOpen(!isOpen);

  React.useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [slides.length]);

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (statsRef.current) {
      observer.observe(statsRef.current);
    }

    return () => observer.disconnect();
  }, []);

  React.useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const currentSlideData = slides[currentSlide];

  return (
    <>
      {/* Enhanced Header with Dynamic Background */}
      <motion.header 
        className={`fixed w-full z-50 transition-all duration-500 ${
          isScrolled 
            ? 'bg-black/90 backdrop-blur-2xl shadow-2xl border-b border-white/10' 
            : 'bg-black/80 backdrop-blur-lg'
        }`}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex justify-between items-center py-4">
            {/* Enhanced Logo */}
            <Link to="/" className="flex items-center gap-3 group">
              <div className="relative">
                <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-teal-500/50 via-cyan-500/50 to-emerald-500/50 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
                <div className="relative transform transition-all duration-500 hover:scale-110">
                  <motion.div
                    whileHover={{ rotate: 180 }}
                    transition={{ duration: 0.5 }}
                  >
                    <Hexagon className="w-10 h-10 text-teal-400" strokeWidth={1.5} />
                    <Hexagon className="w-7 h-7 text-cyan-300 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rotate-90" strokeWidth={1.5} />
                  </motion.div>
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-indigo-200 to-purple-200 bg-clip-text text-transparent">
                  DataAnalyzer Pro
                </span>
                {/* <span className="text-xs text-indigo-300 font-medium">Enterprise Analytics</span> */}
              </div>
            </Link>

            {/* Enhanced Desktop Nav */}
            <nav className="hidden lg:flex items-center space-x-8">
              {[
                { label: "Features", href: "#features", icon: <BarChart3 className="w-4 h-4" /> },
                { label: "How It Works", href: "#how-it-works", icon: <TrendingUp className="w-4 h-4" /> },
                { label: "Built for", href: "#audiences", icon: <Users className="w-4 h-4" /> },
                { label: "Pricing", href: "#pricing", icon: <Target className="w-4 h-4" /> },

              ].map((item) => (
                <motion.a
                  key={item.label}
                  href={item.href}
                  className="flex items-center gap-2 text-white/80 hover:text-white font-semibold transition-all duration-300 px-4 py-2 rounded-xl hover:bg-white/10 backdrop-blur-sm cursor-pointer"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={(e) => {
                    e.preventDefault();
                    const element = document.querySelector(item.href);
                    if (element) {
                      const headerHeight = 80; // Approximate header height
                      const elementPosition = element.getBoundingClientRect().top + window.pageYOffset - headerHeight;
                      window.scrollTo({
                        top: elementPosition,
                        behavior: 'smooth'
                      });
                    }
                  }}
                >
                  {item.icon}
                  {item.label}
                </motion.a>
              ))}
            </nav>

            {/* Enhanced Action Buttons */}
            <div className="hidden md:flex items-center space-x-4">
              <motion.button
                className="text-white/80 hover:text-white font-semibold transition-all duration-300 px-6 py-2 rounded-xl hover:bg-white/10 backdrop-blur-sm"
                onClick={() => navigate('/login')}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Login
              </motion.button>
              <motion.button
                className="relative overflow-hidden bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white font-bold rounded-xl px-8 py-3 shadow-lg hover:shadow-xl transition-all duration-300"
                onClick={() => navigate('/signup')}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600"
                  whileHover={{ scale: 1.1 }}
                  transition={{ duration: 0.3 }}
                />
                <span className="relative z-10">Get Started</span>
              </motion.button>
            </div>

            {/* Enhanced Mobile Menu Button */}
            <motion.button
              onClick={toggleMenu}
              className="lg:hidden relative p-3 text-white focus:outline-none rounded-xl hover:bg-white/10 transition-all duration-300"
              whileTap={{ scale: 0.95 }}
            >
              <AnimatePresence mode="wait">
                {isOpen ? (
                  <motion.div
                    key="close"
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <X className="h-6 w-6" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="menu"
                    initial={{ rotate: 90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: -90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Menu className="h-6 w-6" />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
          </div>

          {/* Enhanced Mobile Dropdown */}
          <AnimatePresence>
            {isOpen && (
              <motion.div
                className="lg:hidden absolute top-full left-0 right-0 bg-black/95 backdrop-blur-2xl border-t border-white/10 shadow-2xl"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="p-6 space-y-6">
                  <nav className="space-y-4">
                    {[
                      { label: "Features", href: "#features", icon: <BarChart3 className="w-5 h-5" /> },
                      { label: "How It Works", href: "#how-it-works", icon: <TrendingUp className="w-5 h-5" /> },
                      { label: "For Teams", href: "#audiences", icon: <Users className="w-5 h-5" /> },
                      { label: "Pricing", href: "#pricing", icon: <Target className="w-5 h-5" /> },

                    ].map((item, index) => (
                      <motion.a
                        key={item.label}
                        href={item.href}
                        className="flex items-center gap-3 text-white hover:text-indigo-300 font-semibold transition-all duration-300 p-3 rounded-xl hover:bg-white/10 cursor-pointer"
                        onClick={(e) => {
                          e.preventDefault();
                          toggleMenu();
                          const element = document.querySelector(item.href);
                          if (element) {
                            const headerHeight = 80; // Approximate header height
                            const elementPosition = element.getBoundingClientRect().top + window.pageYOffset - headerHeight;
                            window.scrollTo({
                              top: elementPosition,
                              behavior: 'smooth'
                            });
                          }
                        }}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        {item.icon}
                        {item.label}
                      </motion.a>
                    ))}
                  </nav>
                  <div className="space-y-4 pt-4 border-t border-white/10">
                    <button
                      className="w-full text-white hover:text-indigo-300 font-semibold transition-all duration-300 p-3 rounded-xl hover:bg-white/10"
                      onClick={() => {
                        setIsOpen(false);
                        navigate('/login');
                      }}
                    >
                      Login
                    </button>
                    <button
                      className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-bold rounded-xl px-6 py-4 shadow-lg transition-all duration-300"
                      onClick={() => {
                        setIsOpen(false);
                        navigate('/signup');
                      }}
                    >
                      Get Started
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.header>

      {/* Enhanced Hero Section */}
      {!['/login', '/signup'].includes(location.pathname) && (
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
          {/* Dynamic Background with current slide colors */}
          <motion.div 
            className={`absolute inset-0 bg-gradient-to-br ${currentSlideData.bgGradient} transition-all duration-1000`}
            key={currentSlide}
          />

          {/* Spline 3D Scene with Enhanced Integration */}
          <div className="absolute inset-0 w-full h-full z-0 opacity-80">
            <Spline scene="https://prod.spline.design/ZEeGookO-CwCceAi/scene.splinecode" />
          </div>

          {/* Enhanced Animated Background Elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 bg-white/20 rounded-full"
                animate={{
                  y: [0, -100, 0],
                  x: [0, Math.random() * 100 - 50, 0],
                  opacity: [0, 1, 0]
                }}
                transition={{
                  duration: Math.random() * 5 + 3,
                  repeat: Infinity,
                  delay: Math.random() * 5
                }}
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`
                }}
              />
            ))}
          </div>

          {/* Main Content Container */}
          <div className="container mx-auto px-6 relative z-10 pt-32">
            <div className="max-w-6xl mx-auto">
              
              {/* Enhanced Trust Badges */}
              <div className="relative overflow-hidden mb-12">
                <motion.div 
                  className="flex gap-6 animate-marquee"
                  style={{ width: 'fit-content' }}
                >
                  {[...trustBadges, ...trustBadges].map((badge, index) => (
                    <motion.div
                      key={index}
                      className={`flex items-center px-6 py-3 bg-gradient-to-r ${badge.color} backdrop-blur-xl rounded-full shadow-xl border border-white/20`}
                      whileHover={{ scale: 1.05, y: -2 }}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <span className="mr-3">{badge.icon}</span>
                      <span className="text-sm font-bold text-gray-800 whitespace-nowrap">
                        {badge.text}
                      </span>
                    </motion.div>
                  ))}
                </motion.div>
              </div>

              {/* Enhanced Hero Content */}
              <div className="text-center mb-16">
                <div className="relative h-[300px] mb-8">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={currentSlide}
                      className="absolute inset-0 flex flex-col items-center justify-center"
                      initial={{ opacity: 0, y: 50, scale: 0.9 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -50, scale: 0.9 }}
                      transition={{ duration: 0.6, ease: "easeOut" }}
                    >
                      <div className="space-y-4">
                        <h1 className="text-5xl md:text-7xl lg:text-8xl font-black leading-none">
                          <span className="text-gray-900">
                            {currentSlideData.title}{' '}
                          </span>
                          <span className={`bg-gradient-to-r ${currentSlideData.gradient} bg-clip-text text-transparent`}>
                            {currentSlideData.titleHighlight}
                          </span>
                        </h1>
                        <div className="flex items-center justify-center gap-4">
                          <span className="text-4xl md:text-6xl font-bold text-gray-700">
                            {currentSlideData.subtitle}
                          </span>
                          
                        </div>
                      </div>
                    </motion.div>
                  </AnimatePresence>
                </div>

                <AnimatePresence mode="wait">
                  <motion.p 
                    key={`desc-${currentSlide}`}
                    className="text-xl md:text-3xl text-gray-700 max-w-4xl mx-auto mb-12 leading-relaxed font-medium"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4 }}
                  >
                    {currentSlideData.description}
                  </motion.p>
                </AnimatePresence>

                {/* Enhanced CTA Buttons */}
                <div className="flex flex-col sm:flex-row justify-center gap-6 mb-16">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Link to="/dashboard">
                      <Button 
                        variant="default" 
                        size="lg"
                        className={`relative overflow-hidden bg-gradient-to-r ${currentSlideData.gradient} text-white text-xl px-12 py-6 rounded-2xl shadow-2xl hover:shadow-3xl transition-all duration-300 font-bold`}
                        rightIcon={<ArrowRight className="ml-3 h-6 w-6" />}
                      >
                        <motion.div
                          className="absolute inset-0 bg-white/20"
                          whileHover={{ scale: 1.1, opacity: 0.3 }}
                          transition={{ duration: 0.3 }}
                        />
                        <span className="relative z-10">Start Data Analysis</span>
                      </Button>
                    </Link>
                  </motion.div>
                  
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button 
                      variant="outline" 
                      size="lg"
                      className="border-3 relative overflow-hidden group text-gray-800 border-gray-800 bg-white/80 backdrop-blur-sm text-xl px-12 py-6 rounded-2xl hover:bg-gray-800 hover:text-white transition-all duration-300 font-bold"
                      leftIcon={<Play className="mr-3 h-6 w-6" />}
                    >
                      <span className="relative z-10">Watch Demo</span>
                    </Button>
                  </motion.div>
                </div>

                {/* Slide Indicators */}
                <div className="flex justify-center gap-3 mb-16">
                  {slides.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentSlide(index)}
                      className={`w-3 h-3 rounded-full transition-all duration-300 ${
                        index === currentSlide 
                          ? `bg-gradient-to-r ${currentSlideData.gradient} scale-125` 
                          : 'bg-gray-400 hover:bg-gray-600'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Enhanced Stats Section */}
              <motion.div 
                ref={statsRef}
                className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto"
                initial={{ opacity: 0, y: 50 }}
                animate={isVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
                transition={{ duration: 0.8, staggerChildren: 0.2 }}
              >
                {stats.map((stat, index) => (
                  <motion.div
                    key={index}
                    className="bg-white/90 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/20 text-center group hover:bg-white/95 transition-all duration-300"
                    initial={{ opacity: 0, y: 30 }}
                    animate={isVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
                    transition={{ delay: index * 0.2 }}
                    whileHover={{ scale: 1.05, y: -10 }}
                  >
                    <div className={`${stat.color} mb-4 flex justify-center group-hover:scale-110 transition-transform duration-300`}>
                      {stat.icon}
                    </div>
                    <div className={`text-4xl font-black mb-2 bg-gradient-to-r ${currentSlideData.gradient} bg-clip-text text-transparent`}>
                      {stat.value}
                    </div>
                    <div className="text-gray-700 font-semibold">
                      {stat.label}
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </div>
        </section>
      )}

      {/* Custom Styles */}
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 30s linear infinite;
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(180deg); }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
      `}</style>
    </>
  );
};

export default Header;