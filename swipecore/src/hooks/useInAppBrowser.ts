import { useEffect } from 'react';
import { warmUpWebBrowser } from '@/utils/browser';

export const useInAppBrowser = () => {
  useEffect(() => {
    // Warm up WebBrowser when the hook is first used
    warmUpWebBrowser();
  }, []);
};
