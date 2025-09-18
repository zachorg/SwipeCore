import { RestaurantCard } from "../types/Types";

export const mockRestaurantCard: RestaurantCard = {
    id: "mock-restaurant-001",
    basicDetails: {
        id: "mock-restaurant-001",
        displayName: {
            text: "The Golden Dragon",
            languageCode: "en"
        },
        formattedAddress: "123 Main Street, Downtown, NY 10001",
        rating: 4.6,
        priceLevel: "PRICE_LEVEL_MODERATE",
        types: ["restaurant", "food", "chinese_restaurant"],
        location: {
            latitude: 40.7589,
            longitude: -73.9851
        },
        regularOpeningHours: {
            openNow: true
        }
    },
    title: "The Golden Dragon",
    subtitle: "Authentic Chinese Cuisine",
    cuisine: "Chinese",
    priceRange: "$$",
    rating: 4.6,
    address: "123 Main Street, Downtown, NY 10001",
    phone: "+1 (555) 123-4567",
    website: "https://goldendragon.example.com",
    distance: "0.8 km away",
    openingHours: "Open until 10:00 PM",
    isOpenNow: true,
    // Use images for backward compatibility with SwipeCard component
    images: [
        "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&h=600&fit=crop",
    ],
    photos: [
        {
            googleUrl: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&h=600&fit=crop",
            url: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&h=600&fit=crop",
            name: "restaurant-interior",
            widthPx: 800,
            heightPx: 600
        }
    ],
    location: {
        latitude: 40.7589,
        longitude: -73.9851
    },
    distanceInMeters: 800,
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

// Generate a comprehensive list of mock restaurant cards
const generateMockRestaurantCards = (): RestaurantCard[] => {
    const cuisines = [
        "Chinese", "Japanese", "American", "Italian", "Mexican", "Thai", "Indian", "French",
        "Korean", "Vietnamese", "Mediterranean", "Greek", "Spanish", "German", "Brazilian",
        "Ethiopian", "Lebanese", "Turkish", "Moroccan", "Peruvian", "Argentine", "Caribbean"
    ];

    const priceRanges = ["$", "$$", "$$$", "$$$$"];
    const openingHours = [
        "Open until 9:00 PM", "Open until 10:00 PM", "Open until 11:00 PM",
        "Open until 12:00 AM", "Open until 1:00 AM", "Open until 2:00 AM"
    ];

    const streetNames = [
        "Main Street", "Oak Avenue", "Pine Street", "Elm Street", "Maple Drive", "Cedar Lane",
        "First Avenue", "Second Street", "Broadway", "Park Avenue", "Washington Street",
        "Lincoln Avenue", "Jefferson Street", "Madison Avenue", "Franklin Street"
    ];

    const neighborhoods = [
        "Downtown", "Uptown", "Midtown", "East Village", "West Village", "SoHo", "Tribeca",
        "Chelsea", "Greenwich Village", "Upper East Side", "Upper West Side", "Brooklyn Heights",
        "Williamsburg", "Astoria", "Long Island City"
    ];

    const images = [
        "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&h=600&fit=crop",
        "https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=800&h=600&fit=crop",
        "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&h=600&fit=crop",
        "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&h=600&fit=crop",
        "https://images.unsplash.com/photo-1551218808-94e220e084d2?w=800&h=600&fit=crop",
        "https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=800&h=600&fit=crop",
        "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&h=600&fit=crop",
        "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=800&h=600&fit=crop",
        "https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=800&h=600&fit=crop",
        "https://images.unsplash.com/photo-1574484284002-952d92456975?w=800&h=600&fit=crop"
    ];

    const restaurantNames = [
        "The Golden Dragon", "Sushi Master", "Burger Joint", "Mama's Italian", "Taco Fiesta",
        "Spice Garden", "Le Bistro", "Kimchi House", "Pho Saigon", "Mediterranean Delight",
        "Greek Taverna", "Tapas Bar", "Bratwurst Haus", "Churrascaria", "Ethiopian Feast",
        "Cedar Palace", "Turkish Delight", "Moroccan Nights", "Lima Kitchen", "Gaucho Grill",
        "Caribbean Breeze", "Noodle House", "Pizza Corner", "Steakhouse Prime", "Seafood Shack",
        "Vegetarian Garden", "BBQ Pit", "Cafe Mocha", "Deli Express", "Bakery Fresh",
        "Wine Cellar", "Cocktail Lounge", "Tea House", "Coffee Corner", "Juice Bar",
        "Ice Cream Parlor", "Donut Shop", "Bagel Store", "Sandwich Stop", "Salad Bowl"
    ];

    const cards: RestaurantCard[] = [];

    for (let i = 0; i < 50; i++) {
        const cuisine = cuisines[i % cuisines.length];
        const priceRange = priceRanges[i % priceRanges.length];
        const streetName = streetNames[i % streetNames.length];
        const neighborhood = neighborhoods[i % neighborhoods.length];
        const image = images[i % images.length];
        const restaurantName = restaurantNames[i % restaurantNames.length];
        const openingHour = openingHours[i % openingHours.length];

        const rating = 3.5 + Math.random() * 1.5; // Rating between 3.5 and 5.0
        const distance = (Math.random() * 5).toFixed(1); // Distance between 0.1 and 5.0 km
        const streetNumber = Math.floor(Math.random() * 999) + 1;
        const zipCode = 10000 + Math.floor(Math.random() * 100);

        const card: RestaurantCard = {
            id: `mock-restaurant-${String(i + 1).padStart(3, '0')}`,
            basicDetails: {
                id: `mock-restaurant-${String(i + 1).padStart(3, '0')}`,
                displayName: {
                    text: restaurantName,
                    languageCode: "en"
                },
                formattedAddress: `${streetNumber} ${streetName}, ${neighborhood}, NY ${zipCode}`,
                rating: Math.round(rating * 10) / 10,
                priceLevel: priceRange === "$" ? "PRICE_LEVEL_INEXPENSIVE" :
                    priceRange === "$$" ? "PRICE_LEVEL_MODERATE" :
                        priceRange === "$$$" ? "PRICE_LEVEL_EXPENSIVE" : "PRICE_LEVEL_VERY_EXPENSIVE",
                types: ["restaurant", "food", `${cuisine.toLowerCase()}_restaurant`],
                location: {
                    latitude: 40.7589 + (Math.random() - 0.5) * 0.1,
                    longitude: -73.9851 + (Math.random() - 0.5) * 0.1
                },
                regularOpeningHours: {
                    openNow: Math.random() > 0.3
                }
            },
            title: restaurantName,
            subtitle: `Authentic ${cuisine} Cuisine`,
            cuisine: cuisine,
            priceRange: priceRange as "$" | "$$" | "$$$" | "$$$$",
            rating: Math.round(rating * 10) / 10,
            address: `${streetNumber} ${streetName}, ${neighborhood}, NY ${zipCode}`,
            phone: `+1 (555) ${String(Math.floor(Math.random() * 900) + 100)}-${String(Math.floor(Math.random() * 9000) + 1000)}`,
            website: `https://${restaurantName.toLowerCase().replace(/\s+/g, '')}.example.com`,
            distance: `${distance} km away`,
            openingHours: openingHour,
            isOpenNow: Math.random() > 0.3,
            images: [image],
            photos: [
                {
                    googleUrl: image,
                    url: image,
                    name: `restaurant-${i}`,
                    widthPx: 800,
                    heightPx: 600
                }
            ],
            location: {
                latitude: 40.7589 + (Math.random() - 0.5) * 0.1,
                longitude: -73.9851 + (Math.random() - 0.5) * 0.1
            },
            distanceInMeters: Math.floor(parseFloat(distance) * 1000),
            placeDetails: {
                editorialSummary: {
                    text: `${restaurantName} is a beloved local ${cuisine.toLowerCase()} restaurant known for its authentic flavors and warm atmosphere. Our chefs bring traditional recipes to life with fresh, locally-sourced ingredients.`
                }
            },
            reviews: [
                {
                    id: `review-${String(i * 3 + 1).padStart(3, '0')}`,
                    author: `Customer ${i + 1}`,
                    rating: Math.floor(rating),
                    comment: `Great ${cuisine.toLowerCase()} food! The atmosphere is wonderful and the service is excellent. Highly recommended!`,
                    relativeTime: `${Math.floor(Math.random() * 7) + 1} days ago`,
                    date: "2024-01-15"
                }
            ],
            adData: null
        };

        cards.push(card);
    }

    return cards;
};

export const mockRestaurantCards: RestaurantCard[] = generateMockRestaurantCards();

// Helper function to get a random restaurant card
export const getRandomRestaurantCard = (): RestaurantCard => {
    const randomIndex = Math.floor(Math.random() * mockRestaurantCards.length);
    return mockRestaurantCards[randomIndex];
};

// Helper function to get multiple random restaurant cards
export const getRandomRestaurantCards = (count: number): RestaurantCard[] => {
    if (count <= 0) return [];

    const availableCards = mockRestaurantCards.length;
    const cards: RestaurantCard[] = [];

    // If we need more cards than available, we'll repeat some cards with unique IDs
    for (let i = 0; i < count; i++) {
        const baseCard = mockRestaurantCards[i % availableCards];

        // If we're repeating cards, create a unique copy with a new ID
        if (i >= availableCards) {
            const uniqueCard: RestaurantCard = {
                ...baseCard,
                id: `mock-restaurant-${String(i + 1).padStart(3, '0')}`,
                basicDetails: {
                    ...baseCard.basicDetails,
                    id: `mock-restaurant-${String(i + 1).padStart(3, '0')}`,
                    displayName: {
                        ...baseCard.basicDetails.displayName,
                        text: `${baseCard.title} ${Math.floor(i / availableCards) + 1}`
                    }
                },
                title: `${baseCard.title} ${Math.floor(i / availableCards) + 1}`,
                address: baseCard.address?.replace(/\d+/, (match) => String(parseInt(match) + Math.floor(i / availableCards) * 10)) || `${Math.floor(Math.random() * 999) + 1} Main Street, Downtown, NY 10001`,
                phone: `+1 (555) ${String(Math.floor(Math.random() * 900) + 100)}-${String(Math.floor(Math.random() * 9000) + 1000)}`,
                website: `https://${baseCard.title.toLowerCase().replace(/\s+/g, '')}${Math.floor(i / availableCards) + 1}.example.com`,
                distance: `${(Math.random() * 5).toFixed(1)} km away`,
                distanceInMeters: Math.floor(Math.random() * 5000),
                location: {
                    latitude: (baseCard.location?.latitude || 40.7589) + (Math.random() - 0.5) * 0.01,
                    longitude: (baseCard.location?.longitude || -73.9851) + (Math.random() - 0.5) * 0.01
                },
                photos: baseCard.photos.map(photo => ({
                    ...photo,
                    name: `restaurant-${i}`,
                    googleUrl: photo.googleUrl,
                    url: photo.url
                }))
            };
            cards.push(uniqueCard);
        } else {
            cards.push(baseCard);
        }
    }

    // Shuffle the final array to randomize the order
    return cards.sort(() => Math.random() - 0.5);
};
