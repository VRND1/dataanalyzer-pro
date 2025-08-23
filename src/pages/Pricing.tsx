import { useState } from 'react';
import { Check, X, Star, Zap } from 'lucide-react';

const PricingUI = () => {
  const [isAnnual, setIsAnnual] = useState(true);

  const plans: Array<{
    name: string;
    price: { monthly: string; annual: string };
    description: string;
    features: { included: string[]; excluded: string[] };
    buttonText: string;
    color: 'blue' | 'purple' | 'emerald';
    isPopular?: boolean;
  }> = [
    {
      name: "Starter",
      price: {
        monthly: "$49",
        annual: "$39",
      },
      description: "Perfect for individuals and small teams just getting started with data analysis.",
      features: {
        included: [
          "Up to 5 data sources",
          "5 GB data storage",
          "Basic AI analysis",
          "Standard visualizations",
          "Email support",
          "Advanced AI models"
        ],
        excluded: [
          "Custom branding",
          "API access",
          "Team collaboration",
          "Priority support"
        ]
      },
      buttonText: "Get Started",
      color: "blue"
    },
    {
      name: "Professional",
      price: {
        monthly: "$99",
        annual: "$79",
      },
      description: "For growing teams that need more power and advanced features.",
      features: {
        included: [
          "Up to 20 data sources",
          "10 GB data storage", 
          "Advanced AI analysis",
          "Custom visualizations",
          "Team collaboration",
          "API access",
          "Priority email support"
        ],
        excluded: [
          "Custom AI models",
          "White labeling",
          "Dedicated support"
        ]
      },
      buttonText: "Get Started",
      isPopular: true,
      color: "purple"
    },
    {
      name: "Enterprise",
      price: {
        monthly: "$249",
        annual: "$199",
      },
      description: "For organizations with complex needs and large data volumes.",
      features: {
        included: [
          "Unlimited data sources",
          "15 GB data storage",
          "Custom AI models",
          "Advanced security",
          "White labeling",
          "Full API access",
          "Dedicated support manager",
          "Custom onboarding"
        ],
        excluded: []
      },
      buttonText: "Contact Sales",
      color: "emerald"
    }
  ];

  const getColorClasses = (color: 'blue' | 'purple' | 'emerald') => {0
    const colors = {
      blue: {
        button: 'bg-blue-600 hover:bg-blue-700 text-white',
        border: 'border-blue-200 hover:border-blue-300',
        accent: 'text-blue-600'
      },
      purple: {
        button: 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg',
        border: 'border-purple-300 hover:border-purple-400 ring-2 ring-purple-200',
        accent: 'text-purple-600'
      },
      emerald: {
        button: 'bg-emerald-600 hover:bg-emerald-700 text-white',
        border: 'border-emerald-200 hover:border-emerald-300',
        accent: 'text-emerald-600'
      }
    };
    return colors[color];
  };

  return (
    <div id="pricing" className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 py-16 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center px-4 py-2 bg-white rounded-full shadow-sm border mb-6">
            <Zap className="w-4 h-4 text-yellow-500 mr-2" />
            <span className="text-sm font-medium text-gray-700">Pricing Plans</span>
          </div>
          
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Simple, Transparent
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> Pricing</span>
          </h1>
          
          <p className="text-xl text-gray-600 mb-12 max-w-3xl mx-auto">
            Choose the plan that's right for your business. All plans include a 14-day free trial with no credit card required.
          </p>
          
          {/* Billing Toggle */}
          <div className="inline-flex items-center p-2 bg-white rounded-xl shadow-sm border">
            <span className={`px-4 py-2 text-sm font-medium transition-colors ${
              !isAnnual ? 'text-gray-900' : 'text-gray-500'
            }`}>
              Monthly
            </span>
            <button
              onClick={() => setIsAnnual(!isAnnual)}
              className={`relative inline-flex h-8 w-14 items-center rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 ${
                isAnnual ? 'bg-gradient-to-r from-purple-500 to-pink-500' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-6 w-6 transform rounded-md bg-white transition-transform shadow-sm ${
                  isAnnual ? 'translate-x-7' : 'translate-x-1'
                }`}
              />
            </button>
            <span className={`px-4 py-2 text-sm font-medium transition-colors ${
              isAnnual ? 'text-gray-900' : 'text-gray-500'
            }`}>
              Annual 
              <span className="ml-1 inline-flex items-center px-2 py-1 rounded-full bg-green-100 text-green-800 text-xs font-medium">
                Save 20%
              </span>
            </span>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-16">
          {plans.map((plan, index) => {
            const colorClasses = getColorClasses(plan.color);
            
            return (
              <div
                key={index}
                className={`relative bg-white rounded-2xl border-2 transition-all duration-300 hover:-translate-y-2 hover:shadow-xl ${
                  plan.isPopular 
                    ? 'md:scale-105 shadow-2xl ' + colorClasses.border
                    : 'shadow-lg ' + colorClasses.border
                }`}
              >
                {plan.isPopular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm font-bold rounded-full shadow-lg">
                      <Star className="w-4 h-4 mr-1 fill-current" />
                      Most Popular
                    </div>
                  </div>
                )}
                
                <div className="p-8">
                  {/* Plan Header */}
                  <div className="text-center mb-8">
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                    <div className="mb-4">
                      <span className="text-5xl font-bold text-gray-900">
                        {isAnnual ? plan.price.annual : plan.price.monthly}
                      </span>
                      <span className="text-gray-600 ml-1">/month/user</span>
                    </div>
                    <p className="text-gray-600 leading-relaxed">{plan.description}</p>
                  </div>
                  
                  {/* CTA Button */}
                  <button 
                    className={`w-full py-4 px-6 rounded-xl font-semibold text-lg transition-all duration-200 transform hover:scale-105 ${colorClasses.button}`}
                  >
                    {plan.buttonText}
                  </button>

                  {/* Features List */}
                  <div className="mt-8">
                    <p className="font-semibold text-gray-900 mb-4">What's included:</p>
                    <ul className="space-y-3">
                      {plan.features.included.map((feature, featureIndex) => (
                        <li key={featureIndex} className="flex items-start">
                          <div className="flex-shrink-0 w-5 h-5 bg-green-100 rounded-full flex items-center justify-center mt-0.5 mr-3">
                            <Check className="h-3 w-3 text-green-600" />
                          </div>
                          <span className="text-gray-700 text-sm leading-relaxed">{feature}</span>
                        </li>
                      ))}
                      {plan.features.excluded.map((feature, featureIndex) => (
                        <li key={featureIndex} className="flex items-start opacity-50">
                          <div className="flex-shrink-0 w-5 h-5 bg-gray-100 rounded-full flex items-center justify-center mt-0.5 mr-3">
                            <X className="h-3 w-3 text-gray-400" />
                          </div>
                          <span className="text-gray-400 text-sm leading-relaxed">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Enterprise CTA Section */}
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-2xl shadow-2xl overflow-hidden">
            <div className="px-8 py-12 text-center">
              <h3 className="text-3xl font-bold text-white mb-4">Need a Custom Solution?</h3>
              <p className="text-gray-300 text-lg mb-8 max-w-2xl mx-auto">
                We offer tailored solutions for large enterprises with specific requirements.
                Contact our sales team to discuss your unique needs and get a custom quote.
              </p>
              <button className="inline-flex items-center px-8 py-4 bg-white text-gray-900 font-semibold rounded-xl hover:bg-gray-100 transition-colors transform hover:scale-105">
                Contact Sales Team
              </button>
            </div>
          </div>
        </div>

        {/* Trust Indicators */}
        <div className="mt-16 text-center">
          <p className="text-sm text-gray-500 mb-4">Trusted by 10,000+ teams worldwide</p>
          <div className="flex justify-center items-center space-x-2">
            <div className="flex -space-x-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full border-2 border-white"></div>
              ))}
            </div>
            <span className="text-sm text-gray-600 ml-4">+10,000 others</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PricingUI;