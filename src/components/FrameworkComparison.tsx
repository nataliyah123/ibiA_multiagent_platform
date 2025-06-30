import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Star, TrendingUp, Clock, RotateCcw } from 'lucide-react';
import { useAppStore } from '../stores/useAppStore';

interface Framework {
  id: string;
  name: string;
  description: string;
  pros: string[];
  cons: string[];
  useCase: string;
  popularity: number;
  lastUpdated: string;
  complexity: 'Beginner' | 'Intermediate' | 'Advanced';
  pricing: 'Free' | 'Freemium' | 'Paid';
}

const frameworks: Framework[] = [
  {
    id: 'crewai',
    name: 'CrewAI',
    description: 'Role-playing autonomous AI agents framework for collaborative intelligence',
    pros: [
      'Easy to set up and use',
      'Strong community support',
      'Excellent documentation',
      'Built-in agent roles',
      'Supports various LLMs'
    ],
    cons: [
      'Relatively new framework',
      'Limited enterprise features',
      'Python-only implementation'
    ],
    useCase: 'Content creation, research tasks, collaborative workflows',
    popularity: 85,
    lastUpdated: '2024-01-15',
    complexity: 'Beginner',
    pricing: 'Free'
  },
  {
    id: 'autogen',
    name: 'AutoGen',
    description: 'Microsoft\'s multi-agent conversation framework for solving tasks',
    pros: [
      'Backed by Microsoft',
      'Advanced conversation handling',
      'Code execution capabilities',
      'Flexible agent configuration',
      'Strong research foundation'
    ],
    cons: [
      'Steeper learning curve',
      'Resource intensive',
      'Complex setup for beginners'
    ],
    useCase: 'Complex problem solving, code generation, research automation',
    popularity: 92,
    lastUpdated: '2024-01-20',
    complexity: 'Advanced',
    pricing: 'Free'
  },
  {
    id: 'google-adk',
    name: 'Google ADK',
    description: 'Google\'s Agent Development Kit for building intelligent agent systems',
    pros: [
      'Google Cloud integration',
      'Enterprise-grade scaling',
      'Advanced AI capabilities',
      'Security features',
      'Multi-language support'
    ],
    cons: [
      'Requires Google Cloud setup',
      'Can be expensive at scale',
      'Learning curve for beginners'
    ],
    useCase: 'Enterprise applications, Google Workspace integration, large-scale deployments',
    popularity: 78,
    lastUpdated: '2024-01-18',
    complexity: 'Intermediate',
    pricing: 'Freemium'
  }
];

export const FrameworkComparison: React.FC = () => {
  const { isDarkMode, selectedFramework, setSelectedFramework } = useAppStore();

  const handleFrameworkSelect = (frameworkId: string) => {
    setSelectedFramework(frameworkId);
  };

  const handleClearSelection = () => {
    setSelectedFramework('');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="text-center flex-1">
          <h2 className="text-2xl font-bold mb-2">Choose Your Framework</h2>
          <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Compare and select the best framework for your multiagent system
          </p>
        </div>
        
        {selectedFramework && (
          <button
            onClick={handleClearSelection}
            className={`px-4 py-2 rounded-lg transition-colors flex items-center space-x-2 ${
              isDarkMode 
                ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
            title="Clear selection"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Clear</span>
          </button>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {frameworks.map((framework, index) => (
          <motion.div
            key={framework.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className={`relative overflow-hidden rounded-xl border-2 transition-all duration-300 cursor-pointer ${
              selectedFramework === framework.id
                ? `border-indigo-500 ${isDarkMode ? 'bg-indigo-900/20' : 'bg-indigo-50'} ring-2 ring-indigo-500/20`
                : `border-transparent ${isDarkMode ? 'bg-gray-800/50' : 'bg-white'} hover:border-gray-300`
            } ${isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-50'}`}
            onClick={() => handleFrameworkSelect(framework.id)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {/* Selection indicator */}
            {selectedFramework === framework.id && (
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute top-4 right-4 z-10"
              >
                <CheckCircle className="w-6 h-6 text-indigo-500" />
              </motion.div>
            )}

            <div className="p-6">
              {/* Header */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xl font-bold">{framework.name}</h3>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    framework.complexity === 'Beginner' 
                      ? 'bg-green-100 text-green-800' 
                      : framework.complexity === 'Intermediate'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {framework.complexity}
                  </span>
                </div>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {framework.description}
                </p>
              </div>

              {/* Metrics */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="flex items-center space-x-2">
                  <Star className="w-4 h-4 text-yellow-500" />
                  <div>
                    <div className="text-sm font-semibold">Popularity</div>
                    <div className="text-xs text-gray-500">{framework.popularity}%</div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-blue-500" />
                  <div>
                    <div className="text-sm font-semibold">Updated</div>
                    <div className="text-xs text-gray-500">
                      {new Date(framework.lastUpdated).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </div>

              {/* Use Case */}
              <div className="mb-4">
                <h4 className="text-sm font-semibold mb-1">Best For</h4>
                <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {framework.useCase}
                </p>
              </div>

              {/* Pros */}
              <div className="mb-4">
                <h4 className="text-sm font-semibold mb-2 text-green-600">Advantages</h4>
                <ul className="space-y-1">
                  {framework.pros.slice(0, 3).map((pro, index) => (
                    <li key={index} className="flex items-start space-x-2">
                      <CheckCircle className="w-3 h-3 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        {pro}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Cons */}
              <div className="mb-4">
                <h4 className="text-sm font-semibold mb-2 text-red-600">Considerations</h4>
                <ul className="space-y-1">
                  {framework.cons.slice(0, 2).map((con, index) => (
                    <li key={index} className="flex items-start space-x-2">
                      <XCircle className="w-3 h-3 text-red-500 mt-0.5 flex-shrink-0" />
                      <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        {con}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Pricing */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">Pricing</span>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  framework.pricing === 'Free'
                    ? 'bg-green-100 text-green-800'
                    : framework.pricing === 'Freemium'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-purple-100 text-purple-800'
                }`}>
                  {framework.pricing}
                </span>
              </div>

              {/* Popularity bar */}
              <div className="mt-4">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span>Community Adoption</span>
                  <span>{framework.popularity}%</span>
                </div>
                <div className={`w-full h-2 rounded-full ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
                  <motion.div
                    className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${framework.popularity}%` }}
                    transition={{ duration: 1, delay: index * 0.2 }}
                  />
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Selected framework details */}
      {selectedFramework && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-xl p-6 ${isDarkMode ? 'bg-gray-800/50' : 'bg-white'} border ${
            isDarkMode ? 'border-gray-700' : 'border-gray-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <CheckCircle className="w-6 h-6 text-indigo-500" />
              <h3 className="text-lg font-bold">
                {frameworks.find(f => f.id === selectedFramework)?.name} Selected
              </h3>
            </div>
            
            <button
              onClick={handleClearSelection}
              className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                isDarkMode 
                  ? 'hover:bg-gray-700 text-gray-400 hover:text-white' 
                  : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
              }`}
            >
              Change Selection
            </button>
          </div>
          
          <p className={`mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            You've selected {frameworks.find(f => f.id === selectedFramework)?.name} for your multiagent system. 
            This framework is ideal for {frameworks.find(f => f.id === selectedFramework)?.useCase.toLowerCase()}.
          </p>
        </motion.div>
      )}
    </div>
  );
};