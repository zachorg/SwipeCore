// Swipe framework core logic
export interface SwipeCard {
  id: string;
  imageUrl: string;
  title: string;
  subtitle?: string;
  // Restaurant-specific fields
  cuisine?: string;
  rating?: number;
  priceRange?: '$' | '$$' | '$$$' | '$$$$';
  distance?: string;
  deliveryTime?: string;
  address?: string;
  phone?: string;
  website?: string;
  openingHours?: string;
  menu?: MenuItem[];
  photos?: string[];
  reviews?: Review[];
  [key: string]: any;
}

export interface MenuItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  category: string;
  imageUrl?: string;
}

export interface Review {
  id: string;
  author: string;
  rating: number;
  comment: string;
  date: string;
}

export interface SwipeAction {
  cardId: string;
  action: 'like' | 'pass' | 'super';
  timestamp: number;
}

export interface SwipeConfig {
  threshold: number; // Minimum distance to trigger swipe
  snapBackDuration: number; // Animation duration for snap back
  swipeOutDuration: number; // Animation duration for swipe out
  maxRotation: number; // Maximum rotation angle in degrees
}

export const defaultSwipeConfig: SwipeConfig = {
  threshold: 100,
  snapBackDuration: 0.3,
  swipeOutDuration: 0.3,
  maxRotation: 15,
};

// Mock data provider
export class SwipeDataProvider {
  private cards: SwipeCard[] = [];
  private actions: SwipeAction[] = [];

  constructor(initialCards: SwipeCard[] = []) {
    this.cards = [...initialCards];
  }

  getCards(): SwipeCard[] {
    return [...this.cards];
  }

  removeCard(cardId: string): void {
    this.cards = this.cards.filter(card => card.id !== cardId);
  }

  saveAction(action: SwipeAction): void {
    this.actions.push(action);
    console.log('Swipe action saved:', action);
  }

  getActions(): SwipeAction[] {
    return [...this.actions];
  }

  addCards(newCards: SwipeCard[]): void {
    this.cards.push(...newCards);
  }
}

// Generate mock restaurant cards for testing
export function generateMockCards(count: number = 10): SwipeCard[] {
  const restaurants = [
    {
      name: 'Pizza Palace',
      cuisine: 'Italian',
      rating: 4.5,
      priceRange: '$$' as const,
      deliveryTime: '25-35 min',
      address: '123 Main St, Downtown',
      phone: '(555) 123-4567',
      website: 'https://pizzapalace.com',
      openingHours: '11:00 AM - 10:00 PM',
      photos: [
        'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&h=600&fit=crop',
        'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=600&fit=crop',
        'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400&h=600&fit=crop'
      ],
      menu: [
        { id: '1', name: 'Margherita Pizza', description: 'Fresh mozzarella, tomato sauce, basil', price: 18.99, category: 'Pizza' },
        { id: '2', name: 'Pepperoni Pizza', description: 'Classic pepperoni with melted cheese', price: 20.99, category: 'Pizza' },
        { id: '3', name: 'Garlic Bread', description: 'Crispy bread with garlic butter', price: 6.99, category: 'Appetizers' }
      ],
      reviews: [
        { id: '1', author: 'Sarah M.', rating: 5, comment: 'Best pizza in town!', date: '2024-01-15' },
        { id: '2', author: 'Mike R.', rating: 4, comment: 'Great service and delicious food', date: '2024-01-10' }
      ]
    },
    {
      name: 'Sushi Express',
      cuisine: 'Japanese',
      rating: 4.8,
      priceRange: '$$$' as const,
      deliveryTime: '30-45 min',
      address: '456 Oak Ave, Midtown',
      phone: '(555) 234-5678',
      website: 'https://sushiexpress.com',
      openingHours: '11:30 AM - 11:00 PM',
      photos: [
        'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=400&h=600&fit=crop',
        'https://images.unsplash.com/photo-1553621042-f6e147245754?w=400&h=600&fit=crop',
        'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=400&h=600&fit=crop'
      ],
      menu: [
        { id: '1', name: 'California Roll', description: 'Crab, avocado, cucumber', price: 12.99, category: 'Rolls' },
        { id: '2', name: 'Salmon Nigiri', description: 'Fresh salmon over rice', price: 8.99, category: 'Nigiri' },
        { id: '3', name: 'Miso Soup', description: 'Traditional Japanese soup', price: 4.99, category: 'Soups' }
      ],
      reviews: [
        { id: '1', author: 'Jennifer L.', rating: 5, comment: 'Fresh and authentic sushi!', date: '2024-01-20' },
        { id: '2', author: 'David K.', rating: 4, comment: 'Excellent quality fish', date: '2024-01-18' }
      ]
    },
    {
      name: 'Burger Joint',
      cuisine: 'American',
      rating: 4.2,
      priceRange: '$' as const,
      deliveryTime: '20-30 min',
      address: '789 Pine St, Uptown',
      phone: '(555) 345-6789',
      website: 'https://burgerjoint.com',
      openingHours: '10:00 AM - 12:00 AM',
      photos: [
        'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=600&fit=crop',
        'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=400&h=600&fit=crop',
        'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=600&fit=crop'
      ],
      menu: [
        { id: '1', name: 'Classic Burger', description: 'Beef patty with lettuce, tomato, onion', price: 12.99, category: 'Burgers' },
        { id: '2', name: 'Cheese Fries', description: 'Crispy fries with melted cheese', price: 7.99, category: 'Sides' },
        { id: '3', name: 'Chicken Wings', description: '8 pieces with choice of sauce', price: 14.99, category: 'Appetizers' }
      ],
      reviews: [
        { id: '1', author: 'Tom B.', rating: 4, comment: 'Great burgers and fast service', date: '2024-01-12' },
        { id: '2', author: 'Lisa P.', rating: 4, comment: 'Love the cheese fries!', date: '2024-01-08' }
      ]
    },
    {
      name: 'Taco Fiesta',
      cuisine: 'Mexican',
      rating: 4.6,
      priceRange: '$' as const,
      deliveryTime: '15-25 min',
      address: '321 Elm St, Downtown',
      phone: '(555) 456-7890',
      website: 'https://tacofiesta.com',
      openingHours: '10:00 AM - 11:00 PM',
      photos: [
        'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=400&h=600&fit=crop',
        'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=400&h=600&fit=crop',
        'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=400&h=600&fit=crop'
      ],
      menu: [
        { id: '1', name: 'Street Tacos', description: '3 authentic street tacos', price: 9.99, category: 'Tacos' },
        { id: '2', name: 'Guacamole & Chips', description: 'Fresh guacamole with tortilla chips', price: 6.99, category: 'Appetizers' },
        { id: '3', name: 'Quesadilla', description: 'Cheese quesadilla with salsa', price: 8.99, category: 'Main Dishes' }
      ],
      reviews: [
        { id: '1', author: 'Maria G.', rating: 5, comment: 'Authentic Mexican flavors!', date: '2024-01-16' },
        { id: '2', author: 'Carlos R.', rating: 4, comment: 'Best tacos in the city', date: '2024-01-14' }
      ]
    },
    {
      name: 'Thai Garden',
      cuisine: 'Thai',
      rating: 4.7,
      priceRange: '$$' as const,
      deliveryTime: '35-50 min',
      address: '654 Maple Dr, Eastside',
      phone: '(555) 567-8901',
      website: 'https://thaigarden.com',
      openingHours: '11:00 AM - 10:30 PM',
      photos: [
        'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=600&fit=crop',
        'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=600&fit=crop',
        'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=600&fit=crop'
      ],
      menu: [
        { id: '1', name: 'Pad Thai', description: 'Stir-fried rice noodles with shrimp', price: 16.99, category: 'Noodles' },
        { id: '2', name: 'Green Curry', description: 'Spicy green curry with vegetables', price: 18.99, category: 'Curries' },
        { id: '3', name: 'Spring Rolls', description: 'Fresh vegetables wrapped in rice paper', price: 7.99, category: 'Appetizers' }
      ],
      reviews: [
        { id: '1', author: 'Anna T.', rating: 5, comment: 'Amazing Thai food!', date: '2024-01-19' },
        { id: '2', author: 'John S.', rating: 4, comment: 'Great curry and friendly service', date: '2024-01-17' }
      ]
    }
  ];

  return Array.from({ length: count }, (_, i) => {
    const restaurant = restaurants[i % restaurants.length];
    return {
      id: `restaurant-${i}`,
      imageUrl: restaurant.photos[0],
      title: restaurant.name,
      subtitle: restaurant.cuisine,
      cuisine: restaurant.cuisine,
      rating: restaurant.rating,
      priceRange: restaurant.priceRange,
      distance: `${Math.floor(Math.random() * 10) + 1} km away`,
      deliveryTime: restaurant.deliveryTime,
      address: restaurant.address,
      phone: restaurant.phone,
      website: restaurant.website,
      openingHours: restaurant.openingHours,
      menu: restaurant.menu,
      photos: restaurant.photos,
      reviews: restaurant.reviews,
    };
  });
}