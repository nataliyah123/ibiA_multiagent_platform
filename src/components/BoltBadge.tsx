import React from 'react';
import { motion } from 'framer-motion';

interface BoltBadgeProps {
  isDarkBackground?: boolean;
  className?: string;
}

export const BoltBadge: React.FC<BoltBadgeProps> = ({ 
  isDarkBackground = false, 
  className = '' 
}) => {
  const badgeVariant = isDarkBackground ? 'bolt-white-circle.svg' : 'bolt-black-circle.svg';
  
  return (
    <motion.a
      href="https://bolt.new/"
      target="_blank"
      rel="noopener noreferrer"
      className={`fixed top-4 right-4 z-50 transition-transform hover:scale-105 ${className}`}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      aria-label="Visit Bolt.new - AI-powered web development platform"
    >
      <img
        src={`/bolt-badge/${badgeVariant}`}
        alt="Bolt.new - AI-powered development platform"
        className="w-24 h-8 sm:w-28 sm:h-9 md:w-32 md:h-10 drop-shadow-lg"
        loading="lazy"
      />
    </motion.a>
  );
};