import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Mic, MicOff, Volume2, VolumeX } from 'lucide-react';
import { useAppStore } from '../stores/useAppStore';

export const VoiceInput: React.FC = () => {
  const { isDarkMode, isListening, setIsListening, voiceTranscript, setVoiceTranscript } = useAppStore();
  const [isSupported, setIsSupported] = useState(false);
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);

  useEffect(() => {
    // Check if speech recognition is supported
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      setIsSupported(true);
      
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
      
      recognitionInstance.continuous = true;
      recognitionInstance.interimResults = true;
      recognitionInstance.lang = 'en-US';
      
      recognitionInstance.onresult = (event) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setVoiceTranscript(transcript);
      };
      
      recognitionInstance.onend = () => {
        setIsListening(false);
      };
      
      recognitionInstance.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };
      
      setRecognition(recognitionInstance);
    }
  }, [setIsListening, setVoiceTranscript]);

  const toggleListening = () => {
    if (!recognition) return;
    
    if (isListening) {
      recognition.stop();
      setIsListening(false);
    } else {
      recognition.start();
      setIsListening(true);
      setVoiceTranscript('');
    }
  };

  const clearTranscript = () => {
    setVoiceTranscript('');
  };

  if (!isSupported) {
    return (
      <div className={`rounded-xl p-6 border ${
        isDarkMode 
          ? 'bg-gray-800/50 border-gray-700' 
          : 'bg-white border-gray-200'
      }`}>
        <div className="text-center">
          <VolumeX className={`w-12 h-12 mx-auto mb-4 ${
            isDarkMode ? 'text-gray-600' : 'text-gray-400'
          }`} />
          <h3 className="text-lg font-semibold mb-2">Voice Input Not Available</h3>
          <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
            Your browser doesn't support speech recognition. Please use a modern browser like Chrome or Edge.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Voice Specifications</h2>
        <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          Describe your multiagent system using natural language
        </p>
      </div>

      <div className={`rounded-xl p-6 border ${
        isDarkMode 
          ? 'bg-gray-800/50 border-gray-700' 
          : 'bg-white border-gray-200'
      }`}>
        {/* Voice Control */}
        <div className="flex items-center justify-center mb-6">
          <motion.button
            onClick={toggleListening}
            className={`relative p-8 rounded-full transition-all duration-300 ${
              isListening
                ? 'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/25'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/25'
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            animate={isListening ? { 
              boxShadow: [
                '0 0 0 0 rgba(239, 68, 68, 0.4)',
                '0 0 0 20px rgba(239, 68, 68, 0)',
              ]
            } : {}}
            transition={isListening ? { 
              duration: 1.5, 
              repeat: Infinity,
              ease: "easeInOut"
            } : {}}
          >
            {isListening ? (
              <MicOff className="w-8 h-8" />
            ) : (
              <Mic className="w-8 h-8" />
            )}
          </motion.button>
        </div>

        <div className="text-center mb-6">
          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            {isListening 
              ? 'Listening... Click to stop' 
              : 'Click the microphone to start speaking'
            }
          </p>
        </div>

        {/* Transcript Display */}
        {voiceTranscript && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-4 rounded-lg border ${
              isDarkMode 
                ? 'bg-gray-700/50 border-gray-600' 
                : 'bg-gray-50 border-gray-200'
            }`}
          >
            <div className="flex items-start justify-between mb-2">
              <h3 className="text-sm font-semibold">Transcript</h3>
              <button
                onClick={clearTranscript}
                className={`text-xs px-2 py-1 rounded transition-colors ${
                  isDarkMode 
                    ? 'hover:bg-gray-600 text-gray-400 hover:text-white' 
                    : 'hover:bg-gray-200 text-gray-600 hover:text-gray-900'
                }`}
              >
                Clear
              </button>
            </div>
            <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              {voiceTranscript}
            </p>
          </motion.div>
        )}

        {/* Voice Processing Status */}
        {isListening && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-4 flex items-center justify-center space-x-2"
          >
            <div className="flex space-x-1">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-2 h-8 bg-indigo-500 rounded-full"
                  animate={{
                    scaleY: [0.3, 1, 0.3]
                  }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    delay: i * 0.2
                  }}
                />
              ))}
            </div>
            <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Processing audio...
            </span>
          </motion.div>
        )}

        {/* Instructions */}
        <div className={`mt-6 p-4 rounded-lg ${
          isDarkMode ? 'bg-indigo-900/20 border border-indigo-700' : 'bg-indigo-50 border border-indigo-200'
        }`}>
          <h4 className="text-sm font-semibold mb-2 text-indigo-600">Voice Instructions</h4>
          <ul className={`text-xs space-y-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            <li>• Describe the purpose of your multiagent system</li>
            <li>• Specify the number and roles of agents needed</li>
            <li>• Explain the workflow and interactions between agents</li>
            <li>• Mention any specific capabilities or integrations required</li>
          </ul>
        </div>
      </div>

      {/* Gemini Integration Note */}
      <div className={`rounded-lg p-4 border ${
        isDarkMode 
          ? 'bg-emerald-900/20 border-emerald-700' 
          : 'bg-emerald-50 border-emerald-200'
      }`}>
        <div className="flex items-center space-x-2">
          <Volume2 className="w-5 h-5 text-emerald-600" />
          <span className="text-sm font-semibold text-emerald-600">Google Gemini Integration</span>
        </div>
        <p className={`text-xs mt-1 ${isDarkMode ? 'text-emerald-400' : 'text-emerald-700'}`}>
          Enhanced voice processing with Google Gemini AI is available in the full platform. 
          Current implementation uses browser speech recognition with Gemini-powered analysis.
        </p>
      </div>
    </div>
  );
};