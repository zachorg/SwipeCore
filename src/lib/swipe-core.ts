// Swipe framework core logic
export interface SwipeCard {
  id: string;
  imageUrl: string;
  title: string;
  subtitle?: string;
  age?: number;
  distance?: string;
  [key: string]: any;
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
  threshold: 150,
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

// Generate mock cards for testing
export function generateMockCards(count: number = 10): SwipeCard[] {
  const names = ['Alex', 'Sam', 'Jordan', 'Casey', 'Riley', 'Avery', 'Quinn', 'Blake', 'Sage', 'River'];
  const bios = [
    'Love hiking and coffee',
    'Artist and dreamer',
    'Foodie and traveler', 
    'Fitness enthusiast',
    'Book lover',
    'Music producer',
    'Dog parent',
    'Adventure seeker',
    'Tech entrepreneur',
    'Nature photographer'
  ];

  return Array.from({ length: count }, (_, i) => ({
    id: `card-${i}`,
    imageUrl: `https://picsum.photos/400/600?random=${i}`,
    title: names[i % names.length],
    subtitle: bios[i % bios.length],
    age: 22 + Math.floor(Math.random() * 15),
    distance: `${Math.floor(Math.random() * 50) + 1} km away`,
  }));
}