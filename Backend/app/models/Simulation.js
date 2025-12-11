const mongoose = require('mongoose');

const coveragePointSchema = new mongoose.Schema({
  latitude: Number,
  longitude: Number,
  signalStrength: Number,
  signalBars: Number,
  network: String,
  servingTower: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tower'
  },
  distance: Number
});

const simulationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  description: String,
  area: {
    northEast: {
      latitude: Number,
      longitude: Number
    },
    southWest: {
      latitude: Number,
      longitude: Number
    }
  },
  parameters: {
    pathLossExponent: {
      type: Number,
      default: 3.0
    },
    referencePower: {
      type: Number,
      default: -30
    },
    receiverSensitivity: {
      type: Number,
      default: -100
    },
    environmentType: {
      type: String,
      enum: ['urban', 'suburban', 'rural'],
      default: 'suburban'
    },
    frequency: {
      type: Number,
      default: 2100
    }
  },
  towers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tower'
  }],
  coverageData: [coveragePointSchema],
  statistics: {
    overallCoverage: Number,
    strongCoverage: Number,
    weakCoverage: Number,
    noCoverage: Number,
    averageSignalStrength: Number,
    coverageArea: Number
  },
  gridResolution: {
    type: Number,
    default: 100
  },
  createdBy: {
    type: String,
    default: 'system'
  },
  isPublic: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

simulationSchema.index({ createdAt: -1 });
simulationSchema.index({ 'area.northEast': '2dsphere' });

module.exports = mongoose.model('Simulation', simulationSchema);


