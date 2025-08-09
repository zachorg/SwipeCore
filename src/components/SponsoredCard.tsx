import { Button } from "./ui/button";

interface SponsoredCardProps {
  onContinue?: () => void;
}

export function SponsoredCard({ onContinue }: SponsoredCardProps) {
  return (
    <div className="relative w-full h-full bg-white rounded-3xl overflow-hidden shadow-2xl border border-purple-200/30 ring-1 ring-purple-100/50">
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md p-6 text-gray-800 border-t border-purple-200/50 shadow-lg">
        <div className="text-xs uppercase tracking-wide text-gray-500 mb-2">Sponsored</div>
        <div className="h-28 bg-gray-200 rounded-xl mb-4" />
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
        <div className="h-4 bg-gray-200 rounded w-1/2" />
        {onContinue && (
          <div className="mt-4 flex justify-end">
            <Button variant="outline" onClick={onContinue}>
              Continue
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}


