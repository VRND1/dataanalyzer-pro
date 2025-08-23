import  { useState } from 'react';
import { 
  BookOpen, Search, FileText, BarChart3, 
   Settings,  ChevronRight,
   MessageCircle,  Users, Clock
} from 'lucide-react';

const documentationSections = [
  {
    title: "Getting Started",
    description: "Learn the basics and set up your first analysis",
    icon: BookOpen,
    color: "from-blue-500 to-cyan-500",
    items: [
      { title: "Quick Start Guide", duration: "5 min read", level: "Beginner" },
      { title: "Installation & Setup", duration: "10 min read", level: "Beginner" },
      { title: "First Analysis", duration: "15 min read", level: "Beginner" },
      { title: "Data Import Guide", duration: "8 min read", level: "Beginner" }
    ]
  },
  {
    title: "Core Features",
    description: "Master the essential analysis tools",
    icon: BarChart3,
    color: "from-purple-500 to-pink-500",
    items: [
      { title: "Statistical Analysis", duration: "12 min read", level: "Intermediate" },
      { title: "Data Visualization", duration: "10 min read", level: "Intermediate" },
      { title: "Regression Analysis", duration: "15 min read", level: "Advanced" },
      { title: "Time Series Analysis", duration: "20 min read", level: "Advanced" }
    ]
  }
];

const quickLinks = [
  { title: "Troubleshooting", icon: Settings, href: "#troubleshooting" },
  { title: "FAQ", icon: MessageCircle, href: "#faq" },
  { title: "Release Notes", icon: FileText, href: "#releases" },
  { title: "Community", icon: Users, href: "#community" }
];

export function Documentation() {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredSections = documentationSections.filter(section =>
    section.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    section.items.some(item => item.title.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl">
            <BookOpen className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-transparent">
            Documentation
          </h1>
        </div>
        <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-8">
          Comprehensive guides, tutorials, and reference materials to help you master data analysis with DataAnalyzer Pro
        </p>
        
        {/* Search Bar */}
        <div className="max-w-2xl mx-auto mb-12">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search documentation..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div className="max-w-7xl mx-auto mb-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {quickLinks.map((link) => (
            <a
              key={link.title}
              href={link.href}
              className="group p-6 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl hover:bg-white/10 transition-all duration-300"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-lg group-hover:from-blue-500/30 group-hover:to-purple-500/30 transition-all duration-300">
                  <link.icon className="w-5 h-5 text-blue-400" />
                </div>
                <span className="text-white font-medium">{link.title}</span>
              </div>
            </a>
          ))}
        </div>
      </div>

      {/* Documentation Sections */}
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {filteredSections.map((section) => (
            <div
              key={section.title}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 hover:bg-white/10 transition-all duration-300"
            >
              <div className="flex items-start gap-4 mb-6">
                <div className={`p-3 bg-gradient-to-r ${section.color} rounded-2xl`}>
                  <section.icon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white mb-2">{section.title}</h3>
                  <p className="text-gray-300">{section.description}</p>
                </div>
              </div>
              
              <div className="space-y-4">
                {section.items.map((item) => (
                  <div
                    key={item.title}
                    className="group p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-all duration-300 cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full" />
                        <span className="text-white font-medium">{item.title}</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-gray-400">
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {item.duration}
                        </div>
                        <span className="px-2 py-1 bg-white/10 rounded-full text-xs">
                          {item.level}
                        </span>
                        <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Call to Action */}
      <div className="max-w-7xl mx-auto mt-16">
        <div className="text-center p-12 bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-pink-600/20 backdrop-blur-xl border border-white/10 rounded-3xl">
          <h2 className="text-3xl font-bold text-white mb-4">Can't find what you're looking for?</h2>
          <p className="text-gray-300 mb-8 max-w-2xl mx-auto">
            Our support team is here to help. Get in touch with us for personalized assistance.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-bold rounded-xl hover:from-blue-600 hover:to-purple-600 transition-all duration-300">
              Contact Support
            </button>
            <button className="px-8 py-4 border border-white/20 text-white font-bold rounded-xl hover:bg-white/10 transition-all duration-300">
              Request Feature
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
