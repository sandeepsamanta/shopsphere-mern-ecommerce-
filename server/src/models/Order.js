import mongoose from 'mongoose';

export const ORDER_STATUSES = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
export const PAYMENT_METHODS = ['COD', 'RAZORPAY'];

const orderItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    // Snapshot of the product at purchase time
    name: { type: String, required: true },
    image: { type: String, required: true },
    price: { type: Number, required: true },
    qty: { type: Number, required: true, min: 1 },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    orderItems: { type: [orderItemSchema], validate: (v) => v.length > 0 },
    shippingAddress: {
      fullName: { type: String, required: true },
      phone: { type: String, required: true },
      address: { type: String, required: true },
      city: { type: String, required: true },
      postalCode: { type: String, required: true },
      country: { type: String, required: true },
    },
    paymentMethod: { type: String, enum: PAYMENT_METHODS, required: true },
    paymentResult: {
      razorpayOrderId: String,
      razorpayPaymentId: String,
    },
    itemsPrice: { type: Number, required: true },
    shippingPrice: { type: Number, required: true },
    taxPrice: { type: Number, required: true },
    totalPrice: { type: Number, required: true },
    isPaid: { type: Boolean, default: false },
    paidAt: Date,
    status: { type: String, enum: ORDER_STATUSES, default: 'pending', index: true },
    deliveredAt: Date,
  },
  { timestamps: true }
);

orderSchema.index({ createdAt: -1 });

export const Order = mongoose.model('Order', orderSchema);
