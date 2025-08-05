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
        { id: '3', name: 'Supreme Pizza', description: 'Pepperoni, sausage, mushrooms, bell peppers, onions', price: 24.99, category: 'Pizza' },
        { id: '4', name: 'BBQ Chicken Pizza', description: 'Grilled chicken, red onions, BBQ sauce', price: 22.99, category: 'Pizza' },
        { id: '5', name: 'Garlic Bread', description: 'Crispy bread with garlic butter', price: 6.99, category: 'Appetizers' },
        { id: '6', name: 'Bruschetta', description: 'Toasted bread with tomatoes, basil, and mozzarella', price: 8.99, category: 'Appetizers' },
        { id: '7', name: 'Caesar Salad', description: 'Romaine lettuce, parmesan cheese, croutons', price: 12.99, category: 'Salads' },
        { id: '8', name: 'Tiramisu', description: 'Classic Italian dessert with coffee and mascarpone', price: 9.99, category: 'Desserts' },
        { id: '9', name: 'Cannoli', description: 'Crispy shells filled with sweet ricotta cream', price: 7.99, category: 'Desserts' },
        { id: '10', name: 'Italian Soda', description: 'Choice of flavors with cream', price: 4.99, category: 'Beverages' }
      ],
      reviews: [
        { id: '1', author: 'Sarah M.', rating: 5, comment: 'Best pizza in town! The crust is perfectly crispy and the toppings are always fresh.', date: '2024-01-15' },
        { id: '2', author: 'Mike R.', rating: 4, comment: 'Great service and delicious food. The garlic bread is a must-try!', date: '2024-01-10' },
        { id: '3', author: 'Emily T.', rating: 5, comment: 'Amazing authentic Italian flavors. The tiramisu is to die for!', date: '2024-01-08' },
        { id: '4', author: 'David L.', rating: 4, comment: 'Consistent quality and friendly staff. Perfect for family dinners.', date: '2024-01-05' },
        { id: '5', author: 'Jessica K.', rating: 5, comment: 'The supreme pizza is loaded with toppings and the prices are reasonable.', date: '2024-01-03' }
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
        { id: '2', name: 'Spicy Tuna Roll', description: 'Spicy tuna, cucumber, spicy mayo', price: 14.99, category: 'Rolls' },
        { id: '3', name: 'Dragon Roll', description: 'Eel, avocado, cucumber, eel sauce', price: 18.99, category: 'Rolls' },
        { id: '4', name: 'Salmon Nigiri', description: 'Fresh salmon over rice', price: 8.99, category: 'Nigiri' },
        { id: '5', name: 'Tuna Nigiri', description: 'Fresh tuna over rice', price: 9.99, category: 'Nigiri' },
        { id: '6', name: 'Eel Nigiri', description: 'Grilled eel over rice', price: 10.99, category: 'Nigiri' },
        { id: '7', name: 'Miso Soup', description: 'Traditional Japanese soup', price: 4.99, category: 'Soups' },
        { id: '8', name: 'Edamame', description: 'Steamed soybeans with sea salt', price: 5.99, category: 'Appetizers' },
        { id: '9', name: 'Gyoza', description: 'Pan-fried dumplings with dipping sauce', price: 7.99, category: 'Appetizers' },
        { id: '10', name: 'Green Tea Ice Cream', description: 'Traditional Japanese dessert', price: 6.99, category: 'Desserts' },
        { id: '11', name: 'Sake', description: 'Premium Japanese rice wine', price: 12.99, category: 'Beverages' }
      ],
      reviews: [
        { id: '1', author: 'Jennifer L.', rating: 5, comment: 'Fresh and authentic sushi! The fish quality is outstanding and the presentation is beautiful.', date: '2024-01-20' },
        { id: '2', author: 'David K.', rating: 4, comment: 'Excellent quality fish and great service. The dragon roll is my favorite!', date: '2024-01-18' },
        { id: '3', author: 'Michael S.', rating: 5, comment: 'Best sushi in the area. The spicy tuna roll has the perfect amount of heat.', date: '2024-01-16' },
        { id: '4', author: 'Lisa P.', rating: 4, comment: 'Great atmosphere and fresh ingredients. The miso soup is comforting.', date: '2024-01-14' },
        { id: '5', author: 'Robert T.', rating: 5, comment: 'Authentic Japanese experience. The sake selection is impressive.', date: '2024-01-12' }
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
        { id: '2', name: 'Bacon Cheeseburger', description: 'Beef patty with bacon, cheese, lettuce, tomato', price: 15.99, category: 'Burgers' },
        { id: '3', name: 'Mushroom Swiss Burger', description: 'Beef patty with mushrooms, Swiss cheese, caramelized onions', price: 16.99, category: 'Burgers' },
        { id: '4', name: 'Veggie Burger', description: 'Plant-based patty with avocado, sprouts, tomato', price: 13.99, category: 'Burgers' },
        { id: '5', name: 'Chicken Wings', description: '8 pieces with choice of sauce', price: 14.99, category: 'Appetizers' },
        { id: '6', name: 'Onion Rings', description: 'Crispy beer-battered onion rings', price: 8.99, category: 'Appetizers' },
        { id: '7', name: 'Cheese Fries', description: 'Crispy fries with melted cheese', price: 7.99, category: 'Sides' },
        { id: '8', name: 'Sweet Potato Fries', description: 'Crispy sweet potato fries with dipping sauce', price: 8.99, category: 'Sides' },
        { id: '9', name: 'Chocolate Milkshake', description: 'Thick and creamy chocolate milkshake', price: 6.99, category: 'Beverages' },
        { id: '10', name: 'Apple Pie', description: 'Warm apple pie with vanilla ice cream', price: 7.99, category: 'Desserts' }
      ],
      reviews: [
        { id: '1', author: 'Tom B.', rating: 4, comment: 'Great burgers and fast service. The bacon cheeseburger is loaded with flavor!', date: '2024-01-12' },
        { id: '2', author: 'Lisa P.', rating: 4, comment: 'Love the cheese fries! The portions are generous and the prices are fair.', date: '2024-01-08' },
        { id: '3', author: 'Chris M.', rating: 5, comment: 'Best burger joint in town. The mushroom Swiss burger is incredible!', date: '2024-01-06' },
        { id: '4', author: 'Amanda R.', rating: 4, comment: 'Great atmosphere and friendly staff. The onion rings are crispy perfection.', date: '2024-01-04' },
        { id: '5', author: 'Kevin D.', rating: 5, comment: 'The veggie burger is surprisingly good, and the milkshakes are thick and creamy.', date: '2024-01-02' }
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
        { id: '2', name: 'Fish Tacos', description: 'Grilled fish with cabbage slaw and chipotle sauce', price: 11.99, category: 'Tacos' },
        { id: '3', name: 'Carne Asada Tacos', description: 'Grilled steak with onions and cilantro', price: 12.99, category: 'Tacos' },
        { id: '4', name: 'Chicken Quesadilla', description: 'Grilled chicken with cheese and salsa', price: 10.99, category: 'Main Dishes' },
        { id: '5', name: 'Veggie Quesadilla', description: 'Bell peppers, onions, mushrooms with cheese', price: 9.99, category: 'Main Dishes' },
        { id: '6', name: 'Guacamole & Chips', description: 'Fresh guacamole with tortilla chips', price: 6.99, category: 'Appetizers' },
        { id: '7', name: 'Salsa & Chips', description: 'Fresh salsa with tortilla chips', price: 5.99, category: 'Appetizers' },
        { id: '8', name: 'Mexican Rice', description: 'Flavorful rice with tomatoes and spices', price: 4.99, category: 'Sides' },
        { id: '9', name: 'Refried Beans', description: 'Creamy refried beans with cheese', price: 4.99, category: 'Sides' },
        { id: '10', name: 'Churros', description: 'Crispy fried dough with cinnamon sugar', price: 6.99, category: 'Desserts' },
        { id: '11', name: 'Horchata', description: 'Traditional rice milk drink with cinnamon', price: 4.99, category: 'Beverages' }
      ],
      reviews: [
        { id: '1', author: 'Maria G.', rating: 5, comment: 'Authentic Mexican flavors! The street tacos remind me of home.', date: '2024-01-16' },
        { id: '2', author: 'Carlos R.', rating: 4, comment: 'Best tacos in the city. The carne asada is perfectly seasoned.', date: '2024-01-14' },
        { id: '3', author: 'Sofia L.', rating: 5, comment: 'Amazing fish tacos! The chipotle sauce adds the perfect kick.', date: '2024-01-12' },
        { id: '4', author: 'Diego M.', rating: 4, comment: 'Great value for money. The quesadillas are cheesy and delicious.', date: '2024-01-10' },
        { id: '5', author: 'Isabella C.', rating: 5, comment: 'The horchata is authentic and the churros are crispy on the outside, soft inside.', date: '2024-01-08' }
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
        { id: '2', name: 'Pad See Ew', description: 'Wide rice noodles with chicken and Chinese broccoli', price: 15.99, category: 'Noodles' },
        { id: '3', name: 'Drunken Noodles', description: 'Spicy wide rice noodles with basil and chili', price: 17.99, category: 'Noodles' },
        { id: '4', name: 'Green Curry', description: 'Spicy green curry with vegetables', price: 18.99, category: 'Curries' },
        { id: '5', name: 'Red Curry', description: 'Spicy red curry with coconut milk', price: 17.99, category: 'Curries' },
        { id: '6', name: 'Massaman Curry', description: 'Mild curry with potatoes and peanuts', price: 19.99, category: 'Curries' },
        { id: '7', name: 'Spring Rolls', description: 'Fresh vegetables wrapped in rice paper', price: 7.99, category: 'Appetizers' },
        { id: '8', name: 'Tom Yum Soup', description: 'Spicy and sour soup with shrimp', price: 12.99, category: 'Soups' },
        { id: '9', name: 'Thai Iced Tea', description: 'Sweetened tea with condensed milk', price: 4.99, category: 'Beverages' },
        { id: '10', name: 'Mango Sticky Rice', description: 'Sweet sticky rice with fresh mango', price: 8.99, category: 'Desserts' },
        { id: '11', name: 'Coconut Ice Cream', description: 'Homemade coconut ice cream', price: 6.99, category: 'Desserts' }
      ],
      reviews: [
        { id: '1', author: 'Anna T.', rating: 5, comment: 'Amazing Thai food! The pad thai is perfectly balanced with sweet, sour, and spicy flavors.', date: '2024-01-19' },
        { id: '2', author: 'John S.', rating: 4, comment: 'Great curry and friendly service. The green curry has the perfect level of spiciness.', date: '2024-01-17' },
        { id: '3', author: 'Sarah K.', rating: 5, comment: 'Authentic Thai flavors. The drunken noodles are my absolute favorite!', date: '2024-01-15' },
        { id: '4', author: 'Mark L.', rating: 4, comment: 'Excellent food quality and generous portions. The tom yum soup is authentic.', date: '2024-01-13' },
        { id: '5', author: 'Emma R.', rating: 5, comment: 'The mango sticky rice is the perfect ending to a delicious meal.', date: '2024-01-11' }
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