import { SwipeDeck } from "@/components/SwipeDeck";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { RestaurantCard } from "@/types/Types";
import { initializeDeviceOptimizations } from "@/utils/deviceOptimization";
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";
import { WelcomeScreen } from "@/components/WelcomeScreen";


const Index = () => {
  const navigate = useNavigate();
  const [swipeStats, setSwipeStats] = useState({ likes: 0, passes: 0 });
  const [filterButton, setFilterButton] = useState<React.ReactNode>(null);
  const [showWelcome, setShowWelcome] = useState(true);
  const [initialFilters, setInitialFilters] = useState<Array<{ filterId: string; value: any }>>([]);

  // Initialize device optimizations on component mount
  useEffect(() => {
    initializeDeviceOptimizations();
    
    // Check if this is first launch or if we should skip welcome
    const hasSeenWelcome = localStorage.getItem('hasSeenWelcome');
    if (hasSeenWelcome === 'true') {
      setShowWelcome(false);
    }
  }, []);
  
  const handleVoiceFiltersApplied = (filters: Array<{ filterId: string; value: any }>) => {
    setInitialFilters(filters);
    setShowWelcome(false);
    localStorage.setItem('hasSeenWelcome', 'true');
  };
  
  const handleSkipWelcome = () => {
    setShowWelcome(false);
    localStorage.setItem('hasSeenWelcome', 'true');
  };

  const handleFilterButtonReady = (button: React.ReactNode) => {
    setFilterButton(button);
  };

  const handleSwipeAction = (cardId: string, action: "menu" | "pass") => {
    console.log(`Swiped ${action} on restaurant:`, cardId);

    // Update stats
    setSwipeStats((prev) => ({
      ...prev,
      [action === "menu" ? "likes" : "passes"]:
        prev[action === "menu" ? "likes" : "passes"] + 1,
    }));
  };

  const handleCardTap = (card: RestaurantCard) => {
    console.log("Tapped on restaurant:", card.title);
    // Navigate to restaurant detail page
    navigate(`/restaurant/${card.id}`);
  };

  return (
    <div className="h-screen flex flex-col bg-white/10 backdrop-blur-xl overflow-hidden">
      {showWelcome ? (
        <WelcomeScreen
          onVoiceFiltersApplied={handleVoiceFiltersApplied}
          onSkip={handleSkipWelcome}
        />
      ) : (
        <>
          {/* Header */}
          <div className="flex items-center justify-between p-6 bg-white/10 backdrop-blur-sm border-b border-white/20 shadow-lg">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-2xl">
                  🍕
                </span>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent" style={{ textShadow: '1px 1px 3px rgba(0,0,0,0.3)' }}>
                  FoodSwipe
                </h1>
                <p className="text-sm text-white/80" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.5)' }}>Discover amazing restaurants</p>
              </div>
            </div>

            {/* Filter Button */}
            {filterButton || (
              <Button
                variant="outline"
                size="lg"
                className="bg-black/40 backdrop-blur-sm hover:bg-black/60 border-white/40 text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-110 rounded-2xl p-4 opacity-50"
                style={{ textShadow: '2px 2px 6px rgba(0,0,0,0.9)' }}
                disabled
              >
                <Settings className="w-7 h-7" />
              </Button>
            )}
          </div>

          {/* Swipe Deck with Live Data and Filtering */}
          <SwipeDeck
            onSwipeAction={handleSwipeAction}
            onCardTap={handleCardTap}
            onFilterButtonReady={handleFilterButtonReady}
            enableFiltering={true}
            initialFilters={initialFilters}
            swipeOptions={{
              searchConfig: {
                radius: 5000, // 5km radius
                type: "restaurant",
                minRating: 3.0,
              },
              autoStart: true,
              maxCards: 20,
              prefetchDetails: true,
              enableFiltering: true,
            }}
          />

          {/* Debug Stats */}
          {process.env.NODE_ENV === "development" && (
            <div className="absolute bottom-4 left-4 bg-black/80 text-white p-2 rounded text-xs">
              👍 {swipeStats.likes} | 👎 {swipeStats.passes}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Index;
