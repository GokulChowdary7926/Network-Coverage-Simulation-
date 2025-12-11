const mongoose = require('mongoose');

const towerSchema = new mongoose.Schema({
  towerId: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  location: {
    latitude: {
      type: Number,
      required: true
    },
    longitude: {
      type: Number,
      required: true
    },
    address: String
  },
  network: {
    type: String,
    enum: ['telco1', 'telco2', 'telco3', 'multi'],
    required: true
  },
  technology: {
    type: [String],
    enum: ['2G', '3G', '4G', '5G'],
    default: ['4G']
  },
  parameters: {
    referencePower: {
      type: Number,
      default: -30
    },
    pathLossExponent: {
      type: Number,
      default: 3.0
    },
    frequency: {
      type: Number,
      default: 2100
    },
    antennaHeight: {
      type: Number,
      default: 30
    },
    transmitterPower: {
      type: Number,
      default: 20
    },
    antennaGain: {
      type: Number,
      default: 10
    }
  },
  capacity: {
    type: Number,
    default: 1000
  },
  coverageRadius: {
    type: Number,
    default: 5000
  },
  status: {
    type: String,
    enum: ['active', 'maintenance', 'inactive'],
    default: 'active'
  },
  installedDate: {
    type: Date,
    default: Date.now
  },
  lastMaintenance: Date,
  notes: String
}, {
  timestamps: true
});

towerSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Tower', towerSchema);


