
interface VoiceFeedbackProps {
  isActive: boolean;
  transcript: string;
  interpretedFilters: Array<{ filterId: string; value: any }>;
  state: 'idle' | 'listening' | 'processing' | 'complete' | 'error';
}

export function VoiceFeedback({ 
  isActive, 
  transcript, 
  interpretedFilters,
  state
}: VoiceFeedbackProps) {
  if (!isActive) return null;

  return (
    <div
      className="fixed bottom-24 left-0 right-0 mx-auto w-5/6 max-w-md bg-white/90 backdrop-blur-md rounded-xl shadow-lg p-4 z-50 transition-all duration-300"
      style={{
        opacity: isActive ? 1 : 0,
        transform: isActive ? 'translateY(0)' : 'translateY(20px)'
      }}
    >
      <div className="space-y-3">
        {state === 'listening' && (
          <div className="flex items-center space-x-2">
            <div className="relative">
              <div className="absolute inset-0 bg-red-400 rounded-full animate-ping opacity-25"></div>
              <div className="relative w-3 h-3 bg-red-500 rounded-full"></div>
            </div>
            <p className="text-gray-700 font-medium">Listening...</p>
          </div>
        )}
        
        {transcript && (
          <p className="text-gray-800 font-medium">{transcript}</p>
        )}
        
        {interpretedFilters.length > 0 && (
          <div className="bg-blue-50 p-2 rounded-lg">
            <p className="text-sm text-blue-800 font-medium">Filters:</p>
            <div className="flex flex-wrap gap-2 mt-1">
              {interpretedFilters.map((filter, index) => (
                <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                  {filter.filterId}: {Array.isArray(filter.value) 
                    ? filter.value.join(', ') 
                    : filter.value.toString()}
                </span>
              ))}
            </div>
          </div>
        )}
        
        {state === 'error' && (
          <p className="text-red-500 text-sm">
            Sorry, I didn't catch that. Please try again.
          </p>
        )}
      </div>
    </div>
  );
}