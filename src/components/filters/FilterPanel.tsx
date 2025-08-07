// Restaurant Filtering System - Filter Panel Component

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Filter, Settings, X } from "lucide-react";
import {
  FilterDefinition,
  FILTER_DEFINITIONS,
  Filter as FilterType,
  FilterValue,
} from "@/hooks/useFilters";
import { FilterItem } from "./FilterItem";
import { NaturalLanguageSearch } from "./NaturalLanguageSearch";

interface FilterPanelProps {
  // Filter state
  allFilters: any[];

  // Filter actions
  addFilter: (filterId: string, value: any) => void;
  updateFilter: (filterId: string, value: any) => void;
  removeFilter: (filterId: string) => void;
  clearFilters: () => void;

  onNewFiltersApplied: () => void;

  // UI props
  trigger?: React.ReactNode;
  className?: string;
}

export function FilterPanel({
  allFilters,
  addFilter,
  updateFilter,
  removeFilter,
  clearFilters,
  onNewFiltersApplied,
  trigger,
  className = "",
}: FilterPanelProps) {
  const [isOpen, setIsOpen] = useState(false);

  const currentFilters = Array.isArray(allFilters) ? allFilters : [];
  const activeFilters =
    currentFilters.length > 0 ? currentFilters.filter((f) => f.enabled) : [];
  const hasActiveFilters = activeFilters.length > 0;
  const filterCount = activeFilters.length;

  // Get all available filters grouped by category
  const filtersByCategory = React.useMemo(() => {
    const grouped = FILTER_DEFINITIONS.reduce((acc, filter) => {
      if (!acc[filter.category]) {
        acc[filter.category] = [];
      }
      acc[filter.category].push(filter);
      return acc;
    }, {} as Record<string, FilterDefinition[]>);

    return grouped;
  }, []);

  // Get current filter value
  const getFilterValue = (filterId: string) => {
    const filter = currentFilters.find((f) => f.id === filterId);
    return filter?.value;
  };

  // Check if filter is active
  const isFilterActive = (filterId: string) => {
    const filter = currentFilters.find((f) => f.id === filterId);
    return filter ? filter.enabled : false;
  };

  // Default trigger button
  const defaultTrigger = (
    <Button
      variant="outline"
      size="sm"
      className="bg-white/10 backdrop-blur-sm hover:bg-white/20 border-white/30 text-white relative"
      style={{ textShadow: "1px 1px 3px rgba(0,0,0,0.8)" }}
    >
      <Filter className="w-4 h-4 mr-2" />
      Filters
      {filterCount > 0 && (
        <Badge
          variant="secondary"
          className="ml-2 bg-white/20 text-white border-white/30"
        >
          {filterCount}
        </Badge>
      )}
    </Button>
  );

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>{trigger || defaultTrigger}</SheetTrigger>

      <SheetContent
        side="right"
        className="w-full sm:max-w-md bg-white/95 backdrop-blur-xl border-gray-200/50 shadow-2xl flex flex-col h-full"
      >
        <SheetHeader className="pb-6 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <SheetTitle className="text-gray-900 text-xl font-bold">
                Restaurant Filters
              </SheetTitle>
              <SheetDescription className="text-gray-600 mt-1">
                Customize your restaurant search preferences
              </SheetDescription>
            </div>

            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="text-gray-700 hover:text-gray-900 hover:bg-gray-100 border border-gray-200"
              >
                <X className="w-4 h-4 mr-1" />
                Clear All
              </Button>
            )}
          </div>

          {hasActiveFilters && (
            <div className="flex flex-wrap gap-2 pt-4">
              {activeFilters.map((filter) => {
                const definition = FILTER_DEFINITIONS.find(
                  (d) => d.id === filter.id
                );
                if (!definition) return null;

                return (
                  <Badge
                    key={filter.id}
                    variant="secondary"
                    className="bg-gray-100 text-gray-800 border-gray-300 cursor-pointer hover:bg-gray-200 transition-all duration-200 shadow-sm"
                    onClick={() => removeFilter(filter.id)}
                  >
                    {definition.icon} {definition.name}
                    <X className="w-3 h-3 ml-1" />
                  </Badge>
                );
              })}
            </div>
          )}
        </SheetHeader>

        <div className="flex-1 overflow-y-auto space-y-4 pr-2">
          {/* AI-Powered Search */}
          <div className="space-y-4 pb-4 border-b border-gray-200">
            {/* Text-based Natural Language Search */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                💬 Type Your Request
              </h3>
              <NaturalLanguageSearch
                onFiltersApplied={(filters) => {
                  // Apply each filter from the NLP result
                  filters.forEach(filter => {
                    addFilter(filter.filterId, filter.value);
                  });
                  // Close the panel after applying filters
                  setIsOpen(false);
                }}
              />
            </div>


          </div>

          <Accordion
            type="multiple"
            defaultValue={["basic"]}
            className="w-full"
          >
            {Object.entries(filtersByCategory).map(([category, filters]) => (
              <AccordionItem
                key={category}
                value={category}
                className="border-gray-200"
              >
                <AccordionTrigger className="text-gray-900 hover:text-gray-700 hover:no-underline">
                  <div className="flex items-center gap-2">
                    {category === "basic" && (
                      <Settings className="w-4 h-4 text-gray-600" />
                    )}
                    {category === "advanced" && (
                      <Filter className="w-4 h-4 text-gray-600" />
                    )}
                    <span className="capitalize font-medium">
                      {category} Filters
                    </span>
                    <Badge
                      variant="outline"
                      className="border-gray-300 text-gray-600 bg-gray-50"
                    >
                      {filters.length}
                    </Badge>
                  </div>
                </AccordionTrigger>

                <AccordionContent className="space-y-4 pt-2">
                  {filters.map((filter) => {
                    // Debug logging for cuisine filter
                    if (filter.id === 'cuisine') {
                      console.log('Rendering cuisine filter:', {
                        filter,
                        value: getFilterValue(filter.id),
                        isActive: isFilterActive(filter.id),
                        options: filter.options
                      });
                    }

                    return (
                      <FilterItem
                        key={filter.id}
                        definition={filter}
                        value={getFilterValue(filter.id)}
                        isActive={isFilterActive(filter.id)}
                        onChange={(value) => {
                        if (
                          value === undefined ||
                          value === null ||
                          value === "" ||
                          (Array.isArray(value) && value.length === 0)
                        ) {
                          removeFilter(filter.id);
                        } else {
                          if (isFilterActive(filter.id)) {
                            updateFilter(filter.id, value);
                          } else {
                            addFilter(filter.id, value);
                          }
                        }
                      }}
                    />
                  );
                  })}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>

        {/* Fixed Apply/Reset Actions Footer */}
        <div className="flex-shrink-0 flex gap-2 pt-4 border-t border-gray-200 bg-white/95 backdrop-blur-sm">
          <Button
            variant="default"
            size="sm"
            onClick={() => {
              onNewFiltersApplied();
              setIsOpen(false);
            }}
            className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-sm"
          >
            Apply Filters
          </Button>

          {hasActiveFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={clearFilters}
              className="bg-white hover:bg-gray-50 border-gray-300 text-gray-700 shadow-sm"
            >
              Reset
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
