<script lang="ts">
  import CsvUploader from '$lib/components/CsvUploader.svelte';
  import { salesData, setSalesData, clearSalesData, setError } from '$lib/stores/dataStore';
  import { parseCsv } from '$lib/utils/csvParser';
  import Dashboard from '$lib/components/Dashboard.svelte';
  import { wooCommerceSampleCsv } from '$lib/data/wooCommerceSample';

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
</script>

<svelte:head>
  <title>E-commerce BI Tool</title>
  <meta name="description" content="Client-side e-commerce business intelligence and analytics" />
</svelte:head>

<div class="container">
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

  <h1>E-commerce BI Dashboard</h1>

  <CsvUploader on:csvUploaded={handleCsvUpload} on:csvCleared={handleCsvCleared} />

  <button on:click={testWooCommerceParsing} class="test-button">Test WooCommerce Parsing</button>

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

  {#if $salesData.error}
    <p class="error-message">{$salesData.error}</p>
  {:else if $salesData.parsedData}
    <Dashboard />
  {:else}
    <p>Upload a CSV file or run a test to get started with your e-commerce analytics.</p>
  {/if}
</div>

<style>
  .container {
    max-width: 960px;
    margin: 0 auto;
    padding: 20px;
    font-family: sans-serif;
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
    background-color: #f9f9f9;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    padding: 20px;
    width: 300px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    text-align: left;
  }

  .platform-card h3 {
    color: #007bff;
    margin-top: 0;
    margin-bottom: 10px;
  }

  .platform-card p {
    color: #555;
    font-size: 14px;
    line-height: 1.5;
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
    border: 1px solid #e0e0e0;
    border-radius: 10px;
    padding: 25px;
    width: 300px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    text-align: center;
    transition: transform 0.2s ease-in-out;
  }

  .feature-card:hover {
    transform: translateY(-5px);
  }

  .feature-card h3 {
    color: #007bff;
    margin-top: 0;
    margin-bottom: 15px;
    font-size: 1.4em;
  }

  .feature-card p {
    color: #555;
    font-size: 1em;
    line-height: 1.6;
  }
</style>
