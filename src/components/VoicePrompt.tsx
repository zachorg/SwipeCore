import { useState, useEffect } from 'react';
import { speechToTextService } from '@/utils/speechToText';
import { parseNaturalLanguageQuery } from '@/utils/nlpFilters';
import { Mic, Square, RefreshCw } from 'lucide-react';
import { Button } from './ui/button';
import { VoiceFeedback } from './VoiceFeedback';

interface VoicePromptProps {
  onFiltersApplied: (filters: Array<{ filterId: string; value: any }>) => void;
  onCancel: () => void;
}

export function VoicePrompt({ onFiltersApplied, onCancel }: VoicePromptProps) {
  const [voiceState, setVoiceState] = useState<'idle' | 'listening' | 'processing' | 'complete' | 'error'>('idle');
  const [transcript, setTranscript] = useState('');
  const [interpretedFilters, setInterpretedFilters] = useState<Array<{ filterId: string; value: any }>>([]);
  const [voiceAttempts, setVoiceAttempts] = useState(0);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  
  // Start listening automatically when component mounts
  useEffect(() => {
    startListening();
  }, []);
  
  const startListening = async () => {
    try {
      setVoiceState('listening');
      setTranscript('');
      setVoiceError(null);
      
      await speechToTextService.startListening(
        (result) => {
          setTranscript(result.transcript);
          
          if (result.isFinal) {
            setVoiceState('processing');
            processTranscript(result.transcript);
          }
        },
        (error) => {
          console.error('Speech recognition error:', error);
          setVoiceState('error');
          setVoiceError(error);
          setVoiceAttempts(prev => prev + 1);
        },
        () => {
          if (voiceState !== 'processing' && voiceState !== 'complete') {
            setVoiceState('idle');
          }
        }
      );
    } catch (error) {
      console.error('Failed to start speech recognition:', error);
      setVoiceState('error');
      setVoiceError('Failed to start speech recognition');
      setVoiceAttempts(prev => prev + 1);
    }
  };
  
  const stopListening = () => {
    if (speechToTextService) {
      speechToTextService.stopListening();
      setVoiceState('idle');
    }
  };
  
  const processTranscript = (text: string) => {
    // Process with NLP
    const nlpResult = parseNaturalLanguageQuery(text);
    setInterpretedFilters(nlpResult.filters);
    
    // Show results for 2 seconds before applying
    setTimeout(() => {
      setVoiceState('complete');
      if (nlpResult.filters.length > 0) {
        onFiltersApplied(nlpResult.filters);
      } else {
        // No filters found, prompt to try again
        setVoiceState('error');
        setVoiceError('No specific preferences detected. Please try again with more details.');
        setVoiceAttempts(prev => prev + 1);
      }
    }, 2000);
  };
  
  // Show different UI based on number of failed attempts
  const renderFallbackOptions = () => {
    if (voiceAttempts < 2) return null;
    
    return (
      <div className="mt-6 space-y-4">
        <p className="text-gray-700">Try one of these instead:</p>
        
        <div className="grid grid-cols-2 gap-2">
          <Button onClick={() => onFiltersApplied([{filterId: 'cuisine', value: ['italian']}])}>
            Italian Food
          </Button>
          <Button onClick={() => onFiltersApplied([{filterId: 'cuisine', value: ['chinese']}])}>
            Chinese Food
          </Button>
          <Button onClick={() => onFiltersApplied([{filterId: 'priceLevel', value: 1}])}>
            Inexpensive
          </Button>
          <Button onClick={() => onFiltersApplied([{filterId: 'restaurantFeatures', value: ['outdoor-seating']}])}>
            Outdoor Seating
          </Button>
        </div>
      </div>
    );
  };
  
  return (
    <div className="space-y-6">
      <div className={`relative w-24 h-24 mx-auto rounded-full flex items-center justify-center transition-all duration-300 ${
        voiceState === 'listening' 
          ? 'bg-red-100 border-2 border-red-400 animate-pulse' 
          : voiceState === 'processing'
          ? 'bg-blue-100 border-2 border-blue-400'
          : voiceState === 'complete'
          ? 'bg-green-100 border-2 border-green-400'
          : voiceState === 'error'
          ? 'bg-red-100 border-2 border-red-400'
          : 'bg-purple-100 border-2 border-purple-400'
      }`}>
        {voiceState === 'listening' ? (
          <Square className="w-8 h-8 text-red-500 cursor-pointer" onClick={stopListening} />
        ) : voiceState === 'processing' ? (
          <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
        ) : voiceState === 'error' ? (
          <Mic className="w-8 h-8 text-red-500 cursor-pointer" onClick={startListening} />
        ) : (
          <Mic 
            className={`w-8 h-8 ${voiceState === 'complete' ? 'text-green-500' : 'text-purple-500'} cursor-pointer`} 
            onClick={startListening} 
          />
        )}
      </div>
      
      <div className="text-center">
        {voiceState === 'listening' && (
          <p className="text-lg font-medium text-gray-800 animate-pulse">
            Listening...
          </p>
        )}
        
        {transcript && (
          <div className="bg-white/80 backdrop-blur-sm p-4 rounded-xl shadow-sm">
            <p className="text-gray-800">{transcript}</p>
          </div>
        )}
        
        {interpretedFilters.length > 0 && voiceState === 'processing' && (
          <div className="mt-4 bg-blue-50 p-3 rounded-lg">
            <p className="text-sm text-blue-800 font-medium">I heard:</p>
            <ul className="text-sm text-blue-700">
              {interpretedFilters.map((filter, index) => (
                <li key={index}>
                  {filter.filterId}: {Array.isArray(filter.value) 
                    ? filter.value.join(', ') 
                    : filter.value.toString()}
                </li>
              ))}
            </ul>
          </div>
        )}
        
        {voiceError && (
          <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-lg">
            <p>{voiceError}</p>
          </div>
        )}
        
        {renderFallbackOptions()}
        
        <Button 
          variant="outline" 
          className="mt-4 px-6 py-2 text-gray-600"
          onClick={onCancel}
        >
          Cancel
        </Button>
      </div>
      
      {/* Visual feedback component */}
      <VoiceFeedback 
        isActive={voiceState === 'listening' || voiceState === 'processing'}
        transcript={transcript}
        interpretedFilters={interpretedFilters}
        state={voiceState}
      />
    </div>
  );
}