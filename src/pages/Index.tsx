import { SwipeDeck } from "@/components/SwipeDeck";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { RestaurantCard } from "@/types/Types";
import { initializeDeviceOptimizations } from "@/utils/deviceOptimization";

const Index = () => {
  const navigate = useNavigate();
  const [swipeStats, setSwipeStats] = useState({ likes: 0, passes: 0 });

  // Initialize device optimizations on component mount
  useEffect(() => {
    initializeDeviceOptimizations();
  }, []);

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
    <div className="h-screen flex flex-col bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 overflow-hidden
                    md:bg-gradient-to-br md:from-gray-100 md:via-purple-50 md:to-blue-100">
      {/* Header */}
      <div className="flex items-center p-6 bg-white/80 backdrop-blur-sm border-b border-purple-200/50 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-purple-500 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg">
            <span className="text-white font-bold text-2xl">
              🍕
            </span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-purple-600 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              FoodSwipe
            </h1>
            <p className="text-sm text-gray-600">Discover amazing restaurants</p>
          </div>
        </div>
      </div>

      {/* Swipe Deck with Live Data */}
      <SwipeDeck
        onSwipeAction={handleSwipeAction}
        onCardTap={handleCardTap}
        swipeOptions={{
          searchConfig: {
            radius: 5000, // 5km radius
            type: "restaurant",
            minRating: 3.0,
          },
          autoStart: true,
          maxCards: 20,
          prefetchDetails: true,
        }}
      />

      {/* Debug Stats */}
      {process.env.NODE_ENV === "development" && (
        <div className="absolute bottom-4 left-4 bg-black/80 text-white p-2 rounded text-xs">
          👍 {swipeStats.likes} | 👎 {swipeStats.passes}
        </div>
      )}
    </div>
  );
};

export default Index;
