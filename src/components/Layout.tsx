import React from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from '../stores/useAppStore';
import { BoltBadge } from './BoltBadge';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { isDarkMode } = useAppStore();

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      isDarkMode 
        ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-indigo-900 text-white' 
        : 'bg-gradient-to-br from-gray-50 via-white to-indigo-50 text-gray-900'
    }`}>
      <BoltBadge isDarkBackground={isDarkMode} />
      
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="relative z-10"
      >
        {children}
      </motion.div>
      
      {/* Background decorative elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-10 ${
          isDarkMode ? 'bg-indigo-400' : 'bg-indigo-600'
        } blur-3xl`} />
        <div className={`absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full opacity-10 ${
          isDarkMode ? 'bg-emerald-400' : 'bg-emerald-600'
        } blur-3xl`} />
      </div>
    </div>
  );
};