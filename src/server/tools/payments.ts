/**
 * Payments tools
 */

import { AdSenseClient } from '../../adsense/client.js';

/**
 * List payments
 */
export async function handleListPayments(args: Record<string, unknown>) {
    const accountId = (args.accountId as string) || process.env.ADSENSE_ACCOUNT_ID;
    const client = await AdSenseClient.create(accountId);
    const payments = await client.listPayments(accountId);

    // Format payments
    const formatPayment = (payment: any) => {
        const date = payment.date
            ? `${payment.date.year}-${String(payment.date.month).padStart(2, '0')}-${String(payment.date.day).padStart(2, '0')}`
            : null;

        // Determine payment type from name
        const name = payment.name || '';
        let type = 'payment';
        if (name.includes('unpaid')) {
            type = 'unpaid';
        } else if (name.includes('youtube')) {
            type = 'youtube';
        }

        return {
            amount: payment.amount || 'N/A',
            date,
            type,
            name: payment.name,
        };
    };

    // Separate unpaid from paid
    const unpaid = payments.filter(p => p.name?.includes('unpaid'));
    const paid = payments.filter(p => !p.name?.includes('unpaid'));

    // Calculate total paid
    const totalPaid = paid.reduce((sum, p) => {
        const match = p.amount?.match(/[\d.]+/);
        return sum + (match ? parseFloat(match[0]) : 0);
    }, 0);

    return {
        payments: payments.map(formatPayment),
        summary: {
            totalPayments: paid.length,
            unpaidBalance: unpaid.length > 0 ? unpaid[0].amount : 'N/A',
            totalPaidAllTime: `$${totalPaid.toFixed(2)}`,
        },
        unpaid: unpaid.map(formatPayment),
        paid: paid.map(formatPayment),
    };
}
