import { RestaurantCard } from "../types/Types";

export const mockRestaurantCard: RestaurantCard = {
    id: "mock-restaurant-001",
    title: "The Golden Dragon",
    cuisine: "Chinese",
    priceRange: "$$",
    rating: 4.6,
    address: "123 Main Street, Downtown, NY 10001",
    phone: "+1 (555) 123-4567",
    website: "https://goldendragon.example.com",
    distance: "0.8 km away",
    openingHours: "Open until 10:00 PM",
    isOpenNow: true,
    images: [
        "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&h=600&fit=crop",
    ],
    placeDetails: {
        editorialSummary: {
            text: "The Golden Dragon is a beloved local Chinese restaurant known for its authentic flavors and warm atmosphere. Our chefs bring traditional recipes to life with fresh, locally-sourced ingredients. From our famous Peking duck to our signature dim sum, every dish tells a story of culinary excellence passed down through generations."
        }
    },
    reviews: [
        {
            id: "review-001",
            author: "Sarah Chen",
            rating: 5,
            comment: "Absolutely amazing! The dim sum is to die for and the service is impeccable. This is now our go-to spot for family dinners.",
            relativeTime: "2 days ago",
            date: "2024-01-15"
        },
        {
            id: "review-002",
            author: "Michael Rodriguez",
            rating: 4,
            comment: "Great food and atmosphere. The Peking duck was perfectly crispy and flavorful. Will definitely come back!",
            relativeTime: "1 week ago",
            date: "2024-01-08"
        },
        {
            id: "review-003",
            author: "Jennifer Kim",
            rating: 5,
            comment: "Best Chinese food in the area! The staff is friendly and the portions are generous. Love their hot and sour soup.",
            relativeTime: "2 weeks ago",
            date: "2024-01-01"
        }
    ],
    adData: null // Set to null for regular restaurant cards
};

export const mockAdRestaurantCard: RestaurantCard = {
    id: "mock-ad-restaurant-001",
    title: "Pizza Palace Express",
    cuisine: "Italian",
    priceRange: "$",
    rating: 4.2,
    address: "456 Oak Avenue, Midtown, NY 10002",
    phone: "+1 (555) 987-6543",
    website: "https://pizzapalace.example.com",
    distance: "1.2 km away",
    openingHours: "Open until 11:00 PM",
    isOpenNow: true,
    images: [
        "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=800&h=600&fit=crop",
    ],
    placeDetails: {
        editorialSummary: {
            text: "Pizza Palace Express brings authentic Italian flavors to your table with our wood-fired pizzas and homemade pasta. Our secret family recipes have been perfected over three generations, ensuring every bite is a taste of Italy."
        }
    },
    reviews: [
        {
            id: "review-ad-001",
            author: "David Wilson",
            rating: 4,
            comment: "Great pizza and fast delivery! The crust is perfectly crispy and the toppings are fresh.",
            relativeTime: "3 days ago",
            date: "2024-01-14"
        }
    ],
    adData: {
        advertiser: "Pizza Palace Express",
        body: "Try our new Margherita Special - 20% off this week only!",
        cta: "Order Now",
        iconUrl: "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=100&h=100&fit=crop",
        adChoicesIconUrl: "https://www.google.com/adsense/static/en_US/AdChoices/icon.png",
        adChoicesLinkUrl: "https://www.google.com/adsense/static/en_US/AdChoices/"
    }
};

export const mockRestaurantCards: RestaurantCard[] = [
    mockRestaurantCard,
    mockAdRestaurantCard,
    {
        id: "mock-restaurant-002",
        title: "Sushi Master",
        cuisine: "Japanese",
        priceRange: "$$$",
        rating: 4.8,
        address: "789 Pine Street, Uptown, NY 10003",
        phone: "+1 (555) 456-7890",
        website: "https://sushimaster.example.com",
        distance: "1.5 km away",
        openingHours: "Open until 9:00 PM",
        isOpenNow: false,
        images: [
            "https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=800&h=600&fit=crop",
        ],
        placeDetails: {
            editorialSummary: {
                text: "Sushi Master offers an authentic Japanese dining experience with the freshest fish and most skilled sushi chefs in the city. Our omakase experience is a must-try for sushi enthusiasts."
            }
        },
        reviews: [
            {
                id: "review-004",
                author: "Lisa Tanaka",
                rating: 5,
                comment: "Incredible sushi! The fish is so fresh and the presentation is beautiful. The chef's special roll was amazing.",
                relativeTime: "1 day ago",
                date: "2024-01-16"
            }
        ],
        adData: null
    },
    {
        id: "mock-restaurant-003",
        title: "Burger Joint",
        cuisine: "American",
        priceRange: "$",
        rating: 4.3,
        address: "321 Elm Street, Downtown, NY 10004",
        phone: "+1 (555) 321-0987",
        website: "https://burgerjoint.example.com",
        distance: "0.5 km away",
        openingHours: "Open until 12:00 AM",
        isOpenNow: true,
        images: [
            "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&h=600&fit=crop",
        ],
        placeDetails: {
            editorialSummary: {
                text: "Burger Joint serves up the juiciest burgers in town with our secret blend of beef and house-made sauces. Our hand-cut fries and milkshakes are the perfect complement to any burger."
            }
        },
        reviews: [
            {
                id: "review-005",
                author: "Tom Johnson",
                rating: 4,
                comment: "Best burgers around! The patty is juicy and the bun is perfectly toasted. Great value for money.",
                relativeTime: "4 days ago",
                date: "2024-01-13"
            }
        ],
        adData: null
    }
];

// Helper function to get a random restaurant card
export const getRandomRestaurantCard = (): RestaurantCard => {
    const randomIndex = Math.floor(Math.random() * mockRestaurantCards.length);
    return mockRestaurantCards[randomIndex];
};

// Helper function to get multiple random restaurant cards
export const getRandomRestaurantCards = (count: number): RestaurantCard[] => {
    const shuffled = [...mockRestaurantCards].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
};
