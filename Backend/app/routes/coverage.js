const express = require('express');
const Tower = require('../models/Tower');
const CoverageCalculator = require('../utils/coverageCalculator');
const router = express.Router();

// Calculate coverage at specific point
router.get('/point', async (req, res) => {
  try {
    const { lat, lng } = req.query;
    
    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        error: 'Latitude and longitude are required'
      });
    }

    // Get all active towers
    const towers = await Tower.find({ status: 'active' });
    
    let bestSignal = {
      strength: -Infinity,
      bars: 0,
      network: '',
      tower: null,
      distance: 0
    };

    // Calculate signal from each tower
    towers.forEach(tower => {
      const distance = CoverageCalculator.calculateDistance(
        parseFloat(lat), parseFloat(lng),
        tower.location.latitude, tower.location.longitude
      );
      
      const signalStrength = CoverageCalculator.calculateSignalStrength(
        distance,
        tower.parameters.referencePower,
        tower.parameters.pathLossExponent,
        tower.parameters.frequency,
        tower.parameters.transmitterPower,
        tower.parameters.antennaGain
      );
      
      if (signalStrength > bestSignal.strength) {
        bestSignal = {
          strength: signalStrength,
          bars: CoverageCalculator.dBmToBars(signalStrength),
          network: tower.network,
          tower: tower._id,
          distance: distance
        };
      }
    });

    res.json({
      success: true,
      data: bestSignal
    });
  } catch (error) {
    console.error('Coverage error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Server Error'
    });
  }
});

// Get coverage statistics
router.get('/statistics', async (req, res) => {
  try {
    const towers = await Tower.find();
    const totalTowers = towers.length;
    
    const networks = {
      telco1: towers.filter(t => t.network === 'telco1').length,
      telco2: towers.filter(t => t.network === 'telco2').length,
      telco3: towers.filter(t => t.network === 'telco3').length,
      multi: towers.filter(t => t.network === 'multi').length
    };

    const technologies = {
      '2G': towers.filter(t => t.technology.includes('2G')).length,
      '3G': towers.filter(t => t.technology.includes('3G')).length,
      '4G': towers.filter(t => t.technology.includes('4G')).length,
      '5G': towers.filter(t => t.technology.includes('5G')).length
    };

    res.json({
      success: true,
      data: {
        totalTowers,
        networks,
        technologies,
        activeTowers: towers.filter(t => t.status === 'active').length,
        maintenanceTowers: towers.filter(t => t.status === 'maintenance').length
      }
    });
  } catch (error) {
    console.error('Coverage error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Server Error'
    });
  }
});

module.exports = router;

