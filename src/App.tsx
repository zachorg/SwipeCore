import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { useEffect } from "react";
import { AuthProvider } from "@/contexts/AuthContext";
import { initialize } from "@capacitor-community/safe-area";

const queryClient = new QueryClient();

const App = () => {
  useEffect(() => {
    (async () => {
      try {
        // Get safe area insets
        initialize();
      } catch (error) {
        // no-op on web or if plugin unavailable
      }
    })();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <div
        style={{
          paddingTop: "var(--safe-area-inset-top)",
        }}
      >
        {/* Your content */}
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Index />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </AuthProvider>
      </div>
    </QueryClientProvider>
  );
};

export default App;
