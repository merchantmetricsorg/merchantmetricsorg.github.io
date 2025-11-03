export interface CsvAdapter {
  platform: string;
  detector: (headers: string[]) => boolean;
  mapping: { [key: string]: string };
}

export const woocommerceAdapter: CsvAdapter = {
  platform: 'WooCommerce',
  detector: (headers: string[]) => {
    // Check for key headers specific to WooCommerce exports
    return headers.includes('Commande n°') && headers.includes('Ventes nettes') && headers.includes('Produit(s)');
  },
  mapping: {
    'Commande n°': 'orderId',
    'Date': 'orderDate',
    'Client': 'customerName', // Assuming 'Client' maps to customer name
    'Ventes nettes': 'totalSales', // Total sales for the order
    'Produit(s)': 'products', // This will need special handling as it's a string of products
    'Articles vendus': 'itemsSold', // Total quantity of items sold in the order
    'Code(s) promo': 'promoCodes',
    'État': 'orderStatus',
    // Add more mappings as needed
  },
};

export const adapters: CsvAdapter[] = [
  woocommerceAdapter,
  // Add other platform adapters here (e.g., shopifyAdapter)
];
