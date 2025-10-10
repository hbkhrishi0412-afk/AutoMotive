
import { Schema, model, models } from 'mongoose';
import { VehicleCategory } from '../types';

const vehicleSchema = new Schema({
  id: { type: Number, required: true, unique: true, index: true },
  category: { type: String, enum: Object.values(VehicleCategory), required: true },
  make: { type: String, required: true },
  model: { type: String, required: true },
  variant: String,
  year: { type: Number, required: true },
  price: { type: Number, required: true },
  mileage: { type: Number, required: true },
  images: [String],
  features: [String],
  description: String,
  sellerEmail: { type: String, required: true, index: true },
  engine: String,
  transmission: String,
  fuelType: String,
  fuelEfficiency: String,
  color: String,
  status: { type: String, enum: ['published', 'unpublished', 'sold'], default: 'published' },
  isFeatured: { type: Boolean, default: false },
  views: { type: Number, default: 0 },
  inquiriesCount: { type: Number, default: 0 },
  isFlagged: Boolean,
  flagReason: String,
  flaggedAt: String,
  registrationYear: Number,
  insuranceValidity: String,
  insuranceType: String,
  rto: String,
  city: String,
  state: String,
  noOfOwners: Number,
  displacement: String,
  groundClearance: String,
  bootSpace: String,
  qualityReport: { type: Schema.Types.Mixed },
  certifiedInspection: { type: Schema.Types.Mixed, default: null },
  certificationStatus: { type: String, enum: ['none', 'requested', 'approved', 'rejected'], default: 'none' },
  videoUrl: String,
  serviceRecords: [Schema.Types.Mixed],
  accidentHistory: [Schema.Types.Mixed],
  documents: [Schema.Types.Mixed],
}, {
  timestamps: true // Add createdAt and updatedAt fields
});

const Vehicle = models.Vehicle || model('Vehicle', vehicleSchema);

export default Vehicle;
