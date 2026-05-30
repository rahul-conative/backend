const { mongoose } = require("../../infrastructure/mongo/mongo-client");

const auditLogSchema = new mongoose.Schema(
  {
    // Actor
    actorId:   { type: String, index: true },
    actorName: { type: String },
    actorRole: { type: String },

    // Business context
    module:     { type: String, index: true },
    action:     { type: String, index: true },
    entityId:   { type: String, index: true },
    entityType: { type: String },
    description:{ type: String },

    // State change
    oldData:      { type: mongoose.Schema.Types.Mixed },
    newData:      { type: mongoose.Schema.Types.Mixed },
    changedFields:{ type: [String], default: [] },
    reason:       { type: String },

    // HTTP context
    method:     { type: String },
    path:       { type: String, index: true },
    statusCode: { type: Number },
    requestId:  { type: String },
    ip:         { type: String },
    userAgent:  { type: String },
  },
  { timestamps: true },
);

auditLogSchema.index({ module: 1, entityId: 1 });
auditLogSchema.index({ actorId: 1, createdAt: -1 });
auditLogSchema.index({ createdAt: -1 });

const AuditLogModel = mongoose.model("AuditLog", auditLogSchema);

module.exports = { AuditLogModel };
