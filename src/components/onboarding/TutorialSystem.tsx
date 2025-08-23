import React from 'react';
import { Trophy, Star, Book, Target, CheckCircle, Lock, X, Play, SkipForward, RotateCcw, Award, Clock, Users, Zap } from 'lucide-react';

interface TutorialStep {
  id: string;
  title: string;
  description: string;
  action: string;
  completed?: boolean;
  estimatedTime?: number; // in minutes
  hints?: string[];
  videoUrl?: string;
}

interface TutorialBadge {
  name: string;
  icon: React.ElementType;
  color: string;
  description: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

interface Tutorial {
  id: string;
  title: string;
  description: string;
  category: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  difficulty: 1 | 2 | 3 | 4 | 5;
  steps: TutorialStep[];
  badge: TutorialBadge;
  completed?: boolean;
  locked?: boolean;
  prerequisites?: string[];
  estimatedDuration?: number; // in minutes
  tags?: string[];
  lastAccessed?: Date;
  progress?: number; // 0-100
}

interface TutorialProgress {
  tutorialId: string;
  completedSteps: string[];
  currentStep: number;
  startedAt: Date;
  completedAt?: Date;
  timeSpent: number; // in minutes
}

export function TutorialSystem() {
  const [tutorials, setTutorials] = React.useState<Tutorial[]>([
    {
      id: 'basics',
      title: 'Getting Started',
      description: 'Learn the basics of data analysis and get comfortable with the platform',
      category: 'beginner',
      difficulty: 1,
      steps: [
        {
          id: 'upload',
          title: 'Upload Your First Dataset',
          description: 'Learn how to upload and validate your data files',
          action: 'Upload a CSV or Excel file',
          estimatedTime: 3,
          hints: ['Supported formats: CSV, Excel, JSON', 'Maximum file size: 50MB', 'Check data preview before analysis']
        },
        {
          id: 'analyze',
          title: 'Run Your First Analysis',
          description: 'Discover insights from your data using automated analysis',
          action: 'Click "Analyze Data"',
          estimatedTime: 5,
          hints: ['Choose the right analysis type', 'Review the generated insights', 'Save interesting findings']
        },
        {
          id: 'visualize',
          title: 'Create Visualizations',
          description: 'Turn your data into beautiful, interactive charts',
          action: 'Create a chart',
          estimatedTime: 4,
          hints: ['Select appropriate chart types', 'Customize colors and labels', 'Export charts for presentations']
        }
      ],
      badge: {
        name: 'Data Explorer',
        icon: Star,
        color: 'text-yellow-500',
        description: 'Mastered the basics of data analysis',
        rarity: 'common'
      },
      estimatedDuration: 12,
      tags: ['basics', 'upload', 'visualization']
    },
    {
      id: 'advanced',
      title: 'Advanced Analysis',
      description: 'Master advanced analysis techniques and statistical methods',
      category: 'intermediate',
      difficulty: 3,
      steps: [
        {
          id: 'ml',
          title: 'Machine Learning Basics',
          description: 'Understand ML predictions and model performance',
          action: 'Run ML analysis',
          estimatedTime: 8,
          hints: ['Choose the right algorithm', 'Interpret model accuracy', 'Validate predictions']
        },
        {
          id: 'correlations',
          title: 'Correlation Analysis',
          description: 'Find relationships and patterns in your data',
          action: 'View correlations',
          estimatedTime: 6,
          hints: ['Look for strong correlations', 'Identify causation vs correlation', 'Use heatmaps for visualization']
        },
        {
          id: 'export',
          title: 'Export & Share',
          description: 'Share insights and reports with your team',
          action: 'Export analysis',
          estimatedTime: 4,
          hints: ['Choose the right export format', 'Include methodology notes', 'Share with appropriate permissions']
        }
      ],
      badge: {
        name: 'Data Scientist',
        icon: Trophy,
        color: 'text-purple-500',
        description: 'Advanced analytical skills demonstrated',
        rarity: 'rare'
      },
      locked: true,
      prerequisites: ['basics'],
      estimatedDuration: 18,
      tags: ['ml', 'statistics', 'correlation']
    },
    {
      id: 'expert',
      title: 'Expert Techniques',
      description: 'Become a data analysis expert with advanced techniques',
      category: 'advanced',
      difficulty: 5,
      steps: [
        {
          id: 'custom',
          title: 'Custom Analysis',
          description: 'Create custom analysis pipelines and workflows',
          action: 'Create custom analysis',
          estimatedTime: 15,
          hints: ['Define clear objectives', 'Test your pipeline', 'Document your process']
        },
        {
          id: 'automate',
          title: 'Automation',
          description: 'Automate your analysis workflow for efficiency',
          action: 'Set up automation',
          estimatedTime: 12,
          hints: ['Start with simple automations', 'Monitor performance', 'Have fallback plans']
        },
        {
          id: 'collaborate',
          title: 'Team Collaboration',
          description: 'Work effectively with your team and stakeholders',
          action: 'Invite team members',
          estimatedTime: 8,
          hints: ['Set clear roles and permissions', 'Use shared workspaces', 'Regular team syncs']
        }
      ],
      badge: {
        name: 'Data Master',
        icon: Target,
        color: 'text-indigo-500',
        description: 'Achieved mastery in data analysis',
        rarity: 'epic'
      },
      locked: true,
      prerequisites: ['basics', 'advanced'],
      estimatedDuration: 35,
      tags: ['automation', 'collaboration', 'custom']
    },
    {
      id: 'specialized',
      title: 'Specialized Analysis',
      description: 'Master domain-specific analysis techniques',
      category: 'expert',
      difficulty: 5,
      steps: [
        {
          id: 'time-series',
          title: 'Time Series Analysis',
          description: 'Analyze temporal data and forecast trends',
          action: 'Run time series analysis',
          estimatedTime: 20,
          hints: ['Check for seasonality', 'Handle missing data', 'Validate forecasts']
        },
        {
          id: 'nlp',
          title: 'Text Analysis',
          description: 'Extract insights from text data using NLP',
          action: 'Analyze text data',
          estimatedTime: 15,
          hints: ['Preprocess text properly', 'Choose relevant metrics', 'Interpret sentiment correctly']
        },
        {
          id: 'optimization',
          title: 'Optimization Techniques',
          description: 'Use advanced optimization for business decisions',
          action: 'Run optimization analysis',
          estimatedTime: 25,
          hints: ['Define clear objectives', 'Consider constraints', 'Validate solutions']
        }
      ],
      badge: {
        name: 'Analysis Expert',
        icon: Award,
        color: 'text-red-500',
        description: 'Mastered specialized analysis techniques',
        rarity: 'legendary'
      },
      locked: true,
      prerequisites: ['basics', 'advanced', 'expert'],
      estimatedDuration: 60,
      tags: ['time-series', 'nlp', 'optimization']
    }
  ]);

  const [activeTutorial, setActiveTutorial] = React.useState<Tutorial | null>(null);
  const [currentStep, setCurrentStep] = React.useState(0);
  const [showCongrats, setShowCongrats] = React.useState(false);
  const [selectedCategory, setSelectedCategory] = React.useState<string>('all');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [sortBy, setSortBy] = React.useState<'difficulty' | 'duration' | 'progress'>('difficulty');
  const [showHints, setShowHints] = React.useState<Record<string, boolean>>({});
  const [tutorialProgress, setTutorialProgress] = React.useState<Record<string, TutorialProgress>>({});

  // Load progress from localStorage
  React.useEffect(() => {
    const savedProgress = localStorage.getItem('tutorialProgress');
    if (savedProgress) {
      setTutorialProgress(JSON.parse(savedProgress));
    }
  }, []);

  // Save progress to localStorage
  React.useEffect(() => {
    localStorage.setItem('tutorialProgress', JSON.stringify(tutorialProgress));
  }, [tutorialProgress]);

  const handleStepComplete = (tutorialId: string, stepId: string) => {
    const tutorial = tutorials.find(t => t.id === tutorialId);
    if (!tutorial) return;

    // Update tutorial progress
    setTutorialProgress(prev => {
      const current = prev[tutorialId] || {
        tutorialId,
        completedSteps: [],
        currentStep: 0,
        startedAt: new Date(),
        timeSpent: 0
      };

      const updated = {
        ...current,
        completedSteps: [...current.completedSteps, stepId],
        timeSpent: current.timeSpent + (tutorial.steps.find(s => s.id === stepId)?.estimatedTime || 0)
      };

      return { ...prev, [tutorialId]: updated };
    });

    // Update tutorials state
    setTutorials(prev => prev.map(tutorial => {
      if (tutorial.id === tutorialId) {
        const updatedSteps = tutorial.steps.map(step =>
          step.id === stepId ? { ...step, completed: true } : step
        );
        const allCompleted = updatedSteps.every(step => step.completed);
        return {
          ...tutorial,
          steps: updatedSteps,
          completed: allCompleted,
          progress: (updatedSteps.filter(s => s.completed).length / updatedSteps.length) * 100
        };
      }
      return tutorial;
    }));

    // Advance to next step
    const currentStepIndex = tutorial.steps.findIndex(step => step.id === stepId);
    if (currentStepIndex < tutorial.steps.length - 1) {
      setCurrentStep(currentStepIndex + 1);
    } else {
      // Tutorial completed
      setTutorialProgress(prev => ({
        ...prev,
        [tutorialId]: {
          ...prev[tutorialId],
          completedAt: new Date()
        }
      }));
      setShowCongrats(true);
      
      // Unlock next tutorials
      const currentIndex = tutorials.findIndex(t => t.id === tutorialId);
      setTutorials(prev => prev.map((t, i) => {
        if (i > currentIndex && t.locked) {
          const prerequisites = t.prerequisites || [];
          const canUnlock = prerequisites.every(preReq => 
            prev.find(p => p.id === preReq)?.completed
          );
          return canUnlock ? { ...t, locked: false } : t;
        }
        return t;
      }));
    }
  };

  const resetTutorial = (tutorialId: string) => {
    setTutorials(prev => prev.map(tutorial => 
      tutorial.id === tutorialId 
        ? { ...tutorial, steps: tutorial.steps.map(step => ({ ...step, completed: false })), completed: false, progress: 0 }
        : tutorial
    ));
    setTutorialProgress(prev => {
      const { [tutorialId]: removed, ...rest } = prev;
      return rest;
    });
    setCurrentStep(0);
  };

  const filteredTutorials = tutorials.filter(tutorial => {
    const matchesCategory = selectedCategory === 'all' || tutorial.category === selectedCategory;
    const matchesSearch = tutorial.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         tutorial.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         tutorial.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const sortedTutorials = [...filteredTutorials].sort((a, b) => {
    switch (sortBy) {
      case 'difficulty':
        return a.difficulty - b.difficulty;
      case 'duration':
        return (a.estimatedDuration || 0) - (b.estimatedDuration || 0);
      case 'progress':
        return (b.progress || 0) - (a.progress || 0);
      default:
        return 0;
    }
  });

  const getDifficultyColor = (difficulty: number) => {
    switch (difficulty) {
      case 1: return 'text-green-500';
      case 2: return 'text-blue-500';
      case 3: return 'text-yellow-500';
      case 4: return 'text-orange-500';
      case 5: return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'text-gray-500';
      case 'rare': return 'text-blue-500';
      case 'epic': return 'text-purple-500';
      case 'legendary': return 'text-yellow-500';
      default: return 'text-gray-500';
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Book className="w-5 h-5 text-black" />
          <h2 className="text-lg font-semibold text-black">Learning Center</h2>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-black" />
            <span className="font-medium text-black">
              {tutorials.filter(t => t.completed).length} / {tutorials.length} Completed
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-black" />
            <span className="text-sm text-black">
              {tutorials.reduce((total, t) => total + (t.estimatedDuration || 0), 0)} min total
            </span>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-black">Category:</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm"
            >
              <option value="all">All Categories</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
              <option value="expert">Expert</option>
            </select>
          </div>
          
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-black">Sort by:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm"
            >
              <option value="difficulty">Difficulty</option>
              <option value="duration">Duration</option>
              <option value="progress">Progress</option>
            </select>
          </div>
        </div>

        <div className="relative">
          <input
            type="text"
            placeholder="Search tutorials..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm"
          />
        </div>
      </div>

      {/* Tutorial List */}
      <div className="grid gap-6">
        {sortedTutorials.map((tutorial) => {
          const progress = tutorialProgress[tutorial.id];
          const progressPercentage = progress 
            ? (progress.completedSteps.length / tutorial.steps.length) * 100
            : 0;

          return (
            <div
              key={tutorial.id}
              className={`border rounded-lg p-4 transition-all duration-200 ${
                tutorial.locked
                  ? 'opacity-50 cursor-not-allowed'
                  : 'hover:border-teal-200 cursor-pointer hover:shadow-md'
              }`}
              onClick={() => !tutorial.locked && setActiveTutorial(tutorial)}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-3 flex-1">
                  {tutorial.locked ? (
                    <Lock className="w-6 h-6 text-black mt-1" />
                  ) : tutorial.completed ? (
                    <tutorial.badge.icon className={`w-6 h-6 ${tutorial.badge.color} mt-1`} />
                  ) : (
                    <tutorial.badge.icon className="w-6 h-6 text-black mt-1" />
                  )}
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium text-black">{tutorial.title}</h3>
                      <div className="flex items-center gap-1">
                        {[...Array(tutorial.difficulty)].map((_, i) => (
                          <Star key={i} className={`w-3 h-3 ${getDifficultyColor(tutorial.difficulty)} fill-current`} />
                        ))}
                      </div>
                    </div>
                    <p className="text-sm text-black mb-2">{tutorial.description}</p>
                    
                    <div className="flex items-center gap-4 text-xs text-black">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {tutorial.estimatedDuration} min
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {tutorial.category}
                      </span>
                      {tutorial.tags && (
                        <div className="flex gap-1">
                          {tutorial.tags.slice(0, 2).map(tag => (
                            <span key={tag} className="px-2 py-1 bg-gray-100 rounded text-xs">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {tutorial.completed && (
                    <div className="flex items-center gap-1">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className="text-xs text-black">Completed</span>
                    </div>
                  )}
                  {progress && progress.completedSteps.length > 0 && !tutorial.completed && (
                    <div className="flex items-center gap-1">
                      <Play className="w-4 h-4 text-blue-500" />
                      <span className="text-xs text-black">{progress.completedSteps.length}/{tutorial.steps.length}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Progress Bar */}
              {!tutorial.locked && (
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-black">Progress</span>
                    <span className="text-sm font-medium text-black">
                      {progressPercentage.toFixed(0)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-teal-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${progressPercentage}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              {!tutorial.locked && (
                <div className="flex items-center gap-2 mt-3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveTutorial(tutorial);
                    }}
                    className="px-3 py-1 bg-teal-600 text-white rounded text-sm hover:bg-teal-700 transition-colors"
                  >
                    {tutorial.completed ? 'Review' : 'Continue'}
                  </button>
                  {progress && progress.completedSteps.length > 0 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        resetTutorial(tutorial.id);
                      }}
                      className="px-3 py-1 border border-gray-300 text-black rounded text-sm hover:bg-gray-50 transition-colors"
                    >
                      <RotateCcw className="w-3 h-3 inline mr-1" />
                      Reset
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Active Tutorial Modal */}
      {activeTutorial && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <activeTutorial.badge.icon className={`w-6 h-6 ${activeTutorial.badge.color}`} />
                  <div>
                    <h3 className="text-lg font-semibold text-black">{activeTutorial.title}</h3>
                    <div className="flex items-center gap-2 text-sm text-black">
                      <span className={`px-2 py-1 rounded ${getDifficultyColor(activeTutorial.difficulty)} bg-opacity-10`}>
                        Level {activeTutorial.difficulty}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {activeTutorial.estimatedDuration} min
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setActiveTutorial(null)}
                  className="text-black hover:text-gray-700 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="mt-2 text-black">{activeTutorial.description}</p>
              
              {/* Badge Info */}
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <activeTutorial.badge.icon className={`w-5 h-5 ${activeTutorial.badge.color}`} />
                  <span className={`font-medium ${getRarityColor(activeTutorial.badge.rarity)}`}>
                    {activeTutorial.badge.name}
                  </span>
                  <span className="text-xs text-black">({activeTutorial.badge.rarity})</span>
                </div>
                <p className="text-sm text-black mt-1">{activeTutorial.badge.description}</p>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {activeTutorial.steps.map((step, index) => {
                const isCurrentStep = index === currentStep;
                const isCompleted = step.completed;

                return (
                  <div
                    key={step.id}
                    className={`border rounded-lg p-4 transition-all duration-200 ${
                      isCompleted ? 'bg-green-50 border-green-200' :
                      isCurrentStep ? 'bg-blue-50 border-blue-200' :
                      'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        isCompleted
                          ? 'bg-green-100'
                          : isCurrentStep
                          ? 'bg-blue-100'
                          : 'bg-gray-100'
                      }`}>
                        {isCompleted ? (
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        ) : (
                          <span className="text-sm font-medium text-black">{index + 1}</span>
                        )}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-medium text-black">{step.title}</h4>
                          {step.estimatedTime && (
                            <span className="text-xs text-black flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {step.estimatedTime} min
                            </span>
                          )}
                        </div>
                        
                        <p className="text-sm text-black mb-3">{step.description}</p>
                        
                        {/* Hints */}
                        {step.hints && step.hints.length > 0 && (
                          <div className="mb-3">
                            <button
                              onClick={() => setShowHints(prev => ({ ...prev, [step.id]: !prev[step.id] }))}
                              className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                            >
                              <Zap className="w-3 h-3" />
                              {showHints[step.id] ? 'Hide hints' : 'Show hints'}
                            </button>
                            {showHints[step.id] && (
                              <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-black">
                                <strong>Hints:</strong>
                                <ul className="mt-1 space-y-1">
                                  {step.hints.map((hint, i) => (
                                    <li key={i}>• {hint}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        )}
                        
                        {/* Action Button */}
                        {isCurrentStep && !isCompleted && (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleStepComplete(activeTutorial.id, step.id)}
                              className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors text-sm"
                            >
                              {step.action}
                            </button>
                            <button
                              onClick={() => setCurrentStep(Math.min(currentStep + 1, activeTutorial.steps.length - 1))}
                              className="px-3 py-2 border border-gray-300 text-black rounded-lg hover:bg-gray-50 transition-colors text-sm flex items-center gap-1"
                            >
                              <SkipForward className="w-3 h-3" />
                              Skip
                            </button>
                          </div>
                        )}
                        
                        {isCompleted && (
                          <div className="flex items-center gap-2 text-green-600 text-sm">
                            <CheckCircle className="w-4 h-4" />
                            Completed
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Congratulations Modal */}
      {showCongrats && activeTutorial && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 text-center">
            <div className="mb-4">
              <activeTutorial.badge.icon className={`w-16 h-16 ${activeTutorial.badge.color} mx-auto`} />
            </div>
            <h3 className="text-xl font-bold mb-2 text-black">Congratulations!</h3>
            <p className="text-black mb-2">
              You've earned the <span className={`font-bold ${getRarityColor(activeTutorial.badge.rarity)}`}>
                {activeTutorial.badge.name}
              </span> badge!
            </p>
            <p className="text-sm text-black mb-6">{activeTutorial.badge.description}</p>
            
            <div className="flex gap-2 justify-center">
              <button
                onClick={() => {
                  setShowCongrats(false);
                  setActiveTutorial(null);
                }}
                className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
              >
                Continue Learning
              </button>
              <button
                onClick={() => {
                  setShowCongrats(false);
                  setActiveTutorial(null);
                  // Navigate to next tutorial if available
                  const currentIndex = tutorials.findIndex(t => t.id === activeTutorial.id);
                  const nextTutorial = tutorials[currentIndex + 1];
                  if (nextTutorial && !nextTutorial.locked) {
                    setActiveTutorial(nextTutorial);
                  }
                }}
                className="px-6 py-2 border border-teal-600 text-teal-600 rounded-lg hover:bg-teal-50 transition-colors"
              >
                Next Tutorial
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}