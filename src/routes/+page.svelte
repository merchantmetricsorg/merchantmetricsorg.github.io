<script lang="ts">
  import CsvUploader from '$lib/components/CsvUploader.svelte';
  import { salesData, setSalesData, clearSalesData, setError } from '$lib/stores/dataStore';
  import { parseCsv } from '$lib/utils/csvParser';
  import Dashboard from '$lib/components/Dashboard.svelte';

  // Sample WooCommerce CSV data for testing
  const wooCommerceSampleCsv = `Date,"Commande n°",État,Client,"Type de client",Produit(s),"Articles vendus","Code(s) promo","Ventes nettes",Attribution
2023-01-01,"#1001",Completed,John Doe,Guest,"Product A x 1, Product B x 2",3,"NONE",150.00,Direct
2023-01-02,"#1002",Processing,Jane Smith,Customer,"Product C x 1",1,"WELCOME10",50.00,Organic
2023-01-03,"#1003",Completed,John Doe,Guest,"Product A x 1",1,"NONE",75.00,Direct`;

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
  <h1>E-commerce BI Dashboard</h1>

  <CsvUploader on:csvUploaded={handleCsvUpload} on:csvCleared={handleCsvCleared} />

  <button on:click={testWooCommerceParsing} class="test-button">Test WooCommerce Parsing</button>

  <section class="platform-import-section">
    <h2>Import from your platform</h2>
    <div class="platform-cards">
      <div class="platform-card">
        <h3>WooCommerce</h3>
        <p>Go to Statistics -> orders -> select YTD -> export</p>
      </div>
      <div class="platform-card disabled">
        <h3>Shopify</h3>
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
</style>
