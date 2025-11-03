import Papa from 'papaparse';
import { adapters, type CsvAdapter } from './csvMappers';

export interface SalesDataRow {
  orderId: string;
  orderDate: string; // ISO 8601 string
  customerName?: string;
  totalSales: number;
  products?: string; // Raw string of products, for now
  itemsSold?: number;
  promoCodes?: string;
  orderStatus?: string;
  // Add more fields as needed based on common e-commerce CSV exports
}

export interface ParsedCSVData {
  headers: string[];
  data: SalesDataRow[];
  errors: Papa.ParseError[];
  platform?: string; // Add platform information
}

/**
 * Parses a CSV string into a structured format using a suitable adapter.
 * @param csvString The raw CSV content as a string.
 * @returns A promise that resolves with the parsed data, headers, any parsing errors, and the detected platform.
 */
export function parseCsv(csvString: string): Promise<ParsedCSVData> {
  return new Promise((resolve) => {
    Papa.parse(csvString, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      complete: (results) => {
        const headers = results.meta.fields || [];
        let detectedAdapter: CsvAdapter | undefined;

        for (const adapter of adapters) {
          if (adapter.detector(headers)) {
            detectedAdapter = adapter;
            break;
          }
        }

        if (!detectedAdapter) {
          resolve({
            headers,
            data: [],
            errors: [{
              type: "FieldMismatch", // Using an existing PapaParse error type
              code: "HeaderMismatch", // Custom code for our specific error
              message: "No suitable adapter found for the provided CSV headers.",
              row: 0,
              index: 0,
            }],
            platform: 'Unknown',
          });
          return;
        }

        const data: SalesDataRow[] = results.data.map((row: any) => {
          const mappedRow: any = {};
          for (const originalHeader in detectedAdapter.mapping) {
            const standardizedField = detectedAdapter.mapping[originalHeader];
            mappedRow[standardizedField] = row[originalHeader];
          }

          // Type conversions and default values
          return {
            orderId: String(mappedRow.orderId || ''),
            orderDate: mappedRow.orderDate
              ? new Date(mappedRow.orderDate).toISOString()
              : '',
            customerName: String(mappedRow.customerName || ''),
            totalSales: Number(mappedRow.totalSales || 0),
            products: String(mappedRow.products || ''),
            itemsSold: Number(mappedRow.itemsSold || 0),
            promoCodes: String(mappedRow.promoCodes || ''),
            orderStatus: String(mappedRow.orderStatus || ''),
          };
        });

        resolve({
          headers,
          data,
          errors: results.errors,
          platform: detectedAdapter.platform,
        });
      },
      error: (error: Papa.ParseError) => {
        resolve({
          headers: [],
          data: [],
          errors: [error],
          platform: 'Unknown',
        });
      },
    });
  });
}
