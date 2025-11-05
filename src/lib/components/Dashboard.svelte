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
    prepareSalesByHourOfDayData,
    prepareSalesByDayOfWeekData,
    prepareCohortRetentionData,
    generateProductPerformanceInsights,
    detectSalesAnomalies,
    type Kpi,
    type Kpis,
    type ProductInsight,
    type Anomaly,
    type CohortRetentionData
  } from '$lib/utils/analytics';

  let kpis: Kpis | null = null;
  let productInsights: ProductInsight[] = [];
  let salesAnomalies: Anomaly[] = [];
  let cohortRetentionData: CohortRetentionData | null = null;
  let showCohortRetention: boolean = false; // New state variable to control visibility

  let salesOverTimeChartAll: Chart | null = null;
  let salesOverTimeChart30Days: Chart | null = null;
  let salesOverTimeChart30DaysOverview: Chart | null = null;
  let salesOverTimeChart365Days: Chart | null = null;
  let topProductsChart: Chart | null = null;
  let orderStatusChart: Chart | null = null;
  let customerTypeChartAll: Chart | null = null;
  let customerTypeChart30Days: Chart | null = null;
  let customerTypeChart365Days: Chart | null = null;
  let salesByHourOfDayChart: Chart | null = null;
  let salesByDayOfWeekChart: Chart | null = null;

  let salesOverTimeCanvasAll: HTMLCanvasElement;
  let salesOverTimeCanvas30Days: HTMLCanvasElement;
  let salesOverTimeCanvas365Days: HTMLCanvasElement;
  let salesOverTimeCanvas30DaysOverview: HTMLCanvasElement;
  let topProductsCanvas: HTMLCanvasElement;
  let orderStatusCanvas: HTMLCanvasElement;
  let customerTypeCanvasAll: HTMLCanvasElement;
  let customerTypeCanvas30Days: HTMLCanvasElement;
  let customerTypeCanvas365Days: HTMLCanvasElement;
  let salesByHourOfDayCanvas: HTMLCanvasElement;
  let salesByDayOfWeekCanvas: HTMLCanvasElement;

  // Reactive block for KPI calculation, product insights, and anomaly detection
  $: if ($salesData.parsedData) {
    kpis = calculateAllKpis($salesData.parsedData);
    productInsights = generateProductPerformanceInsights($salesData.parsedData);
    salesAnomalies = detectSalesAnomalies($salesData.parsedData);
    // cohortRetentionData is now generated on demand
  }

  // Function to generate Cohort Retention Analysis
  function generateCohortRetentionAnalysis() {
    if ($salesData.parsedData) {
      cohortRetentionData = prepareCohortRetentionData($salesData.parsedData);
      showCohortRetention = true;
    }
  }

  // Function to render charts
  function updateCharts() {
    if ($salesData.parsedData && salesOverTimeCanvasAll && salesOverTimeCanvas30Days && salesOverTimeCanvas365Days && salesOverTimeCanvas30DaysOverview && topProductsCanvas && orderStatusCanvas && customerTypeCanvasAll && customerTypeCanvas30Days && customerTypeCanvas365Days && salesByHourOfDayCanvas && salesByDayOfWeekCanvas) {
      const data = $salesData.parsedData;

      // Sales Over Time Charts
      const salesOverTimeAll = prepareSalesOverTimeData(data, undefined, 'month');
      const salesOverTime30Days = prepareSalesOverTimeData(data, 30, 'day');
      const salesOverTime365Days = prepareSalesOverTimeData(data, 365, 'month');

      // Other Charts
      const topProducts = prepareTopProductsData(data);
      const orderStatus = prepareOrderStatusData(data);
      const salesByHour = prepareSalesByHourOfDayData(data);
      const salesByDay = prepareSalesByDayOfWeekData(data);

      // Customer Type Charts
      const customerTypeAll = prepareCustomerTypeData(data, undefined, 'month');
      const customerType30Days = prepareCustomerTypeData(data, 30, 'day');
      const customerType365Days = prepareCustomerTypeData(data, 365, 'month');

      salesOverTimeChart30DaysOverview = renderSalesOverTimeChart(salesOverTimeCanvas30DaysOverview, salesOverTime30Days, 'Sales Over Time (Last 30 Days)', salesOverTimeChart30DaysOverview, 'day'); // Render for overview
      salesOverTimeChartAll = renderSalesOverTimeChart(salesOverTimeCanvasAll, salesOverTimeAll, 'Sales Over Time (All Time)', salesOverTimeChartAll, 'month');
      salesOverTimeChart30Days = renderSalesOverTimeChart(salesOverTimeCanvas30Days, salesOverTime30Days, 'Sales Over Time (Last 30 Days)', salesOverTimeChart30Days, 'day');
      salesOverTimeChart365Days = renderSalesOverTimeChart(salesOverTimeCanvas365Days, salesOverTime365Days, 'Sales Over Time (Last 365 Days)', salesOverTimeChart365Days, 'month');
      renderTopProductsChart(topProducts);
      renderOrderStatusChart(orderStatus);
      customerTypeChartAll = renderCustomerTypeChart(customerTypeCanvasAll, customerTypeAll, 'Sales by Customer Type (All Time)', customerTypeChartAll, 'month');
      customerTypeChart30Days = renderCustomerTypeChart(customerTypeCanvas30Days, customerType30Days, 'Sales by Customer Type (Last 30 Days)', customerTypeChart30Days, 'day');
      customerTypeChart365Days = renderCustomerTypeChart(customerTypeCanvas365Days, customerType365Days, 'Sales by Customer Type (Last 365 Days)', customerTypeChart365Days, 'month');
      salesByHourOfDayChart = renderSalesByHourOfDayChart(salesByHourOfDayCanvas, salesByHour, 'Sales by Hour of Day', salesByHourOfDayChart);
      salesByDayOfWeekChart = renderSalesByDayOfWeekChart(salesByDayOfWeekCanvas, salesByDay, 'Sales by Day of Week', salesByDayOfWeekChart);
    }
  }

  // Call updateCharts on mount
  onMount(() => {
    updateCharts();
  });

  // Reactively call updateCharts when salesData changes
  $: $salesData.parsedData, updateCharts();

  function renderSalesOverTimeChart(canvas: HTMLCanvasElement, data: { labels: string[]; values: number[]; movingAverage: (number | null)[] }, title: string, chartInstance: Chart | null, unit: 'day' | 'week' | 'month' = 'day'): Chart {
    if (chartInstance) {
      chartInstance.destroy();
    }
    const newChartInstance = new Chart(canvas, {
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
            label: unit === 'month' ? '3-Month Moving Average' : '7-Period Moving Average',
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
              tooltipFormat: unit === 'month' ? 'MMM yyyy' : undefined,
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
    return newChartInstance;
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

  function renderCustomerTypeChart(canvas: HTMLCanvasElement, data: { labels: string[]; newCustomerSales: number[]; returningCustomerSales: number[] }, title: string, chartInstance: Chart | null, unit: 'day' | 'week' | 'month' = 'day'): Chart {
    if (chartInstance) {
      chartInstance.destroy();
    }
    const newChartInstance = new Chart(canvas, {
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
              tooltipFormat: unit === 'month' ? 'MMM yyyy' : undefined,
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
    return newChartInstance;
  }

  function renderSalesByHourOfDayChart(canvas: HTMLCanvasElement, data: { labels: string[]; values: number[] }, title: string, chartInstance: Chart | null): Chart {
    if (chartInstance) {
      chartInstance.destroy();
    }
    const newChartInstance = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: data.labels,
        datasets: [
          {
            label: 'Total Sales',
            data: data.values,
            backgroundColor: 'rgba(75, 192, 192, 0.6)',
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
              text: 'Hour of Day',
            },
          },
          y: {
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
    return newChartInstance;
  }

  function renderSalesByDayOfWeekChart(canvas: HTMLCanvasElement, data: { labels: string[]; values: number[] }, title: string, chartInstance: Chart | null): Chart {
    if (chartInstance) {
      chartInstance.destroy();
    }
    const newChartInstance = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: data.labels,
        datasets: [
          {
            label: 'Total Sales',
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
              text: 'Day of Week',
            },
          },
          y: {
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
    return newChartInstance;
  }
</script>

<div class="card dashboard-container">
  <h2 class="text-center text-primary">E-commerce Dashboard</h2>

  <!-- Overview Category -->
  <section class="category-section">
    <h3 class="text-center text-medium">Overview</h3>
    <div class="grid grid-cols-4 kpi-cards">
      {#if kpis}
        {#each ['totalRevenue', 'totalOrders', 'averageOrderValue'] as kpiName}
          {#if kpis[kpiName as keyof Kpis]}
            {#each kpis[kpiName as keyof Kpis].filter(k => k.period === 'Last 30 Days') as kpi}
              <div class="card kpi-card">
                <h4 class="text-secondary">{kpiName.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase())}</h4>
                <p class="text-dark">
                  {kpi.value.toFixed(2)}
                  {#if kpiName === 'totalRevenue' || kpiName === 'averageOrderValue'}€{/if}
                  {#if kpiName === 'repeatCustomerRate' || kpiName === 'promoCodeUsageRate'}%{/if}
                </p>
                <span class="kpi-period text-light">{kpi.period}</span>
                {#if kpi.change !== undefined && kpi.comparisonPeriod}
                  <span class="kpi-change {kpi.isGood ? 'text-accent' : 'text-danger'}">
                    {#if kpi.change > 0}▲{/if}
                    {#if kpi.change < 0}▼{/if}
                    {Math.abs(kpi.change).toFixed(2)}% {kpi.comparisonPeriod}
                  </span>
                {:else if kpi.comparisonPeriod}
                  <span class="kpi-change text-light">{kpi.comparisonPeriod}</span>
                {/if}
              </div>
            {/each}
          {/if}
        {/each}
        {#if kpis.repeatCustomerRate}
          {#each kpis.repeatCustomerRate.filter(k => k.period === 'Last 90 Days') as kpi}
            <div class="card kpi-card">
              <h4 class="text-secondary">Repeat Customer Rate</h4>
              <p class="text-dark">{kpi.value.toFixed(2)}%</p>
              <span class="kpi-period text-light">{kpi.period}</span>
              {#if kpi.change !== undefined && kpi.comparisonPeriod}
                <span class="kpi-change {kpi.isGood ? 'text-accent' : 'text-danger'}">
                  {#if kpi.change > 0}▲{/if}
                  {#if kpi.change < 0}▼{/if}
                  {Math.abs(kpi.change).toFixed(2)}% {kpi.comparisonPeriod}
                </span>
              {:else if kpi.comparisonPeriod}
                <span class="kpi-change text-light">{kpi.comparisonPeriod}</span>
              {/if}
            </div>
          {/each}
        {/if}
      {/if}
    </div>
    <div class="grid grid-cols-2 charts-container">
      <div class="card chart-card">
        <canvas bind:this={salesOverTimeCanvas30DaysOverview}></canvas>
      </div>
    </div>
  </section>

  <!-- Sales Category -->
  <section class="category-section">
    <h3 class="text-center text-medium">Sales</h3>
    <div class="grid grid-cols-4 kpi-cards">
      {#if kpis}
        {#each ['totalRevenue', 'averageOrderValue', 'totalOrders', 'promoCodeUsageRate'] as kpiName}
          {#if kpis[kpiName as keyof Kpis]}
            {#each kpis[kpiName as keyof Kpis] as kpi}
              <div class="card kpi-card">
                <h4 class="text-secondary">{kpiName.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase())}</h4>
                <p class="text-dark">
                  {kpi.value.toFixed(2)}
                  {#if kpiName === 'totalRevenue' || kpiName === 'averageOrderValue'}€{/if}
                  {#if kpiName === 'repeatCustomerRate' || kpiName === 'promoCodeUsageRate'}%{/if}
                </p>
                <span class="kpi-period text-light">{kpi.period}</span>
                {#if kpi.change !== undefined && kpi.comparisonPeriod}
                  <span class="kpi-change {kpi.isGood ? 'text-accent' : 'text-danger'}">
                    {#if kpi.change > 0}▲{/if}
                    {#if kpi.change < 0}▼{/if}
                    {Math.abs(kpi.change).toFixed(2)}% {kpi.comparisonPeriod}
                  </span>
                {:else if kpi.comparisonPeriod}
                  <span class="kpi-change text-light">{kpi.comparisonPeriod}</span>
                {/if}
              </div>
            {/each}
          {/if}
        {/each}
      {/if}
    </div>
    <div class="grid grid-cols-2 charts-container">
      <div class="card chart-card">
        <canvas bind:this={salesOverTimeCanvasAll}></canvas>
      </div>
      <div class="card chart-card">
        <canvas bind:this={salesOverTimeCanvas30Days}></canvas>
      </div>
      <div class="card chart-card">
        <canvas bind:this={salesOverTimeCanvas365Days}></canvas>
      </div>
      <div class="card chart-card">
        <canvas bind:this={orderStatusCanvas}></canvas>
      </div>
    </div>
  </section>

  <!-- Customers Category -->
  <section class="category-section">
    <h3 class="text-center text-medium">Customers</h3>
    <div class="grid grid-cols-4 kpi-cards">
      {#if kpis && kpis.repeatCustomerRate}
        {#each kpis.repeatCustomerRate as kpi}
          <div class="card kpi-card">
            <h4 class="text-secondary">Repeat Customer Rate</h4>
            <p class="text-dark">{kpi.value.toFixed(2)}%</p>
            <span class="kpi-period text-light">{kpi.period}</span>
            {#if kpi.change !== undefined && kpi.comparisonPeriod}
              <span class="kpi-change {kpi.isGood ? 'text-accent' : 'text-danger'}">
                {#if kpi.change > 0}▲{/if}
                {#if kpi.change < 0}▼{/if}
                {Math.abs(kpi.change).toFixed(2)}% {kpi.comparisonPeriod}
              </span>
            {:else if kpi.comparisonPeriod}
              <span class="kpi-change text-light">{kpi.comparisonPeriod}</span>
            {/if}
          </div>
        {/each}
      {/if}
    </div>
    <div class="grid grid-cols-2 charts-container">
      <div class="card chart-card">
        <canvas bind:this={customerTypeCanvasAll}></canvas>
      </div>
      <div class="card chart-card">
        <canvas bind:this={customerTypeCanvas30Days}></canvas>
      </div>
      <div class="card chart-card">
        <canvas bind:this={customerTypeCanvas365Days}></canvas>
      </div>
    </div>
  </section>

  <!-- Products Category -->
  <section class="category-section">
    <h3 class="text-center text-medium">Products</h3>
    <div class="grid grid-cols-4 kpi-cards">
      {#if kpis && kpis.averageItemsPerOrder}
        {#each kpis.averageItemsPerOrder as kpi}
          <div class="card kpi-card">
            <h4 class="text-secondary">Average Items Per Order</h4>
            <p class="text-dark">{kpi.value.toFixed(2)}</p>
            <span class="kpi-period text-light">{kpi.period}</span>
            {#if kpi.change !== undefined && kpi.comparisonPeriod}
              <span class="kpi-change {kpi.isGood ? 'text-accent' : 'text-danger'}">
                {#if kpi.change > 0}▲{/if}
                {#if kpi.change < 0}▼{/if}
                {Math.abs(kpi.change).toFixed(2)}% {kpi.comparisonPeriod}
              </span>
            {:else if kpi.comparisonPeriod}
              <span class="kpi-change text-light">{kpi.comparisonPeriod}</span>
            {/if}
          </div>
        {/each}
      {/if}
    </div>
    <div class="grid grid-cols-2 charts-container">
      <div class="card chart-card">
        <canvas bind:this={topProductsCanvas}></canvas>
      </div>
    </div>
    <div class="card product-insights">
      <h4 class="text-center text-medium">Product Performance Insights (Last 30 Days)</h4>
      {#if productInsights.length > 0}
        <ul>
          {#each productInsights as insight}
            <li class="alert {insight.type === 'positive' ? 'alert-success' : insight.type === 'negative' ? 'alert-danger' : ''}">
              {insight.insight}
            </li>
          {/each}
        </ul>
      {:else}
        <p class="text-center text-light">No product insights available for the last 30 days.</p>
      {/if}
    </div>
    <div class="card sales-anomalies">
      <h4 class="text-center text-medium">Sales Anomaly Detection (Last 90 Days)</h4>
      {#if salesAnomalies.length > 0}
        <ul>
          {#each salesAnomalies as anomaly}
            <li class="alert {anomaly.type === 'spike' ? 'alert-success' : anomaly.type === 'drop' ? 'alert-danger' : ''}">
              {anomaly.message}
            </li>
          {/each}
        </ul>
      {:else}
        <p class="text-center text-light">No significant sales anomalies detected in the last 90 days.</p>
      {/if}
    </div>
  </section>

  <!-- Analytics Category -->
  <section class="category-section">
    <h3 class="text-center text-medium">Analytics</h3>
    <div class="grid grid-cols-2 charts-container">
      <div class="card chart-card">
        <canvas bind:this={salesByHourOfDayCanvas}></canvas>
      </div>
      <div class="card chart-card">
        <canvas bind:this={salesByDayOfWeekCanvas}></canvas>
      </div>
    </div>
    <div class="card cohort-retention">
      <h4 class="text-center text-medium">Cohort Retention Analysis</h4>
      {#if !showCohortRetention}
        <button on:click={generateCohortRetentionAnalysis} class="btn btn-primary">Generate Cohort Retention Analysis</button>
      {:else if cohortRetentionData && cohortRetentionData.cohorts.length > 0}
        <div class="retention-table-container">
          <table class="retention-table">
            <thead>
              <tr>
                <th>Cohort</th>
                {#each cohortRetentionData.months as month}
                  <th>{month}</th>
                {/each}
              </tr>
            </thead>
            <tbody>
              {#each cohortRetentionData.cohorts as cohort}
                <tr>
                  <td>{cohort}</td>
                  {#each cohortRetentionData.retention[cohort] as retentionValue}
                    <td class={retentionValue !== null ? (retentionValue > 0 ? 'retained' : 'not-retained') : ''}>
                      {#if retentionValue !== null}
                        {retentionValue.toFixed(0)}%
                      {:else}
                        -
                      {/if}
                    </td>
                  {/each}
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      {:else}
        <p class="text-center text-light">No cohort retention data available.</p>
      {/if}
    </div>
  </section>
</div>

<style>
  /* Scoped styles for Dashboard.svelte */
  .dashboard-container {
    padding: var(--spacing-lg);
    margin-top: var(--spacing-lg);
  }

  .category-section {
    margin-bottom: var(--spacing-xl);
    padding: var(--spacing-lg);
    background-color: var(--color-background-light);
    border-radius: var(--border-radius-md);
    box-shadow: var(--shadow-md);
  }

  .kpi-cards {
    margin-bottom: var(--spacing-lg);
  }

  .kpi-card {
    padding: var(--spacing-md);
  }

  .kpi-card h4 {
    margin-bottom: var(--spacing-xxs);
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
  }

  .kpi-card p {
    font-size: var(--font-size-xl);
    font-weight: var(--font-weight-bold);
    margin-bottom: var(--spacing-xxs);
  }

  .kpi-period {
    font-size: var(--font-size-sm);
    display: block;
    margin-bottom: var(--spacing-xxs);
  }

  .kpi-change {
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-semibold);
  }

  .charts-container {
    margin-top: var(--spacing-lg);
  }

  .chart-card {
    padding: var(--spacing-md);
    min-height: 350px;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }

  canvas {
    max-height: 300px;
    width: 100% !important;
    height: 100% !important;
  }

  .product-insights,
  .sales-anomalies,
  .cohort-retention {
    margin-top: var(--spacing-lg);
    padding: var(--spacing-md);
  }

  .product-insights h4,
  .sales-anomalies h4,
  .cohort-retention h4 {
    margin-bottom: var(--spacing-md);
    font-size: var(--font-size-lg);
  }

  .product-insights ul,
  .sales-anomalies ul {
    list-style: none;
    padding: 0;
  }

  .product-insights li,
  .sales-anomalies li {
    margin-bottom: var(--spacing-xs);
    font-size: var(--font-size-sm);
    line-height: 1.4;
  }

  .retention-table-container {
    overflow-x: auto;
    margin-top: var(--spacing-md);
  }

  .retention-table {
    width: 100%;
    border-collapse: collapse;
    font-size: var(--font-size-sm);
    min-width: 600px;
  }

  .retention-table th,
  .retention-table td {
    border: 1px solid var(--color-border);
    padding: var(--spacing-xs) var(--spacing-sm);
    text-align: center;
  }

  .retention-table thead th {
    background-color: var(--color-background-medium);
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-medium);
  }

  .retention-table tbody td {
    background-color: var(--color-surface);
  }

  .retention-table tbody tr:nth-child(even) td {
    background-color: var(--color-background-light);
  }

  .retention-table td.retained {
    background-color: #e6ffed; /* Light green for retained */
    color: var(--color-accent);
  }

  .retention-table td.not-retained {
    background-color: #ffebeb; /* Light red for not retained (if 0%) */
    color: var(--color-danger);
  }
</style>
