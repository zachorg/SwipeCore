import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Detect Android devices for performance optimization
export function isAndroid() {
  return /Android/i.test(navigator.userAgent);
}

export function isIOS() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
}
