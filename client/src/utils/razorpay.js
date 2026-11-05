import { api } from '../api/client';

let scriptPromise;
function loadScript() {
  if (window.Razorpay) return Promise.resolve();
  scriptPromise ??= new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    s.onload = resolve;
    s.onerror = () => {
      scriptPromise = null;
      reject(new Error('Could not load the payment window. Check your connection.'));
    };
    document.body.appendChild(s);
  });
  return scriptPromise;
}

/**
 * Opens Razorpay checkout for an existing order.
 * Resolves with the updated order once the server has verified the signature,
 * resolves null if the shopper closes the window.
 */
export async function payWithRazorpay(order, user) {
  const [, cfg] = await Promise.all([loadScript(), api.post(`/orders/${order._id}/razorpay`)]);

  return new Promise((resolve, reject) => {
    const rzp = new window.Razorpay({
      key: cfg.keyId,
      amount: cfg.amount,
      currency: cfg.currency,
      order_id: cfg.razorpayOrderId,
      name: 'ShopSphere',
      description: `Order ${order._id.slice(-8).toUpperCase()}`,
      prefill: { name: user?.name, email: user?.email, contact: order.shippingAddress?.phone },
      theme: { color: '#4f46e5' },
      handler: async (response) => {
        try {
          const { order: paid } = await api.post(`/orders/${order._id}/razorpay/verify`, response);
          resolve(paid);
        } catch (e) {
          reject(e);
        }
      },
      modal: { ondismiss: () => resolve(null) },
    });
    rzp.on('payment.failed', (r) => reject(new Error(r.error?.description || 'Payment failed')));
    rzp.open();
  });
}
