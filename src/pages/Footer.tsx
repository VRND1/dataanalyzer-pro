import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Facebook, 
  Twitter, 
  Linkedin, 
  Instagram, 
  Mail, 
  Phone,
  MapPin,
  Hexagon, 
  ArrowRight,
  BarChart3,
  Database,
  TrendingUp,
  Award,
  Shield,
  Download,
  BookOpen,
  Video,
  MessageCircle
} from 'lucide-react';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white relative overflow-hidden">
      {/* Enhanced Background Effects */}
      <div className="absolute inset-0 z-0">
        {/* Animated grid pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            backgroundSize: '60px 60px'
          }} />
        </div>
        
        {/* Floating elements */}
        <div className="absolute top-10 left-10 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl animate-pulse" />
        <div className="absolute bottom-20 right-20 w-40 h-40 bg-purple-500/10 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/3 w-24 h-24 bg-teal-500/10 rounded-full blur-xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <div className="relative z-10">


        {/* Main Footer Content */}
        <div className="container mx-auto px-4 py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8">
            
            {/* Company Info - Enhanced */}
            <div className="lg:col-span-2">
              <div className="flex items-center mb-6">
                <div className="relative group">
                  <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-teal-500/30 to-blue-500/30 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
                  <div className="relative transform transition-all duration-500 hover:scale-110 hover:rotate-12">
                    <Hexagon className="w-10 h-10 text-teal-400" strokeWidth={1.5} />
                    <Hexagon className="w-7 h-7 text-teal-300 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rotate-90" strokeWidth={1.5} />
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                      <BarChart3 className="w-4 h-4 text-white" />
                    </div>
                  </div>
                </div>
                <span className="ml-3 text-2xl font-bold tracking-tight bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                  DataAnalyzer Pro
                </span>
              </div>
              
              <p className="text-slate-400 mb-6 leading-relaxed">
                Empowering businesses worldwide with AI-driven data analytics. Transform complex datasets 
                into actionable insights with our intuitive, no-code platform trusted by 10,000+ professionals.
              </p>

              {/* Contact Info */}
              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3">
                  <MapPin className="h-4 w-4 text-slate-500 flex-shrink-0" />
                  <span className="text-slate-400 text-sm">San Francisco, CA & Remote Worldwide</span>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-slate-500 flex-shrink-0" />
                  <a href="tel:+1-555-0123" className="text-slate-400 text-sm hover:text-white transition-colors">
                    +1 (555) 123-4567
                  </a>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-slate-500 flex-shrink-0" />
                  <a href="mailto:hello@dataanalyzerpro.com" className="text-slate-400 text-sm hover:text-white transition-colors">
                    hello@dataanalyzerpro.com
                  </a>
                </div>
              </div>

              {/* Social Links - Enhanced */}
              <div className="flex space-x-4">
                {[
                  { icon: Facebook, href: "https://www.facebook.com/share/1BUo6UK4fx/", label: "Facebook" },
                  { icon: Twitter, href: "https://x.com/DataanalyzerPro?t=hp5H1qiPc9gQJSSH9et6_w&s=08", label: "Twitter" },
                  { icon: Linkedin, href: "https://www.linkedin.com/company/dataanalyzerpro", label: "LinkedIn" },
                  { icon: Instagram, href: "https://www.facebook.com/share/1BUo6UK4fx/", label: "Instagram" }
                ].map((social, index) => (
                  <a
                    key={index}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={social.label}
                    className="group relative p-2 bg-slate-800/50 rounded-lg hover:bg-gradient-to-br hover:from-blue-600/20 hover:to-purple-600/20 transition-all duration-300 transform hover:scale-110"
                  >
                    <social.icon size={20} className="text-slate-400 group-hover:text-white transition-colors duration-300" />
                  </a>
                ))}
              </div>
            </div>

            {/* Platform */}
            <div>
              <h3 className="font-semibold text-lg mb-6 flex items-center gap-2">
                <Database className="h-5 w-5 text-blue-400" />
                Platform
              </h3>
              <ul className="space-y-3">
                {[
                  { name: "Dashboard", href: "#dashboard" },
                  { name: "Data Connectors", href: "#connectors" },
                  { name: "AI Analytics", href: "#ai-analytics" },
                  { name: "Visualizations", href: "#visualizations" },
                  { name: "Reports & Export", href: "#reports" },
                  { name: "API Access", href: "#api" }
                ].map((item, index) => (
                  <li key={index}>
                    <a href={item.href} className="text-slate-400 hover:text-white transition-colors duration-300 flex items-center gap-2 group">
                      <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transform -translate-x-2 group-hover:translate-x-0 transition-all duration-300" />
                      {item.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Resources */}
            <div>
              <h3 className="font-semibold text-lg mb-6 flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-purple-400" />
                Resources
              </h3>
              <ul className="space-y-3">
                {[
                  { name: "Documentation", href: "/resources/documentation", icon: <BookOpen className="h-3 w-3" /> },
                  { name: "Video Tutorials", href: "/resources/video-tutorials", icon: <Video className="h-3 w-3" /> },
                  { name: "Data Templates", href: "/resources/data-templates", icon: <Download className="h-3 w-3" /> },
                  { name: "Best Practices", href: "/resources/best-practices", icon: <Award className="h-3 w-3" /> },
                  { name: "Case Studies", href: "/resources/case-studies", icon: <TrendingUp className="h-3 w-3" /> },
                  { name: "Community Forum", href: "/resources/community-forum", icon: <MessageCircle className="h-3 w-3" /> }
                ].map((item, index) => (
                  <li key={index}>
                    <Link to={item.href} className="text-slate-400 hover:text-white transition-colors duration-300 flex items-center gap-2 group">
                      <span className="opacity-50 group-hover:opacity-100 transition-opacity duration-300">
                        {item.icon}
                      </span>
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Solutions */}
            <div>
              <h3 className="font-semibold text-lg mb-6 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-400" />
                Solutions
              </h3>
              <ul className="space-y-3">
                {[
                  "Business Intelligence",
                  "Sales Analytics",
                  "Marketing Insights",
                  "Financial Reporting",
                  "Customer Analytics",
                  "Predictive Analysis"
                ].map((item, index) => (
                  <li key={index}>
                    <a href="#" className="text-slate-400 hover:text-white transition-colors duration-300 flex items-center gap-2 group">
                      <div className="w-1 h-1 bg-slate-500 rounded-full group-hover:bg-green-400 transition-colors duration-300"></div>
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Support */}
            <div>
              <h3 className="font-semibold text-lg mb-6 flex items-center gap-2">
                <Shield className="h-5 w-5 text-teal-400" />
                Support
              </h3>
              <ul className="space-y-3">
                {[
                  { name: "Help Center", href: "#help", badge: null },
                  { name: "Live Chat", href: "#chat", badge: "24/7" },
                  { name: "Email Support", href: "mailto:support@dataanalyzerpro.com", badge: null },
                  { name: "System Status", href: "#status", badge: "99.9%" },
                  { name: "Feature Requests", href: "#features", badge: null },
                  { name: "Bug Reports", href: "#bugs", badge: null }
                ].map((item, index) => (
                  <li key={index}>
                    <a href={item.href} className="text-slate-400 hover:text-white transition-colors duration-300 flex items-center justify-between gap-2 group">
                      <span>{item.name}</span>
                      {item.badge && (
                        <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full">
                          {item.badge}
                        </span>
                      )}
                    </a>
                  </li>
                ))}
              </ul>
              
              {/* Quick Contact */}
              <div className="mt-6 p-4 bg-slate-800/30 rounded-lg border border-slate-700/50">
                <h4 className="font-medium text-white mb-2">Need Immediate Help?</h4>
                <p className="text-slate-400 text-sm mb-3">Our team is here to help you succeed</p>
                <a 
                  href="#contact" 
                  className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 text-sm font-medium group"
                >
                  Contact Support
                  <ArrowRight className="h-3 w-3 transform transition-transform duration-300 group-hover:translate-x-1" />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar - Enhanced */}
        <div className="border-t border-slate-700/50 bg-slate-800/30">
          <div className="container mx-auto px-4 py-6">
            <div className="flex flex-col lg:flex-row justify-between items-center gap-4">
              <div className="flex flex-col md:flex-row items-center gap-4 text-slate-500 text-sm">
                <p>&copy; {currentYear} DataAnalyzer Pro, Inc. All rights reserved.</p>
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-green-500" />
                  <span>SOC2 Compliant</span>
                </div>
              </div>
              
              <div className="flex flex-wrap justify-center gap-6">
                {[
                  "Privacy Policy",
                  "Terms of Service", 
                  "Cookie Policy",
                  "Data Processing Agreement",
                  "Security"
                ].map((item, index) => (
                  <a
                    key={index}
                    href="#"
                    className="text-slate-500 text-sm hover:text-white transition-colors duration-300 relative group"
                  >
                    {item}
                    <span className="absolute bottom-0 left-0 w-0 h-px bg-blue-400 transition-all duration-300 group-hover:w-full"></span>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;