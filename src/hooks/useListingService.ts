/**
 * React Hook: useListingService
 *
 * Provides convenient access to the listing service with React integration.
 * Handles service initialization and error management.
 *
 * This is the recommended way for React components to interact with the service layer.
 * It ensures proper initialization and consistent error handling.
 */

import { useEffect, useState } from "react";
import type { IListingService } from "../services/types";
import {
  getListingService,
  initializeListingService,
} from "../services/listingService";

interface UseListingServiceState {
  service: IListingService | null;
  loading: boolean;
  error: Error | null;
}

/**
 * Hook to access the listing service with proper initialization
 *
 * Usage:
 * ```tsx
 * const { service, loading, error } = useListingService();
 *
 * if (loading) return <div>Loading...</div>;
 * if (error) return <div>Error: {error.message}</div>;
 *
 * // service is now guaranteed to be initialized
 * const listings = await service.getListings();
 * ```
 */
export function useListingService(): UseListingServiceState {
  const [state, setState] = useState<UseListingServiceState>({
    service: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    let mounted = true;

    const initializeService = async () => {
      try {
        const service = await initializeListingService();
        if (mounted) {
          setState({ service, loading: false, error: null });
        }
      } catch (err) {
        if (mounted) {
          const error = err instanceof Error ? err : new Error(String(err));
          setState({ service: null, loading: false, error });
        }
      }
    };

    // Try to get existing service first
    try {
      const existingService = getListingService();
      setState({ service: existingService, loading: false, error: null });
    } catch {
      // Service not initialized yet, initialize it
      initializeService();
    }

    return () => {
      mounted = false;
    };
  }, []);

  return state;
}
