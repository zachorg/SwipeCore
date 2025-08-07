import { RestaurantCard } from '@/types/Types';

// Generate mock restaurant cards for testing
export function generateMockCards(count: number = 10): RestaurantCard[] {
  const restaurants = [
    {
      title: 'Pizza Palace',
      subtitle: 'Authentic Italian Pizza & Pasta',
      description: 'Family-owned Italian restaurant serving traditional wood-fired pizzas and homemade pasta since 1985',
      cuisine: 'Italian',
      types: ['Italian Restaurant', 'Pizza Place', 'Family Restaurant'],
      rating: 4.5,
      priceRange: '$$' as const,
      priceLevel: 2,
      address: '123 Main St, Downtown',
      phone: '(555) 123-4567',
      website: 'https://pizzapalace.com',
      openingHours: '11:00 AM - 10:00 PM',
      isOpen: true,
      isOpenNow: true,
      distance: '0.3 miles',
      distanceInMeters: 480,
      location: { latitude: 40.7128, longitude: -74.0060 },
      photos: [
        'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&h=600&fit=crop',
        'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=600&fit=crop',
        'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400&h=600&fit=crop'
      ]
    },
    {
      title: 'Sushi Express',
      subtitle: 'Fresh Sushi & Japanese Cuisine',
      description: 'Modern Japanese restaurant specializing in fresh sushi, sashimi, and traditional Japanese dishes',
      cuisine: 'Japanese',
      types: ['Japanese Restaurant', 'Sushi Bar', 'Asian Restaurant'],
      rating: 4.8,
      priceRange: '$$$' as const,
      priceLevel: 3,
      address: '456 Oak Ave, Midtown',
      phone: '(555) 234-5678',
      website: 'https://sushiexpress.com',
      openingHours: '11:30 AM - 11:00 PM',
      isOpen: true,
      isOpenNow: true,
      distance: '0.7 miles',
      distanceInMeters: 1120,
      location: { latitude: 40.7589, longitude: -73.9851 },
      photos: [
        'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=400&h=600&fit=crop',
        'https://images.unsplash.com/photo-1553621042-f6e147245754?w=400&h=600&fit=crop',
        'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=400&h=600&fit=crop'
      ]
    },
    {
      title: 'Burger Joint',
      subtitle: 'Classic American Burgers & Fries',
      description: 'Casual burger restaurant serving juicy burgers, crispy fries, and thick milkshakes in a retro atmosphere',
      cuisine: 'American',
      types: ['American Restaurant', 'Burger Joint', 'Fast Casual'],
      rating: 4.2,
      priceRange: '$' as const,
      priceLevel: 1,
      address: '789 Pine St, Uptown',
      phone: '(555) 345-6789',
      website: 'https://burgerjoint.com',
      openingHours: '10:00 AM - 12:00 AM',
      isOpen: true,
      isOpenNow: true,
      distance: '1.2 miles',
      distanceInMeters: 1930,
      location: { latitude: 40.7831, longitude: -73.9712 },
      photos: [
        'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=600&fit=crop',
        'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=400&h=600&fit=crop',
        'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=600&fit=crop'
      ]
    },
    {
      title: 'Taco Fiesta',
      subtitle: 'Authentic Mexican Street Food',
      description: 'Vibrant Mexican restaurant serving authentic street tacos, fresh guacamole, and traditional dishes',
      cuisine: 'Mexican',
      types: ['Mexican Restaurant', 'Taco Shop', 'Latin American'],
      rating: 4.6,
      priceRange: '$' as const,
      priceLevel: 1,
      address: '321 Elm St, Downtown',
      phone: '(555) 456-7890',
      website: 'https://tacofiesta.com',
      openingHours: '10:00 AM - 11:00 PM',
      isOpen: true,
      isOpenNow: true,
      distance: '0.5 miles',
      distanceInMeters: 800,
      location: { latitude: 40.7505, longitude: -73.9934 },
      photos: [
        'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=400&h=600&fit=crop',
        'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=400&h=600&fit=crop',
        'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=400&h=600&fit=crop'
      ]
    },
    {
      title: 'Thai Garden',
      subtitle: 'Authentic Thai Cuisine',
      description: 'Traditional Thai restaurant offering aromatic curries, fresh pad thai, and authentic Thai flavors',
      cuisine: 'Thai',
      types: ['Thai Restaurant', 'Asian Restaurant', 'Curry House'],
      rating: 4.7,
      priceRange: '$$' as const,
      priceLevel: 2,
      address: '654 Maple Dr, Eastside',
      phone: '(555) 567-8901',
      website: 'https://thaigarden.com',
      openingHours: '11:00 AM - 10:30 PM',
      isOpen: true,
      isOpenNow: true,
      distance: '1.5 miles',
      distanceInMeters: 2400,
      location: { latitude: 40.7282, longitude: -73.9942 },
      photos: [
        'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=600&fit=crop',
        'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=600&fit=crop',
        'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=600&fit=crop'
      ]
    },
    // Add more restaurants for better variety
    {
      title: 'Curry Palace',
      subtitle: 'Authentic Indian Cuisine',
      description: 'Traditional Indian restaurant serving aromatic curries, fresh naan, and tandoori specialties',
      cuisine: 'Indian',
      types: ['Indian Restaurant', 'Curry House', 'Tandoori Grill'],
      rating: 4.4,
      priceRange: '$$' as const,
      priceLevel: 2,
      address: '987 Spice Lane, Little India',
      phone: '(555) 678-9012',
      website: 'https://currypalace.com',
      openingHours: '11:30 AM - 10:00 PM',
      isOpen: false,
      isOpenNow: false,
      distance: '2.1 miles',
      distanceInMeters: 3380,
      location: { latitude: 40.7489, longitude: -73.9680 },
      photos: [
        'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400&h=600&fit=crop',
        'https://images.unsplash.com/photo-1574653853027-5d3ac9b04f9b?w=400&h=600&fit=crop'
      ]
    },
    {
      title: 'Le Petit Bistro',
      subtitle: 'Classic French Cuisine',
      description: 'Charming French bistro offering traditional dishes, fine wines, and elegant atmosphere',
      cuisine: 'French',
      types: ['French Restaurant', 'Bistro', 'Fine Dining'],
      rating: 4.9,
      priceRange: '$$$$' as const,
      priceLevel: 4,
      address: '234 Rue de Paris, French Quarter',
      phone: '(555) 789-0123',
      website: 'https://lepetitbistro.com',
      openingHours: '5:00 PM - 11:00 PM',
      isOpen: true,
      isOpenNow: true,
      distance: '3.2 miles',
      distanceInMeters: 5150,
      location: { latitude: 40.7614, longitude: -73.9776 },
      photos: [
        'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=600&fit=crop',
        'https://images.unsplash.com/photo-1551218808-94e220e084d2?w=400&h=600&fit=crop'
      ]
    },
    {
      title: 'Golden Dragon',
      subtitle: 'Traditional Chinese Cuisine',
      description: 'Family-owned Chinese restaurant serving dim sum, noodles, and authentic Cantonese dishes',
      cuisine: 'Chinese',
      types: ['Chinese Restaurant', 'Dim Sum', 'Asian Restaurant'],
      rating: 4.3,
      priceRange: '$$' as const,
      priceLevel: 2,
      address: '567 Dragon Street, Chinatown',
      phone: '(555) 890-1234',
      website: 'https://goldendragon.com',
      openingHours: '10:00 AM - 11:00 PM',
      isOpen: true,
      isOpenNow: true,
      distance: '1.8 miles',
      distanceInMeters: 2900,
      location: { latitude: 40.7184, longitude: -74.0027 },
      photos: [
        'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=400&h=600&fit=crop',
        'https://images.unsplash.com/photo-1563379091339-03246963d96c?w=400&h=600&fit=crop'
      ]
    }
  ];

  return Array.from({ length: count }, (_, i) => {
    const restaurant = restaurants[i % restaurants.length];
    return {
      id: `restaurant-${i}`,
      imageUrl: restaurant.photos[0] || null,
      title: restaurant.title,
      subtitle: restaurant.subtitle,
      description: restaurant.description,
      cuisine: restaurant.cuisine,
      types: restaurant.types,
      rating: restaurant.rating,
      priceRange: restaurant.priceRange,
      priceLevel: restaurant.priceLevel,
      distance: restaurant.distance,
      distanceInMeters: restaurant.distanceInMeters,
      address: restaurant.address,
      phone: restaurant.phone,
      website: restaurant.website,
      openingHours: restaurant.openingHours,
      isOpen: restaurant.isOpen,
      isOpenNow: restaurant.isOpenNow,
      location: restaurant.location,
      photos: restaurant.photos,
    };
  });
}