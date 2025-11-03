import Papa from 'papaparse';

export interface SalesDataRow {
  orderId: string;
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  total: number;
  orderDate: string; // ISO 8601 string
  customerEmail: string;
  // Add more fields as needed based on common e-commerce CSV exports
}

export interface ParsedCSVData {
  headers: string[];
  data: SalesDataRow[];
  errors: Papa.ParseError[];
}

/**
 * Parses a CSV string into a structured format.
 * @param csvString The raw CSV content as a string.
 * @returns A promise that resolves with the parsed data, headers, and any parsing errors.
 */
export function parseCsv(csvString: string): Promise<ParsedCSVData> {
  return new Promise((resolve) => {
    Papa.parse(csvString, {
      header: true, // Treat the first row as headers
      dynamicTyping: true, // Attempt to convert values to appropriate types (numbers, booleans)
      skipEmptyLines: true,
      complete: (results) => {
        const headers = results.meta.fields || [];
        const data: SalesDataRow[] = results.data.map((row: any) => ({
          orderId: String(row['Order ID'] || row['id'] || ''),
          productId: String(row['Product ID'] || row['product_id'] || ''),
          productName: String(row['Product Name'] || row['name'] || ''),
          quantity: Number(row['Quantity'] || row['quantity'] || 0),
          price: Number(row['Price'] || row['price'] || 0),
          total: Number(row['Total'] || row['total'] || row['line_total'] || 0),
          orderDate: (row['Order Date'] || row['created_at'])
            ? new Date(row['Order Date'] || row['created_at']).toISOString()
            : '', // Handle potentially invalid date strings
          customerEmail: String(row['Customer Email'] || row['email'] || ''),
          // Map other fields here, considering common variations
        }));

        resolve({
          headers,
          data,
          errors: results.errors,
        });
      },
      error: (error: Papa.ParseError) => {
        resolve({
          headers: [],
          data: [],
          errors: [error],
        });
      },
    });
  });
}
