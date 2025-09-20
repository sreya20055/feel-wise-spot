import axios from 'axios';

const ELEVENLABS_API_KEY = import.meta.env.VITE_ELEVENLABS_API_KEY;
const ELEVENLABS_BASE_URL = 'https://api.elevenlabs.io/v1';

interface VoiceSettings {
  stability: number;
  similarity_boost: number;
  style?: number;
  use_speaker_boost?: boolean;
}

interface TextToSpeechRequest {
  text: string;
  voice_id: string;
  voice_settings?: VoiceSettings;
}

interface Voice {
  voice_id: string;
  name: string;
  samples: any[];
  category: string;
  fine_tuning: {
    is_allowed_to_fine_tune: boolean;
    state: string;
  };
  labels: Record<string, string>;
  description: string;
  preview_url: string;
  available_for_tiers: string[];
  settings: VoiceSettings;
}

export class ElevenLabsService {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = ELEVENLABS_API_KEY;
    this.baseUrl = ELEVENLABS_BASE_URL;
  }

  private getHeaders() {
    return {
      'xi-api-key': this.apiKey,
      'Content-Type': 'application/json',
    };
  }

  async getVoices(): Promise<Voice[]> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/voices`,
        { headers: this.getHeaders() }
      );
      return response.data.voices || [];
    } catch (error) {
      console.error('Error fetching voices:', error);
      return [];
    }
  }

  async textToSpeech(request: TextToSpeechRequest): Promise<Blob> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/text-to-speech/${request.voice_id}`,
        {
          text: request.text,
          voice_settings: request.voice_settings || this.getDefaultVoiceSettings(),
        },
        {
          headers: {
            'xi-api-key': this.apiKey,
            'Content-Type': 'application/json',
          },
          responseType: 'blob',
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error generating speech:', error);
      throw new Error('Failed to generate speech');
    }
  }

  async speechToText(audioBlob: Blob): Promise<string> {
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'audio.webm');
      formData.append('model', 'whisper-1');

      const response = await axios.post(
        `${this.baseUrl}/speech-to-text`,
        formData,
        {
          headers: {
            'xi-api-key': this.apiKey,
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      return response.data.text || '';
    } catch (error) {
      console.error('Error converting speech to text:', error);
      throw new Error('Failed to convert speech to text');
    }
  }

  getDefaultVoiceSettings(): VoiceSettings {
    return {
      stability: 0.75,
      similarity_boost: 0.75,
      style: 0.5,
      use_speaker_boost: true,
    };
  }

  // Get a therapeutic, calming voice for mental health companion
  getTherapeuticVoice(): { voice_id: string; name: string } {
    // Using Rachel voice which is known to be calming and professional
    return {
      voice_id: '21m00Tcm4TlvDq8ikWAM',
      name: 'Rachel',
    };
  }

  // Get voice optimized for accessibility and clear speech
  getAccessibilityVoice(): { voice_id: string; name: string } {
    // Using Bella voice which is clear and well-articulated
    return {
      voice_id: 'EXAVITQu4vr4xnSDxMaL',
      name: 'Bella',
    };
  }
}

export const elevenLabsService = new ElevenLabsService();