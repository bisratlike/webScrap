'use strict';

const mongoose = require('mongoose');

const InstallSchema = new mongoose.Schema(
  {
    extensionId: {
      type: String,
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    lastSeen: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: { createdAt: 'installedAt', updatedAt: false } }
);

// Compound index: one record per extensionId + userId pair.
// When userId is null (anonymous), multiple anonymous installs are allowed
// unless we also add a partial filter. For clarity we document this intent.
InstallSchema.index({ extensionId: 1, userId: 1 }, { unique: true, sparse: true });

InstallSchema.set('toJSON', {
  virtuals: true,
  transform(doc, ret) {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
  },
});

const Install = mongoose.model('Install', InstallSchema);

module.exports = Install;
