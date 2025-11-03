import { writable } from 'svelte/store';
import type { SalesDataRow } from '$lib/utils/csvParser';

interface DataStore {
  parsedData: SalesDataRow[] | null;
  headers: string[] | null;
  fileName: string | null;
  error: string | null;
  platform: string | null; // Add platform information
}

const initialStore: DataStore = {
  parsedData: null,
  headers: null,
  fileName: null,
  error: null,
  platform: null, // Initialize platform
};

export const salesData = writable<DataStore>(initialStore);

export function setSalesData(data: SalesDataRow[], headers: string[], fileName: string, platform: string | undefined) {
  salesData.set({
    parsedData: data,
    headers: headers,
    fileName: fileName,
    error: null,
    platform: platform || null, // Store platform
  });
}

export function clearSalesData() {
  salesData.set(initialStore);
}

export function setError(message: string) {
  salesData.update((store) => ({
    ...store,
    error: message,
  }));
}
