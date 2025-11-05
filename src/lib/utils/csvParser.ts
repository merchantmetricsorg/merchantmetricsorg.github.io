import Papa from 'papaparse';
import { adapters, type CsvAdapter } from './csvMappers';

export interface SalesDataRow {
  orderId: string;
  orderDate: string; // ISO 8601 string
  customerName?: string;
  orderTotal: number; // Total sales for the entire order
  productDetails?: string; // Raw string of products from WooCommerce, for initial parsing
  productName?: string; // Name of the individual product
  productQuantity?: number; // Quantity of the individual product in the line item
  lineItemPrice?: number; // Price of the individual line item (productQuantity * unitPrice)
  itemsSold?: number; // Total quantity of items sold in the order (WooCommerce) or line item quantity (Shopify)
  promoCodes?: string;
  orderStatus?: string;
  customerEmail?: string;
  financialStatus?: string;
  fulfillmentStatus?: string;
  currency?: string;
  subtotal?: number;
  shipping?: number;
  taxes?: number;
  discountCode?: string;
  discountAmount?: number;
  shippingMethod?: string;
  billingCity?: string;
  shippingCity?: string;
  paymentMethod?: string;
  tags?: string;
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
    let headers: string[] = [];
    const parsedData: SalesDataRow[] = [];
    const parsingErrors: Papa.ParseError[] = [];
    let detectedAdapter: CsvAdapter | undefined;

    Papa.parse(csvString, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      step: (rowParseResult, parser) => {
        // Always detect adapter first, as headers are available from the first step
        if (!detectedAdapter) {
          headers = rowParseResult.meta.fields || [];
          for (const adapter of adapters) {
            if (adapter.detector(headers)) {
              detectedAdapter = adapter;
              break;
            }
          }

          if (!detectedAdapter) {
            parser.abort(); // No adapter found, stop parsing
            resolve({
              headers,
              data: [],
              errors: [{
                message: "No suitable adapter found for the provided CSV headers.",
                row: 0,
                index: 0,
                type: "Delimiter",
                code: "UndetectableDelimiter"
              } as Papa.ParseError],
              platform: 'Unknown',
            });
            return;
          }
        }

        const row: any = rowParseResult.data;
        const mappedRow: any = {};

        // Only process row if an adapter is detected and it's not an empty row
        if (detectedAdapter && Object.keys(row).length > 0) {
          if (rowParseResult.errors.length > 0) {
            // Filter out "Too many fields" errors for non-strict adapters
            const filteredErrors = rowParseResult.errors.filter(error => {
              const isTooManyFieldsError = error.code === 'TooManyFields';
              const isNonStrictAdapter = detectedAdapter.strict === false; // detectedAdapter is guaranteed to be defined here

              if (isTooManyFieldsError && isNonStrictAdapter) {
                console.warn(`Filtered out error for platform ${detectedAdapter.platform}: ${error.message}`);
                return false; // Filter this error out
              }
              return true; // Keep other errors
            });
            parsingErrors.push(...filteredErrors);
          }

          for (const originalHeader in detectedAdapter.mapping) {
            const standardizedField = detectedAdapter.mapping[originalHeader];
            // Only map if the original header exists in the row, or if the adapter is not strict
            if (row[originalHeader as keyof typeof row] !== undefined || detectedAdapter.strict === false) {
              mappedRow[standardizedField] = row[originalHeader as keyof typeof row];
            }
          }

          // Type conversions and default values
          const baseRow: Omit<SalesDataRow, 'productName' | 'productQuantity' | 'lineItemPrice'> = {
            orderId: String(mappedRow.orderId || ''),
            orderDate: mappedRow.orderDate
              ? new Date(mappedRow.orderDate).toISOString()
              : '',
            customerName: String(mappedRow.customerName || ''),
            orderTotal: Number(mappedRow.orderTotal || mappedRow.totalSales || 0), // Use orderTotal, fallback to totalSales for old data
            productDetails: String(mappedRow.productDetails || mappedRow.products || ''), // Use productDetails, fallback to products
            itemsSold: Number(mappedRow.itemsSold || 0),
            promoCodes: String(mappedRow.promoCodes || ''),
            orderStatus: String(mappedRow.orderStatus || ''),
            customerEmail: String(mappedRow.customerEmail || ''),
            financialStatus: String(mappedRow.financialStatus || ''),
            fulfillmentStatus: String(mappedRow.fulfillmentStatus || ''),
            currency: String(mappedRow.currency || ''),
            subtotal: Number(mappedRow.subtotal || 0),
            shipping: Number(mappedRow.shipping || 0),
            taxes: Number(mappedRow.taxes || 0),
            discountCode: String(mappedRow.discountCode || ''),
            discountAmount: Number(mappedRow.discountAmount || 0),
            shippingMethod: String(mappedRow.shippingMethod || ''),
            billingCity: String(mappedRow.billingCity || ''),
            shippingCity: String(mappedRow.shippingCity || ''),
            paymentMethod: String(mappedRow.paymentMethod || ''),
            tags: String(mappedRow.tags || ''),
          };

          if (detectedAdapter.platform === 'WooCommerce') {
            const productsString = baseRow.productDetails;
            const orderTotal = baseRow.orderTotal;
            const totalItemsSoldInOrder = baseRow.itemsSold || 0; // Total quantity of items sold in the order

            let averagePricePerItem = 0;
            if (totalItemsSoldInOrder > 0) {
              averagePricePerItem = orderTotal / totalItemsSoldInOrder;
            }

            if (productsString) {
              const productEntries = productsString.split(',').map(s => s.trim());
              for (const entry of productEntries) {
                const match = entry.match(/(.*)\s+x\s+(\d+)$/);
                if (match) {
                  const productName = match[1].trim();
                  const productQuantity = Number(match[2]);
                  const lineItemPrice = productQuantity * averagePricePerItem; // Calculate estimated line item price
                  parsedData.push({
                    ...baseRow,
                    productName,
                    productQuantity,
                    lineItemPrice,
                  });
                } else {
                  // Handle cases where product string doesn't match expected format, assume quantity 1
                  parsedData.push({
                    ...baseRow,
                    productName: entry,
                    productQuantity: 1,
                    lineItemPrice: averagePricePerItem, // Assign average price if quantity is assumed 1
                  });
                }
              }
            } else {
              // If no products string, still add the order as a single line item (e.g., for services)
              parsedData.push({
                ...baseRow,
                productName: 'N/A',
                productQuantity: 0,
                lineItemPrice: 0, // No products, no line item price
              });
            }
          } else if (detectedAdapter.platform === 'Shopify') {
            // Shopify rows are already line items
            parsedData.push({
              ...baseRow,
              productName: String(mappedRow.productName || ''), // Use new productName field
              productQuantity: Number(mappedRow.productQuantity || 0), // Use new productQuantity field
              lineItemPrice: Number(mappedRow.lineItemPrice || 0),
            });
          } else {
            // For unknown platforms or if no specific handling, push the row as is
            parsedData.push({
              ...baseRow,
              productName: String(mappedRow.productName || ''),
              productQuantity: Number(mappedRow.productQuantity || 0),
              lineItemPrice: Number(mappedRow.lineItemPrice || 0),
            });
          }
        }
      },
      complete: (results) => {
        // If parsing was aborted due to no adapter, we already resolved.
        if (!detectedAdapter) return;

        resolve({
          headers: results.meta.fields || [],
          data: parsedData,
          errors: parsingErrors, // Use collected errors
          platform: detectedAdapter.platform,
        });
      },
    });
  });
}
