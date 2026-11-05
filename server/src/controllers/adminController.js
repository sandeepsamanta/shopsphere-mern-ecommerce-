import { Order } from '../models/Order.js';
import { Product } from '../models/Product.js';
import { User } from '../models/User.js';
import { AppError } from '../utils/AppError.js';

export async function stats(_req, res) {
  const since = new Date();
  since.setUTCHours(0, 0, 0, 0);
  since.setUTCDate(since.getUTCDate() - 6);

  const [users, products, orders, revenueAgg, salesByDay, lowStock, recentOrders] = await Promise.all([
    User.countDocuments(),
    Product.countDocuments(),
    Order.countDocuments(),
    Order.aggregate([
      { $match: { isPaid: true, status: { $ne: 'cancelled' } } },
      { $group: { _id: null, total: { $sum: '$totalPrice' } } },
    ]),
    Order.aggregate([
      { $match: { createdAt: { $gte: since }, status: { $ne: 'cancelled' } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          orders: { $sum: 1 },
          revenue: { $sum: '$totalPrice' },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    Product.find({ stock: { $lte: 5 } }).sort({ stock: 1 }).limit(5).select('name stock image').lean(),
    Order.find().sort({ createdAt: -1 }).limit(5).populate('user', 'name').lean(),
  ]);

  // Fill in days with no orders so the chart has 7 continuous points.
  const byDay = new Map(salesByDay.map((d) => [d._id, d]));
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(since);
    d.setUTCDate(since.getUTCDate() + i);
    const key = d.toISOString().slice(0, 10);
    return { date: key, orders: byDay.get(key)?.orders ?? 0, revenue: byDay.get(key)?.revenue ?? 0 };
  });

  res.json({
    users,
    products,
    orders,
    revenue: revenueAgg[0]?.total ?? 0,
    last7Days,
    lowStock,
    recentOrders,
  });
}

export async function listUsers(req, res) {
  const { page, limit } = req.query;
  const [total, users] = await Promise.all([
    User.countDocuments(),
    User.find()
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
  ]);
  res.json({ users, page, pages: Math.max(1, Math.ceil(total / limit)), total });
}

export async function setUserRole(req, res) {
  if (String(req.user._id) === req.params.id) throw new AppError('You cannot change your own role', 400);
  const user = await User.findByIdAndUpdate(req.params.id, { role: req.body.role }, { new: true });
  if (!user) throw new AppError('User not found', 404);
  res.json({ user: user.toPublic() });
}
