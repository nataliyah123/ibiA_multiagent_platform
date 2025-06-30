import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Wand2, 
  Brain,
  Settings,
  Play,
  Pause
} from 'lucide-react';
import { useAppStore } from '../stores/useAppStore';
import { getElevenLabsService } from '../services/elevenlabs';

interface VoiceSettings {
  useElevenLabs: boolean;
  enhanceTranscript: boolean;
  analyzeIntent: boolean;
  selectedVoice: string;
}

export const VoiceInput: React.FC = () => {
  const { 
    isDarkMode, 
    isListening, 
    setIsListening, 
    voiceTranscript, 
    setVoiceTranscript,
    addAgent,
    setSelectedFramework 
  } = useAppStore();
  
  const [isSupported, setIsSupported] = useState(false);
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);
  const [finalTranscript, setFinalTranscript] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [enhancedTranscript, setEnhancedTranscript] = useState('');
  const [intentAnalysis, setIntentAnalysis] = useState<any>(null);
  const [audioPlayback, setAudioPlayback] = useState<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [availableVoices, setAvailableVoices] = useState<Array<{ voice_id: string; name: string }>>([]);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  
  const [settings, setSettings] = useState<VoiceSettings>({
    useElevenLabs: false,
    enhanceTranscript: true,
    analyzeIntent: true,
    selectedVoice: 'pNInz6obpgDQGcFmaJgB', // Adam voice
  });

  const elevenLabs = getElevenLabsService();

  useEffect(() => {
    initializeVoiceInput();
    loadAvailableVoices();
  }, []);

  const initializeVoiceInput = () => {
    // Check if speech recognition is supported
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      setIsSupported(true);
      
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
      
      recognitionInstance.continuous = true;
      recognitionInstance.interimResults = true;
      recognitionInstance.lang = 'en-US';
      
      recognitionInstance.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscriptPart = '';
        
        for (let i = 0; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          
          if (event.results[i].isFinal) {
            finalTranscriptPart += transcript + ' ';
          } else {
            interimTranscript += transcript;
          }
        }
        
        if (finalTranscriptPart) {
          setFinalTranscript(prev => prev + finalTranscriptPart);
        }
        
        const fullTranscript = finalTranscript + finalTranscriptPart + interimTranscript;
        setVoiceTranscript(fullTranscript.trim());
      };
      
      recognitionInstance.onend = () => {
        setIsListening(false);
        if (settings.useElevenLabs && mediaRecorderRef.current) {
          stopElevenLabsRecording();
        }
      };
      
      recognitionInstance.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };
      
      setRecognition(recognitionInstance);
    }
  };

  const loadAvailableVoices = async () => {
    if (elevenLabs) {
      try {
        const voices = await elevenLabs.getVoices();
        setAvailableVoices(voices);
        setSettings(prev => ({ ...prev, useElevenLabs: true }));
      } catch (error) {
        console.warn('Failed to load ElevenLabs voices:', error);
      }
    }
  };

  const startElevenLabsRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };
      
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        await processElevenLabsAudio(audioBlob);
        
        // Stop all tracks to release microphone
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
    } catch (error) {
      console.error('Failed to start ElevenLabs recording:', error);
    }
  };

  const stopElevenLabsRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
  };

  const processElevenLabsAudio = async (audioBlob: Blob) => {
    if (!elevenLabs) return;
    
    setIsProcessing(true);
    
    try {
      const result = await elevenLabs.speechToText(audioBlob);
      const newTranscript = finalTranscript + result.text + ' ';
      
      setFinalTranscript(newTranscript);
      setVoiceTranscript(newTranscript.trim());
      
      // Process transcript if enabled
      if (settings.enhanceTranscript || settings.analyzeIntent) {
        await processTranscript(newTranscript.trim());
      }
    } catch (error) {
      console.error('Failed to process ElevenLabs audio:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const processTranscript = async (transcript: string) => {
    if (!transcript.trim()) return;
    
    setIsProcessing(true);
    
    try {
      // Enhance transcript
      if (settings.enhanceTranscript && elevenLabs) {
        const enhanced = await elevenLabs.enhanceTranscript(transcript);
        setEnhancedTranscript(enhanced);
      }
      
      // Analyze intent
      if (settings.analyzeIntent && elevenLabs) {
        const analysis = await elevenLabs.analyzeIntent(transcript);
        setIntentAnalysis(analysis);
        
        // Auto-apply detected intents
        await applyIntentActions(analysis);
      }
    } catch (error) {
      console.error('Failed to process transcript:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const applyIntentActions = async (analysis: any) => {
    if (!analysis || analysis.confidence < 0.7) return;
    
    try {
      // Extract framework selection
      const frameworkEntity = analysis.entities.find((e: any) => e.type === 'framework');
      if (frameworkEntity && analysis.intent.includes('framework')) {
        const framework = frameworkEntity.value.toLowerCase();
        if (['crewai', 'autogen', 'google-adk'].includes(framework)) {
          setSelectedFramework(framework);
        }
      }
      
      // Extract agent creation
      if (analysis.intent.includes('agent') || analysis.intent.includes('create')) {
        const agentRoles = analysis.entities.filter((e: any) => e.type === 'agent_role');
        const agentCount = analysis.entities.find((e: any) => e.type === 'agent_count');
        
        if (agentRoles.length > 0) {
          for (const roleEntity of agentRoles) {
            const agent = {
              id: `agent-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              name: roleEntity.value,
              role: roleEntity.value,
              description: `AI agent specialized in ${roleEntity.value.toLowerCase()} tasks`,
              capabilities: [`${roleEntity.value.toLowerCase()}_processing`, 'communication', 'task_execution'],
            };
            addAgent(agent);
          }
        }
      }
    } catch (error) {
      console.error('Failed to apply intent actions:', error);
    }
  };

  const toggleListening = async () => {
    if (!recognition) return;
    
    if (isListening) {
      recognition.stop();
      setIsListening(false);
    } else {
      // Reset transcripts when starting a new session
      setFinalTranscript('');
      setVoiceTranscript('');
      setEnhancedTranscript('');
      setIntentAnalysis(null);
      
      if (settings.useElevenLabs && elevenLabs) {
        await startElevenLabsRecording();
      }
      
      recognition.start();
      setIsListening(true);
    }
  };

  const clearTranscript = () => {
    setVoiceTranscript('');
    setFinalTranscript('');
    setEnhancedTranscript('');
    setIntentAnalysis(null);
  };

  const playEnhancedTranscript = async () => {
    if (!elevenLabs || !enhancedTranscript) return;
    
    try {
      setIsProcessing(true);
      const result = await elevenLabs.textToSpeech(enhancedTranscript, settings.selectedVoice);
      
      if (audioPlayback) {
        audioPlayback.pause();
      }
      
      const audio = new Audio(result.audioUrl);
      audio.onplay = () => setIsPlaying(true);
      audio.onended = () => setIsPlaying(false);
      audio.onerror = () => setIsPlaying(false);
      
      setAudioPlayback(audio);
      await audio.play();
    } catch (error) {
      console.error('Failed to play enhanced transcript:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const stopPlayback = () => {
    if (audioPlayback) {
      audioPlayback.pause();
      setIsPlaying(false);
    }
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
      <div className="flex items-center justify-between">
        <div className="text-center flex-1">
          <h2 className="text-2xl font-bold mb-2">Voice Specifications</h2>
          <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Describe your multiagent system using natural language
          </p>
        </div>
        
        <button
          onClick={() => setShowSettings(!showSettings)}
          className={`p-2 rounded-lg transition-colors ${
            isDarkMode 
              ? 'hover:bg-gray-700 text-gray-400 hover:text-white' 
              : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
          }`}
        >
          <Settings className="w-5 h-5" />
        </button>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className={`rounded-xl p-4 border ${
            isDarkMode 
              ? 'bg-gray-800/50 border-gray-700' 
              : 'bg-white border-gray-200'
          }`}
        >
          <h3 className="text-lg font-semibold mb-4">Voice Settings</h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Use ElevenLabs</label>
              <input
                type="checkbox"
                checked={settings.useElevenLabs && !!elevenLabs}
                onChange={(e) => setSettings(prev => ({ ...prev, useElevenLabs: e.target.checked }))}
                disabled={!elevenLabs}
                className="rounded"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Enhance Transcript</label>
              <input
                type="checkbox"
                checked={settings.enhanceTranscript}
                onChange={(e) => setSettings(prev => ({ ...prev, enhanceTranscript: e.target.checked }))}
                className="rounded"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Analyze Intent</label>
              <input
                type="checkbox"
                checked={settings.analyzeIntent}
                onChange={(e) => setSettings(prev => ({ ...prev, analyzeIntent: e.target.checked }))}
                className="rounded"
              />
            </div>
            
            {availableVoices.length > 0 && (
              <div>
                <label className="text-sm font-medium block mb-2">Voice Selection</label>
                <select
                  value={settings.selectedVoice}
                  onChange={(e) => setSettings(prev => ({ ...prev, selectedVoice: e.target.value }))}
                  className={`w-full px-3 py-2 rounded-lg border ${
                    isDarkMode 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-300'
                  }`}
                >
                  {availableVoices.map(voice => (
                    <option key={voice.voice_id} value={voice.voice_id}>
                      {voice.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </motion.div>
      )}

      <div className={`rounded-xl p-6 border ${
        isDarkMode 
          ? 'bg-gray-800/50 border-gray-700' 
          : 'bg-white border-gray-200'
      }`}>
        {/* Voice Control */}
        <div className="flex items-center justify-center mb-6">
          <motion.button
            onClick={toggleListening}
            disabled={isProcessing}
            className={`relative p-8 rounded-full transition-all duration-300 ${
              isListening
                ? 'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/25'
                : isProcessing
                ? 'bg-yellow-500 text-white shadow-lg shadow-yellow-500/25'
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
            {isProcessing ? (
              <Brain className="w-8 h-8" />
            ) : isListening ? (
              <MicOff className="w-8 h-8" />
            ) : (
              <Mic className="w-8 h-8" />
            )}
          </motion.button>
        </div>

        <div className="text-center mb-6">
          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            {isProcessing 
              ? 'Processing with AI...'
              : isListening 
              ? 'Listening... Click to stop recording' 
              : 'Click the microphone to start speaking'
            }
          </p>
          {(isListening || isProcessing) && (
            <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
              {settings.useElevenLabs && elevenLabs 
                ? 'Using ElevenLabs enhanced processing'
                : 'Using browser speech recognition'
              }
            </p>
          )}
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
              <h3 className="text-sm font-semibold">Original Transcript</h3>
              <div className="flex items-center space-x-2">
                <span className={`text-xs px-2 py-1 rounded-full ${
                  isListening 
                    ? 'bg-red-100 text-red-800' 
                    : 'bg-green-100 text-green-800'
                }`}>
                  {isListening ? 'Recording' : 'Stopped'}
                </span>
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
            </div>
            <div className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} max-h-32 overflow-y-auto`}>
              <p className="whitespace-pre-wrap leading-relaxed">
                {voiceTranscript}
              </p>
            </div>
            <div className={`text-xs mt-2 ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
              Words: {voiceTranscript.split(' ').filter(word => word.length > 0).length}
            </div>
          </motion.div>
        )}

        {/* Enhanced Transcript */}
        {enhancedTranscript && enhancedTranscript !== voiceTranscript && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mt-4 p-4 rounded-lg border ${
              isDarkMode 
                ? 'bg-emerald-900/20 border-emerald-700' 
                : 'bg-emerald-50 border-emerald-200'
            }`}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center space-x-2">
                <Wand2 className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-semibold text-emerald-600">Enhanced Transcript</h3>
              </div>
              <div className="flex items-center space-x-2">
                {elevenLabs && (
                  <button
                    onClick={isPlaying ? stopPlayback : playEnhancedTranscript}
                    disabled={isProcessing}
                    className={`p-1 rounded transition-colors ${
                      isDarkMode 
                        ? 'hover:bg-emerald-700 text-emerald-400 hover:text-white' 
                        : 'hover:bg-emerald-200 text-emerald-600 hover:text-emerald-800'
                    }`}
                  >
                    {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </button>
                )}
              </div>
            </div>
            <div className={`text-sm ${isDarkMode ? 'text-emerald-300' : 'text-emerald-800'} max-h-32 overflow-y-auto`}>
              <p className="whitespace-pre-wrap leading-relaxed">
                {enhancedTranscript}
              </p>
            </div>
          </motion.div>
        )}

        {/* Intent Analysis */}
        {intentAnalysis && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mt-4 p-4 rounded-lg border ${
              isDarkMode 
                ? 'bg-purple-900/20 border-purple-700' 
                : 'bg-purple-50 border-purple-200'
            }`}
          >
            <div className="flex items-center space-x-2 mb-2">
              <Brain className="w-4 h-4 text-purple-600" />
              <h3 className="text-sm font-semibold text-purple-600">Intent Analysis</h3>
              <span className={`text-xs px-2 py-1 rounded-full ${
                intentAnalysis.confidence > 0.8 
                  ? 'bg-green-100 text-green-800'
                  : intentAnalysis.confidence > 0.6
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-red-100 text-red-800'
              }`}>
                {Math.round(intentAnalysis.confidence * 100)}% confidence
              </span>
            </div>
            
            <div className="space-y-2">
              <div>
                <span className="text-xs font-medium">Intent:</span>
                <span className={`ml-2 text-sm ${isDarkMode ? 'text-purple-300' : 'text-purple-800'}`}>
                  {intentAnalysis.intent}
                </span>
              </div>
              
              {intentAnalysis.entities.length > 0 && (
                <div>
                  <span className="text-xs font-medium">Entities:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {intentAnalysis.entities.map((entity: any, index: number) => (
                      <span
                        key={index}
                        className={`text-xs px-2 py-1 rounded-full ${
                          isDarkMode 
                            ? 'bg-purple-700 text-purple-200' 
                            : 'bg-purple-100 text-purple-800'
                        }`}
                      >
                        {entity.type}: {entity.value}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Voice Processing Status */}
        {(isListening || isProcessing) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-4 flex items-center justify-center space-x-2"
          >
            <div className="flex space-x-1">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className={`w-2 h-8 rounded-full ${
                    isProcessing ? 'bg-yellow-500' : 'bg-indigo-500'
                  }`}
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
              {isProcessing ? 'Processing with AI...' : 'Processing audio...'}
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
            <li>• Speak naturally - AI will enhance and analyze your input</li>
          </ul>
        </div>
      </div>

      {/* ElevenLabs Integration Status */}
      <div className={`rounded-lg p-4 border ${
        elevenLabs
          ? isDarkMode 
            ? 'bg-emerald-900/20 border-emerald-700' 
            : 'bg-emerald-50 border-emerald-200'
          : isDarkMode 
            ? 'bg-amber-900/20 border-amber-700' 
            : 'bg-amber-50 border-amber-200'
      }`}>
        <div className="flex items-center space-x-2">
          <Volume2 className={`w-5 h-5 ${elevenLabs ? 'text-emerald-600' : 'text-amber-600'}`} />
          <span className={`text-sm font-semibold ${elevenLabs ? 'text-emerald-600' : 'text-amber-600'}`}>
            {elevenLabs ? 'ElevenLabs Enhanced Voice' : 'Browser Speech Recognition'}
          </span>
        </div>
        <p className={`text-xs mt-1 ${
          elevenLabs 
            ? isDarkMode ? 'text-emerald-400' : 'text-emerald-700'
            : isDarkMode ? 'text-amber-400' : 'text-amber-700'
        }`}>
          {elevenLabs 
            ? 'Advanced voice processing with speech-to-text, transcript enhancement, and intent analysis powered by ElevenLabs and Google Gemini AI.'
            : 'Using browser speech recognition with Gemini AI enhancement. Add VITE_ELEVENLABS_API_KEY to enable advanced features.'
          }
        </p>
      </div>
    </div>
  );
};