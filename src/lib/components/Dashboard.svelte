<script lang="ts">
  import { salesData } from '$lib/stores/dataStore';
  import { onMount } from 'svelte';
  import { Chart } from 'chart.js/auto'; // Import Chart from 'chart.js/auto' for automatic registration
  import 'chartjs-adapter-date-fns'; // Import date adapter for Chart.js
  import { calculateKpis, prepareSalesOverTimeData, prepareTopProductsData } from '$lib/utils/analytics';

  let totalRevenue: number = 0;
  let averageOrderValue: number = 0;
  let totalOrders: number = 0;
  let salesOverTimeChart: Chart | null = null;
  let topProductsChart: Chart | null = null;

  let salesOverTimeCanvas: HTMLCanvasElement;
  let topProductsCanvas: HTMLCanvasElement;

  // Reactive block for KPI calculation
  $: if ($salesData.parsedData) {
    const data = $salesData.parsedData;

    // Calculate KPIs
    const kpis = calculateKpis(data);
    totalRevenue = kpis.totalRevenue;
    averageOrderValue = kpis.averageOrderValue;
    totalOrders = kpis.totalOrders;
  }

  // Function to render charts
  function updateCharts() {
    if ($salesData.parsedData && salesOverTimeCanvas && topProductsCanvas) {
      const data = $salesData.parsedData;
      const salesOverTime = prepareSalesOverTimeData(data);
      const topProducts = prepareTopProductsData(data);
      renderSalesOverTimeChart(salesOverTime);
      renderTopProductsChart(topProducts);
    }
  }

  // Call updateCharts on mount
  onMount(() => {
    updateCharts();
  });

  // Reactively call updateCharts when salesData changes
  $: $salesData.parsedData, updateCharts();

  function renderSalesOverTimeChart(data: { labels: string[]; values: number[] }) {
    if (salesOverTimeChart) {
      salesOverTimeChart.destroy();
    }
    salesOverTimeChart = new Chart(salesOverTimeCanvas, {
      type: 'line',
      data: {
        labels: data.labels,
        datasets: [
          {
            label: 'Sales Over Time',
            data: data.values,
            borderColor: 'rgb(75, 192, 192)',
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
              unit: 'day',
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
      },
    });
  }

  function renderTopProductsChart(data: { labels: string[]; values: number[] }) {
    if (topProductsChart) {
      topProductsChart.destroy();
    }
    topProductsChart = new Chart(topProductsCanvas, {
      type: 'bar',
      data: {
        labels: data.labels,
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
      },
    });
  }
</script>

<div class="dashboard">
  <h2>E-commerce Dashboard</h2>

  <div class="kpi-cards">
    <div class="kpi-card">
      <h3>Total Revenue</h3>
      <p>{totalRevenue.toFixed(2)} €</p>
    </div>
    <div class="kpi-card">
      <h3>Average Order Value</h3>
      <p>{averageOrderValue.toFixed(2)} €</p>
    </div>
    <div class="kpi-card">
      <h3>Total Orders</h3>
      <p>{totalOrders}</p>
    </div>
  </div>

  <div class="charts-container">
    <div class="chart-card">
      <h3>Sales Over Time</h3>
      <canvas bind:this={salesOverTimeCanvas}></canvas>
    </div>
    <div class="chart-card">
      <h3>Top Selling Products</h3>
      <canvas bind:this={topProductsCanvas}></canvas>
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
    display: flex;
    justify-content: space-around;
    gap: 20px;
    margin-bottom: 40px;
    flex-wrap: wrap;
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
  }

  .chart-card h3 {
    text-align: center;
    color: #007bff;
    margin-bottom: 20px;
  }

  canvas {
    max-height: 300px; /* Adjust as needed */
  }
</style>
