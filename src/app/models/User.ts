import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  // Basic user information
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  emailVerified: Date,
  image: String,
  password: { type: String, required: true },
  
  // Waste management specific fields
  walletAddress: { type: String, unique: true }, // For blockchain rewards
  virtualCoins: { type: Number, default: 0 }, // Track user's earned coins
  
  // Activity tracking
  reportedBins: [{
    binId: { type: mongoose.Schema.Types.ObjectId, ref: 'Bin' },
    reportDate: { type: Date, default: Date.now },
    verified: { type: Boolean, default: false }
  }],
  
  // Usage statistics
  disposalHistory: [{
    binId: { type: mongoose.Schema.Types.ObjectId, ref: 'Bin' },
    disposalDate: { type: Date, default: Date.now },
    wasteType: String,
    rewardEarned: Number
  }],
  
  // User status and role
  role: {
    type: String,
    enum: ['user', 'admin', 'verifier'],
    default: 'user'
  },
  isActive: { type: Boolean, default: true },
  
  // Gamification elements
  sustainabilityScore: { type: Number, default: 0 },
  badges: [String],
  
  // Location tracking for nearby bin suggestions
  defaultLocation: {
    type: { type: String, default: 'Point' },
    coordinates: [Number] // [longitude, latitude]
  }
}, {
  timestamps: true
});

// Add index for geospatial queries
userSchema.index({ defaultLocation: '2dsphere' });

const User = mongoose.models.User || mongoose.model('User', userSchema);

export default User;