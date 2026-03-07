'use strict';

const User = require('../models/User');
const Subscription = require('../models/Subscription');
const UsageLog = require('../models/UsageLog');
const Install = require('../models/Install');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

// GET /api/admin/dashboard
const dashboard = asyncHandler(async (req, res) => {
  const [
    totalUsers,
    activeSubscriptions,
    revenueResult,
    totalInstalls,
    recentSignups,
    recentActivity,
  ] = await Promise.all([
    User.countDocuments(),
    Subscription.countDocuments({ status: { $in: ['active', 'trialing'] } }),
    Subscription.aggregate([
      { $match: { status: { $in: ['active', 'trialing'] } } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
    Install.countDocuments(),
    User.find().sort({ createdAt: -1 }).limit(10).select('-passwordHash'),
    UsageLog.find().sort({ createdAt: -1 }).limit(20),
  ]);

  const totalRevenue = revenueResult[0]?.total ?? 0;

  res.json({
    totalUsers,
    activeSubscriptions,
    totalRevenue,
    totalInstalls,
    recentSignups: recentSignups.map(u => u.toJSON()),
    recentActivity: recentActivity.map(l => l.toJSON()),
  });
});

// GET /api/admin/users
const listUsers = asyncHandler(async (req, res) => {
  const page   = Math.max(1, parseInt(req.query.page)  || 1);
  const limit  = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
  const search = req.query.search || '';
  const skip   = (page - 1) * limit;

  const filter = search
    ? { $or: [
        { email: { $regex: search, $options: 'i' } },
        { name:  { $regex: search, $options: 'i' } },
      ]}
    : {};

  const [total, users] = await Promise.all([
    User.countDocuments(filter),
    User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).select('-passwordHash'),
  ]);

  res.json({ total, page, limit, users: users.map(u => u.toJSON()) });
});

// GET /api/admin/subscriptions
const listSubscriptions = asyncHandler(async (req, res) => {
  const page   = Math.max(1, parseInt(req.query.page)  || 1);
  const limit  = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
  const status = req.query.status;
  const skip   = (page - 1) * limit;

  const filter = status ? { status } : {};

  const [total, subscriptions] = await Promise.all([
    Subscription.countDocuments(filter),
    Subscription.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('userId', 'email name'),
  ]);

  const serialised = subscriptions.map(s => {
    const obj = s.toJSON();
    if (s.userId && typeof s.userId === 'object') {
      obj.email = s.userId.email;
      obj.name  = s.userId.name;
    }
    return obj;
  });

  res.json({ total, page, limit, subscriptions: serialised });
});

// GET /api/admin/usage
const usageStats = asyncHandler(async (req, res) => {
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [byAction, byDay] = await Promise.all([
    UsageLog.aggregate([
      { $match: { createdAt: { $gte: since } } },
      { $group: { _id: '$action', count: { $sum: 1 } } },
      { $project: { _id: 0, action: '$_id', count: 1 } },
    ]),
    UsageLog.aggregate([
      { $match: { createdAt: { $gte: since } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      { $project: { _id: 0, day: '$_id', count: 1 } },
    ]),
  ]);

  res.json({ byAction, byDay });
});

// GET /api/admin/installs
const installStats = asyncHandler(async (req, res) => {
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [total, byDay, recent] = await Promise.all([
    Install.countDocuments(),
    Install.aggregate([
      { $match: { installedAt: { $gte: since } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$installedAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      { $project: { _id: 0, day: '$_id', count: 1 } },
    ]),
    Install.find().sort({ installedAt: -1 }).limit(50),
  ]);

  res.json({ total, byDay, recent: recent.map(i => i.toJSON()) });
});

// POST /api/admin/users/:id/role
const changeRole = asyncHandler(async (req, res) => {
  const { role } = req.body;
  if (!['admin', 'user'].includes(role)) {
    throw ApiError.badRequest('role must be "admin" or "user"');
  }

  const user = await User.findByIdAndUpdate(
    req.params.id,
    { role },
    { new: true }
  ).select('-passwordHash');

  if (!user) throw ApiError.notFound('User not found');

  res.json({ success: true, user: user.toJSON() });
});

module.exports = {
  dashboard,
  listUsers,
  listSubscriptions,
  usageStats,
  installStats,
  changeRole,
};
