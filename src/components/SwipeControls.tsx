import { Menu, X, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SwipeControlsProps {
  onAction: (action: 'pass') => void;
  onMenuOpen?: () => void;
  onUndo?: () => void;
  swipeDirection?: 'menu' | 'pass' | null;
}

export function SwipeControls({ onAction, onMenuOpen, onUndo, swipeDirection }: SwipeControlsProps) {
  return (
    <div className="w-full px-4 py-3 bg-background border-t border-border/20">
      <div className="flex items-center justify-center gap-6">
        {/* Undo Button */}
        {onUndo && (
          <Button
            variant="outline"
            size="sm"
            className={`flex items-center gap-2 transition-all duration-200 ${
              swipeDirection ? 'opacity-50' : 'hover:scale-105'
            }`}
            onClick={onUndo}
          >
            <RotateCcw className="w-4 h-4" />
            Undo
          </Button>
        )}

        {/* Pass Button */}
        <Button
          variant="destructive"
          size="lg"
          className={`flex items-center gap-2 px-8 transition-all duration-200 ${
            swipeDirection === 'pass'
              ? 'scale-125 shadow-xl shadow-red-500/50 ring-2 ring-red-500/30'
              : swipeDirection === 'menu'
              ? 'scale-90 opacity-60'
              : 'hover:scale-105'
          }`}
          onClick={() => onAction('pass')}
        >
          <X className={`transition-all duration-200 ${
            swipeDirection === 'pass' ? 'w-6 h-6' : 'w-5 h-5'
          }`} />
          Pass
        </Button>

        {/* Open Menu Button */}
        <Button
          variant="default"
          size="lg"
          className={`flex items-center gap-2 px-8 bg-blue-500 hover:bg-blue-600 transition-all duration-200 ${
            swipeDirection === 'menu'
              ? 'scale-125 shadow-xl shadow-blue-500/50 ring-2 ring-blue-500/30'
              : swipeDirection === 'pass'
              ? 'scale-90 opacity-60'
              : 'hover:scale-105'
          }`}
          onClick={onMenuOpen}
        >
          <Menu className={`transition-all duration-200 ${
            swipeDirection === 'menu' ? 'w-6 h-6' : 'w-5 h-5'
          }`} />
          Open Menu
        </Button>
      </div>
    </div>
  );
}