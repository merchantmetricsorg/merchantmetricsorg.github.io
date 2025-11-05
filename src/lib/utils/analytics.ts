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

export interface ProductInsight {
  productName: string;
  insight: string;
  type: 'positive' | 'negative' | 'neutral';
}

export interface Anomaly {
  date: string;
  value: number;
  type: 'spike' | 'drop';
  message: string;
}

/**
 * Calculates the simple moving average for a given array of numbers.
 * @param data The array of numbers to calculate the moving average for.
 * @param windowSize The size of the moving average window.
 * @returns An array containing the moving average values.
 */
function calculateMovingAverage(data: number[], windowSize: number): (number | null)[] {
  if (windowSize <= 0) {
    throw new Error("Window size must be a positive integer.");
  }
  if (windowSize > data.length) {
    // If windowSize is larger than data length, return an array of nulls
    return new Array(data.length).fill(null);
  }

  const movingAverages: (number | null)[] = [];
  for (let i = 0; i < data.length; i++) {
    if (i < windowSize - 1) {
      movingAverages.push(null); // Not enough data points to calculate moving average
    } else {
      const window = data.slice(i - windowSize + 1, i + 1);
      const sum = window.reduce((acc, val) => acc + val, 0);
      movingAverages.push(sum / windowSize);
    }
  }
  return movingAverages;
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

  const totalRevenue = data.reduce((sum, row) => sum + (row.lineItemPrice || 0), 0); // Sum lineItemPrice for total revenue
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
 * @returns An object with labels (dates), values (total sales for that date), and movingAverage (7-period moving average).
 */
export function prepareSalesOverTimeData(data: SalesDataRow[], days?: number, grain: 'day' | 'week' | 'month' = 'day'): { labels: string[]; values: number[]; movingAverage: (number | null)[] } {
  if (!data || data.length === 0) {
    return { labels: [], values: [], movingAverage: [] };
  }

    const salesByDate: { [date: string]: number } = {};
    data.forEach(row => {
      const date = new Date(row.orderDate).toISOString().split('T')[0]; // Get YYYY-MM-DD
      salesByDate[date] = (salesByDate[date] || 0) + (row.lineItemPrice || 0); // Sum lineItemPrice for sales over time
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

  const getMonthStart = (date: Date) => {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), 1));
    return d.toISOString().split('T')[0]; // YYYY-MM-DD in UTC
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
    // For 'All Time' data, generate a continuous range of dates from the earliest to the latest order date
    const allOrderDates = data.map(row => new Date(row.orderDate));
    const minDate = new Date(Math.min(...allOrderDates.map(date => date.getTime())));
    const maxDate = new Date(Math.max(...allOrderDates.map(date => date.getTime())));

    minDate.setHours(0, 0, 0, 0);
    maxDate.setHours(0, 0, 0, 0);

    for (let d = new Date(minDate); d <= maxDate; d.setDate(d.getDate() + 1)) {
      allDates.push(d.toISOString().split('T')[0]);
    }
  }

  if (grain === 'month') {
    // For 'All Time' monthly aggregation, generate month starts directly
    if (days === undefined) {
      const allOrderDates = data.map(row => new Date(row.orderDate));
      const minDate = new Date(Math.min(...allOrderDates.map(date => date.getTime())));
      const maxDate = new Date(Math.max(...allOrderDates.map(date => date.getTime())));

      const uniqueMonths = new Set<string>();
      for (let d = new Date(minDate.getFullYear(), minDate.getMonth(), 1); d <= maxDate; d.setMonth(d.getMonth() + 1)) {
        uniqueMonths.add(getMonthStart(d));
      }
      allDates = Array.from(uniqueMonths).sort();
    } else {
      const uniqueMonths = new Set<string>();
      allDates.forEach(dateString => {
        const monthStart = getMonthStart(new Date(dateString));
        uniqueMonths.add(monthStart);
      });
      allDates = Array.from(uniqueMonths).sort();
    }

    Object.entries(salesByDate).forEach(([dateString, sales]) => {
      const monthStart = getMonthStart(new Date(dateString));
      aggregatedSales[monthStart] = (aggregatedSales[monthStart] || 0) + sales;
    });
  } else if (grain === 'week') {
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
  const movingAverage = calculateMovingAverage(values, grain === 'month' ? 3 : 7); // 3-month moving average for month, 7-period for others

  return { labels: allDates, values, movingAverage };
}

/**
 * Generates product performance insights based on sales trends.
 * Compares current period sales to a previous period for each product.
 * @param data An array of SalesDataRow.
 * @param periodDays The number of days for the current and comparison periods.
 * @returns An array of ProductInsight objects.
 */
export function generateProductPerformanceInsights(data: SalesDataRow[], periodDays: number = 30): ProductInsight[] {
  if (!data || data.length === 0) {
    return [];
  }

  const today = new Date();
  today.setHours(23, 59, 59, 999);

  const currentPeriodEndDate = new Date(today);
  const currentPeriodStartDate = new Date(today);
  currentPeriodStartDate.setDate(today.getDate() - periodDays + 1);
  currentPeriodStartDate.setHours(0, 0, 0, 0);

  const prevPeriodEndDate = new Date(currentPeriodStartDate);
  prevPeriodEndDate.setDate(currentPeriodStartDate.getDate() - 1);
  prevPeriodEndDate.setHours(23, 59, 59, 999);

  const prevPeriodStartDate = new Date(prevPeriodEndDate);
  prevPeriodStartDate.setDate(prevPeriodEndDate.getDate() - periodDays + 1);
  prevPeriodStartDate.setHours(0, 0, 0, 0);

  const currentPeriodData = filterDataByDateRange(data, currentPeriodStartDate, currentPeriodEndDate);
  const previousPeriodData = filterDataByDateRange(data, prevPeriodStartDate, prevPeriodEndDate);

  const getProductSales = (salesData: SalesDataRow[]) => {
    const productSales: { [productName: string]: number } = {};
    salesData.forEach(row => {
      if (row.productName && row.productQuantity !== undefined) {
        productSales[row.productName] = (productSales[row.productName] || 0) + row.productQuantity;
      }
    });
    return productSales;
  };

  const currentProductSales = getProductSales(currentPeriodData);
  const previousProductSales = getProductSales(previousPeriodData);

  const insights: ProductInsight[] = [];
  const allProductNames = new Set([...Object.keys(currentProductSales), ...Object.keys(previousProductSales)]);

  allProductNames.forEach(productName => {
    const currentSales = currentProductSales[productName] || 0;
    const previousSales = previousProductSales[productName] || 0;

    let insightText = '';
    let type: 'positive' | 'negative' | 'neutral' = 'neutral';

    if (previousSales === 0 && currentSales > 0) {
      insightText = `"${productName}" is a new trending product with ${currentSales} units sold in the last ${periodDays} days.`;
      type = 'positive';
    } else if (currentSales === 0 && previousSales > 0) {
      insightText = `"${productName}" sales have dropped to zero in the last ${periodDays} days.`;
      type = 'negative';
    } else if (previousSales > 0) {
      const change = ((currentSales - previousSales) / previousSales) * 100;
      if (change > 10) { // More than 10% increase
        insightText = `"${productName}" sales are trending up, with a ${change.toFixed(2)}% increase in the last ${periodDays} days.`;
        type = 'positive';
      } else if (change < -10) { // More than 10% decrease
        insightText = `"${productName}" sales are trending down, with a ${Math.abs(change).toFixed(2)}% decrease in the last ${periodDays} days.`;
        type = 'negative';
      } else {
        insightText = `"${productName}" sales are stable in the last ${periodDays} days.`;
        type = 'neutral';
      }
    } else {
      insightText = `"${productName}" has no sales data for the last ${periodDays} days.`;
      type = 'neutral';
    }

    if (insightText) {
      insights.push({ productName, insight: insightText, type });
    }
  });

  return insights;
}

/**
 * Detects sales anomalies using a simple statistical method (e.g., values outside a certain number of standard deviations).
 * @param data An array of SalesDataRow.
 * @param periodDays The number of past days to consider for anomaly detection.
 * @param stdDevMultiplier Multiplier for standard deviation to define anomaly threshold.
 * @returns An array of Anomaly objects.
 */
export function detectSalesAnomalies(data: SalesDataRow[], periodDays: number = 90, stdDevMultiplier: number = 2): Anomaly[] {
  if (!data || data.length === 0) {
    return [];
  }

  const today = new Date();
  today.setHours(23, 59, 59, 999);

  const periodEndDate = new Date(today);
  const periodStartDate = new Date(today);
  periodStartDate.setDate(today.getDate() - periodDays + 1);
  periodStartDate.setHours(0, 0, 0, 0);

  const relevantData = filterDataByDateRange(data, periodStartDate, periodEndDate);

  if (relevantData.length < 2) { // Need at least 2 data points to calculate std dev
    return [];
  }

  const salesByDate: { [date: string]: number } = {};
  relevantData.forEach(row => {
    const date = new Date(row.orderDate).toISOString().split('T')[0];
    salesByDate[date] = (salesByDate[date] || 0) + (row.lineItemPrice || 0); // Sum lineItemPrice for anomaly detection
  });

  const allDates = Array.from(new Set(relevantData.map(row => new Date(row.orderDate).toISOString().split('T')[0]))).sort();
  const dailySalesValues = allDates.map(date => salesByDate[date] || 0);

  // Calculate mean
  const mean = dailySalesValues.reduce((sum, val) => sum + val, 0) / dailySalesValues.length;

  // Calculate standard deviation
  const variance = dailySalesValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / dailySalesValues.length;
  const stdDev = Math.sqrt(variance);

  const anomalies: Anomaly[] = [];
  const upperThreshold = mean + stdDevMultiplier * stdDev;
  const lowerThreshold = mean - stdDevMultiplier * stdDev;

  dailySalesValues.forEach((value, index) => {
    const date = allDates[index];
    if (value > upperThreshold) {
      anomalies.push({
        date: date,
        value: value,
        type: 'spike',
        message: `Unusual sales spike detected on ${date}: ${value.toFixed(2)}€ (>${upperThreshold.toFixed(2)}€)`,
      });
    } else if (value < lowerThreshold && value > 0) { // Only consider drops if sales are not already zero
      anomalies.push({
        date: date,
        value: value,
        type: 'drop',
        message: `Unusual sales drop detected on ${date}: ${value.toFixed(2)}€ (<${lowerThreshold.toFixed(2)}€)`,
      });
    } else if (value === 0 && mean > 0 && lowerThreshold > 0) { // Special case for complete drops to zero when there's usually sales
      anomalies.push({
        date: date,
        value: value,
        type: 'drop',
        message: `Complete sales drop detected on ${date}: 0€ (expected average ${mean.toFixed(2)}€)`,
      });
    }
  });

  return anomalies;
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
    if (row.productName && row.productQuantity !== undefined) {
      productSales[row.productName] = (productSales[row.productName] || 0) + row.productQuantity;
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
export function prepareCustomerTypeData(data: SalesDataRow[], days?: number, grain: 'day' | 'week' | 'month' = 'day'): { labels: string[]; newCustomerSales: number[]; returningCustomerSales: number[] } {
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

  const getMonthStart = (date: Date) => {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), 1));
    return d.toISOString().split('T')[0]; // YYYY-MM-DD in UTC
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
      salesByDateNew[date] = (salesByDateNew[date] || 0) + (row.lineItemPrice || 0);
    } else {
      salesByDateReturning[date] = (salesByDateReturning[date] || 0) + (row.lineItemPrice || 0);
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
    // For 'All Time' data, generate a continuous range of dates from the earliest to the latest order date
    const allOrderDates = data.map(row => new Date(row.orderDate));
    const minDate = new Date(Math.min(...allOrderDates.map(date => date.getTime())));
    const maxDate = new Date(Math.max(...allOrderDates.map(date => date.getTime())));

    minDate.setHours(0, 0, 0, 0);
    maxDate.setHours(0, 0, 0, 0);

    for (let d = new Date(minDate); d <= maxDate; d.setDate(d.getDate() + 1)) {
      allDates.push(d.toISOString().split('T')[0]);
    }
  }

  let aggregatedNewCustomerSales: { [key: string]: number } = {};
  let aggregatedReturningCustomerSales: { [key: string]: number } = {};

  if (grain === 'month') {
    // For 'All Time' monthly aggregation, generate month starts directly
    if (days === undefined) {
      const allOrderDates = data.map(row => new Date(row.orderDate));
      const minDate = new Date(Math.min(...allOrderDates.map(date => date.getTime())));
      const maxDate = new Date(Math.max(...allOrderDates.map(date => date.getTime())));

      const uniqueMonths = new Set<string>();
      for (let d = new Date(minDate.getFullYear(), minDate.getMonth(), 1); d <= maxDate; d.setMonth(d.getMonth() + 1)) {
        uniqueMonths.add(getMonthStart(d));
      }
      allDates = Array.from(uniqueMonths).sort();
    } else {
      const uniqueMonths = new Set<string>();
      allDates.forEach(dateString => {
        const monthStart = getMonthStart(new Date(dateString));
        uniqueMonths.add(monthStart);
      });
      allDates = Array.from(uniqueMonths).sort();
    }

    Object.entries(salesByDateNew).forEach(([dateString, sales]) => {
      const monthStart = getMonthStart(new Date(dateString));
      aggregatedNewCustomerSales[monthStart] = (aggregatedNewCustomerSales[monthStart] || 0) + sales;
    });

    Object.entries(salesByDateReturning).forEach(([dateString, sales]) => {
      const monthStart = getMonthStart(new Date(dateString));
      aggregatedReturningCustomerSales[monthStart] = (aggregatedReturningCustomerSales[monthStart] || 0) + sales;
    });
  } else if (grain === 'week') {
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

/**
 * Prepares data for a "Sales by Hour of Day" chart.
 * Aggregates total sales for each hour of the day.
 * @param data An array of SalesDataRow.
 * @returns An object with labels (hours 0-23) and values (total sales for that hour).
 */
export function prepareSalesByHourOfDayData(data: SalesDataRow[]): { labels: string[]; values: number[] } {
  if (!data || data.length === 0) {
    return { labels: Array.from({ length: 24 }, (_, i) => i.toString()), values: new Array(24).fill(0) };
  }

  const salesByHour: { [hour: string]: number } = {};
  for (let i = 0; i < 24; i++) {
    salesByHour[i.toString()] = 0; // Initialize all hours to 0
  }

  data.forEach(row => {
    const orderDate = new Date(row.orderDate);
    const hour = orderDate.getHours();
    salesByHour[hour.toString()] = (salesByHour[hour.toString()] || 0) + (row.lineItemPrice || 0);
  });

  const labels = Object.keys(salesByHour).sort((a, b) => parseInt(a) - parseInt(b));
  const values = labels.map(hour => salesByHour[hour]);

  return { labels, values };
}

/**
 * Prepares data for a "Sales by Day of Week" chart.
 * Aggregates total sales for each day of the week.
 * @param data An array of SalesDataRow.
 * @returns An object with labels (days of week) and values (total sales for that day).
 */
export function prepareSalesByDayOfWeekData(data: SalesDataRow[]): { labels: string[]; values: number[] } {
  if (!data || data.length === 0) {
    return { labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], values: new Array(7).fill(0) };
  }

  const salesByDay: { [day: number]: number } = {}; // 0 for Sunday, 1 for Monday, etc.
  for (let i = 0; i < 7; i++) {
    salesByDay[i] = 0; // Initialize all days to 0
  }

  data.forEach(row => {
    const orderDate = new Date(row.orderDate);
    const day = orderDate.getDay(); // 0 for Sunday, 1 for Monday, etc.
    salesByDay[day] = (salesByDay[day] || 0) + (row.lineItemPrice || 0);
  });

  const labels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const values = labels.map((_, index) => salesByDay[index]);

  return { labels, values };
}

export interface CohortRetentionData {
  cohorts: string[];
  retention: { [cohort: string]: (number | null)[] };
  months: string[];
}

/**
 * Prepares data for a "Cohort Retention" analysis.
 * Groups customers by their first purchase month and tracks their retention over subsequent months.
 * @param data An array of SalesDataRow.
 * @returns An object containing cohort labels, retention percentages, and month labels.
 */
export function prepareCohortRetentionData(data: SalesDataRow[]): CohortRetentionData {
  if (!data || data.length === 0) {
    return { cohorts: [], retention: {}, months: [] };
  }

  // 1. Determine first purchase month for each unique customer
  const customerFirstPurchaseMonth: { [customerName: string]: string } = {}; // YYYY-MM format
  const allOrderDates = data.map(row => new Date(row.orderDate));
  const minDate = new Date(Math.min(...allOrderDates.map(date => date.getTime())));
  const maxDate = new Date(Math.max(...allOrderDates.map(date => date.getTime())));

  // Sort data by order date to ensure correct first purchase month
  data.sort((a, b) => new Date(a.orderDate).getTime() - new Date(b.orderDate).getTime());

  data.forEach(row => {
    if (row.customerName) {
      const orderMonth = new Date(row.orderDate).toISOString().substring(0, 7); // YYYY-MM
      if (!customerFirstPurchaseMonth[row.customerName]) {
        customerFirstPurchaseMonth[row.customerName] = orderMonth;
      }
    }
  });

  // 2. Group customers into cohorts based on their first purchase month
  const cohorts: { [month: string]: Set<string> } = {}; // { 'YYYY-MM': Set<customerName> }
  Object.entries(customerFirstPurchaseMonth).forEach(([customerName, firstPurchaseMonth]) => {
    if (!cohorts[firstPurchaseMonth]) {
      cohorts[firstPurchaseMonth] = new Set();
    }
    cohorts[firstPurchaseMonth].add(customerName);
  });

  const sortedCohortMonths = Object.keys(cohorts).sort();

  // 3. Track customer activity in subsequent months
  const monthlyActivity: { [month: string]: { [customerName: string]: boolean } } = {}; // { 'YYYY-MM': { customerName: true } }
  data.forEach(row => {
    if (row.customerName) {
      const orderMonth = new Date(row.orderDate).toISOString().substring(0, 7);
      if (!monthlyActivity[orderMonth]) {
        monthlyActivity[orderMonth] = {};
      }
      monthlyActivity[orderMonth][row.customerName] = true;
    }
  });

  // 4. Calculate retention rates
  const retentionData: { [cohort: string]: (number | null)[] } = {};
  const allMonths: string[] = []; // All months from minDate to maxDate

  for (let d = new Date(minDate.getFullYear(), minDate.getMonth(), 1); d <= maxDate; d.setMonth(d.getMonth() + 1)) {
    allMonths.push(d.toISOString().substring(0, 7));
  }

  sortedCohortMonths.forEach(cohortMonth => {
    const cohortCustomers = cohorts[cohortMonth];
    const cohortSize = cohortCustomers.size;
    const retentionRow: (number | null)[] = [];

    allMonths.forEach(currentMonth => {
      if (currentMonth < cohortMonth) {
        retentionRow.push(null); // Before cohort started
      } else {
        const activeCustomersInMonth = monthlyActivity[currentMonth] || {};
        let retainedCount = 0;
        cohortCustomers.forEach(customerName => {
          if (activeCustomersInMonth[customerName]) {
            retainedCount++;
          }
        });
        const retentionPercentage = cohortSize > 0 ? (retainedCount / cohortSize) * 100 : 0;
        retentionRow.push(parseFloat(retentionPercentage.toFixed(2)));
      }
    });
    retentionData[cohortMonth] = retentionRow;
  });

  return {
    cohorts: sortedCohortMonths,
    retention: retentionData,
    months: allMonths,
  };
}
