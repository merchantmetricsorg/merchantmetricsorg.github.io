import type { SalesDataRow } from '$lib/utils/csvParser';

export interface Kpi {
  value: number;
  period: string;
  change?: number; // Percentage change from previous period
  isGood?: boolean; // True if change is positive/good, false if negative/bad
  comparisonPeriod?: string; // e.g., "vs. previous 30 days"
}

export interface Kpis {
  totalRevenue: Kpi[];
  averageOrderValue: Kpi[];
  totalOrders: Kpi[];
  averageItemsPerOrder: Kpi[];
  repeatCustomerRate: Kpi[];
  promoCodeUsageRate: Kpi[];
}

/**
 * Filters sales data for a specific date range.
 * @param data An array of SalesDataRow.
 * @param startDate The start date for filtering (inclusive).
 * @param endDate The end date for filtering (inclusive).
 * @returns Filtered sales data.
 */
function filterDataByDateRange(data: SalesDataRow[], startDate: Date, endDate: Date): SalesDataRow[] {
  return data.filter(row => {
    const orderDate = new Date(row.orderDate);
    return orderDate >= startDate && orderDate <= endDate;
  });
}

/**
 * Calculates key performance indicators (KPIs) from sales data for a given period.
 * @param data An array of SalesDataRow.
 * @returns An object containing total revenue, average order value, total orders, average items per order, repeat customer rate, and promo code usage rate.
 */
export function calculateKpisForPeriod(data: SalesDataRow[]): Omit<Kpis, 'totalRevenue' | 'averageOrderValue' | 'totalOrders' | 'averageItemsPerOrder' | 'repeatCustomerRate' | 'promoCodeUsageRate'> & {
  totalRevenue: number;
  averageOrderValue: number;
  totalOrders: number;
  averageItemsPerOrder: number;
  repeatCustomerRate: number;
  promoCodeUsageRate: number;
} {
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
 * Calculates all predefined KPIs for various periods with comparisons.
 * @param allData An array of all SalesDataRow.
 * @returns An object containing all KPIs with their values, periods, and comparisons.
 */
export function calculateAllKpis(allData: SalesDataRow[]): Kpis {
  const today = new Date();
  today.setHours(23, 59, 59, 999); // End of today

  const calculateKpiWithComparison = (
    data: SalesDataRow[],
    periodDays: number,
    kpiName: keyof ReturnType<typeof calculateKpisForPeriod>,
    isHigherBetter: boolean = true,
    periodDescription: string
  ): Kpi => {
    const endDate = new Date(today);
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - periodDays + 1);
    startDate.setHours(0, 0, 0, 0);

    const currentPeriodData = filterDataByDateRange(data, startDate, endDate);
    const currentKpis = calculateKpisForPeriod(currentPeriodData);
    const currentValue = currentKpis[kpiName] as number;

    // Calculate previous period
    const prevEndDate = new Date(startDate);
    prevEndDate.setDate(startDate.getDate() - 1);
    prevEndDate.setHours(23, 59, 59, 999);

    const prevStartDate = new Date(prevEndDate);
    prevStartDate.setDate(prevEndDate.getDate() - periodDays + 1);
    prevStartDate.setHours(0, 0, 0, 0);

    const previousPeriodData = filterDataByDateRange(data, prevStartDate, prevEndDate);
    const previousKpis = calculateKpisForPeriod(previousPeriodData);
    const previousValue = previousKpis[kpiName] as number;

    // If there's no data for the previous period, indicate that no comparison can be made.
    if (previousPeriodData.length === 0) {
      return {
        value: currentValue,
        period: periodDescription,
        comparisonPeriod: 'No previous period',
      };
    }

    let change = 0;
    let isGood = false;

    if (previousValue !== 0) {
      change = ((currentValue - previousValue) / previousValue) * 100;
      isGood = isHigherBetter ? change >= 0 : change <= 0;
    } else if (currentValue > 0) {
      change = 100; // If previous was 0 and current is > 0, it's a 100% increase
      isGood = isHigherBetter;
    } else {
      change = 0;
      isGood = true; // No change, consider it neutral/good
    }

    return {
      value: currentValue,
      period: periodDescription,
      change: parseFloat(change.toFixed(2)),
      isGood: isGood,
      comparisonPeriod: `vs. previous ${periodDays} days`,
    };
  };

  return {
    totalRevenue: [
      calculateKpiWithComparison(allData, 30, 'totalRevenue', true, 'Last 30 Days'),
      calculateKpiWithComparison(allData, 365, 'totalRevenue', true, 'Last 365 Days'),
    ],
    averageOrderValue: [
      calculateKpiWithComparison(allData, 30, 'averageOrderValue', true, 'Last 30 Days'),
    ],
    totalOrders: [
      calculateKpiWithComparison(allData, 30, 'totalOrders', true, 'Last 30 Days'),
    ],
    averageItemsPerOrder: [
      calculateKpiWithComparison(allData, 30, 'averageItemsPerOrder', true, 'Last 30 Days'),
    ],
    repeatCustomerRate: [
      calculateKpiWithComparison(allData, 90, 'repeatCustomerRate', true, 'Last 90 Days'),
    ],
    promoCodeUsageRate: [
      calculateKpiWithComparison(allData, 30, 'promoCodeUsageRate', true, 'Last 30 Days'),
    ],
  };
}

/**
 * Prepares sales data for a "Sales Over Time" chart.
 * Aggregates total sales by date.
 * @param data An array of SalesDataRow.
 * @param days Optional. The number of past days to include in the data. If not provided, all data is used.
 * @returns An object with labels (dates) and values (total sales for that date).
 */
export function prepareSalesOverTimeData(data: SalesDataRow[], days?: number, grain: 'day' | 'week' = 'day'): { labels: string[]; values: number[] } {
  if (!data || data.length === 0) {
    return { labels: [], values: [] };
  }

  const salesByDate: { [date: string]: number } = {};
  data.forEach(row => {
    const date = new Date(row.orderDate).toISOString().split('T')[0]; // Get YYYY-MM-DD
    salesByDate[date] = (salesByDate[date] || 0) + row.totalSales;
  });

  let allDates: string[] = [];
  let aggregatedSales: { [key: string]: number } = {};

  const getWeekStart = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust to Monday
    d.setDate(diff);
    d.setHours(0, 0, 0, 0);
    return d.toISOString().split('T')[0];
  };

  if (days !== undefined) {
    const latestDate = data.reduce((maxDate, row) => {
      const orderDate = new Date(row.orderDate);
      return orderDate > maxDate ? orderDate : maxDate;
    }, new Date(0));

    const startDate = new Date(latestDate);
    startDate.setDate(latestDate.getDate() - (days - 1));

    for (let d = new Date(startDate); d <= latestDate; d.setDate(d.getDate() + 1)) {
      const dateString = d.toISOString().split('T')[0];
      allDates.push(dateString);
    }
  } else {
    allDates = Array.from(new Set(data.map(row => new Date(row.orderDate).toISOString().split('T')[0]))).sort();
  }

  if (grain === 'week') {
    const uniqueWeeks = new Set<string>();
    allDates.forEach(dateString => {
      const weekStart = getWeekStart(new Date(dateString));
      uniqueWeeks.add(weekStart);
    });
    allDates = Array.from(uniqueWeeks).sort();

    Object.entries(salesByDate).forEach(([dateString, sales]) => {
      const weekStart = getWeekStart(new Date(dateString));
      aggregatedSales[weekStart] = (aggregatedSales[weekStart] || 0) + sales;
    });
  } else {
    aggregatedSales = salesByDate;
  }

  const values = allDates.map(date => aggregatedSales[date] || 0);

  return { labels: allDates, values };
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
 * @param days Optional. The number of past days to include in the data. If not provided, all data is used.
 * @returns An object with labels (dates) and two sets of values (new customer sales, returning customer sales).
 */
export function prepareCustomerTypeData(data: SalesDataRow[], days?: number, grain: 'day' | 'week' = 'day'): { labels: string[]; newCustomerSales: number[]; returningCustomerSales: number[] } {
  if (!data || data.length === 0) {
    return { labels: [], newCustomerSales: [], returningCustomerSales: [] };
  }

  const salesByDateNew: { [date: string]: number } = {};
  const salesByDateReturning: { [date: string]: number } = {};
  const customerFirstOrderDate: { [customerName: string]: string } = {};

  const getWeekStart = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust to Monday
    d.setDate(diff);
    d.setHours(0, 0, 0, 0);
    return d.toISOString().split('T')[0];
  };

  // Determine first order date for each customer from the entire dataset
  data.sort((a, b) => new Date(a.orderDate).getTime() - new Date(b.orderDate).getTime());
  data.forEach(row => {
    if (row.customerName) {
      const date = new Date(row.orderDate).toISOString().split('T')[0];
      if (!customerFirstOrderDate[row.customerName]) {
        customerFirstOrderDate[row.customerName] = date;
      }
    }
  });

  // Aggregate sales by customer type and date for all data
  data.forEach(row => {
    const date = new Date(row.orderDate).toISOString().split('T')[0];
    if (row.customerName && customerFirstOrderDate[row.customerName] === date) {
      salesByDateNew[date] = (salesByDateNew[date] || 0) + row.totalSales;
    } else {
      salesByDateReturning[date] = (salesByDateReturning[date] || 0) + row.totalSales;
    }
  });

  let allDates: string[] = [];
  if (days !== undefined) {
    const latestDate = data.reduce((maxDate, row) => {
      const orderDate = new Date(row.orderDate);
      return orderDate > maxDate ? orderDate : maxDate;
    }, new Date(0));

    const startDate = new Date(latestDate);
    startDate.setDate(latestDate.getDate() - (days - 1));

    for (let d = new Date(startDate); d <= latestDate; d.setDate(d.getDate() + 1)) {
      allDates.push(d.toISOString().split('T')[0]);
    }
  } else {
    allDates = Array.from(new Set([...Object.keys(salesByDateNew), ...Object.keys(salesByDateReturning)])).sort();
  }

  let aggregatedNewCustomerSales: { [key: string]: number } = {};
  let aggregatedReturningCustomerSales: { [key: string]: number } = {};

  if (grain === 'week') {
    const uniqueWeeks = new Set<string>();
    allDates.forEach(dateString => {
      const weekStart = getWeekStart(new Date(dateString));
      uniqueWeeks.add(weekStart);
    });
    allDates = Array.from(uniqueWeeks).sort();

    Object.entries(salesByDateNew).forEach(([dateString, sales]) => {
      const weekStart = getWeekStart(new Date(dateString));
      aggregatedNewCustomerSales[weekStart] = (aggregatedNewCustomerSales[weekStart] || 0) + sales;
    });

    Object.entries(salesByDateReturning).forEach(([dateString, sales]) => {
      const weekStart = getWeekStart(new Date(dateString));
      aggregatedReturningCustomerSales[weekStart] = (aggregatedReturningCustomerSales[weekStart] || 0) + sales;
    });
  } else {
    aggregatedNewCustomerSales = salesByDateNew;
    aggregatedReturningCustomerSales = salesByDateReturning;
  }

  const newCustomerSales = allDates.map(date => aggregatedNewCustomerSales[date] || 0);
  const returningCustomerSales = allDates.map(date => aggregatedReturningCustomerSales[date] || 0);

  return { labels: allDates, newCustomerSales, returningCustomerSales };
}
