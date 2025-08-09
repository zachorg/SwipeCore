import { create } from 'zustand';

interface QueueItem {
  id: string;
  item: any;
  timestamp: number;
}

interface QueueStore {
  queue: QueueItem[];
  enqueue: (item: Omit<QueueItem, 'id' | 'timestamp'>) => string;
  dequeue: () => any | undefined;
  peek: () => QueueItem | undefined;
  isEmpty: () => boolean;
}

export const useQueueStore = create<QueueStore>((set, get) => ({
  queue: [],
  
  enqueue: (item) => {
    const id = crypto.randomUUID();
    const queueItem = {
      id,
      item,
      timestamp: Date.now()
    };
    
    set((state) => ({ queue: [...state.queue, queueItem] }));
    return id;
  },
  
  dequeue: () => {
    const { queue } = get();
    if (queue.length === 0) return undefined;
    
    const item = queue[0];
    set({ queue: queue.slice(1) });
    return item.item;
  },
  
  peek: () => {
    const { queue } = get();
    return queue.length > 0 ? queue[0] : undefined;
  },
  
  isEmpty: () => {
    return get().queue.length === 0;
  }
}));