<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import CsvUploader from '$lib/components/CsvUploader.svelte';
  import { salesData, setSalesData, clearSalesData, setError } from '$lib/stores/dataStore';
  import { parseCsv } from '$lib/utils/csvParser';
  import Dashboard from '$lib/components/Dashboard.svelte';
  import { wooCommerceSampleCsv } from '$lib/data/wooCommerceSample';
  import { tick } from 'svelte';

  async function scrollToDashboard() {
    await tick(); // Ensure DOM is updated
    const dashboardElement = document.getElementById('ecommerce-dashboard');
    if (dashboardElement) {
      dashboardElement.scrollIntoView({ behavior: 'smooth' });
    }
  }

  async function handleCsvUpload(event: CustomEvent<string>) {
    const csvString = event.detail;
    const fileName = 'uploaded_file.csv'; // CsvUploader handles display

    await processCsv(csvString, fileName);
  }

  async function processCsv(csvString: string, fileName: string) {
    try {
      const { data, headers, errors, platform } = await parseCsv(csvString);

      if (errors.length > 0) {
        console.error('CSV Parsing Errors:', errors);
        setError(`Error parsing CSV from ${platform || 'Unknown'} platform: ` + errors[0].message);
        return;
      }

      if (data.length === 0) {
        setError('No data found in the CSV file.');
        return;
      }

      setSalesData(data, headers, fileName, platform);
      scrollToDashboard(); // Scroll to dashboard after data is set
    } catch (e: any) {
      console.error('Failed to process CSV:', e);
      setError('Failed to process CSV: ' + e.message);
    }
  }

  function handleCsvCleared() {
    clearSalesData();
  }

  async function testWooCommerceParsing() {
    console.log('Testing WooCommerce CSV parsing...');
    await processCsv(wooCommerceSampleCsv, 'woocommerce_test.csv');
  }

  onMount(() => {
    const urlParams = new URLSearchParams($page.url.search);
    if (urlParams.has('sample')) {
      testWooCommerceParsing();
    }
  });
</script>

<svelte:head>
  <title>E-commerce BI Tool</title>
  <meta name="description" content="Client-side e-commerce business intelligence and analytics" />
</svelte:head>


<div class="container">
  <h1>E-commerce BI Dashboard</h1>
  <section class="features-section">
    <div class="feature-cards">
      <div class="feature-card">
        <h3>One-Click Business Intelligence</h3>
        <p>Gain instant insights with KPIs, charts, trends, anomaly detection, and product performance analytics.</p>
      </div>
      <div class="feature-card">
        <h3>Private & Client-Side</h3>
        <p>Your sensitive order data never leaves your browser, ensuring complete privacy and security.</p>
      </div>
      <div class="feature-card">
        <h3>Open-Source & Free</h3>
        <p>Leverage a powerful, community-driven tool at no cost, with full transparency and extensibility.</p>
      </div>
    </div>
  </section>

  <section class="platform-import-section">
    <h2>Import from your platform</h2>
    <div class="platform-cards">
      <div class="platform-card disabled">
        <h3>Shopify</h3>
        <p>Coming soon</p>
        <p>Go to the <a target="_blank" href="https://admin.shopify.com/orders">Orders page</a> -> Export -> Export orders by date -> Export as CSV file -> Export orders.</p>
      </div>
      <div class="platform-card">
        <h3>WooCommerce</h3>
        <p>Go to Statistics -> orders -> select YTD -> export.</p>
      </div>
      <div class="platform-card disabled">
        <h3>More adapters</h3>
        <p>Coming soon</p>
      </div>
    </div>
  </section>

  <br />

  <CsvUploader on:csvUploaded={handleCsvUpload} on:csvCleared={handleCsvCleared} />

  <button on:click={testWooCommerceParsing} class="test-button">Test Sample CSV</button>


  <div id="ecommerce-dashboard">
    {#if $salesData.error}
      <p class="error-message">{$salesData.error}</p>
    {:else if $salesData.parsedData}
      <Dashboard />
    {:else}
      <p>Upload a CSV file or run a test to get started with your e-commerce analytics.</p>
    {/if}
  </div>
</div>

<style>
  .container {
    max-width: 1280px;
    margin: 0 auto;
    padding: 20px 15px; /* Adjusted padding */
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
    background-color: #f4f7f6; /* Light background for the page */
    border-radius: 8px;
  }

  h1 {
    color: #2c3e50; /* Darker, professional color */
    text-align: center;
    margin-bottom: 30px;
    font-size: 2.5em;
    font-weight: 700;
  }

  h1 {
    color: #333;
    text-align: center;
    margin-bottom: 30px;
  }

  .test-button {
    display: block;
    margin: 20px auto;
    padding: 10px 20px;
    background-color: #28a745;
    color: white;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    font-size: 16px;
  }

  .test-button:hover {
    background-color: #218838;
  }

  .error-message {
    color: #dc3545;
    background-color: #f8d7da;
    border: 1px solid #f5c6cb;
    padding: 10px;
    border-radius: 5px;
    margin-top: 20px;
  }

  .data-summary {
    margin-top: 30px;
    padding: 20px;
    border: 1px solid #e9ecef;
    border-radius: 8px;
    background-color: #f1f1f1;
  }

  .data-summary h2 {
    color: #007bff;
    margin-bottom: 15px;
  }

  .data-summary pre {
    background-color: #e9ecef;
    padding: 10px;
    border-radius: 5px;
    overflow-x: auto;
  }

  .platform-import-section {
    margin-top: 40px;
    text-align: center;
  }

  .platform-import-section h2 {
    color: #333;
    margin-bottom: 20px;
  }

  .platform-cards {
    display: flex;
    justify-content: center;
    gap: 20px;
    flex-wrap: wrap;
  }

  .platform-card {
    background-color: #ffffff;
    border: 1px solid #e9ecef;
    border-radius: 8px;
    padding: 15px;
    width: 300px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    text-align: left;
  }

  .platform-card h3 {
    color: #34495e;
    margin-top: 0;
    margin-bottom: 8px;
    font-size: 1.1em;
  }

  .platform-card p {
    color: #7f8c8d;
    font-size: 0.85em;
    line-height: 1.4;
  }

  .platform-card.disabled {
    opacity: 0.6;
    background-color: #e9ecef;
    cursor: not-allowed;
  }

  .platform-card.disabled h3 {
    color: #6c757d;
  }

  .features-section {
    margin-top: 20px;
    margin-bottom: 40px;
    text-align: center;
  }

  .feature-cards {
    display: flex;
    justify-content: center;
    gap: 20px;
    flex-wrap: wrap;
  }

  .feature-card {
    background-color: #ffffff;
    border: 1px solid #e9ecef;
    border-radius: 8px;
    padding: 20px;
    width: 300px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    text-align: center;
    transition: transform 0.2s ease-in-out;
  }

  .feature-card:hover {
    transform: translateY(-5px);
  }

  .feature-card h3 {
    color: #34495e; /* Professional blue-grey */
    margin-top: 0;
    margin-bottom: 10px;
    font-size: 1.2em;
  }

  .feature-card p {
    color: #7f8c8d; /* Softer grey */
    font-size: 0.9em;
    line-height: 1.5;
  }
</style>
