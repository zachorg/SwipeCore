import { useState, useEffect } from 'react';
import { Geolocation, Position, PositionOptions } from '@capacitor/geolocation';
import { Capacitor } from '@capacitor/core';

export interface GeolocationState {
  position: Position | null;
  loading: boolean;
  error: string | null;
  isSupported: boolean;
}

export interface UseGeolocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
  watchPosition?: boolean;
  requestOnMount?: boolean;
}

export const useGeolocation = (options: UseGeolocationOptions = {}) => {
  const {
    enableHighAccuracy = true,
    timeout = 10000,
    maximumAge = 60000,
    watchPosition = false,
    requestOnMount = true,
  } = options;

  const [state, setState] = useState<GeolocationState>({
    position: null,
    loading: false,
    error: null,
    isSupported: Capacitor.isPluginAvailable('Geolocation'),
  });

  const positionOptions: PositionOptions = {
    enableHighAccuracy,
    timeout,
    maximumAge,
  };

  const requestPermissions = async (): Promise<boolean> => {
    try {
      // For web browsers, we use the navigator.geolocation API
      if (!navigator.geolocation) {
        console.error('Geolocation is not supported by this browser');
        return false;
      }
      
      // Request permission by attempting to get the current position
      return new Promise((resolve) => {
        navigator.geolocation.getCurrentPosition(
          () => resolve(true), // Success callback - user granted permission
          (error) => {
            console.error('Error requesting geolocation permissions:', error);
            resolve(false); // Error callback - user denied permission or error occurred
          },
          { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
        );
      });
    } catch (error) {
      console.error('Error requesting geolocation permissions:', error);
      return false;
    }
  };

  const getCurrentPosition = async (): Promise<Position | null> => {
    console.log('📍 Starting geolocation request...', { isSupported: state.isSupported });
    
    if (!state.isSupported) {
      console.error('Geolocation not supported');
      setState(prev => ({
        ...prev,
        error: 'Geolocation is not supported on this device',
        loading: false,
      }));
      return null;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      // Check and request permissions
      console.log('Requesting geolocation permissions...');
      const hasPermission = await requestPermissions();
      console.log('Permission result:', hasPermission);
      
      if (!hasPermission) {
        console.error('Location permission denied');
        setState(prev => ({
          ...prev,
          error: 'Location permission denied. Please enable location access in your device settings.',
          loading: false,
        }));
        return null;
      }

      console.log('Getting current position...');
      const position = await Geolocation.getCurrentPosition(positionOptions);
      console.log('Location obtained:', {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        accuracy: position.coords.accuracy
      });
      
      setState(prev => ({
        ...prev,
        position,
        loading: false,
        error: null,
      }));

      return position;
    } catch (error: any) {
      let errorMessage = 'Failed to get current location';
      
      if (error.message?.includes('timeout')) {
        errorMessage = 'Location request timed out. Please try again.';
      } else if (error.message?.includes('denied')) {
        errorMessage = 'Location access denied. Please enable location services.';
      } else if (error.message?.includes('unavailable')) {
        errorMessage = 'Location services are currently unavailable.';
      } else if (error.message) {
        errorMessage = error.message;
      }

      setState(prev => ({
        ...prev,
        error: errorMessage,
        loading: false,
      }));

      return null;
    }
  };

  const watchCurrentPosition = async () => {
    if (!state.isSupported) {
      setState(prev => ({
        ...prev,
        error: 'Geolocation is not supported on this device',
      }));
      return null;
    }

    try {
      const hasPermission = await requestPermissions();
      if (!hasPermission) {
        setState(prev => ({
          ...prev,
          error: 'Location permission denied',
        }));
        return null;
      }

      const watchId = await Geolocation.watchPosition(positionOptions, (position, error) => {
        if (error) {
          setState(prev => ({
            ...prev,
            error: error.message || 'Failed to watch position',
          }));
        } else if (position) {
          setState(prev => ({
            ...prev,
            position,
            error: null,
          }));
        }
      });

      return watchId;
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        error: error.message || 'Failed to start watching position',
      }));
      return null;
    }
  };

  const clearWatch = async (watchId: string) => {
    try {
      await Geolocation.clearWatch({ id: watchId });
    } catch (error) {
      console.error('Error clearing geolocation watch:', error);
    }
  };

  const refreshPosition = () => {
    getCurrentPosition();
  };

  // Auto-request location on mount if requested
  useEffect(() => {
    if (requestOnMount && state.isSupported) {
      if (watchPosition) {
        let watchId: string | null = null;
        
        watchCurrentPosition().then((id) => {
          if (id) {
            watchId = id;
          }
        });

        return () => {
          if (watchId) {
            clearWatch(watchId);
          }
        };
      } else {
        getCurrentPosition();
      }
    }
  }, [requestOnMount, watchPosition, state.isSupported]);

  return {
    ...state,
    getCurrentPosition,
    refreshPosition,
    watchCurrentPosition,
    clearWatch,
    requestPermissions,
  };
};