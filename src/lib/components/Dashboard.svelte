<script lang="ts">
  import { salesData } from '$lib/stores/dataStore';
  import { onMount } from 'svelte';
  import { Chart } from 'chart.js/auto'; // Import Chart from 'chart.js/auto' for automatic registration
  import 'chartjs-adapter-date-fns'; // Import date adapter for Chart.js
  import {
    calculateAllKpis,
    prepareSalesOverTimeData,
    prepareTopProductsData,
    prepareOrderStatusData,
    prepareCustomerTypeData,
    generateProductPerformanceInsights,
    detectSalesAnomalies,
    type Kpi,
    type Kpis,
    type ProductInsight,
    type Anomaly
  } from '$lib/utils/analytics';

  let kpis: Kpis | null = null;
  let productInsights: ProductInsight[] = [];
  let salesAnomalies: Anomaly[] = [];

  let salesOverTimeChartAll: Chart | null = null;
  let salesOverTimeChart30Days: Chart | null = null;
  let salesOverTimeChart365Days: Chart | null = null;
  let topProductsChart: Chart | null = null;
  let orderStatusChart: Chart | null = null;
  let customerTypeChartAll: Chart | null = null;
  let customerTypeChart30Days: Chart | null = null;
  let customerTypeChart365Days: Chart | null = null;

  let salesOverTimeCanvasAll: HTMLCanvasElement;
  let salesOverTimeCanvas30Days: HTMLCanvasElement;
  let salesOverTimeCanvas365Days: HTMLCanvasElement;
  let topProductsCanvas: HTMLCanvasElement;
  let orderStatusCanvas: HTMLCanvasElement;
  let customerTypeCanvasAll: HTMLCanvasElement;
  let customerTypeCanvas30Days: HTMLCanvasElement;
  let customerTypeCanvas365Days: HTMLCanvasElement;

  // Reactive block for KPI calculation, product insights, and anomaly detection
  $: if ($salesData.parsedData) {
    kpis = calculateAllKpis($salesData.parsedData);
    productInsights = generateProductPerformanceInsights($salesData.parsedData);
    salesAnomalies = detectSalesAnomalies($salesData.parsedData);
  }

  // Function to render charts
  function updateCharts() {
    if ($salesData.parsedData && salesOverTimeCanvasAll && salesOverTimeCanvas30Days && salesOverTimeCanvas365Days && topProductsCanvas && orderStatusCanvas && customerTypeCanvasAll && customerTypeCanvas30Days && customerTypeCanvas365Days) {
      const data = $salesData.parsedData;

      // Sales Over Time Charts
      const salesOverTimeAll = prepareSalesOverTimeData(data, undefined, 'week');
      const salesOverTime30Days = prepareSalesOverTimeData(data, 30, 'day');
      const salesOverTime365Days = prepareSalesOverTimeData(data, 365, 'week');

      // Other Charts
      const topProducts = prepareTopProductsData(data);
      const orderStatus = prepareOrderStatusData(data);

      // Customer Type Charts
      const customerTypeAll = prepareCustomerTypeData(data, undefined, 'week');
      const customerType30Days = prepareCustomerTypeData(data, 30, 'day');
      const customerType365Days = prepareCustomerTypeData(data, 365, 'week');

      renderSalesOverTimeChart(salesOverTimeCanvasAll, salesOverTimeAll, 'Sales Over Time (All Time)', salesOverTimeChartAll, 'week');
      renderSalesOverTimeChart(salesOverTimeCanvas30Days, salesOverTime30Days, 'Sales Over Time (Last 30 Days)', salesOverTimeChart30Days, 'day');
      renderSalesOverTimeChart(salesOverTimeCanvas365Days, salesOverTime365Days, 'Sales Over Time (Last 365 Days)', salesOverTimeChart365Days, 'week');
      renderTopProductsChart(topProducts);
      renderOrderStatusChart(orderStatus);
      renderCustomerTypeChart(customerTypeCanvasAll, customerTypeAll, 'Sales by Customer Type (All Time)', customerTypeChartAll, 'week');
      renderCustomerTypeChart(customerTypeCanvas30Days, customerType30Days, 'Sales by Customer Type (Last 30 Days)', customerTypeChart30Days, 'day');
      renderCustomerTypeChart(customerTypeCanvas365Days, customerType365Days, 'Sales by Customer Type (Last 365 Days)', customerTypeChart365Days, 'week');
    }
  }

  // Call updateCharts on mount
  onMount(() => {
    updateCharts();
  });

  // Reactively call updateCharts when salesData changes
  $: $salesData.parsedData, updateCharts();

  function renderSalesOverTimeChart(canvas: HTMLCanvasElement, data: { labels: string[]; values: number[]; movingAverage: (number | null)[] }, title: string, chartInstance: Chart | null, unit: 'day' | 'week' = 'day') {
    if (chartInstance) {
      chartInstance.destroy();
    }
    chartInstance = new Chart(canvas, {
      type: 'line',
      data: {
        labels: data.labels,
        datasets: [
          {
            label: 'Total Sales',
            data: data.values,
            borderColor: 'rgb(75, 192, 192)',
            tension: 0.1,
            fill: false,
          },
          {
            label: '7-Period Moving Average',
            data: data.movingAverage,
            borderColor: 'rgb(255, 99, 132)',
            borderDash: [5, 5],
            tension: 0.1,
            fill: false,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            type: 'time',
            time: {
              unit: unit,
            },
            title: {
              display: true,
              text: 'Date',
            },
          },
          y: {
            title: {
              display: true,
              text: 'Revenue',
            },
          },
        },
        plugins: {
          title: {
            display: true,
            text: title,
          },
        },
      },
    });

    // Assign the new chart instance to the correct variable
    if (title.includes('All Time')) {
      salesOverTimeChartAll = chartInstance;
    } else if (title.includes('Last 30 Days')) {
      salesOverTimeChart30Days = chartInstance;
    } else if (title.includes('Last 365 Days')) {
      salesOverTimeChart365Days = chartInstance;
    }
  }

  function renderTopProductsChart(data: { labels: string[]; values: number[] }) {
    if (topProductsChart) {
      topProductsChart.destroy();
    }

    const truncateLabel = (label: string, maxLength: number = 20) => {
      if (label.length > maxLength) {
        return label.substring(0, maxLength) + '...';
      }
      return label;
    };

    const truncatedLabels = data.labels.map(label => truncateLabel(label));

    topProductsChart = new Chart(topProductsCanvas, {
      type: 'bar',
      data: {
        labels: truncatedLabels,
        datasets: [
          {
            label: 'Top Selling Products',
            data: data.values,
            backgroundColor: 'rgba(153, 102, 255, 0.6)',
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            title: {
              display: true,
              text: 'Product',
            },
          },
          y: {
            title: {
              display: true,
              text: 'Items Sold',
            },
            beginAtZero: true,
          },
        },
        plugins: {
          title: {
            display: true,
            text: 'Top Selling Products',
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                let label = context.dataset.label || '';
                if (label) {
                  label += ': ';
                }
                if (context.parsed.y !== null) {
                  label += data.labels[context.dataIndex] + ' (' + context.parsed.y + ')';
                }
                return label;
              }
            }
          }
        },
      },
    });
  }

  function renderOrderStatusChart(data: { labels: string[]; values: number[] }) {
    if (orderStatusChart) {
      orderStatusChart.destroy();
    }
    orderStatusChart = new Chart(orderStatusCanvas, {
      type: 'pie',
      data: {
        labels: data.labels,
        datasets: [
          {
            label: 'Order Status',
            data: data.values,
            backgroundColor: [
              'rgba(255, 99, 132, 0.6)',
              'rgba(54, 162, 235, 0.6)',
              'rgba(255, 206, 86, 0.6)',
              'rgba(75, 192, 192, 0.6)',
              'rgba(153, 102, 255, 0.6)',
            ],
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: 'Order Status Distribution',
          },
        },
      },
    });
  }

  function renderCustomerTypeChart(canvas: HTMLCanvasElement, data: { labels: string[]; newCustomerSales: number[]; returningCustomerSales: number[] }, title: string, chartInstance: Chart | null, unit: 'day' | 'week' = 'day') {
    if (chartInstance) {
      chartInstance.destroy();
    }
    chartInstance = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: data.labels,
        datasets: [
          {
            label: 'New Customer Sales',
            data: data.newCustomerSales,
            backgroundColor: 'rgba(255, 159, 64, 0.6)',
          },
          {
            label: 'Returning Customer Sales',
            data: data.returningCustomerSales,
            backgroundColor: 'rgba(54, 162, 235, 0.6)',
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            stacked: true,
            type: 'time',
            time: {
              unit: unit,
            },
            title: {
              display: true,
              text: 'Date',
            },
          },
          y: {
            stacked: true,
            title: {
              display: true,
              text: 'Revenue',
            },
            beginAtZero: true,
          },
        },
        plugins: {
          title: {
            display: true,
            text: title,
          },
        },
      },
    });

    // Assign the new chart instance to the correct variable
    if (title.includes('All Time')) {
      customerTypeChartAll = chartInstance;
    } else if (title.includes('Last 30 Days')) {
      customerTypeChart30Days = chartInstance;
    } else if (title.includes('Last 365 Days')) {
      customerTypeChart365Days = chartInstance;
    }
  }
</script>

<div class="dashboard">
  <h2>E-commerce Dashboard</h2>

  <div class="product-insights">
    <h3>Product Performance Insights (Last 30 Days)</h3>
    {#if productInsights.length > 0}
      <ul>
        {#each productInsights as insight}
          <li class="insight-item insight-{insight.type}">
            {insight.insight}
          </li>
        {/each}
      </ul>
    {:else}
      <p>No product insights available for the last 30 days.</p>
    {/if}
  </div>

  <div class="sales-anomalies">
    <h3>Sales Anomaly Detection (Last 90 Days)</h3>
    {#if salesAnomalies.length > 0}
      <ul>
        {#each salesAnomalies as anomaly}
          <li class="anomaly-item anomaly-{anomaly.type}">
            {anomaly.message}
          </li>
        {/each}
      </ul>
    {:else}
      <p>No significant sales anomalies detected in the last 90 days.</p>
    {/if}
  </div>

  <div class="kpi-cards">
    {#if kpis}
      {#each Object.entries(kpis) as [kpiName, kpiArray]}
        {#each kpiArray as kpi}
          <div class="kpi-card">
            <h3>{kpiName.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase())}</h3>
            <p>
              {kpi.value.toFixed(2)}
              {#if kpiName === 'totalRevenue' || kpiName === 'averageOrderValue'}€{/if}
              {#if kpiName === 'repeatCustomerRate' || kpiName === 'promoCodeUsageRate'}%{/if}
            </p>
            <span class="kpi-period">{kpi.period}</span>
            {#if kpi.change !== undefined && kpi.comparisonPeriod}
              <span class="kpi-change {kpi.isGood ? 'good' : 'bad'}">
                {#if kpi.change > 0}▲{/if}
                {#if kpi.change < 0}▼{/if}
                {Math.abs(kpi.change).toFixed(2)}% {kpi.comparisonPeriod}
              </span>
            {:else if kpi.comparisonPeriod}
              <span class="kpi-change">{kpi.comparisonPeriod}</span>
            {/if}
          </div>
        {/each}
      {/each}
    {/if}
  </div>

  <div class="charts-container">
    <div class="chart-card">
      <canvas bind:this={salesOverTimeCanvasAll}></canvas>
    </div>
    <div class="chart-card">
      <canvas bind:this={salesOverTimeCanvas30Days}></canvas>
    </div>
    <div class="chart-card">
      <canvas bind:this={salesOverTimeCanvas365Days}></canvas>
    </div>
    <div class="chart-card">
      <canvas bind:this={topProductsCanvas}></canvas>
    </div>
    <div class="chart-card">
      <canvas bind:this={orderStatusCanvas}></canvas>
    </div>
    <div class="chart-card">
      <canvas bind:this={customerTypeCanvasAll}></canvas>
    </div>
    <div class="chart-card">
      <canvas bind:this={customerTypeCanvas30Days}></canvas>
    </div>
    <div class="chart-card">
      <canvas bind:this={customerTypeCanvas365Days}></canvas>
    </div>
  </div>
</div>

<style>
  .dashboard {
    padding: 20px;
    background-color: #f8f9fa;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    margin-top: 20px;
  }

  .dashboard h2 {
    text-align: center;
    color: #343a40;
    margin-bottom: 30px;
  }

  .kpi-cards {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 20px;
    margin-bottom: 40px;
  }

  .kpi-card {
    background-color: #ffffff;
    padding: 20px;
    border-radius: 8px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
    text-align: center;
    flex: 1;
    min-width: 200px;
  }

  .kpi-card h3 {
    color: #007bff;
    margin-bottom: 10px;
    font-size: 1.2em;
  }

  .kpi-card p {
    font-size: 2em;
    font-weight: bold;
    color: #343a40;
  }

  .charts-container {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
    gap: 30px;
  }

  .chart-card {
    background-color: #ffffff;
    padding: 20px;
    border-radius: 8px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
    min-height: 400px; /* Consistent height for all charts */
    position: relative;
  }

  .chart-card h3 {
    text-align: center;
    color: #007bff;
    margin-bottom: 20px;
  }

  canvas {
    max-height: 350px; /* Adjusted max-height for consistent appearance */
    height: 100%; /* Ensure canvas fills the container */
  }

  .kpi-card p {
    font-size: 2em;
    font-weight: bold;
    color: #343a40;
    margin-bottom: 5px;
  }

  .product-insights {
    background-color: #ffffff;
    padding: 20px;
    border-radius: 8px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
    margin-bottom: 40px;
  }

  .product-insights h3 {
    text-align: center;
    color: #007bff;
    margin-bottom: 20px;
  }

  .product-insights ul {
    list-style: none;
    padding: 0;
  }

  .product-insights li {
    padding: 10px 15px;
    margin-bottom: 10px;
    border-radius: 5px;
    font-size: 0.95em;
    line-height: 1.4;
  }

  .insight-item.insight-positive {
    background-color: #d4edda;
    color: #155724;
    border: 1px solid #c3e6cb;
  }

  .insight-item.insight-negative {
    background-color: #f8d7da;
    color: #721c24;
    border: 1px solid #f5c6cb;
  }

  .insight-item.insight-neutral {
    background-color: #e2e3e5;
    color: #383d41;
    border: 1px solid #d6d8db;
  }

  .sales-anomalies {
    background-color: #ffffff;
    padding: 20px;
    border-radius: 8px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
    margin-bottom: 40px;
  }

  .sales-anomalies h3 {
    text-align: center;
    color: #007bff;
    margin-bottom: 20px;
  }

  .sales-anomalies ul {
    list-style: none;
    padding: 0;
  }

  .sales-anomalies li {
    padding: 10px 15px;
    margin-bottom: 10px;
    border-radius: 5px;
    font-size: 0.95em;
    line-height: 1.4;
  }

  .anomaly-item.anomaly-spike {
    background-color: #d4edda;
    color: #155724;
    border: 1px solid #c3e6cb;
  }

  .anomaly-item.anomaly-drop {
    background-color: #f8d7da;
    color: #721c24;
    border: 1px solid #f5c6cb;
  }

  .kpi-period {
    font-size: 0.9em;
    color: #6c757d;
    display: block;
    margin-bottom: 5px;
  }

  .kpi-change {
    font-size: 0.9em;
    font-weight: bold;
  }

  .kpi-change.good {
    color: #28a745; /* Green for positive change */
  }

  .kpi-change.bad {
    color: #dc3545; /* Red for negative change */
  }
</style>
