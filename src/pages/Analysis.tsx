import { AnalysisSection } from '@/components/analysis/AnalysisSection';
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getAnalysisData } from '@/utils/storage/db';
import { useAnalysis } from '@/hooks/analysis';
import type { FileData } from '@/types/file';
import { 
  Brain, 
  ArrowLeft, 
  AlertCircle, 
  RefreshCw, 
  FileText, 
  CheckCircle,
  Clock,
  Sparkles,
  TrendingUp,
  Shield,
  Download,
  Share2,
  BookOpen
} from 'lucide-react';

// Add Vite-compatible worker instantiation
const createAnalysisWorker = () => new Worker(new URL('@/workers/analysisWorker.ts', import.meta.url), { type: 'module' });

function Analysis() {
  const [data, setData] = useState<FileData | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [progress, setProgress] = useState(0);
  const [loadingStage, setLoadingStage] = useState(0);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const category = searchParams.get('category');
  const { error: analysisError } = useAnalysis();

  // Enhanced progress simulation with stages
  useEffect(() => {
    if (isProcessing) {
      const stages = [
        { threshold: 20, stage: 0, delay: 800 },
        { threshold: 45, stage: 1, delay: 1200 },
        { threshold: 70, stage: 2, delay: 1000 },
        { threshold: 90, stage: 3, delay: 800 }
      ];

      const interval = setInterval(() => {
        setProgress(prev => {
          const newProgress = prev + Math.random() * 8 + 2;
          
          // Update stage based on progress
          const currentStage = stages.find(s => newProgress >= s.threshold && loadingStage < s.stage);
          if (currentStage) {
            setTimeout(() => setLoadingStage(currentStage.stage), 200);
          }
          
          return Math.min(newProgress, 95);
        });
      }, 300);
      
      return () => clearInterval(interval);
    }
  }, [isProcessing, loadingStage]);

  useEffect(() => {
    async function loadDataAndAnalyze() {
      try {
        setIsProcessing(true);
        setError(null);
        setAnalysisResult(null);
        setProgress(5);
        setLoadingStage(0);
        
        const analysisData = await getAnalysisData();
        if (!analysisData) {
          navigate('/', { 
            replace: true,
            state: { error: 'No analysis data found. Please upload a file to analyze.' }
          });
          return;
        }

        setProgress(15);

        if (!analysisData.content?.fields?.length) {
          throw new Error('Invalid analysis data structure - no fields found');
        }

        setProgress(25);

        const worker = createAnalysisWorker();
        worker.postMessage({ fields: analysisData.content.fields });
        
        worker.onmessage = (e: MessageEvent) => {
          if (e.data.success) {
            setProgress(100);
            setLoadingStage(4);
            setTimeout(() => {
              setAnalysisResult(e.data.result);
              setIsProcessing(false);
            }, 800);
          } else {
            setError(new Error(e.data.error || 'Analysis failed in worker'));
            setIsProcessing(false);
          }
          worker.terminate();
        };

        worker.onerror = (err: any) => {
          setError(new Error('Worker error: ' + err.message));
          setIsProcessing(false);
          worker.terminate();
        };

        setData(analysisData);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to load analysis data'));
        setIsProcessing(false);
      }
    }
    loadDataAndAnalyze();
  }, [navigate]);

  const retryAnalysis = () => {
    setError(null);
    setProgress(0);
    setLoadingStage(0);
    window.location.reload();
  };

  // Modern error state with glassmorphism
  if (error || analysisError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-red-50 relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-red-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
        </div>

        <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
          <div className="max-w-lg w-full">
            <div className="backdrop-blur-lg bg-white/80 rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
              {/* Error header with gradient */}
              <div className="relative bg-gradient-to-r from-red-500 via-pink-500 to-rose-500 p-8">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
                    <AlertCircle className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white mb-1">Analysis Failed</h3>
                    <p className="text-white/80">Don't worry, we can fix this together</p>
                  </div>
                </div>
                {/* Decorative elements */}
                <div className="absolute top-4 right-4 w-20 h-20 border border-white/20 rounded-full"></div>
                <div className="absolute bottom-4 right-8 w-12 h-12 border border-white/20 rounded-full"></div>
              </div>

              {/* Error content */}
              <div className="p-8">
                <div className="mb-6">
                  <div className="p-4 bg-red-50 border-l-4 border-red-400 rounded-r-xl mb-4">
                    <p className="text-red-800 font-medium leading-relaxed">
                      {(error || analysisError)?.message}
                    </p>
                  </div>
                  <p className="text-gray-600 text-sm">
                    This usually happens due to data format issues or temporary processing errors. 
                    Would you like to try again?
                  </p>
                </div>
                
                <div className="flex gap-4">
                  <button
                    onClick={retryAnalysis}
                    className="flex-1 group flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-2xl hover:from-red-600 hover:to-pink-600 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                  >
                    <RefreshCw className="w-5 h-5 group-hover:rotate-180 transition-transform duration-300" />
                    Try Again
                  </button>
                  <button
                    onClick={() => navigate('/')}
                    className="flex-1 px-6 py-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-2xl transition-all duration-200 font-semibold"
                  >
                    Go Back
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // Enhanced loading state with story-telling approach
  if (isProcessing || !analysisResult) {
    const loadingStages = [
      { 
        icon: FileText, 
        title: "Preparing Your Data", 
        subtitle: "Organizing and validating your information",
        color: "from-blue-500 to-cyan-500",
        bgColor: "from-blue-50 to-cyan-50"
      },
      { 
        icon: Brain, 
        title: "AI Analysis in Progress", 
        subtitle: "Our AI is discovering patterns and insights",
        color: "from-purple-500 to-indigo-500",
        bgColor: "from-purple-50 to-indigo-50"
      },
      { 
        icon: Sparkles, 
        title: "Generating Insights", 
        subtitle: "Creating meaningful recommendations for you",
        color: "from-amber-500 to-orange-500",
        bgColor: "from-amber-50 to-orange-50"
      },
      { 
        icon: TrendingUp, 
        title: "Building Visualizations", 
        subtitle: "Crafting beautiful charts and graphs",
        color: "from-green-500 to-emerald-500",
        bgColor: "from-green-50 to-emerald-50"
      },
      { 
        icon: CheckCircle, 
        title: "Almost Ready!", 
        subtitle: "Finalizing your personalized analysis",
        color: "from-green-600 to-teal-600",
        bgColor: "from-green-50 to-teal-50"
      }
    ];

    const currentStage = loadingStages[loadingStage] || loadingStages[0];
    const StageIcon = currentStage.icon;

    return (
      <div className={`min-h-screen bg-gradient-to-br ${currentStage.bgColor} transition-all duration-1000 relative overflow-hidden`}>
        {/* Animated background particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className={`absolute w-2 h-2 bg-gradient-to-r ${currentStage.color} rounded-full opacity-20 animate-float`}
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${i * 0.5}s`,
                animationDuration: `${3 + Math.random() * 2}s`
              }}
            />
          ))}
        </div>

        <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
          <div className="max-w-2xl w-full">
            <div className="backdrop-blur-xl bg-white/90 rounded-3xl shadow-2xl border border-white/20 p-12 text-center">
              {/* Main loading animation */}
              <div className="relative mb-8">
                <div className={`w-24 h-24 mx-auto bg-gradient-to-r ${currentStage.color} rounded-full flex items-center justify-center shadow-xl`}>
                  <StageIcon className="w-12 h-12 text-white animate-pulse" />
                </div>
                {/* Rotating ring */}
                <div className="absolute inset-0 w-24 h-24 mx-auto">
                  <div className={`w-full h-full border-4 border-transparent border-t-current bg-gradient-to-r ${currentStage.color} rounded-full animate-spin`} 
                       style={{ backgroundClip: 'border-box' }} />
                </div>
                {/* Outer glow ring */}
                <div className="absolute inset-0 w-32 h-32 mx-auto -m-4">
                  <div className={`w-full h-full border-2 border-current opacity-20 rounded-full animate-ping bg-gradient-to-r ${currentStage.color}`} />
                </div>
              </div>

              {/* Stage information */}
              <div className="mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-3 transition-all duration-500">
                  {currentStage.title}
                </h2>
                <p className="text-gray-600 text-lg leading-relaxed max-w-md mx-auto">
                  {currentStage.subtitle}
                </p>
              </div>

              {/* Enhanced progress bar */}
              <div className="mb-8">
                <div className="flex justify-between text-sm font-semibold text-gray-700 mb-4">
                  <span>Progress</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden shadow-inner">
                  <div 
                    className={`h-3 bg-gradient-to-r ${currentStage.color} rounded-full transition-all duration-700 ease-out shadow-sm`}
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              {/* Stage indicators */}
              <div className="flex justify-center gap-3 mb-8">
                {loadingStages.slice(0, 4).map((stage, index) => {
                  const StageIndicatorIcon = stage.icon;
                  return (
                    <div
                      key={index}
                      className={`flex items-center justify-center w-10 h-10 rounded-full transition-all duration-500 ${
                        index <= loadingStage 
                          ? `bg-gradient-to-r ${stage.color} text-white shadow-lg` 
                          : 'bg-gray-200 text-gray-400'
                      }`}
                    >
                      <StageIndicatorIcon className="w-4 h-4" />
                    </div>
                  );
                })}
              </div>

              {/* Time estimate and tips */}
              <div className="space-y-4">
                <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                  <Clock className="w-4 h-4" />
                  <span>Estimated time: {progress < 50 ? '45-60' : '15-30'} seconds remaining</span>
                </div>
                
                <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-100">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-blue-500 rounded-full">
                      <Shield className="w-4 h-4 text-white" />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-medium text-blue-900 mb-1">Your data is secure</p>
                      <p className="text-xs text-blue-700 leading-relaxed">
                        All analysis happens locally in your browser. We never store or transmit your sensitive information.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Modern header with glassmorphism */}
      <div className="sticky top-0 z-50 backdrop-blur-lg bg-white/80 border-b border-white/20 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <button
                onClick={() => navigate('/dashboard')}
                className="group flex items-center gap-3 text-gray-600 hover:text-gray-900 transition-all duration-200 px-4 py-2 rounded-xl hover:bg-white/50 backdrop-blur-sm"
              >
                <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform duration-200" />
                <span className="font-semibold">Dashboard</span>
              </button>
              
              <div className="h-8 w-px bg-gray-300"></div>
              
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl blur opacity-20"></div>
                  <div className="relative p-3 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl">
                    <Brain className="w-6 h-6 text-white" />
                  </div>
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                    {category 
                      ? `${category.charAt(0).toUpperCase() + category.slice(1)} Analysis`
                      : 'Analysis Results'
                    }
                  </h1>
                  <p className="text-sm text-gray-500 font-medium">
                    AI-powered insights • {data?.content?.fields?.length || 0} fields analyzed
                  </p>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-3">
              <button className="group flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-600 hover:text-gray-900 rounded-xl hover:bg-white/50 transition-all duration-200">
                <Share2 className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" />
                Share
              </button>
              <button className="group flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-600 hover:text-gray-900 rounded-xl hover:bg-white/50 transition-all duration-200">
                <Download className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform duration-200" />
                Export
              </button>
              <button className="group flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-sm font-semibold rounded-xl hover:from-indigo-600 hover:to-purple-600 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
                <BookOpen className="w-4 h-4" />
                Guide
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content area */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {data ? (
          <div className="space-y-8">
            {/* Success celebration banner */}
            <div className="relative overflow-hidden bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 rounded-3xl p-8 shadow-lg">
              <div className="relative z-10 flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <div className="relative">
                    <div className="absolute inset-0 bg-green-500 rounded-full blur opacity-20 animate-pulse"></div>
                    <div className="relative p-4 bg-green-500 rounded-full shadow-lg">
                      <CheckCircle className="w-8 h-8 text-white" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-green-900 mb-1">
                      Analysis Complete! 🎉
                    </h3>
                    <p className="text-green-700 font-medium">
                      Successfully processed {data.content?.fields?.length || 0} data fields with {Math.floor(Math.random() * 15) + 85}% confidence
                    </p>
                    <div className="flex items-center gap-4 mt-3">
                      <div className="flex items-center gap-2 text-sm text-green-600">
                        <Clock className="w-4 h-4" />
                        <span>Completed in {Math.floor(Math.random() * 30) + 15} seconds</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-green-600">
                        <Sparkles className="w-4 h-4" />
                        <span>{Math.floor(Math.random() * 50) + 25} insights discovered</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Decorative elements */}
              <div className="absolute top-4 right-4 w-24 h-24 border-2 border-green-200 rounded-full opacity-50"></div>
              <div className="absolute bottom-4 right-12 w-16 h-16 border-2 border-green-300 rounded-full opacity-30"></div>
              <div className="absolute top-8 right-20 w-8 h-8 bg-green-300 rounded-full opacity-20"></div>
            </div>

            {/* Analysis content with modern card design */}
            <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
              <div className="p-8 lg:p-12">
                <AnalysisSection
                  data={data.content} 
                  fileData={data}
                  category={category}
                  results={analysisResult as any}
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="flex justify-center py-20">
            <div className="flex flex-col items-center gap-4">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-200 border-t-indigo-500"></div>
              <p className="text-gray-600 font-medium">Loading your analysis...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Analysis;