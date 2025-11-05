# Project Plan: Client-Side E-Commerce BI Tool

This document outlines the plan for creating a web application that allows users to upload CSV exports from e-commerce platforms (like WooCommerce or Shopify) and perform client-side business intelligence, data analytics, and visualization.

---

#### 1. Project Vision

To create a fast, secure, and user-friendly web application that empowers e-commerce store owners to gain insights from their sales data directly in their browser. All data processing will happen on the client-side, ensuring user data remains private.

---

#### 2. Core Features

Here is a breakdown of the key features:

* **CSV Data Uploader:** An interface for users to upload their sales/order CSV files. We should aim to support formats from major platforms.
* **Data Parser & Normalizer:** A robust module to parse the CSV data and transform it into a consistent internal format, handling potential variations between platforms.
* **Interactive Dashboard:** A central view with key metrics and visualizations.
    * **Charts & Graphs:** Visual representations of sales over time, top-selling products, revenue trends, etc.
    * **Key Performance Indicators (KPIs):** Displaying important metrics like total revenue, average order value, and number of orders.
* **Client-Side Analytics Engine:**
    * **Basic Aggregations:** Calculating sums, averages, and counts (e.g., total sales per product).
    * **Trend Analysis:** Identifying upward or downward trends in sales using techniques like moving averages.
    * **Anomaly Detection:** Simple statistical methods to flag unusual sales patterns (e.g., a sudden drop or spike).
    * **Product Performance Insights:** Automatically generating simple text-based insights, such as "Product X sales have decreased by 20% this month."

---

#### 3. Tech Stack

* **Framework:** SvelteKit.
* **CSV Parsing:** PapaParse.
* **Charting/Visualization:** Chart.js (or Frappe Charts / D3.js if needed).
* **Data Analysis & ML:** For initial analytics like moving averages and aggregations, we can write custom JavaScript functions. For more advanced features like seasonal decomposition or complex correlations, we could integrate a library like **`danfo-js`** (which is like Pandas for JavaScript).
