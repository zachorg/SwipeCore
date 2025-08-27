import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { Platform } from "react-native"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Detect Android devices for performance optimization
export function isAndroid() {
  return Platform.OS === 'android';
}

export function isIOS() {
  return Platform.OS === 'ios';
}

export function isMobile() {
  return isIOS() || isAndroid();
}
