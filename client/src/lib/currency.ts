/**
 * Central Currency and Pricing Utilities for worlducationHub
 * Default System Currency: Kenya Shillings (KES / KSh)
 */

export const DEFAULT_CURRENCY = 'KES';
export const CURRENCY_SYMBOL = 'KSh';
export const USD_TO_KES_RATE = 130; // 1 USD = 130 KES

/**
 * Format any numerical amount in Kenya Shillings (KSh)
 */
export function formatKES(amount: number | string | undefined | null): string {
    const num = Number(amount) || 0;
    return `KSh ${num.toLocaleString('en-KE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

/**
 * Automatically converts legacy or external USD values into Kenya Shillings
 */
export function usdToKes(usd: number | string | undefined | null): number {
    const num = Number(usd) || 0;
    return Math.round(num * USD_TO_KES_RATE);
}

/**
 * Converts KES amounts to USD equivalent for foreign gateways (e.g. PayPal)
 */
export function kesToUsd(kes: number | string | undefined | null): number {
    const num = Number(kes) || 0;
    return Number((num / USD_TO_KES_RATE).toFixed(2));
}

/**
 * Smart price resolver: If a price stored is less than 300, it was likely stored in legacy USD,
 * so we automatically convert it to Kenya Shillings (e.g. 50 -> 6,500 KES).
 */
export function resolvePriceInKES(price: number | string | undefined | null): number {
    const num = Number(price) || 0;
    if (num <= 0) return 0;
    // If price is low (legacy USD amounts like $10, $50, $100), auto-convert to KES
    if (num < 300) {
        return usdToKes(num);
    }
    return Math.round(num);
}
