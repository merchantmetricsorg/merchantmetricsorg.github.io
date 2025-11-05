export interface CsvAdapter {
  platform: string;
  detector: (headers: string[]) => boolean;
  mapping: { [key: string]: string };
  strict?: boolean; // Add strict flag, default to true if not specified
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

export const shopifyAdapter: CsvAdapter = {
  platform: 'Shopify',
  strict: false, // Set strict to false for Shopify
  detector: (headers: string[]) => {
    return headers.includes('Name') && headers.includes('Email') && headers.includes('Financial Status') && headers.includes('Total');
  },
  mapping: {
    'Name': 'orderId',
    'Created at': 'orderDate',
    'Billing Name': 'customerName',
    'Email': 'customerEmail',
    'Total': 'totalSales',
    'Lineitem name': 'products', // Shopify has multiple line items, this will need aggregation or special handling
    'Lineitem quantity': 'itemsSold', // This will need aggregation or special handling
    'Discount Code': 'promoCodes',
    'Financial Status': 'financialStatus',
    'Fulfillment Status': 'fulfillmentStatus',
    'Currency': 'currency',
    'Subtotal': 'subtotal',
    'Shipping': 'shipping',
    'Taxes': 'taxes',
    'Discount Amount': 'discountAmount',
    'Shipping Method': 'shippingMethod',
    'Billing City': 'billingCity',
    'Shipping City': 'shippingCity',
    'Payment Method': 'paymentMethod',
    'Tags': 'tags',
  },
};

export const adapters: CsvAdapter[] = [
  woocommerceAdapter,
  shopifyAdapter,
];
