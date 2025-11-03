import { writable } from 'svelte/store';
import type { SalesDataRow } from '$lib/utils/csvParser';

interface DataStore {
  parsedData: SalesDataRow[] | null;
  headers: string[] | null;
  fileName: string | null;
  error: string | null;
}

const initialStore: DataStore = {
  parsedData: null,
  headers: null,
  fileName: null,
  error: null,
};

export const salesData = writable<DataStore>(initialStore);

export function setSalesData(data: SalesDataRow[], headers: string[], fileName: string) {
  salesData.set({
    parsedData: data,
    headers: headers,
    fileName: fileName,
    error: null,
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
