import NodeCache from 'node-cache';

// Configure NodeCache with proper TTL options
// checkperiod: how often to check for expired items (in seconds)
// This ensures automatic deletion of expired items even if they're not accessed
export const local = new NodeCache({
  checkperiod: 10, // Check for expired items every 10 seconds
  useClones: false, // For better performance
  deleteOnExpire: true, // Ensure items are deleted when they expire
});
