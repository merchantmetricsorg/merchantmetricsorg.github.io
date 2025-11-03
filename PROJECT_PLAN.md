# Project Plan: Client-Side E-Commerce BI Tool

This document outlines the plan for creating a web application that allows users to upload CSV exports from e-commerce platforms (like WooCommerce or Shopify) and perform client-side business intelligence, data analytics, and visualization.

---

#### 1. Project Vision

To create a fast, secure, and user-friendly web application that empowers e-commerce store owners to gain insights from their sales data directly in their browser. All data processing will happen on the client-side, ensuring user data remains private.

---

#### 2. Core Features

Here is a breakdown of the key features we'll need to build:

*   **CSV Data Uploader:** An interface for users to upload their sales/order CSV files. We should aim to support formats from major platforms.
*   **Data Parser & Normalizer:** A robust module to parse the CSV data and transform it into a consistent internal format, handling potential variations between platforms.
*   **Interactive Dashboard:** A central view with key metrics and visualizations.
    *   **Charts & Graphs:** Visual representations of sales over time, top-selling products, revenue trends, etc.
    *   **Key Performance Indicators (KPIs):** Displaying important metrics like total revenue, average order value, and number of orders.
*   **Client-Side Analytics Engine:**
    *   **Basic Aggregations:** Calculating sums, averages, and counts (e.g., total sales per product).
    *   **Trend Analysis:** Identifying upward or downward trends in sales using techniques like moving averages.
    *   **Anomaly Detection:** Simple statistical methods to flag unusual sales patterns (e.g., a sudden drop or spike).
    *   **Product Performance Insights:** Automatically generating simple text-based insights, such as "Product X sales have decreased by 20% this month."

---

#### 3. Proposed Tech Stack

*   **Framework:** SvelteKit.
*   **CSV Parsing:** **PapaParse** is a popular and reliable choice for in-browser CSV parsing.
*   **Charting/Visualization:** I suggest we start with **Chart.js** or **Frappe Charts** (which has a nice Svelte wrapper). They are powerful yet relatively easy to implement. D3.js is an option for highly custom visualizations later on.
*   **Data Analysis & ML:** For initial analytics like moving averages and aggregations, we can write custom JavaScript functions. For more advanced features like seasonal decomposition or complex correlations, we could integrate a library like **`danfo-js`** (which is like Pandas for JavaScript).

---

#### 4. Initial Questions & Discussion Points

To help prioritize, could you clarify a few things?

1.  **Initial Platform Focus:** Should we start by focusing on a single CSV format (e.g., Shopify orders) to get the MVP working, or try to support multiple formats from the beginning?
2.  **Most Important Insight:** For a first version, what is the single most valuable piece of information a user should get from their data? (e.g., "Which product is trending down?")
3.  **UI/UX Ideas:** Do you have any preference for the dashboard layout? For example, a single-page dashboard or a multi-tabbed interface for different types of analysis (e.g., "Sales Overview", "Product Deep Dive")?
