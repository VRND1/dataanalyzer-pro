import React, { useState, useEffect } from 'react';
import { 
  Check, 
  ArrowRight, 
  Play, 
  Users, 
  TrendingUp, 
  BarChart3, 
  Shield,
  Award,
  Zap,
  Database,
  Star,
  Sparkles
} from 'lucide-react';

const CTASection: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.3 }
    );

    const element = document.getElementById('cta-section');
    if (element) observer.observe(element);

    return () => observer.disconnect();
  }, []);

  const features = [
    { 
      icon: <Database className="h-5 w-5" />, 
      text: "Connect 100+ data sources instantly",
      highlight: true
    },
    { 
      icon: <Zap className="h-5 w-5" />, 
      text: "AI-powered insights in minutes",
      highlight: true
    },
    { 
      icon: <Shield className="h-5 w-5" />, 
      text: "Enterprise-grade security & compliance",
      highlight: false
    },
    { 
      icon: <Award className="h-5 w-5" />, 
      text: "24/7 expert support included",
      highlight: false
    }
  ];

  const testimonialTabs = [
    {
      role: "Data Director",
      company: "TechCorp",
      quote: "Reduced our reporting time from weeks to hours. The AI insights are game-changing.",
      metric: "85% faster reporting",
      name: "Sarah Chen"
    },
    {
      role: "Analytics Manager", 
      company: "RetailPlus",
      quote: "Finally, a tool that makes complex data analysis accessible to our entire team.",
      metric: "300% ROI in 6 months",
      name: "Mike Rodriguez"
    },
    {
      role: "Business Analyst",
      company: "FinanceFirst", 
      quote: "The predictive models helped us identify $2M in cost savings opportunities.",
      metric: "$2M saved annually",
      name: "Emily Johnson"
    }
  ];

  const stats = [
    { icon: <Users className="h-6 w-6" />, value: "10K+", label: "Active Users" },
    { icon: <TrendingUp className="h-6 w-6" />, value: "98%", label: "Customer Satisfaction" },
    { icon: <BarChart3 className="h-6 w-6" />, value: "5M+", label: "Reports Generated" }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTab((prev) => (prev + 1) % testimonialTabs.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section 
      id="cta-section"
      className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30 relative overflow-hidden"
    >
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/4 w-72 h-72 bg-blue-400/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-purple-400/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-0 w-64 h-64 bg-teal-400/10 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      {/* Floating Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="absolute animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${4 + Math.random() * 2}s`
            }}
          >
            <div className="w-2 h-2 bg-blue-400/30 rounded-full" />
          </div>
        ))}
      </div>

      <div className="w-full px-4 md:px-6 relative z-10">
        <div className="max-w-7xl mx-auto">
          
          {/* Main CTA Card */}
          <div className={`bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900 rounded-3xl overflow-hidden shadow-2xl transform transition-all duration-1000 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
            
            {/* Animated border effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-teal-500/20 rounded-3xl blur-xl animate-pulse" />
            
            <div className="relative bg-gradient-to-br from-slate-900/95 via-blue-900/95 to-purple-900/95 backdrop-blur-sm">
              <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[600px]">
                
                {/* Left Content */}
                <div className="p-8 md:p-12 flex flex-col justify-center relative">
                  
                  {/* Decorative elements */}
                  <div className="absolute top-8 right-8 opacity-10">
                    <Sparkles className="h-24 w-24 text-white" />
                  </div>
                  
                  <div className="relative z-10">
                    {/* Header */}
                    <div className="flex items-center gap-2 mb-4">
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        ))}
                      </div>
                      <span className="text-yellow-400 text-sm font-semibold">Trusted by 10,000+ professionals</span>
                    </div>

                    <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
                      Turn Your Data Into Your 
                      <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent"> Competitive Edge</span>
                    </h2>
                    
                    <p className="text-slate-300 text-xl mb-8 leading-relaxed">
                      Join thousands of data-driven companies using DataAnalyzer Pro to uncover hidden insights, 
                      predict trends, and make decisions that drive 10x growth.
                    </p>
                    
                    {/* Features List */}
                    <div className="space-y-4 mb-8">
                      {features.map((feature, index) => (
                        <div 
                          key={index} 
                          className={`flex items-center group transform transition-all duration-500 hover:translate-x-2 ${isVisible ? 'translate-x-0 opacity-100' : '-translate-x-10 opacity-0'}`}
                          style={{ transitionDelay: `${index * 100}ms` }}
                        >
                          <div className={`${feature.highlight ? 'bg-gradient-to-r from-blue-500 to-purple-500' : 'bg-slate-700'} rounded-full p-2 mr-4 group-hover:scale-110 transition-transform duration-300`}>
                            <Check className="h-4 w-4 text-white" />
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-blue-400 opacity-70 group-hover:opacity-100 transition-opacity duration-300">
                              {feature.icon}
                            </span>
                            <span className="text-slate-200 group-hover:text-white transition-colors duration-300">
                              {feature.text}
                            </span>
                            {feature.highlight && (
                              <span className="bg-gradient-to-r from-yellow-400 to-orange-400 text-black text-xs font-bold px-2 py-1 rounded-full ml-2">
                                NEW
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {/* CTA Buttons */}
                    <div className="flex flex-col sm:flex-row gap-4 mb-8">
                      <button className="group bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-3">
                        <Zap className="h-5 w-5" />
                        Start Free 14-Day Trial
                        <ArrowRight className="h-5 w-5 transform transition-transform duration-300 group-hover:translate-x-1" />
                      </button>
                      
                      <button className="group bg-white/10 backdrop-blur-sm border-2 border-white/20 hover:border-white/40 text-white px-8 py-4 rounded-xl font-semibold transition-all duration-300 hover:bg-white/20 flex items-center justify-center gap-3">
                        <Play className="h-5 w-5" />
                        Watch 2-Min Demo
                      </button>
                    </div>

                    {/* Trust Indicators */}
                    {/* <div className="flex items-center gap-6 text-slate-400 text-sm">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span>Setup in 5 minutes</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        <span>SOC2 Compliant</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>Cancel anytime</span>
                      </div>
                    </div> */}
                  </div>
                </div>
                
                {/* Right Content - Testimonials & Stats */}
                <div className="relative bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-sm p-8 md:p-12 flex flex-col justify-center">
                  
                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-6 mb-8">
                    {stats.map((stat, index) => (
                      <div 
                        key={index} 
                        className={`text-center group transform transition-all duration-700 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}
                        style={{ transitionDelay: `${index * 200}ms` }}
                      >
                        <div className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-2xl p-4 mb-3 mx-auto w-fit group-hover:scale-110 transition-transform duration-300">
                          <div className="text-blue-400 group-hover:text-blue-300 transition-colors duration-300">
                            {stat.icon}
                          </div>
                        </div>
                        <div className="text-2xl font-bold text-white mb-1">{stat.value}</div>
                        <div className="text-slate-400 text-sm">{stat.label}</div>
                      </div>
                    ))}
                  </div>

                  {/* Testimonial Carousel */}
                  <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="flex gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        ))}
                      </div>
                      <span className="text-yellow-400 text-sm font-semibold">4.9/5 rating</span>
                    </div>
                    
                    <div className="min-h-[120px]">
                      <p className="text-white text-lg mb-4 italic leading-relaxed">
                        "{testimonialTabs[activeTab].quote}"
                      </p>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-blue-400 font-semibold">
                            {testimonialTabs[activeTab].name}
                          </div>
                          <div className="text-slate-400 text-sm">
                            {testimonialTabs[activeTab].role}, {testimonialTabs[activeTab].company}
                          </div>
                        </div>
                        
                        <div className="bg-gradient-to-r from-green-500/20 to-blue-500/20 px-4 py-2 rounded-full">
                          <span className="text-green-400 font-bold text-sm">
                            {testimonialTabs[activeTab].metric}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Testimonial Dots */}
                    <div className="flex justify-center gap-2 mt-4">
                      {testimonialTabs.map((_, index) => (
                        <button
                          key={index}
                          onClick={() => setActiveTab(index)}
                          className={`w-2 h-2 rounded-full transition-all duration-300 ${
                            index === activeTab 
                              ? 'bg-blue-400 w-8' 
                              : 'bg-slate-600 hover:bg-slate-500'
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Security Badge */}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(180deg); }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
      `}</style>
    </section>
  );
};

export default CTASection;