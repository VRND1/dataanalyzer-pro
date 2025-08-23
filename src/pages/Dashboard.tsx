import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Brain,
  BarChart2,
  FileText,
  PlayCircle,
  LineChart,
  Settings2,
  Share2,
  Database,
} from "lucide-react";
import { FloatingNav } from "@/components/layout/FloatingNav";
import { FileUpload } from "@/components/file";
import { useFileUpload } from "@/hooks/useFileUpload";
import { storeAnalysisData } from "@/utils/storage/db";
import DashboardHeader from "@/components/layout/DashboardHeader";
//import { ComprehensiveReport } from "@/components/reports/ComprehensiveReport";
import React from "react";


export function Dashboard() {
  const navigate = useNavigate();
  const [selectedFeature, setSelectedFeature] = React.useState<any>(null);

  const onUploadSuccess = useCallback(async (data: any) => {
    await storeAnalysisData(data);
    navigate('/analysis');
  }, [navigate]);

  const { handleFileUpload, isUploading, error } = useFileUpload(onUploadSuccess);

  const handleFeatureClick = (feature: any) => {
    if (feature.component) {
      setSelectedFeature(feature);
    } else {
      navigate(feature.path);
    }
  };

  const features = [
    {
      title: "Data Analysis",
      description: "Analyze your data with AI-powered insights",
      icon: Brain,
      color: "teal",
      path: "/analysis/new",
    },
    {
      title: "Visualizations",
      description: "Create interactive charts and dashboards",
      icon: BarChart2,
      color: "indigo",
      path: "/analysis/visualizations",
    },
    {
      title: "Reports",
      description: "Generate comprehensive analysis reports",
      icon: FileText,
      color: "blue",
      path: "/analysis/reports"
    },
    {
      title: "Simulations",
      description: "Run predictive simulations and scenarios",
      icon: PlayCircle,
      color: "purple",
      path: "/analysis/simulations",
    },
    {
      title: "Trends",
      description: "Track patterns and predict future trends",
      icon: LineChart,
      color: "green",
      path: "/analysis/trends",
    },
    {
      title: "Workspaces",
      description: "Organize and share your analyses",
      icon: Database,
      color: "orange",
      path: "/workspaces",
    },
    {
      title: "Collaboration",
      description: "Work together with your team",
      icon: Share2,
      color: "pink",
      path: "/team",
    },
    {
      title: "Settings",
      description: "Configure analysis preferences",
      icon: Settings2,
      color: "gray",
      path: "/settings",
    },
  ];

  return (
    <>
      <div className="dashboard-page min-h-screen flex flex-col bg-[#0F172A] text-white relative overflow-hidden">
        <DashboardHeader />
        <div className="flex-1 flex items-center justify-center pb-12">
          <FloatingNav />
          {/* Animated Background */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute w-[1200px] h-[1200px] -top-[600px] -left-[600px] bg-gradient-to-r from-teal-500/50 to-indigo-500/50 rounded-full mix-blend-overlay animate-blob"></div>
            <div className="absolute w-[1000px] h-[1000px] top-[100px] right-[100px] bg-gradient-to-l from-purple-500/50 to-pink-500/50 rounded-full mix-blend-overlay animate-blob animation-delay-2000"></div>
            <div className="absolute w-[900px] h-[900px] bottom-[-300px] left-[20%] bg-gradient-to-t from-blue-500/50 to-green-500/50 rounded-full mix-blend-overlay animate-blob animation-delay-4000"></div>

            {/* Grid Background */}
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgNDAgMTAgTSAxMCAwIEwgMTAgNDBNIDAgMjAgTCA0MCAyMCBNIDIwIDAgTCAyMCA0ME0gMCAzMCBMIDQwIDMwIE0gMzAgMCBMIDMwIDQwIiBmaWxsPSJub25lIiBzdHJva2U9IiMxRTI5M0IiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-10"></div>
          </div>

          <div className="max-w-7xl mx-auto px-4 relative">
            <div className="text-center mb-12">
              <h1 className="text-5xl font-bold text-white mb-4 animate-fade-in">
                DataAnalyzer Pro
              </h1>
              <p className="text-xl text-gray-300 max-w-2xl mx-auto mb-8 animate-fade-in animation-delay-300">
                Transform your data into actionable insights with AI-powered
                analytics
              </p>

              {/* File Upload */}
              <div className="max-w-xl mx-auto bg-white/5 backdrop-blur-lg rounded-xl border border-white/10 p-6 mb-12 transform hover:scale-105 transition-all duration-300 hover:border-teal-500/50">
                <FileUpload
                  onFileUpload={handleFileUpload}
                  isProcessing={isUploading}
                  error={error}
                />
              </div>

              {/* Analysis Results */}
              {/* {analysisData && (
                <div className="mt-8 bg-white/5 backdrop-blur-lg rounded-xl border border-white/10 p-6">
                  <DataAnalysisView analysis={analysisData} />
                </div>
              )} */}

              {/* Features Grid */}
              <div className="mt-12 w-full px-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 w-full">
                  {features.map((feature) => (
                    <button
                      key={feature.title}
                      onClick={() => handleFeatureClick(feature)}
                      className="group bg-white/5 backdrop-blur-lg p-4 rounded-xl border border-white/10 transition-all text-left w-full h-full flex flex-col hover:bg-white/10 hover:border-teal-500/50"
                    >
                      <div className="flex items-start gap-3 mb-2">
                        <div className={`p-2 rounded-lg bg-gradient-to-r from-${feature.color}-500/20 to-${feature.color}-500/20 text-white flex-shrink-0`}>
                          <feature.icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-white text-sm sm:text-base truncate">
                            {feature.title}
                          </h3>
                          <p className="text-xs sm:text-sm text-gray-400 mt-1 line-clamp-2">
                            {feature.description}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>

                {/* Render selected feature component */}
                {selectedFeature?.component && (
                  <div className="mt-8">
                    <selectedFeature.component />
                  </div>
                )}

                {/* Quick Links */}
                <div className="mt-12 flex items-center justify-center gap-4">
                  <button
                    onClick={() => navigate("/help")}
                    className="text-sm text-gray-400 hover:text-white transition-colors"
                  >
                    Documentation
                  </button>
                  <span className="text-gray-700">•</span>
                  <button
                    onClick={() => navigate("/tutorials")}
                    className="text-sm text-gray-400 hover:text-white transition-colors"
                  >
                    Tutorials
                  </button>
                  <span className="text-gray-700">•</span>
                  <button
                    onClick={() => navigate("/support")}
                    className="text-sm text-gray-400 hover:text-white transition-colors"
                  >
                    Support
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default Dashboard;
