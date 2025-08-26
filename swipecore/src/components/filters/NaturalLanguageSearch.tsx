// Natural Language Search Component
// Allows users to input plain language queries and converts them to filters

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, Sparkles, X } from 'lucide-react';
import { parseNaturalLanguageQuery, NLPResult, EXAMPLE_QUERIES } from '@/utils/nlpFilters';
import { FILTER_DEFINITIONS } from '@/hooks/useFilters';

interface NaturalLanguageSearchProps {
  onFiltersApplied: (filters: Array<{ filterId: string; value: any }>) => void;
  className?: string;
}

export function NaturalLanguageSearch({ onFiltersApplied, className = '' }: NaturalLanguageSearchProps) {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<NLPResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSearch = () => {
    if (!query.trim()) return;

    setIsProcessing(true);
    
    // Simulate processing delay for better UX
    setTimeout(() => {
      const nlpResult = parseNaturalLanguageQuery(query);
      setResult(nlpResult);
      setIsProcessing(false);
    }, 300);
  };

  const handleApplyFilters = () => {
    if (result && result.filters.length > 0) {
      onFiltersApplied(result.filters);
      setQuery('');
      setResult(null);
    }
  };

  const handleExampleClick = (exampleQuery: string) => {
    setQuery(exampleQuery);
    setResult(null);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const getFilterName = (filterId: string): string => {
    const definition = FILTER_DEFINITIONS.find(d => d.id === filterId);
    return definition?.name || filterId;
  };

  const getConfidenceColor = (confidence: number): string => {
    if (confidence >= 0.7) return 'bg-green-100 text-green-800 border-green-300';
    if (confidence >= 0.4) return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    return 'bg-red-100 text-red-800 border-red-300';
  };

  const getConfidenceText = (confidence: number): string => {
    if (confidence >= 0.7) return 'High confidence';
    if (confidence >= 0.4) return 'Medium confidence';
    return 'Low confidence';
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Search Input */}
      <div className="relative">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              type="text"
              placeholder="Try: 'Show me cheap Italian restaurants open late'"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              className="pl-10 bg-white border-gray-300 text-gray-800 placeholder:text-gray-500"
            />
          </div>
          <Button
            onClick={handleSearch}
            disabled={!query.trim() || isProcessing}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
          >
            {isProcessing ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Example Queries */}
      <div className="space-y-2">
        <p className="text-sm text-gray-600 font-medium">Try these examples:</p>
        <div className="flex flex-wrap gap-2">
          {EXAMPLE_QUERIES.slice(0, 4).map((example, index) => (
            <Button
              key={index}
              variant="outline"
              size="sm"
              onClick={() => handleExampleClick(example)}
              className="text-xs bg-gray-50 hover:bg-gray-100 border-gray-300 text-gray-700"
            >
              {example}
            </Button>
          ))}
        </div>
      </div>

      {/* Results */}
      {result && (
        <Card className="bg-white border-gray-200 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg text-gray-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-600" />
                AI Interpretation
              </CardTitle>
              <Badge 
                variant="outline" 
                className={getConfidenceColor(result.confidence)}
              >
                {getConfidenceText(result.confidence)} ({Math.round(result.confidence * 100)}%)
              </Badge>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {/* Interpretation */}
            <div>
              <p className="text-sm text-gray-600 mb-1">Interpreted as:</p>
              <p className="text-gray-800 font-medium">{result.interpretedAs}</p>
            </div>

            {/* Detected Filters */}
            {result.filters.length > 0 ? (
              <div>
                <p className="text-sm text-gray-600 mb-2">Detected filters:</p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {result.filters.map((filter, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="bg-purple-100 text-purple-800 border-purple-300"
                    >
                      {getFilterName(filter.filterId)}: {
                        Array.isArray(filter.value) 
                          ? filter.value.join(', ')
                          : String(filter.value)
                      }
                    </Badge>
                  ))}
                </div>

                {/* Apply Button */}
                <div className="flex gap-2">
                  <Button
                    onClick={handleApplyFilters}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                  >
                    Apply These Filters
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setResult(null)}
                    className="border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    <X className="w-4 h-4 mr-1" />
                    Clear
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-gray-500">No specific filters detected in your query.</p>
                <p className="text-sm text-gray-400 mt-1">
                  Try being more specific, like "cheap Italian restaurants" or "vegetarian places with outdoor seating"
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
