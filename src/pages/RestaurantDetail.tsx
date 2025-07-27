import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  Star, 
  Clock, 
  MapPin, 
  Phone, 
  Globe, 
  Heart,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { SwipeCard, generateMockCards } from '@/lib/swipe-core';

export default function RestaurantDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [restaurant, setRestaurant] = useState<SwipeCard | null>(null);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get restaurant data from mock data
    const mockRestaurants = generateMockCards(20);
    const foundRestaurant = mockRestaurants.find(r => r.id === id);
    if (foundRestaurant) {
      setRestaurant(foundRestaurant);
    }
    setLoading(false);
  }, [id]);

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${i < Math.floor(rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
      />
    ));
  };

  const renderPriceRange = (priceRange: string) => {
    return priceRange.split('').map((_, i) => (
      <DollarSign key={i} className="w-3 h-3 text-green-500" />
    ));
  };

  const nextPhoto = () => {
    if (restaurant?.photos) {
      setCurrentPhotoIndex((prev) => 
        prev === restaurant.photos.length - 1 ? 0 : prev + 1
      );
    }
  };

  const prevPhoto = () => {
    if (restaurant?.photos) {
      setCurrentPhotoIndex((prev) => 
        prev === 0 ? restaurant.photos.length - 1 : prev - 1
      );
    }
  };

  const handleOrderNow = () => {
    if (restaurant?.website) {
      window.open(restaurant.website, '_blank');
    }
  };

  const handleCall = () => {
    if (restaurant?.phone) {
      window.open(`tel:${restaurant.phone}`);
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading restaurant details...</p>
        </div>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Restaurant not found</h2>
          <p className="text-muted-foreground mb-4">The restaurant you're looking for doesn't exist.</p>
          <Button onClick={() => navigate('/')}>Go back</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-sm border-b border-border/20">
        <div className="flex items-center justify-between p-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/')}
            className="rounded-full"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-semibold">{restaurant.title}</h1>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full"
          >
            <Heart className="w-5 h-5" />
          </Button>
        </div>
      </div>

      <div className="pb-20">
        {/* Photo Gallery */}
        <div className="relative h-80 bg-gray-200">
          {restaurant.photos && restaurant.photos.length > 0 && (
            <>
              <img
                src={restaurant.photos[currentPhotoIndex]}
                alt={restaurant.title}
                className="w-full h-full object-cover"
              />
              
              {/* Photo Navigation */}
              {restaurant.photos.length > 1 && (
                <>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white border-0"
                    onClick={prevPhoto}
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </Button>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white border-0"
                    onClick={nextPhoto}
                  >
                    <ChevronRight className="w-5 h-5" />
                  </Button>
                  
                  {/* Photo Indicators */}
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
                    {restaurant.photos.map((_, index) => (
                      <div
                        key={index}
                        className={`w-2 h-2 rounded-full ${
                          index === currentPhotoIndex ? 'bg-white' : 'bg-white/50'
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}
            </>
          )}
        </div>

        {/* Restaurant Info */}
        <div className="p-6 space-y-6">
          {/* Basic Info */}
          <div className="space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-3xl font-bold">{restaurant.title}</h2>
                <p className="text-lg text-muted-foreground">{restaurant.cuisine}</p>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1 mb-1">
                  {renderPriceRange(restaurant.priceRange || '$$')}
                </div>
                <div className="flex items-center gap-1">
                  {renderStars(restaurant.rating || 0)}
                  <span className="text-sm text-muted-foreground ml-1">
                    ({restaurant.rating})
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex gap-3">
              <Button 
                className="flex-1 bg-green-500 hover:bg-green-600"
                onClick={handleOrderNow}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Order Now
              </Button>
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={handleCall}
              >
                <Phone className="w-4 h-4 mr-2" />
                Call
              </Button>
            </div>
          </div>

          <Separator />

          {/* Details */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold">Details</h3>
            <div className="space-y-3">
              {restaurant.distance && (
                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{restaurant.address}</p>
                    <p className="text-sm text-muted-foreground">{restaurant.distance}</p>
                  </div>
                </div>
              )}
              {restaurant.deliveryTime && (
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Delivery Time</p>
                    <p className="text-sm text-muted-foreground">{restaurant.deliveryTime}</p>
                  </div>
                </div>
              )}
              {restaurant.openingHours && (
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Hours</p>
                    <p className="text-sm text-muted-foreground">{restaurant.openingHours}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Menu */}
          {restaurant.menu && restaurant.menu.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold">Menu</h3>
              <div className="space-y-3">
                {restaurant.menu.map((item) => (
                  <Card key={item.id}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="font-semibold">{item.name}</h4>
                          {item.description && (
                            <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                          )}
                        </div>
                        <p className="font-semibold text-lg">${item.price.toFixed(2)}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          <Separator />

          {/* Reviews */}
          {restaurant.reviews && restaurant.reviews.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold">Reviews</h3>
              <div className="space-y-4">
                {restaurant.reviews.map((review) => (
                  <Card key={review.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-semibold">{review.author}</p>
                          <div className="flex items-center gap-1 mt-1">
                            {renderStars(review.rating)}
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground">{review.date}</p>
                      </div>
                      <p className="text-sm">{review.comment}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 