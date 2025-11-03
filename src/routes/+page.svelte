<script lang="ts">
  import CsvUploader from '$lib/components/CsvUploader.svelte';
  import { salesData, setSalesData, clearSalesData, setError } from '$lib/stores/dataStore';
  import { parseCsv } from '$lib/utils/csvParser';

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

  {#if $salesData.error}
    <p class="error-message">{$salesData.error}</p>
  {:else if $salesData.parsedData}
    <div class="data-summary">
      <h2>Data Loaded: {$salesData.fileName} (Platform: {$salesData.platform || 'Unknown'})</h2>
      <p>Total Rows: {$salesData.parsedData.length}</p>
      <!-- Display some basic stats or a table preview here -->
      <!-- For now, just a placeholder -->
      <pre>{JSON.stringify($salesData.parsedData[0], null, 2)}</pre>
    </div>
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
</style>
