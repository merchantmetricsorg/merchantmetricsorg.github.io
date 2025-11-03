<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  const dispatch = createEventDispatcher();
  let fileInput: HTMLInputElement;
  let fileName: string = '';
  let error: string | null = null;

  function handleFileChange(event: Event) {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];

    if (file) {
      fileName = file.name;
      error = null;
      if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const csvString = e.target?.result as string;
          dispatch('csvUploaded', csvString);
        };
        reader.onerror = () => {
          error = 'Failed to read file.';
        };
        reader.readAsText(file);
      } else {
        error = 'Please upload a valid CSV file.';
      }
    } else {
      fileName = '';
      error = null;
    }
  }

  function clearFile() {
    if (fileInput) {
      fileInput.value = '';
    }
    fileName = '';
    error = null;
    dispatch('csvCleared');
  }
</script>

<div class="csv-uploader">
  <label for="csv-file-input" class="button">
    Upload CSV File
    <input
      id="csv-file-input"
      type="file"
      accept=".csv, text/csv"
      on:change={handleFileChange}
      bind:this={fileInput}
      style="display: none;"
    />
  </label>

  {#if fileName}
    <div class="file-info">
      <span>File: {fileName}</span>
      <button on:click={clearFile} class="clear-button">X</button>
    </div>
  {/if}

  {#if error}
    <p class="error-message">{error}</p>
  {/if}
</div>

<style>
  .csv-uploader {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
    padding: 20px;
    border: 1px solid #ccc;
    border-radius: 8px;
    background-color: #f9f9f9;
  }

  .button {
    background-color: #007bff;
    color: white;
    padding: 10px 15px;
    border-radius: 5px;
    cursor: pointer;
    font-size: 16px;
    transition: background-color 0.2s ease-in-out;
  }

  .button:hover {
    background-color: #0056b3;
  }

  .file-info {
    display: flex;
    align-items: center;
    gap: 10px;
    background-color: #e9ecef;
    padding: 8px 12px;
    border-radius: 5px;
  }

  .clear-button {
    background: none;
    border: none;
    color: #dc3545;
    font-weight: bold;
    cursor: pointer;
    font-size: 16px;
  }

  .clear-button:hover {
    color: #c82333;
  }

  .error-message {
    color: #dc3545;
    font-size: 14px;
  }
</style>
