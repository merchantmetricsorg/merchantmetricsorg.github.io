<script lang="ts">
  import CsvUploader from '$lib/components/CsvUploader.svelte';
  import { salesData, setSalesData, clearSalesData, setError } from '$lib/stores/dataStore';
  import { parseCsv } from '$lib/utils/csvParser';

  async function handleCsvUpload(event: CustomEvent<string>) {
    const csvString = event.detail;
    // The file name is managed by CsvUploader, but we can derive it if needed here
    // For now, we'll use a placeholder as the CsvUploader component handles the display.
    const fileName = 'uploaded_file.csv';

    try {
      const { data, headers, errors } = await parseCsv(csvString);

      if (errors.length > 0) {
        console.error('CSV Parsing Errors:', errors);
        setError('Error parsing CSV: ' + errors[0].message);
        return;
      }

      if (data.length === 0) {
        setError('No data found in the CSV file.');
        return;
      }

      setSalesData(data, headers, fileName);
    } catch (e: any) {
      console.error('Failed to process CSV:', e);
      setError('Failed to process CSV: ' + e.message);
    }
  }

  function handleCsvCleared() {
    clearSalesData();
  }
</script>

<svelte:head>
  <title>E-commerce BI Tool</title>
  <meta name="description" content="Client-side e-commerce business intelligence and analytics" />
</svelte:head>

<div class="container">
  <h1>E-commerce BI Dashboard</h1>

  <CsvUploader on:csvUploaded={handleCsvUpload} on:csvCleared={handleCsvCleared} />

  {#if $salesData.error}
    <p class="error-message">{$salesData.error}</p>
  {:else if $salesData.parsedData}
    <div class="data-summary">
      <h2>Data Loaded: {$salesData.fileName}</h2>
      <p>Total Rows: {$salesData.parsedData.length}</p>
      <!-- Display some basic stats or a table preview here -->
      <!-- For now, just a placeholder -->
      <pre>{JSON.stringify($salesData.parsedData[0], null, 2)}</pre>
    </div>
  {:else}
    <p>Upload a CSV file to get started with your e-commerce analytics.</p>
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
