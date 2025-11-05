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
  <title>MerchantMetrics: Automated E-commerce Analytics, No Skills Needed</title>
  <meta name="description" content="Transform your sales CSV into an automated analytics dashboard. Get powerful KPIs, trends, and product insights without needing business analytics skills—your data never leaves your browser." />
</svelte:head>


<div class="container">
  <h1 class="text-center">Automated E-commerce Analytics: No Skills Required</h1>
  <p class="text-center text-medium">Automatically generate a private, powerful BI dashboard from your sales CSV. No business analytics skills needed, no sign-up required, completely free.</p>
  <section class="my-xl text-center">
    <h2 class="text-primary">Key Features</h2>
    <div class="grid grid-cols-3 my-lg">
      <div class="card feature-card">
        <h3>Automated Intelligence</h3>
        <p>Get automated KPIs, sales trends, and product performance visualized for you, no business analytics skills required.</p>
      </div>
      <div class="card feature-card">
        <h3>Your Data Stays Yours</h3>
        <p>Analyzes your sales data entirely within your browser. Nothing is ever uploaded to a server, ensuring total privacy.</p>
      </div>
      <div class="card feature-card">
        <h3>Powerful & Free Forever</h3>
        <p>Leverage a powerful, community-driven tool at no cost, with full transparency.</p>
      </div>
    </div>
  </section>

  <section class="my-xl text-center">
    <h2 class="text-primary">Automated Insights in Minutes</h2>
    <p class="text-center text-medium">Follow these simple steps to upload your sales data and automatically generate your insights.</p>
    <div class="grid grid-cols-3 my-lg">
      <div class="card platform-card">
        <h3>Shopify</h3>
        <p>Go to the <a target="_blank" href="https://admin.shopify.com/orders">Orders page</a> -> Export -> Export orders by date -> Export as CSV file -> Export orders.</p>
      </div>
      <div class="card platform-card">
        <h3>WooCommerce</h3>
        <p>Go to Statistics -> orders -> select YTD -> export.</p>
      </div>
      <div class="card platform-card disabled">
        <h3>More adapters</h3>
        <p>Coming soon</p>
      </div>
    </div>
  </section>

  <div class="my-xl text-center">
    <h2 class="text-primary">Get Your Automated Sales Dashboard Now</h2>
    <div class="my-lg">
      <CsvUploader on:csvUploaded={handleCsvUpload} on:csvCleared={handleCsvCleared} />
    </div>
    <button on:click={testWooCommerceParsing} class="btn btn-accent my-lg">Or Try a Demo with Sample Data</button>
  </div>

  <div id="ecommerce-dashboard" class="my-xl">
    {#if $salesData.error}
      <p class="alert alert-danger">{$salesData.error}</p>
    {:else if $salesData.parsedData}
      <Dashboard />
    {:else}
      <p class="text-center text-medium">Upload a CSV file or run a test to get started with your e-commerce analytics.</p>
    {/if}
  </div>
</div>

<style>
  /* Scoped styles for +page.svelte */
  .my-lg { margin-top: var(--spacing-lg); margin-bottom: var(--spacing-lg); }
  .my-xl { margin-top: var(--spacing-xl); margin-bottom: var(--spacing-xl); }

  .feature-card:hover {
    transform: translateY(-5px);
  }

  .platform-card.disabled {
    opacity: 0.6;
    background-color: var(--color-background-medium);
    cursor: not-allowed;
  }

  .platform-card.disabled h3 {
    color: var(--color-text-light);
  }
</style>
