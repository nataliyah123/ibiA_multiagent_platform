interface ElevenLabsConfig {
  apiKey: string;
  voiceId?: string;
  model?: string;
}

interface SpeechToTextResponse {
  text: string;
  confidence: number;
  duration: number;
}

interface TextToSpeechResponse {
  audioUrl: string;
  duration: number;
}

class ElevenLabsService {
  private apiKey: string;
  private baseUrl = 'https://api.elevenlabs.io/v1';
  private defaultVoiceId = 'pNInz6obpgDQGcFmaJgB'; // Adam voice

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async speechToText(audioBlob: Blob): Promise<SpeechToTextResponse> {
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'audio.wav');
      formData.append('model', 'whisper-1');

      const response = await fetch(`${this.baseUrl}/speech-to-text`, {
        method: 'POST',
        headers: {
          'xi-api-key': this.apiKey,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`ElevenLabs API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      return {
        text: data.text || '',
        confidence: data.confidence || 0.9,
        duration: data.duration || 0,
      };
    } catch (error) {
      console.error('ElevenLabs speech-to-text error:', error);
      throw new Error('Failed to convert speech to text');
    }
  }

  async textToSpeech(text: string, voiceId?: string): Promise<TextToSpeechResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/text-to-speech/${voiceId || this.defaultVoiceId}`, {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': this.apiKey,
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_monolingual_v1',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.5,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`ElevenLabs API error: ${response.status} ${response.statusText}`);
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      
      return {
        audioUrl,
        duration: 0, // Duration would need to be calculated or provided by API
      };
    } catch (error) {
      console.error('ElevenLabs text-to-speech error:', error);
      throw new Error('Failed to convert text to speech');
    }
  }

  async getVoices(): Promise<Array<{ voice_id: string; name: string; category: string }>> {
    try {
      const response = await fetch(`${this.baseUrl}/voices`, {
        headers: {
          'xi-api-key': this.apiKey,
        },
      });

      if (!response.ok) {
        throw new Error(`ElevenLabs API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data.voices || [];
    } catch (error) {
      console.error('ElevenLabs get voices error:', error);
      return [];
    }
  }

  async enhanceTranscript(transcript: string): Promise<string> {
    // Use ElevenLabs or integrate with Gemini for transcript enhancement
    try {
      const geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!geminiApiKey) {
        return transcript; // Return original if no Gemini key
      }

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${geminiApiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: `Please clean up and enhance this voice transcript for better readability while preserving the original meaning and intent. Fix grammar, punctuation, and formatting but keep the natural speech patterns:

"${transcript}"

Enhanced transcript:`
              }]
            }],
            generationConfig: {
              temperature: 0.3,
              maxOutputTokens: 1000,
            },
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        const enhancedText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        return enhancedText || transcript;
      }
    } catch (error) {
      console.warn('Failed to enhance transcript:', error);
    }

    return transcript;
  }

  async analyzeIntent(transcript: string): Promise<{
    intent: string;
    entities: Array<{ type: string; value: string }>;
    confidence: number;
  }> {
    try {
      const geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!geminiApiKey) {
        throw new Error('Gemini API key not available');
      }

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${geminiApiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: `Analyze this voice input for a multiagent system builder and extract:
1. Primary intent (e.g., "create_agents", "define_workflow", "set_framework", "configure_system")
2. Key entities (agent names, roles, frameworks, numbers, capabilities)
3. Confidence level (0-1)

Voice input: "${transcript}"

Respond in JSON format:
{
  "intent": "primary_intent_here",
  "entities": [
    {"type": "agent_count", "value": "number"},
    {"type": "framework", "value": "framework_name"},
    {"type": "agent_role", "value": "role_name"}
  ],
  "confidence": 0.95
}`
              }]
            }],
            generationConfig: {
              temperature: 0.1,
              maxOutputTokens: 500,
            },
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        const analysisText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        
        try {
          // Extract JSON from the response
          const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
          }
        } catch (parseError) {
          console.warn('Failed to parse intent analysis:', parseError);
        }
      }
    } catch (error) {
      console.warn('Failed to analyze intent:', error);
    }

    // Fallback analysis
    return {
      intent: 'general_input',
      entities: [],
      confidence: 0.5,
    };
  }
}

// Singleton instance
let elevenLabsInstance: ElevenLabsService | null = null;

export const getElevenLabsService = (): ElevenLabsService | null => {
  const apiKey = import.meta.env.VITE_ELEVENLABS_API_KEY;
  
  if (!apiKey) {
    console.warn('ElevenLabs API key not found. Voice features will use browser fallback.');
    return null;
  }

  if (!elevenLabsInstance) {
    elevenLabsInstance = new ElevenLabsService(apiKey);
  }

  return elevenLabsInstance;
};

export { ElevenLabsService };