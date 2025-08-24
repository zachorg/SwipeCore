import { SwipeDeck } from "@/components/SwipeDeck";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { RestaurantCard } from "@/types/Types";
import { initializeDeviceOptimizations } from "@/utils/deviceOptimization";
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";
import { WelcomeScreen } from "@/components/WelcomeScreen";
import { AuthFlow } from "@/components/auth/AuthFlow";
import { useAuth } from "@/contexts/AuthContext";
import { UserProfileScreen } from "@/components/UserProfileScreen";

enum AppState {
  AUTH_FLOW = "AUTH_FLOW",
  USER_PROFILE = "USER_PROFILE",
  LOADING = "LOADING",
  MAIN_APP = "MAIN_APP",
}

const Index = () => {
  const navigate = useNavigate();
  const {
    isAuthenticated,
    loadingAuthentication,
    loadingUserProfile,
    userProfile,
  } = useAuth();
  const [swipeStats, setSwipeStats] = useState({ likes: 0, passes: 0 });
  const [filterButton, setFilterButton] = useState<React.ReactNode | null>(
    null
  );
  const [showWelcome, setShowWelcome] = useState(true);
  const [initialFilters, setInitialFilters] = useState<
    Array<{ filterId: string; value: any }>
  >([]);
  const [appState, setAppState] = useState<AppState>(AppState.LOADING);

  const handleExitWelcome = () => {
    setShowWelcome(false);
  };

  const handleShowWelcome = () => {
    console.log("🎉 Showing welcome screen");
    setShowWelcome(true);
  };

  // Initialize device optimizations on component mount
  useEffect(() => {
    initializeDeviceOptimizations();
  }, []);

  useEffect(() => {
    if (loadingAuthentication) {
      setAppState(AppState.LOADING);
      return;
    }

    if (!isAuthenticated) {
      console.log("[Index] User not verified show AuthFlow");
      setAppState(AppState.AUTH_FLOW);
      return;
    }

    if (loadingUserProfile) {
      setAppState(AppState.LOADING);
      return;
    }

    if (
      userProfile === null ||
      (userProfile.age === null && userProfile.gender === null)
    ) {
      console.log(
        "[Index] User verified but needs to complete profile, showing UserProfileScreen"
      );
      setAppState(AppState.USER_PROFILE);
      return;
    }

    // lastly show the welcome screen
    setAppState(AppState.MAIN_APP);
    handleShowWelcome();
  }, [isAuthenticated, userProfile, loadingAuthentication, loadingUserProfile]);

  const handleVoiceFiltersApplied = (
    filters: Array<{ filterId: string; value: any }>
  ) => {
    setInitialFilters(filters);
    handleExitWelcome();
  };

  const LoadingState = () => {
    return (
      <div
        className="flex items-center justify-center bg-gradient-to-b from-purple-50 to-blue-50"
        style={{
          height: `calc(100vh - var(--safe-area-inset-top))`,
        }}
      >
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
            <span className="text-white text-2xl">🍕</span>
          </div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
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
    <>
      {appState === AppState.LOADING && <LoadingState />}
      {appState === AppState.AUTH_FLOW && <AuthFlow onComplete={() => {}} />}
      {appState === AppState.USER_PROFILE && (
        <UserProfileScreen onComplete={() => {}} />
      )}
      {appState === AppState.MAIN_APP && (
        <div
          className="flex flex-col bg-white/10 backdrop-blur-xl overflow-hidden"
          style={{
            height: `calc(100vh - var(--safe-area-inset-top))`,
          }}
        >
          {showWelcome && (
            <WelcomeScreen
              onVoiceFiltersApplied={handleVoiceFiltersApplied}
              onSkip={handleExitWelcome}
            />
          )}

          {!showWelcome && (
            <>
              {/* Header */}
              <div className="flex items-center justify-between p-6 bg-white/10 backdrop-blur-sm border-b border-white/20 shadow-lg">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg">
                    <span className="text-white font-bold text-2xl">🍕</span>
                  </div>
                  <div>
                    <h1
                      className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent"
                      style={{ textShadow: "1px 1px 3px rgba(0,0,0,0.3)" }}
                    >
                      NomNom
                    </h1>
                    <p
                      className="text-sm text-white/80"
                      style={{ textShadow: "1px 1px 2px rgba(0,0,0,0.5)" }}
                    >
                      Discover amazing restaurants
                    </p>
                  </div>
                </div>

                {/* Filter Button */}
                {filterButton || (
                  <Button
                    variant="outline"
                    size="lg"
                    className="bg-black/40 backdrop-blur-sm hover:bg-black/60 border-white/40 text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-110 rounded-2xl p-4 opacity-50"
                    style={{ textShadow: "2px 2px 6px rgba(0,0,0,0.9)" }}
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
                  maxCards: 2,
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
      )}
    </>
  );
};

export default Index;
