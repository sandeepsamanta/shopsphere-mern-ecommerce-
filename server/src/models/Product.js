import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 140 },
    description: { type: String, required: true, trim: true, maxlength: 4000 },
    price: { type: Number, required: true, min: 0 },
    category: { type: String, required: true, trim: true, index: true },
    brand: { type: String, trim: true, default: '' },
    image: { type: String, required: true },
    images: { type: [String], default: [], validate: [(v) => v.length <= 6, 'At most 6 extra images'] },
    stock: { type: Number, required: true, min: 0, default: 0 },
    featured: { type: Boolean, default: false },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    numReviews: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

productSchema.index({ price: 1 });
productSchema.index({ createdAt: -1 });

export const Product = mongoose.model('Product', productSchema);
