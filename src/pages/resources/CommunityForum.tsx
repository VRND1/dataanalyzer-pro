import { useState } from 'react';
import { 
  MessageCircle, Search, Users, TrendingUp,  
   Eye, ChevronRight, Award,
   Brain,
} from 'lucide-react';
import { motion } from 'framer-motion';

const forumCategories = [
  {
    title: "General Discussion",
    description: "General topics about data analysis and the platform",
    icon: MessageCircle,
    color: "from-blue-500 to-cyan-500",
    topics: [
      {
        title: "What's your favorite data visualization technique?",
        author: "Sarah Johnson",
        authorAvatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=40&h=40&fit=crop&crop=face",
        replies: 24,
        views: 156,
        lastActivity: "2 hours ago",
        tags: ["Visualization", "Techniques", "Discussion"],
        isPinned: true,
        isHot: true
      },
      {
        title: "Tips for presenting data to non-technical stakeholders",
        author: "Mike Chen",
        authorAvatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face",
        replies: 18,
        views: 89,
        lastActivity: "5 hours ago",
        tags: ["Presentation", "Communication", "Tips"],
        isPinned: false,
        isHot: true
      },
      {
        title: "How do you handle missing data in your analysis?",
        author: "Emma Davis",
        authorAvatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=40&h=40&fit=crop&crop=face",
        replies: 31,
        views: 203,
        lastActivity: "1 day ago",
        tags: ["Data Quality", "Missing Data", "Methods"],
        isPinned: false,
        isHot: false
      }
    ]
  },
  {
    title: "Technical Support",
    description: "Get help with technical issues and platform features",
    icon: Brain,
    color: "from-purple-500 to-pink-500",
    topics: [
      {
        title: "Error: Cannot connect to database after update",
        author: "Alex Rodriguez",
        authorAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop&crop=face",
        replies: 12,
        views: 67,
        lastActivity: "3 hours ago",
        tags: ["Database", "Error", "Support"],
        isPinned: false,
        isHot: true
      },
      {
        title: "How to export analysis results in different formats?",
        author: "Lisa Wang",
        authorAvatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=40&h=40&fit=crop&crop=face",
        replies: 8,
        views: 45,
        lastActivity: "6 hours ago",
        tags: ["Export", "Formats", "How-to"],
        isPinned: false,
        isHot: false
      },
      {
        title: "API integration with external data sources",
        author: "David Kim",
        authorAvatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=40&h=40&fit=crop&crop=face",
        replies: 15,
        views: 78,
        lastActivity: "2 days ago",
        tags: ["API", "Integration", "External Data"],
        isPinned: false,
        isHot: false
      }
    ]
  },
  {
    title: "Best Practices",
    description: "Share and discuss best practices in data analysis",
    icon: Award,
    color: "from-emerald-500 to-teal-500",
    topics: [
      {
        title: "Data validation checklist for new projects",
        author: "Dr. Maria Garcia",
        authorAvatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=40&h=40&fit=crop&crop=face",
        replies: 27,
        views: 134,
        lastActivity: "4 hours ago",
        tags: ["Validation", "Checklist", "Best Practices"],
        isPinned: true,
        isHot: true
      },
      {
        title: "Statistical significance vs practical significance",
        author: "Dr. James Wilson",
        authorAvatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=40&h=40&fit=crop&crop=face",
        replies: 22,
        views: 98,
        lastActivity: "1 day ago",
        tags: ["Statistics", "Significance", "Analysis"],
        isPinned: false,
        isHot: true
      },
      {
        title: "Documentation standards for data projects",
        author: "Jennifer Smith",
        authorAvatar: "https://images.unsplash.com/photo-1546961329-78bef0414d7c?w=40&h=40&fit=crop&crop=face",
        replies: 16,
        views: 67,
        lastActivity: "3 days ago",
        tags: ["Documentation", "Standards", "Projects"],
        isPinned: false,
        isHot: false
      }
    ]
  },
  {
    title: "Industry Insights",
    description: "Industry-specific discussions and insights",
    icon: TrendingUp,
    color: "from-orange-500 to-red-500",
    topics: [
      {
        title: "Healthcare analytics trends in 2024",
        author: "Dr. Robert Lee",
        authorAvatar: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=40&h=40&fit=crop&crop=face",
        replies: 19,
        views: 112,
        lastActivity: "5 hours ago",
        tags: ["Healthcare", "Trends", "2024"],
        isPinned: false,
        isHot: true
      },
      {
        title: "E-commerce analytics case study discussion",
        author: "Tom Anderson",
        authorAvatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face",
        replies: 14,
        views: 89,
        lastActivity: "2 days ago",
        tags: ["E-commerce", "Case Study", "Analytics"],
        isPinned: false,
        isHot: false
      },
      {
        title: "Financial services data governance",
        author: "Rachel Green",
        authorAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=40&h=40&fit=crop&crop=face",
        replies: 11,
        views: 56,
        lastActivity: "4 days ago",
        tags: ["Finance", "Governance", "Compliance"],
        isPinned: false,
        isHot: false
      }
    ]
  }
];

const featuredTopics = [
  {
    title: "Community Guidelines and Code of Conduct",
    author: "Community Team",
    authorAvatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=40&h=40&fit=crop&crop=face",
    replies: 45,
    views: 234,
    lastActivity: "1 week ago",
    tags: ["Guidelines", "Community", "Rules"],
    isPinned: true,
    isHot: false,
    description: "Important guidelines for maintaining a positive and productive community environment."
  },
  {
    title: "Monthly Community Challenge: Predictive Analytics",
    author: "Challenge Team",
    authorAvatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face",
    replies: 67,
    views: 456,
    lastActivity: "2 days ago",
    tags: ["Challenge", "Predictive", "Analytics"],
    isPinned: true,
    isHot: true,
    description: "Join this month's community challenge and showcase your predictive analytics skills!"
  }
];

const communityStats = [
  { label: "Active Members", value: "12.5K", icon: Users },
  { label: "Topics Created", value: "8.9K", icon: MessageCircle },
  { label: "Replies Posted", value: "45.2K", icon: TrendingUp },
  { label: "Solutions Provided", value: "23.1K", icon: Award }
];

export function CommunityForum() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<string | null>(null);

  const filters = ["All", "Hot", "Pinned", "Unanswered", "My Topics"];

  const filteredCategories = forumCategories.filter(category =>
    selectedCategory ? category.title === selectedCategory : true
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-pink-600/20" />
        <div className="relative max-w-7xl mx-auto px-6 py-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl">
                <MessageCircle className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-transparent">
                Community Forum
              </h1>
            </div>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-8">
              Connect with fellow data analysts, share insights, ask questions, and learn from the community.
            </p>
            
            {/* Search and Filters */}
            <div className="max-w-4xl mx-auto mb-12">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search discussions..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="flex gap-2">
                  <select
                    value={selectedCategory || ''}
                    onChange={(e) => setSelectedCategory(e.target.value || null)}
                    className="px-4 py-4 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Categories</option>
                    {forumCategories.map(category => (
                      <option key={category.title} value={category.title}>{category.title}</option>
                    ))}
                  </select>
                  <select
                    value={selectedFilter || ''}
                    onChange={(e) => setSelectedFilter(e.target.value || null)}
                    className="px-4 py-4 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Topics</option>
                    {filters.map(filter => (
                      <option key={filter} value={filter}>{filter}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Community Stats */}
      <div className="max-w-7xl mx-auto px-6 mb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-6"
        >
          {communityStats.map((stat, index) => (
            <motion.div
              key={stat.label}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 text-center"
              whileHover={{ scale: 1.02, y: -2 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 + index * 0.1 }}
            >
              <div className="flex justify-center mb-3">
                <div className="p-2 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-lg">
                  <stat.icon className="w-6 h-6 text-blue-400" />
                </div>
              </div>
              <div className="text-2xl font-bold text-white mb-1">{stat.value}</div>
              <div className="text-sm text-gray-300">{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Featured Topics */}
      <div className="max-w-7xl mx-auto px-6 mb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <h2 className="text-3xl font-bold text-white mb-8">Featured Discussions</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {featuredTopics.map((topic, index) => (
              <motion.div
                key={topic.title}
                className="group relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden hover:bg-white/10 transition-all duration-300"
                whileHover={{ scale: 1.02, y: -4 }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5 + index * 0.1 }}
              >
                <div className="absolute top-4 right-4 px-2 py-1 bg-red-500 text-white text-xs font-bold rounded">
                  FEATURED
                </div>
                {topic.isPinned && (
                  <div className="absolute top-4 left-4 px-2 py-1 bg-blue-500 text-white text-xs font-bold rounded">
                    PINNED
                  </div>
                )}
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <img 
                      src={topic.authorAvatar} 
                      alt={topic.author}
                      className="w-10 h-10 rounded-full"
                    />
                    <div>
                      <div className="text-blue-400 font-medium">{topic.author}</div>
                      <div className="text-sm text-gray-400">{topic.lastActivity}</div>
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">{topic.title}</h3>
                  <p className="text-gray-300 mb-6">{topic.description}</p>
                  <div className="flex items-center justify-between text-sm text-gray-400 mb-6">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        <MessageCircle className="w-4 h-4" />
                        {topic.replies} replies
                      </div>
                      <div className="flex items-center gap-1">
                        <Eye className="w-4 h-4" />
                        {topic.views} views
                      </div>
                    </div>
                    {topic.isHot && (
                      <div className="flex items-center gap-1 text-orange-400">
                        <TrendingUp className="w-4 h-4" />
                        Hot
                      </div>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex gap-2">
                      {topic.tags.map((tag, tagIndex) => (
                        <span key={tagIndex} className="px-2 py-1 bg-white/10 rounded-full text-xs text-gray-300">
                          {tag}
                        </span>
                      ))}
                    </div>
                    <button className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-bold rounded-xl hover:from-blue-600 hover:to-purple-600 transition-all duration-300">
                      Join Discussion
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Forum Categories */}
      <div className="max-w-7xl mx-auto px-6 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <h2 className="text-3xl font-bold text-white mb-8">Browse by Category</h2>
          <div className="space-y-12">
            {filteredCategories.map((category, categoryIndex) => (
              <motion.div
                key={category.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.7 + categoryIndex * 0.1 }}
              >
                <div className="flex items-center gap-4 mb-6">
                  <div className={`p-3 bg-gradient-to-r ${category.color} rounded-2xl`}>
                    <category.icon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white">{category.title}</h3>
                    <p className="text-gray-300">{category.description}</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  {category.topics.map((topic, topicIndex) => (
                    <motion.div
                      key={topic.title}
                      className="group bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden hover:bg-white/10 transition-all duration-300"
                      whileHover={{ scale: 1.01, y: -1 }}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: 0.8 + categoryIndex * 0.1 + topicIndex * 0.05 }}
                    >
                      <div className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <img 
                              src={topic.authorAvatar} 
                              alt={topic.author}
                              className="w-8 h-8 rounded-full"
                            />
                            <div>
                              <div className="text-blue-400 text-sm font-medium">{topic.author}</div>
                              <div className="text-xs text-gray-400">{topic.lastActivity}</div>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            {topic.isPinned && (
                              <span className="px-2 py-1 bg-blue-500 text-white text-xs font-bold rounded">
                                PINNED
                              </span>
                            )}
                            {topic.isHot && (
                              <span className="px-2 py-1 bg-orange-500 text-white text-xs font-bold rounded">
                                HOT
                              </span>
                            )}
                          </div>
                        </div>
                        <h4 className="text-lg font-bold text-white mb-3 group-hover:text-blue-400 transition-colors">
                          {topic.title}
                        </h4>
                        <div className="flex items-center justify-between text-sm text-gray-400 mb-4">
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1">
                              <MessageCircle className="w-3 h-3" />
                              {topic.replies} replies
                            </div>
                            <div className="flex items-center gap-1">
                              <Eye className="w-3 h-3" />
                              {topic.views} views
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex gap-2">
                            {topic.tags.map((tag, tagIndex) => (
                              <span key={tagIndex} className="px-2 py-1 bg-white/10 rounded-full text-xs text-gray-300">
                                {tag}
                              </span>
                            ))}
                          </div>
                          <ChevronRight className="w-4 h-4 text-gray-400 group-hover:translate-x-1 transition-transform duration-300" />
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Call to Action */}
      <div className="max-w-7xl mx-auto px-6 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.9 }}
          className="text-center p-12 bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-pink-600/20 backdrop-blur-xl border border-white/10 rounded-3xl"
        >
          <h2 className="text-3xl font-bold text-white mb-4">Join the Conversation</h2>
          <p className="text-gray-300 mb-8 max-w-2xl mx-auto">
            Start a new discussion, share your expertise, or ask questions. The community is here to help and learn together.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-bold rounded-xl hover:from-blue-600 hover:to-purple-600 transition-all duration-300">
              Start New Topic
            </button>
            <button className="px-8 py-4 border border-white/20 text-white font-bold rounded-xl hover:bg-white/10 transition-all duration-300">
              Browse All Topics
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

