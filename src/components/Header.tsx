import React from 'react';
import { motion } from 'framer-motion';
import { Bot, Moon, Sun, Settings } from 'lucide-react';
import { useAppStore } from '../stores/useAppStore';

export const Header: React.FC = () => {
  const { isDarkMode, toggleTheme, projectName } = useAppStore();

  return (
    <header className={`sticky top-0 z-40 backdrop-blur-md border-b ${
      isDarkMode 
        ? 'bg-gray-900/80 border-gray-700' 
        : 'bg-white/80 border-gray-200'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Project Name */}
          <motion.div 
            className="flex items-center space-x-3"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className={`p-2 rounded-lg ${
              isDarkMode ? 'bg-indigo-600' : 'bg-indigo-100'
            }`}>
              <Bot className={`w-6 h-6 ${
                isDarkMode ? 'text-white' : 'text-indigo-600'
              }`} />
            </div>
            <div>
              <h1 className="text-lg font-bold">
                {projectName || 'ibiA Multiagent Platform'}
              </h1>
              <p className={`text-sm ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                AI-Powered Development
              </p>
            </div>
          </motion.div>

          {/* Actions */}
          <motion.div 
            className="flex items-center space-x-2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-lg transition-colors ${
                isDarkMode 
                  ? 'hover:bg-gray-700 text-gray-300 hover:text-white' 
                  : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
              }`}
              aria-label="Toggle theme"
            >
              {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            
            <button
              className={`p-2 rounded-lg transition-colors ${
                isDarkMode 
                  ? 'hover:bg-gray-700 text-gray-300 hover:text-white' 
                  : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
              }`}
              aria-label="Settings"
            >
              <Settings className="w-5 h-5" />
            </button>
          </motion.div>
        </div>
      </div>
    </header>
  );
};