'use strict';

const mongoose = require('mongoose');

const SubscriptionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    stripeSubscriptionId: {
      type: String,
      unique: true,
      sparse: true,
    },
    stripePaymentIntentId: {
      type: String,
      default: null,
    },
    plan: {
      type: String,
      enum: ['free', 'pro'],
      default: 'pro',
    },
    status: {
      type: String,
      enum: ['active', 'trialing', 'past_due', 'cancelled', 'expired', 'incomplete'],
      default: 'active',
    },
    /** Amount in cents */
    amount: {
      type: Number,
      default: 300,
    },
    currentPeriodStart: Date,
    currentPeriodEnd: Date,
  },
  { timestamps: true }
);

SubscriptionSchema.set('toJSON', {
  virtuals: true,
  transform(doc, ret) {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
  },
});

const Subscription = mongoose.model('Subscription', SubscriptionSchema);

module.exports = Subscription;
