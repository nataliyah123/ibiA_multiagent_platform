import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Zap, 
  Bot, 
  Workflow, 
  Download, 
  Settings, 
  BarChart3,
  Clock,
  CheckCircle,
  AlertCircle,
  Mic,
  FileText,
  Database
} from 'lucide-react';
import { useAppStore } from '../stores/useAppStore';
import { FrameworkComparison } from './FrameworkComparison';
import { AgentBuilder } from './AgentBuilder';
import { VoiceInput } from './VoiceInput';
import { DataManagement } from './DataManagement';
import { codeGenerator } from '../services/codeGenerator';
import { packageService } from '../services/packageService';

type Step = 'framework' | 'input-mode' | 'agents' | 'generate' | 'data';

export const Dashboard: React.FC = () => {
  const { 
    isDarkMode, 
    selectedFramework, 
    inputMode, 
    setInputMode,
    agents, 
    workflowSteps,
    projectName,
    setProjectName,
    resetSessionState
  } = useAppStore();
  
  const [currentStep, setCurrentStep] = useState<Step>('framework');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedProject, setGeneratedProject] = useState<any>(null);
  const [hasElevenLabs, setHasElevenLabs] = useState(false);

  // Reset session state on component mount to ensure fresh start
  useEffect(() => {
    resetSessionState();
  }, [resetSessionState]);

  // Check for ElevenLabs API key
  useEffect(() => {
    const elevenLabsKey = import.meta.env.VITE_ELEVENLABS_API_KEY;
    setHasElevenLabs(!!elevenLabsKey);
  }, []);

  const steps = [
    { id: 'framework', title: 'Framework', icon: Zap, completed: !!selectedFramework },
    { id: 'input-mode', title: 'Input & Workflow', icon: inputMode === 'voice' ? Mic : FileText, completed: !!inputMode },
    { id: 'agents', title: 'Agents', icon: Bot, completed: agents.length > 0 },
    { id: 'data', title: 'Data', icon: Database, completed: true },
    { id: 'generate', title: 'Generate', icon: Download, completed: !!generatedProject },
  ];

  const handleGenerateProject = async () => {
    if (!selectedFramework || agents.length === 0) return;
    
    setIsGenerating(true);
    
    try {
      // Generate project code
      const project = codeGenerator.generateProject({
        framework: selectedFramework,
        agents,
        workflow: workflowSteps,
        projectName: projectName || 'My Multiagent System'
      });
      
      setGeneratedProject(project);
      
      // Simulate generation delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
    } catch (error) {
      console.error('Project generation failed:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadProject = async () => {
    if (!generatedProject) return;
    
    try {
      const packageBlob = await packageService.createDownloadPackage({
        projectName: projectName || 'My Multiagent System',
        framework: selectedFramework,
        files: generatedProject.files,
        includeNetlifyConfig: true,
        includeServerless: true
      });
      
      const url = URL.createObjectURL(packageBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${(projectName || 'multiagent-system').toLowerCase().replace(/\s+/g, '-')}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  const StepHeader = () => (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Multiagent System Builder</h1>
          <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Create production-ready AI agent systems with automated workflows and RAG-powered insights
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          <input
            type="text"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            placeholder="Project Name"
            className={`px-4 py-2 rounded-lg border ${
              isDarkMode 
                ? 'bg-gray-800 border-gray-700 text-white' 
                : 'bg-white border-gray-300'
            } focus:ring-2 focus:ring-indigo-500 focus:border-transparent`}
          />
          
          <button
            onClick={resetSessionState}
            className={`px-3 py-2 rounded-lg text-sm transition-colors ${
              isDarkMode 
                ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
            title="Reset all selections"
          >
            Reset
          </button>
        </div>
      </div>
      
      {/* Progress Steps */}
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const isActive = currentStep === step.id;
          const isCompleted = step.completed;
          
          return (
            <React.Fragment key={step.id}>
              <motion.button
                onClick={() => setCurrentStep(step.id as Step)}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${
                  isActive
                    ? isDarkMode
                      ? 'bg-indigo-600 text-white'
                      : 'bg-indigo-100 text-indigo-700'
                    : isCompleted
                    ? isDarkMode
                      ? 'bg-green-600/20 text-green-400 hover:bg-green-600/30'
                      : 'bg-green-100 text-green-700 hover:bg-green-200'
                    : isDarkMode
                    ? 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="relative">
                  <Icon className="w-5 h-5" />
                  {isCompleted && (
                    <CheckCircle className="w-3 h-3 absolute -top-1 -right-1 text-green-500 bg-white rounded-full" />
                  )}
                </div>
                <span className="font-medium">{step.title}</span>
              </motion.button>
              
              {index < steps.length - 1 && (
                <div className={`flex-1 h-px mx-4 ${
                  isDarkMode ? 'bg-gray-700' : 'bg-gray-300'
                }`} />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case 'framework':
        return <FrameworkComparison />;
        
      case 'input-mode':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">Choose Input Method</h2>
              <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Select how you want to specify your multiagent system requirements
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <motion.button
                onClick={() => setInputMode('voice')}
                className={`p-6 rounded-xl border-2 transition-all text-left ${
                  inputMode === 'voice'
                    ? `border-indigo-500 ${isDarkMode ? 'bg-indigo-900/20' : 'bg-indigo-50'}`
                    : `border-transparent ${isDarkMode ? 'bg-gray-800/50 hover:bg-gray-800' : 'bg-white hover:bg-gray-50'} ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`
                } border-2`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Mic className="w-8 h-8 text-indigo-600 mb-4" />
                <h3 className="text-lg font-bold mb-2">Voice Input</h3>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Describe your system using natural language with AI-powered voice processing
                </p>
                <div className="mt-4 flex items-center space-x-2">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    hasElevenLabs 
                      ? 'bg-green-100 text-green-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {hasElevenLabs ? 'ElevenLabs' : 'Browser Speech'}
                  </span>
                  <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                    Natural Language
                  </span>
                </div>
              </motion.button>
              
              <motion.button
                onClick={() => setInputMode('form')}
                className={`p-6 rounded-xl border-2 transition-all text-left ${
                  inputMode === 'form'
                    ? `border-indigo-500 ${isDarkMode ? 'bg-indigo-900/20' : 'bg-indigo-50'}`
                    : `border-transparent ${isDarkMode ? 'bg-gray-800/50 hover:bg-gray-800' : 'bg-white hover:bg-gray-50'} ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`
                } border-2`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <FileText className="w-8 h-8 text-emerald-600 mb-4" />
                <h3 className="text-lg font-bold mb-2">Form Input</h3>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Use structured forms with conditional fields for precise configuration
                </p>
                <div className="mt-4 flex items-center space-x-2">
                  <span className="px-2 py-1 text-xs bg-emerald-100 text-emerald-800 rounded-full">
                    Structured
                  </span>
                  <span className="px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded-full">
                    Precise
                  </span>
                </div>
              </motion.button>
            </div>
            
            {inputMode && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-8"
              >
                {inputMode === 'voice' ? (
                  <VoiceInput />
                ) : (
                  <div className="space-y-6">
                    {/* Workflow Design for Form Input */}
                    <div className={`rounded-xl p-6 border ${
                      isDarkMode 
                        ? 'bg-gray-800/50 border-gray-700' 
                        : 'bg-white border-gray-200'
                    }`}>
                      <div className="text-center">
                        <Workflow className={`w-16 h-16 mx-auto mb-4 ${
                          isDarkMode ? 'text-gray-600' : 'text-gray-400'
                        }`} />
                        <h3 className="text-lg font-semibold mb-2">Workflow Builder</h3>
                        <p className={`mb-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          Visual workflow designer with drag-and-drop interface and Mermaid diagram export
                        </p>
                        <div className="flex items-center justify-center space-x-4 text-sm">
                          <span className="flex items-center space-x-2">
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            <span>Drag & Drop Interface</span>
                          </span>
                          <span className="flex items-center space-x-2">
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            <span>Mermaid Export</span>
                          </span>
                          <span className="flex items-center space-x-2">
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            <span>Real-time Validation</span>
                          </span>
                        </div>
                        
                        <div className={`mt-6 p-4 rounded-lg ${
                          isDarkMode ? 'bg-indigo-900/20 border border-indigo-700' : 'bg-indigo-50 border border-indigo-200'
                        }`}>
                          <h4 className="text-sm font-semibold mb-2 text-indigo-600">Coming in v2.0</h4>
                          <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            Advanced workflow builder with visual node editor, conditional logic, and automated testing capabilities.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </div>
        );
        
      case 'agents':
        return <AgentBuilder />;

      case 'data':
        return <DataManagement />;
        
      case 'generate':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">Generate Project</h2>
              <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Create your complete multiagent system with deployment configuration
              </p>
            </div>
            
            {/* Project Summary */}
            <div className={`rounded-xl p-6 border ${
              isDarkMode 
                ? 'bg-gray-800/50 border-gray-700' 
                : 'bg-white border-gray-200'
            }`}>
              <h3 className="text-lg font-bold mb-4">Project Summary</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className={`p-4 rounded-lg ${
                  isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'
                }`}>
                  <div className="flex items-center space-x-2 mb-2">
                    <Zap className="w-5 h-5 text-indigo-600" />
                    <span className="font-semibold">Framework</span>
                  </div>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {selectedFramework?.toUpperCase() || 'Not selected'}
                  </p>
                </div>
                
                <div className={`p-4 rounded-lg ${
                  isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'
                }`}>
                  <div className="flex items-center space-x-2 mb-2">
                    <Bot className="w-5 h-5 text-emerald-600" />
                    <span className="font-semibold">Agents</span>
                  </div>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {agents.length} configured
                  </p>
                </div>
                
                <div className={`p-4 rounded-lg ${
                  isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'
                }`}>
                  <div className="flex items-center space-x-2 mb-2">
                    <Database className="w-5 h-5 text-purple-600" />
                    <span className="font-semibold">Data</span>
                  </div>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    RAG-enabled
                  </p>
                </div>
              </div>
              
              <div className="flex space-x-4">
                <button
                  onClick={handleGenerateProject}
                  disabled={!selectedFramework || agents.length === 0 || isGenerating}
                  className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
                >
                  {isGenerating ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Generating...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-5 h-5" />
                      <span>Generate Project</span>
                    </>
                  )}
                </button>
                
                {generatedProject && (
                  <button
                    onClick={handleDownloadProject}
                    className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center space-x-2"
                  >
                    <Download className="w-5 h-5" />
                    <span>Download</span>
                  </button>
                )}
              </div>
            </div>
            
            {/* Generated Project Details */}
            {generatedProject && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`rounded-xl p-6 border ${
                  isDarkMode 
                    ? 'bg-gray-800/50 border-gray-700' 
                    : 'bg-white border-gray-200'
                }`}
              >
                <h3 className="text-lg font-bold mb-4">Generated Project</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-2">Project Structure</h4>
                    <div className={`p-3 rounded-lg text-sm font-mono ${
                      isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'
                    }`}>
                      {generatedProject.structure.slice(0, 10).map((file: string, index: number) => (
                        <div key={index} className="py-1">
                          {file}
                        </div>
                      ))}
                      {generatedProject.structure.length > 10 && (
                        <div className={`py-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          ... and {generatedProject.structure.length - 10} more files
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-2">Dependencies</h4>
                    <div className={`p-3 rounded-lg text-sm ${
                      isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'
                    }`}>
                      {generatedProject.dependencies.map((dep: string, index: number) => (
                        <div key={index} className="py-1">
                          {dep}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                
                <div className="mt-6 flex items-center space-x-4 text-sm">
                  <span className="flex items-center space-x-2 text-green-600">
                    <CheckCircle className="w-4 h-4" />
                    <span>Code Sanitized</span>
                  </span>
                  <span className="flex items-center space-x-2 text-green-600">
                    <CheckCircle className="w-4 h-4" />
                    <span>Supabase Ready</span>
                  </span>
                  <span className="flex items-center space-x-2 text-green-600">
                    <CheckCircle className="w-4 h-4" />
                    <span>Vector DB Enabled</span>
                  </span>
                  <span className="flex items-center space-x-2 text-green-600">
                    <CheckCircle className="w-4 h-4" />
                    <span>Netlify Ready</span>
                  </span>
                </div>
              </motion.div>
            )}
          </div>
        );
        
      default:
        return null;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <StepHeader />
      
      <motion.div
        key={currentStep}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.3 }}
      >
        {renderStepContent()}
      </motion.div>
      
      {/* Navigation */}
      <div className="mt-8 flex justify-between">
        <button
          onClick={() => {
            const currentIndex = steps.findIndex(s => s.id === currentStep);
            if (currentIndex > 0) {
              setCurrentStep(steps[currentIndex - 1].id as Step);
            }
          }}
          disabled={currentStep === 'framework'}
          className={`px-6 py-2 rounded-lg transition-colors ${
            currentStep === 'framework'
              ? 'opacity-50 cursor-not-allowed'
              : isDarkMode
              ? 'bg-gray-700 text-white hover:bg-gray-600'
              : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
          }`}
        >
          Previous
        </button>
        
        <button
          onClick={() => {
            const currentIndex = steps.findIndex(s => s.id === currentStep);
            if (currentIndex < steps.length - 1) {
              setCurrentStep(steps[currentIndex + 1].id as Step);
            }
          }}
          disabled={currentStep === 'generate'}
          className={`px-6 py-2 rounded-lg transition-colors ${
            currentStep === 'generate'
              ? 'opacity-50 cursor-not-allowed'
              : 'bg-indigo-600 text-white hover:bg-indigo-700'
          }`}
        >
          Next
        </button>
      </div>
    </div>
  );
};