// Demo component to showcase voice search functionality
// This can be used for testing and demonstration purposes

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Mic, Volume2, Sparkles } from 'lucide-react';
import { VoiceSearch } from './filters/VoiceSearch';
import { parseNaturalLanguageQuery } from '@/utils/nlpFilters';

export function VoiceSearchDemo() {
  const [appliedFilters, setAppliedFilters] = useState<Array<{ filterId: string; value: any }>>([]);
  const [demoResults, setDemoResults] = useState<string[]>([]);

  const handleFiltersApplied = (filters: Array<{ filterId: string; value: any }>) => {
    setAppliedFilters(filters);
    setDemoResults([]);
  };

  const clearDemo = () => {
    setAppliedFilters([]);
    setDemoResults([]);
  };

  const testExamples = [
    "Show me cheap Italian restaurants",
    "Find vegetarian places with outdoor seating",
    "I want expensive sushi with parking",
    "Looking for family friendly pizza places"
  ];

  const testExample = (query: string) => {
    const result = parseNaturalLanguageQuery(query);
    console.log(`Testing: "${query}"`);
    console.log('Result:', result);
    handleFiltersApplied(result.filters);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center justify-center gap-3">
          <Mic className="w-8 h-8 text-purple-600" />
          Voice Search Demo
        </h1>
        <p className="text-gray-600">
          Test the voice-powered restaurant filtering system
        </p>
      </div>

      {/* Voice Search Component */}
      <Card className="bg-white border-gray-200 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Volume2 className="w-5 h-5 text-purple-600" />
            Voice Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <VoiceSearch onFiltersApplied={handleFiltersApplied} />
        </CardContent>
      </Card>

      {/* Test Examples */}
      <Card className="bg-gray-50 border-gray-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-600" />
            Quick Test Examples
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 mb-3">
            Click these buttons to test the NLP system without using voice:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {testExamples.map((example, index) => (
              <Button
                key={index}
                variant="outline"
                onClick={() => testExample(example)}
                className="text-left justify-start h-auto p-3 bg-white hover:bg-blue-50 border-gray-300"
              >
                <span className="text-sm">"{example}"</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Applied Filters */}
      {appliedFilters.length > 0 && (
        <Card className="bg-green-50 border-green-200">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-green-800 flex items-center gap-2">
                ✅ Applied Filters
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={clearDemo}
                className="border-green-300 text-green-700 hover:bg-green-100"
              >
                Clear Demo
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2 mb-4">
              {appliedFilters.map((filter, index) => (
                <Badge
                  key={index}
                  className="bg-green-100 text-green-800 border-green-300"
                >
                  {filter.filterId}: {
                    Array.isArray(filter.value) 
                      ? filter.value.join(', ')
                      : String(filter.value)
                  }
                </Badge>
              ))}
            </div>
            
            {demoResults.length > 0 && (
              <div>
                <p className="text-sm text-green-700 font-medium mb-2">
                  Results:
                </p>
                <div className="space-y-2">
                  {demoResults.map((result, index) => (
                    <div
                      key={index}
                      className="p-3 bg-white border border-green-200 rounded-lg text-sm"
                    >
                      {result}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-800">How to Test</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-blue-700 space-y-2">
          <div>
            <strong>Voice Testing:</strong>
            <ol className="list-decimal list-inside ml-4 mt-1 space-y-1">
              <li>Click the microphone button above</li>
              <li>Allow microphone permission when prompted</li>
              <li>Speak clearly: "Show me cheap Italian restaurants"</li>
              <li>Review the detected filters and apply them</li>
            </ol>
          </div>
          
          <div>
            <strong>Text Testing:</strong>
            <ol className="list-decimal list-inside ml-4 mt-1 space-y-1">
              <li>Click any of the example buttons above</li>
              <li>See how the NLP system interprets the text</li>
              <li>Observe the applied filters</li>
            </ol>
          </div>

          <div>
            <strong>Browser Console:</strong>
            <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
              <li><code>testSpeech()</code> - Get speech testing info</li>
              <li><code>testNLP("your query")</code> - Test NLP directly</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
