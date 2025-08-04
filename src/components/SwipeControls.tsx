import { Heart, X, Star, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface SwipeControlsProps {
  onAction: (action: 'like' | 'pass') => void;
  onUndo?: () => void;
  swipeDirection?: 'like' | 'pass' | null;
}

export function SwipeControls({ onAction, onUndo, swipeDirection }: SwipeControlsProps) {
  return (
    <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-50">
      <div className="flex items-center gap-4 bg-card/80 backdrop-blur-sm px-6 py-4 rounded-full border border-border/20 shadow-lg">
        {/* Undo Button */}
        {onUndo && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className={`w-12 h-12 rounded-full border-2 transition-all duration-200 ${
                    swipeDirection ? 'scale-90 opacity-50' : 'hover:scale-110'
                  }`}
                  onClick={onUndo}
                >
                  <RotateCcw className="w-5 h-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Undo last swipe</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
        
        {/* Pass Button */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="destructive"
                size="icon"
                className={`w-14 h-14 rounded-full transition-all duration-200 ${
                  swipeDirection === 'pass' 
                    ? 'scale-125 shadow-lg shadow-red-500/50' 
                    : swipeDirection === 'like'
                    ? 'scale-90 opacity-50'
                    : 'hover:scale-110'
                }`}
                onClick={() => onAction('pass')}
              >
                <X className="w-6 h-6" />
              </Button>
            </TooltipTrigger>
          </Tooltip>
        </TooltipProvider>
        
        {/* Like Button */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="default"
                size="icon"
                className={`w-14 h-14 rounded-full bg-green-500 hover:bg-green-600 transition-all duration-200 ${
                  swipeDirection === 'like' 
                    ? 'scale-125 shadow-lg shadow-green-500/50' 
                    : swipeDirection === 'pass'
                    ? 'scale-90 opacity-50'
                    : 'hover:scale-110'
                }`}
                onClick={() => onAction('like')}
              >
                <Heart className="w-6 h-6" fill="currentColor" />
              </Button>
            </TooltipTrigger>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
}