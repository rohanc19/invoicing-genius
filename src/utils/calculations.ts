
import { Product } from "../types/invoice";

export const calculateProductTotal = (product: Product) => {
  const subtotal = product.quantity * product.price;
  const discountAmount = subtotal * (product.discount / 100);
  const afterDiscount = subtotal - discountAmount;
  const taxAmount = afterDiscount * (product.tax / 100);
  
  return afterDiscount + taxAmount;
};

export const calculateSubtotal = (products: Product[]) => {
  return products.reduce((sum, product) => {
    return sum + (product.quantity * product.price);
  }, 0);
};

export const calculateTotalDiscount = (products: Product[]) => {
  return products.reduce((sum, product) => {
    const subtotal = product.quantity * product.price;
    return sum + (subtotal * (product.discount / 100));
  }, 0);
};

export const calculateTotalTax = (products: Product[]) => {
  return products.reduce((sum, product) => {
    const subtotal = product.quantity * product.price;
    const discountAmount = subtotal * (product.discount / 100);
    const afterDiscount = subtotal - discountAmount;
    return sum + (afterDiscount * (product.tax / 100));
  }, 0);
};

export const calculateTotal = (products: Product[]) => {
  return products.reduce((sum, product) => {
    return sum + calculateProductTotal(product);
  }, 0);
};

export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};
