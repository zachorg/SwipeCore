import React, { createContext, useContext, useCallback } from "react";
import { useFilters, Filter, FilterValue } from "@/hooks/useFilters";

interface FilterContextValue {
  // State
  filters: Filter[];
  isLoading: boolean;
  error: string | null;

  // Actions
  addFilter: (filterId: string, value: FilterValue) => void;
  updateFilter: (filterId: string, value: FilterValue) => void;
  removeFilter: (filterId: string) => void;
  clearFilters: () => void;
  onNewFiltersApplied: () => void;
  applyFilters: (cards: any[]) => Promise<any>; // Apply filters to cards

  // Utilities
  getFilterValue: (filterId: string) => FilterValue | undefined;

  // Voice-specific methods
  applyVoiceFilters: (filters: Array<{ filterId: string; value: any }>) => void;
  clearAndApplyVoiceFilters: (
    filters: Array<{ filterId: string; value: any }>
  ) => void;
}

const FilterContext = createContext<FilterContextValue | null>(null);

interface FilterProviderProps {
  children: React.ReactNode;
  onNewFiltersApplied?: () => void;
}

export function FilterProvider({
  children,
  onNewFiltersApplied,
}: FilterProviderProps) {
  const {
    filters,
    isLoading,
    error,
    addFilter,
    updateFilter,
    removeFilter,
    clearFilters,
    onNewFiltersApplied: hookOnNewFiltersApplied,
    getFilterValue,
    applyFilters,
  } = useFilters({
    enablePersistence: true,
    onNewFiltersApplied: onNewFiltersApplied || (() => {}),
  });

  // Voice filter management
  const applyVoiceFilters = useCallback(
    (voiceFilters: Array<{ filterId: string; value: any }>) => {
      console.log("🎯 FilterContext - Applying voice filters:", voiceFilters);

      // Add each voice filter
      voiceFilters.forEach(({ filterId, value }) => {
        addFilter(filterId, value);
      });

      // Trigger re-filtering
      setTimeout(() => {
        hookOnNewFiltersApplied();
      }, 100);
    },
    [addFilter, hookOnNewFiltersApplied]
  );

  const clearAndApplyVoiceFilters = useCallback(
    (voiceFilters: Array<{ filterId: string; value: any }>) => {
      console.log(
        "🎯 FilterContext - Clearing and applying voice filters:",
        voiceFilters
      );

      clearFilters();

      setTimeout(() => {
        voiceFilters.forEach(({ filterId, value }) => {
          addFilter(filterId, value);
        });

        setTimeout(() => {
          hookOnNewFiltersApplied();
        }, 100);
      }, 50);
    },
    [clearFilters, addFilter, hookOnNewFiltersApplied]
  );

  const value: FilterContextValue = {
    filters,
    isLoading,
    error,
    addFilter,
    updateFilter,
    removeFilter,
    clearFilters,
    onNewFiltersApplied: onNewFiltersApplied || (() => {}),
    getFilterValue,
    applyFilters,
    applyVoiceFilters,
    clearAndApplyVoiceFilters,
  };

  return (
    <FilterContext.Provider value={value}>{children}</FilterContext.Provider>
  );
}

export function useFilterContext(): FilterContextValue {
  const context = useContext(FilterContext);
  if (!context) {
    throw new Error("useFilterContext must be used within a FilterProvider");
  }
  return context;
}
