import type { SalesDataRow } from '$lib/utils/csvParser';

export interface KpiMetrics {
  totalRevenue: number;
  averageOrderValue: number;
  totalOrders: number;
}

/**
 * Calculates key performance indicators (KPIs) from sales data.
 * @param data An array of SalesDataRow.
 * @returns An object containing total revenue, average order value, and total orders.
 */
export function calculateKpis(data: SalesDataRow[]): KpiMetrics {
  if (!data || data.length === 0) {
    return { totalRevenue: 0, averageOrderValue: 0, totalOrders: 0 };
  }

  const totalRevenue = data.reduce((sum, row) => sum + row.totalSales, 0);
  const totalOrders = data.length;
  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  return {
    totalRevenue,
    averageOrderValue,
    totalOrders,
  };
}

/**
 * Prepares sales data for a "Sales Over Time" chart.
 * Aggregates total sales by date.
 * @param data An array of SalesDataRow.
 * @returns An object with labels (dates) and values (total sales for that date).
 */
export function prepareSalesOverTimeData(data: SalesDataRow[]): { labels: string[]; values: number[] } {
  const salesByDate: { [date: string]: number } = {};

  data.forEach(row => {
    const date = new Date(row.orderDate).toISOString().split('T')[0]; // Get YYYY-MM-DD
    salesByDate[date] = (salesByDate[date] || 0) + row.totalSales;
  });

  const sortedDates = Object.keys(salesByDate).sort();
  const values = sortedDates.map(date => salesByDate[date]);

  return { labels: sortedDates, values };
}

/**
 * Prepares data for a "Top Selling Products" chart.
 * Parses product strings and aggregates items sold per product.
 * @param data An array of SalesDataRow.
 * @returns An object with labels (product names) and values (total items sold for that product).
 */
export function prepareTopProductsData(data: SalesDataRow[]): { labels: string[]; values: number[] } {
  const productSales: { [productName: string]: number } = {};

  data.forEach(row => {
    if (row.products && row.itemsSold !== undefined && row.itemsSold !== null) {
      // Assuming products string format like "Product A x 1, Product B x 2"
      const productEntries = row.products.split(',').map(p => p.trim());
      productEntries.forEach(entry => {
        const match = entry.match(/(.*) x (\d+)/);
        if (match) {
          const productName = match[1].trim();
          const quantity = parseInt(match[2], 10);
          productSales[productName] = (productSales[productName] || 0) + quantity;
        } else {
          // Fallback for products without explicit quantity (assume 1 if itemsSold is 1)
          if (row.itemsSold === 1 && productEntries.length === 1) {
            productSales[entry] = (productSales[entry] || 0) + 1;
          } else if (productEntries.length === 1) { // If multiple items sold but only one product listed, distribute
            productSales[entry] = (productSales[entry] || 0) + row.itemsSold;
          }
        }
      });
    }
  });

  const sortedProducts = Object.entries(productSales)
    .sort(([, a], [, b]) => b - a) // Sort by sales quantity descending
    .slice(0, 10); // Get top 10 products

  const labels = sortedProducts.map(([productName]) => productName);
  const values = sortedProducts.map(([, quantity]) => quantity);

  return { labels, values };
}
