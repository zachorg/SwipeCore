import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight, Smartphone } from 'lucide-react';

interface GetStartedScreenProps {
  onGetStarted: () => void;
}

export const GetStartedScreen: React.FC<GetStartedScreenProps> = ({ onGetStarted }) => {
  return (
    <div className="flex flex-col items-center justify-center h-full p-6 bg-gradient-to-b from-purple-50 to-blue-50">
      <div className="text-center space-y-8 max-w-md">
        {/* App Logo/Icon */}
        <div className="w-24 h-24 bg-gradient-to-r from-purple-500 to-pink-500 rounded-3xl flex items-center justify-center shadow-2xl mx-auto">
          <span className="text-white text-4xl">🍕</span>
        </div>

        {/* App Title */}
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
            FoodSwipe
          </h1>
          <p className="text-lg text-gray-600">
            Discover amazing restaurants with a swipe
          </p>
        </div>

        {/* Description */}
        <div className="space-y-4">
          <p className="text-gray-600 leading-relaxed">
            Get personalized restaurant recommendations based on your preferences and location. 
            Start your culinary journey today!
          </p>
          
          <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
            <Smartphone className="w-4 h-4" />
            <span>Quick phone verification to get started</span>
          </div>
        </div>

        {/* Get Started Button */}
        <Button
          onClick={onGetStarted}
          size="lg"
          className="bg-gradient-to-r from-purple-500 to-pink-500 text-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 text-lg font-semibold"
        >
          Get Started
          <ArrowRight className="w-5 h-5 ml-2" />
        </Button>

        {/* Privacy Note */}
        <p className="text-xs text-gray-400 mt-6">
          Your data is secure and we'll never share your personal information
        </p>
      </div>
    </div>
  );
};
