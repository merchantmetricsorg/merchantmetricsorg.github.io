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

<div class="dashboard">
  <h2>E-commerce Dashboard</h2>

  <!-- Overview Category -->
  <section class="category-section">
    <h3>Overview</h3>
    <div class="kpi-cards">
      {#if kpis}
        {#each ['totalRevenue', 'totalOrders', 'averageOrderValue'] as kpiName}
          {#if kpis[kpiName as keyof Kpis]}
            {#each kpis[kpiName as keyof Kpis].filter(k => k.period === 'Last 30 Days') as kpi}
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
          {/if}
        {/each}
        {#if kpis.repeatCustomerRate}
          {#each kpis.repeatCustomerRate.filter(k => k.period === 'Last 90 Days') as kpi}
            <div class="kpi-card">
              <h3>Repeat Customer Rate</h3>
              <p>{kpi.value.toFixed(2)}%</p>
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
        {/if}
      {/if}
    </div>
    <div class="charts-container">
      <div class="chart-card">
        <canvas bind:this={salesOverTimeCanvas30DaysOverview}></canvas>
      </div>
    </div>
  </section>

  <!-- Sales Category -->
  <section class="category-section">
    <h3>Sales</h3>
    <div class="kpi-cards">
      {#if kpis}
        {#each ['totalRevenue', 'averageOrderValue', 'totalOrders', 'promoCodeUsageRate'] as kpiName}
          {#if kpis[kpiName as keyof Kpis]}
            {#each kpis[kpiName as keyof Kpis] as kpi}
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
          {/if}
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
        <canvas bind:this={orderStatusCanvas}></canvas>
      </div>
    </div>
  </section>

  <!-- Customers Category -->
  <section class="category-section">
    <h3>Customers</h3>
    <div class="kpi-cards">
      {#if kpis && kpis.repeatCustomerRate}
        {#each kpis.repeatCustomerRate as kpi}
          <div class="kpi-card">
            <h3>Repeat Customer Rate</h3>
            <p>{kpi.value.toFixed(2)}%</p>
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
      {/if}
    </div>
    <div class="charts-container">
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
  </section>

  <!-- Products Category -->
  <section class="category-section">
    <h3>Products</h3>
    <div class="kpi-cards">
      {#if kpis && kpis.averageItemsPerOrder}
        {#each kpis.averageItemsPerOrder as kpi}
          <div class="kpi-card">
            <h3>Average Items Per Order</h3>
            <p>{kpi.value.toFixed(2)}</p>
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
      {/if}
    </div>
    <div class="charts-container">
      <div class="chart-card">
        <canvas bind:this={topProductsCanvas}></canvas>
      </div>
    </div>
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
  </section>

  <!-- Analytics Category -->
  <section class="category-section">
    <h3>Analytics</h3>
    <div class="charts-container">
      <div class="chart-card">
        <canvas bind:this={salesByHourOfDayCanvas}></canvas>
      </div>
      <div class="chart-card">
        <canvas bind:this={salesByDayOfWeekCanvas}></canvas>
      </div>
    </div>
    <div class="cohort-retention">
      <h3>Cohort Retention Analysis</h3>
      {#if !showCohortRetention}
        <button on:click={generateCohortRetentionAnalysis} class="generate-button">Generate Cohort Retention Analysis</button>
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
        <p>No cohort retention data available.</p>
      {/if}
    </div>
  </section>
</div>

<style>
  .generate-button {
    display: block;
    margin: 20px auto;
    padding: 10px 20px;
    background-color: #007bff;
    color: white;
    border: none;
    border-radius: 5px;
    font-size: 1em;
    cursor: pointer;
    transition: background-color 0.3s ease;
  }

  .generate-button:hover {
    background-color: #0056b3;
  }
  .dashboard {
    padding: 15px; /* Reduced padding */
    background-color: #ffffff; /* Lighter background */
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    margin-top: 20px;
  }

  .dashboard h2 {
    text-align: center;
    color: #2c3e50; /* Darker, professional color */
    margin-bottom: 25px;
    font-size: 2em;
    font-weight: 600;
  }

  .category-section {
    background-color: #ffffff;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    padding: 20px;
    margin-bottom: 30px;
  }

  .category-section h3 {
    text-align: center;
    color: #007bff;
    margin-bottom: 20px;
    font-size: 1.8em;
    font-weight: 500;
  }

  .kpi-cards {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); /* Slightly smaller min-width */
    gap: 15px; /* Reduced gap */
    margin-bottom: 30px; /* Reduced margin */
  }

  .kpi-card {
    background-color: #fdfdfd; /* Slightly off-white */
    padding: 15px; /* Reduced padding */
    border-radius: 8px;
    border: 1px solid #e9ecef; /* Subtle border */
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
    text-align: center;
    flex: 1;
    min-width: 180px;
  }

  .kpi-card h3 {
    color: #34495e; /* Professional blue-grey */
    margin-bottom: 8px;
    font-size: 1.1em;
  }

  .kpi-card p {
    font-size: 1.8em; /* Slightly smaller font */
    font-weight: bold;
    color: #2c3e50; /* Darker color */
    margin-bottom: 5px;
  }

  .charts-container {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(350px, 1fr)); /* Adjusted min-width */
    gap: 20px; /* Reduced gap */
  }

  .chart-card {
    background-color: #fdfdfd; /* Slightly off-white */
    padding: 15px; /* Reduced padding */
    border-radius: 8px;
    border: 1px solid #e9ecef; /* Subtle border */
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
    min-height: 380px; /* Slightly reduced height */
    position: relative;
  }

  .chart-card h3 {
    text-align: center;
    color: #007bff;
    margin-bottom: 20px;
  }

  canvas {
    max-height: 330px; /* Adjusted max-height */
    height: 100%; /* Ensure canvas fills the container */
  }

  .kpi-card p {
    font-size: 2em;
    font-weight: bold;
    color: #343a40;
    margin-bottom: 5px;
  }

  .product-insights {
    background-color: #fdfdfd;
    padding: 15px;
    border-radius: 8px;
    border: 1px solid #e9ecef;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
    margin-bottom: 30px;
  }

  .product-insights h3 {
    text-align: center;
    color: #34495e;
    margin-bottom: 15px;
    font-size: 1.2em;
  }

  .product-insights ul {
    list-style: none;
    padding: 0;
  }

  .product-insights li {
    padding: 8px 12px;
    margin-bottom: 8px;
    border-radius: 4px;
    font-size: 0.9em;
    line-height: 1.3;
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
    background-color: #fdfdfd;
    padding: 15px;
    border-radius: 8px;
    border: 1px solid #e9ecef;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
    margin-bottom: 30px;
  }

  .sales-anomalies h3 {
    text-align: center;
    color: #34495e;
    margin-bottom: 15px;
    font-size: 1.2em;
  }

  .sales-anomalies ul {
    list-style: none;
    padding: 0;
  }

  .sales-anomalies li {
    padding: 8px 12px;
    margin-bottom: 8px;
    border-radius: 4px;
    font-size: 0.9em;
    line-height: 1.3;
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

  .cohort-retention {
    background-color: #fdfdfd;
    padding: 15px;
    border-radius: 8px;
    border: 1px solid #e9ecef;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
    margin-top: 20px;
  }

  .cohort-retention h3 {
    text-align: center;
    color: #34495e;
    margin-bottom: 15px;
    font-size: 1.2em;
  }

  .retention-table-container {
    overflow-x: auto;
    margin-top: 15px;
  }

  .retention-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.9em;
    min-width: 600px; /* Ensure table is wide enough for content */
  }

  .retention-table th,
  .retention-table td {
    border: 1px solid #e9ecef;
    padding: 8px 12px;
    text-align: center;
  }

  .retention-table thead th {
    background-color: #f1f3f5;
    font-weight: bold;
    color: #495057;
  }

  .retention-table tbody td {
    background-color: #ffffff;
  }

  .retention-table tbody tr:nth-child(even) td {
    background-color: #f8f9fa;
  }

  .retention-table td.retained {
    background-color: #e6ffed; /* Light green for retained */
    color: #155724;
  }

  .retention-table td.not-retained {
    background-color: #ffebeb; /* Light red for not retained (if 0%) */
    color: #721c24;
  }
</style>
