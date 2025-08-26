import { useState, useEffect } from 'react';
import * as Location from 'expo-location';
import { Platform } from 'react-native';

export interface GeolocationState {
  position: Location.LocationObject | null;
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
    isSupported: Platform.OS !== 'web' ? true : typeof navigator !== 'undefined' && !!navigator.geolocation,
  });

  const positionOptions = {
    enableHighAccuracy,
    timeout,
    maximumAge,
  } as const;

  const logLocationError = (error: any): any => {
    let errorMessage = 'Failed to get current location';

    // Handle GeolocationPositionError properly
    if (error && typeof error === 'object') {
      if (error.code !== undefined) {
        switch (error.code) {
          case 1: // PERMISSION_DENIED
            errorMessage = 'Location access denied. Please enable location services.';
            break;
          case 2: // POSITION_UNAVAILABLE
            errorMessage = 'Location services are currently unavailable.';
            break;
          case 3: // TIMEOUT
            errorMessage = 'Location request timed out. Please try again.';
            break;
          default:
            errorMessage = error.message || 'Unknown location error occurred.';
        }
      } else if (error.message) {
        // Fallback to message-based checking
        if (error.message.includes('timeout')) {
          errorMessage = 'Location request timed out. Please try again.';
        } else if (error.message.includes('denied')) {
          errorMessage = 'Location access denied. Please enable location services.';
        } else if (error.message.includes('unavailable')) {
          errorMessage = 'Location services are currently unavailable.';
        } else {
          errorMessage = error.message;
        }
      }
    }

    console.error('Geolocation permission error details:', {
      error,
      errorType: typeof error,
      errorCode: error?.code,
      errorMessage: error?.message,
      finalErrorMessage: errorMessage
    });

    return {
      error,
      errorType: typeof error,
      errorCode: error?.code,
      errorMessage: error?.message,
      finalErrorMessage: errorMessage
    };
  }

  const requestPermissions = async (): Promise<boolean> => {
    try {
      if (Platform.OS === 'web') {
        if (!navigator.geolocation) {
          console.error('Geolocation is not supported by this browser');
          return false;
        }
        return new Promise((resolve) => {
          navigator.geolocation.getCurrentPosition(
            () => resolve(true),
            (error) => {
              logLocationError(error);
              resolve(false);
            },
            { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
          );
        });
      }

      const { status } = await Location.requestForegroundPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      logLocationError(error);
      return false;
    }
  };

  const getCurrentPosition = async (): Promise<Location.LocationObject | null> => {
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
      let position: Location.LocationObject;
      if (Platform.OS === 'web') {
        position = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(
            (pos) =>
              resolve({
                coords: {
                  latitude: pos.coords.latitude,
                  longitude: pos.coords.longitude,
                  altitude: pos.coords.altitude ?? null,
                  accuracy: pos.coords.accuracy,
                  altitudeAccuracy: pos.coords.altitudeAccuracy ?? null,
                  heading: pos.coords.heading ?? null,
                  speed: pos.coords.speed ?? null,
                },
                timestamp: pos.timestamp,
              } as unknown as Location.LocationObject),
            reject,
            { enableHighAccuracy: positionOptions.enableHighAccuracy, timeout: positionOptions.timeout, maximumAge: positionOptions.maximumAge }
          );
        });
      } else {
        position = await Location.getCurrentPositionAsync({
          accuracy: positionOptions.enableHighAccuracy ? Location.Accuracy.High : Location.Accuracy.Balanced,
          maximumAge: positionOptions.maximumAge,
          timeout: positionOptions.timeout,
        } as any);
      }
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
      const { finalErrorMessage } = logLocationError(error);

      setState(prev => ({
        ...prev,
        error: finalErrorMessage.errorMessage,
        loading: false,
      }));

      return null;
    }
  };

  const watchCurrentPosition = async (): Promise<string | Location.LocationSubscription | null> => {
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

      if (Platform.OS === 'web') {
        const id = navigator.geolocation.watchPosition(
          (pos) => {
            setState(prev => ({
              ...prev,
              position: {
                coords: {
                  latitude: pos.coords.latitude,
                  longitude: pos.coords.longitude,
                  altitude: pos.coords.altitude ?? null,
                  accuracy: pos.coords.accuracy,
                  altitudeAccuracy: pos.coords.altitudeAccuracy ?? null,
                  heading: pos.coords.heading ?? null,
                  speed: pos.coords.speed ?? null,
                },
                timestamp: pos.timestamp,
              } as unknown as Location.LocationObject,
              error: null,
            }));
          },
          (error) => {
            const { finalErrorMessage } = logLocationError(error);
            setState(prev => ({ ...prev, error: finalErrorMessage.errorMessage }));
          },
          { enableHighAccuracy: positionOptions.enableHighAccuracy, timeout: positionOptions.timeout, maximumAge: positionOptions.maximumAge }
        );
        return `web:${id}`;
      }

      const subscription = await Location.watchPositionAsync(
        {
          accuracy: positionOptions.enableHighAccuracy ? Location.Accuracy.High : Location.Accuracy.Balanced,
          timeInterval: 1000,
          distanceInterval: 1,
        },
        (position) => {
          setState(prev => ({ ...prev, position, error: null }));
        }
      );
      return subscription;
    } catch (error: any) {
      const { finalErrorMessage } = logLocationError(error);
      setState(prev => ({
        ...prev,
        error: finalErrorMessage.errorMessage,
      }));
      return null;
    }
  };

  const clearWatch = async (watchId: string | Location.LocationSubscription | null) => {
    try {
      if (!watchId) return;
      if (Platform.OS === 'web') {
        navigator.geolocation.clearWatch(Number(watchId));
      } else if (typeof (watchId as any).remove === 'function') {
        (watchId as any).remove();
      }
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
        let watchId: string | Location.LocationSubscription | null = null;

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