import type { SalesDataRow } from '$lib/utils/csvParser';

export interface KpiMetrics {
  totalRevenue: number;
  averageOrderValue: number;
  totalOrders: number;
  averageItemsPerOrder: number;
  repeatCustomerRate: number;
  promoCodeUsageRate: number;
}

/**
 * Calculates key performance indicators (KPIs) from sales data.
 * @param data An array of SalesDataRow.
 * @returns An object containing total revenue, average order value, total orders, average items per order, repeat customer rate, and promo code usage rate.
 */
export function calculateKpis(data: SalesDataRow[]): KpiMetrics {
  if (!data || data.length === 0) {
    return {
      totalRevenue: 0,
      averageOrderValue: 0,
      totalOrders: 0,
      averageItemsPerOrder: 0,
      repeatCustomerRate: 0,
      promoCodeUsageRate: 0,
    };
  }

  const totalRevenue = data.reduce((sum, row) => sum + row.totalSales, 0);
  const totalOrders = data.length;
  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  const totalItemsSold = data.reduce((sum, row) => sum + (row.itemsSold || 0), 0);
  const averageItemsPerOrder = totalOrders > 0 ? totalItemsSold / totalOrders : 0;

  const customerOrderCounts: { [customerName: string]: number } = {};
  data.forEach(row => {
    if (row.customerName) {
      customerOrderCounts[row.customerName] = (customerOrderCounts[row.customerName] || 0) + 1;
    }
  });

  const repeatCustomers = Object.values(customerOrderCounts).filter(count => count > 1).length;
  const uniqueCustomers = Object.keys(customerOrderCounts).length;
  const repeatCustomerRate = uniqueCustomers > 0 ? (repeatCustomers / uniqueCustomers) * 100 : 0;

  const ordersWithPromo = data.filter(row => row.promoCodes && row.promoCodes.length > 0).length;
  const promoCodeUsageRate = totalOrders > 0 ? (ordersWithPromo / totalOrders) * 100 : 0;

  return {
    totalRevenue,
    averageOrderValue,
    totalOrders,
    averageItemsPerOrder,
    repeatCustomerRate,
    promoCodeUsageRate,
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
    if (row.products) {
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
          if ((row.itemsSold ?? 0) === 1 && productEntries.length === 1) {
            productSales[entry] = (productSales[entry] || 0) + 1;
          } else if (productEntries.length === 1) { // If multiple items sold but only one product listed, distribute
            productSales[entry] = (productSales[entry] || 0) + (row.itemsSold ?? 0);
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

/**
 * Prepares data for an "Order Status Distribution" chart.
 * Aggregates the count of orders by their status.
 * @param data An array of SalesDataRow.
 * @returns An object with labels (order statuses) and values (count of orders for that status).
 */
export function prepareOrderStatusData(data: SalesDataRow[]): { labels: string[]; values: number[] } {
  const orderStatusCounts: { [status: string]: number } = {};

  data.forEach(row => {
    const status = row.orderStatus || 'Unknown';
    orderStatusCounts[status] = (orderStatusCounts[status] || 0) + 1;
  });

  const labels = Object.keys(orderStatusCounts);
  const values = Object.values(orderStatusCounts);

  return { labels, values };
}

/**
 * Prepares data for a "Sales from New vs. Returning Customers" chart.
 * Aggregates total sales by date, distinguishing between new and returning customers.
 * @param data An array of SalesDataRow.
 * @returns An object with labels (dates) and two sets of values (new customer sales, returning customer sales).
 */
export function prepareCustomerTypeData(data: SalesDataRow[]): { labels: string[]; newCustomerSales: number[]; returningCustomerSales: number[] } {
  const salesByDateNew: { [date: string]: number } = {};
  const salesByDateReturning: { [date: string]: number } = {};
  const customerFirstOrderDate: { [customerName: string]: string } = {};

  // First pass: Determine first order date for each customer
  data.sort((a, b) => new Date(a.orderDate).getTime() - new Date(b.orderDate).getTime()); // Sort by date
  data.forEach(row => {
    if (row.customerName) {
      const date = new Date(row.orderDate).toISOString().split('T')[0];
      if (!customerFirstOrderDate[row.customerName]) {
        customerFirstOrderDate[row.customerName] = date;
      }
    }
  });

  // Second pass: Aggregate sales by customer type and date
  data.forEach(row => {
    const date = new Date(row.orderDate).toISOString().split('T')[0];
    if (row.customerName && customerFirstOrderDate[row.customerName] === date) {
      // New customer
      salesByDateNew[date] = (salesByDateNew[date] || 0) + row.totalSales;
    } else {
      // Returning customer or no customer name
      salesByDateReturning[date] = (salesByDateReturning[date] || 0) + row.totalSales;
    }
  });

  const allDates = Array.from(new Set([...Object.keys(salesByDateNew), ...Object.keys(salesByDateReturning)])).sort();

  const newCustomerSales = allDates.map(date => salesByDateNew[date] || 0);
  const returningCustomerSales = allDates.map(date => salesByDateReturning[date] || 0);

  return { labels: allDates, newCustomerSales, returningCustomerSales };
}
