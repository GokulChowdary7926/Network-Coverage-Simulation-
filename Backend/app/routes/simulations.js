const express = require('express');
const Simulation = require('../models/Simulation');
const Tower = require('../models/Tower');
const CoverageCalculator = require('../utils/coverageCalculator');
const router = express.Router();

// Get all simulations
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const simulations = await Simulation.find()
      .populate('towers')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await Simulation.countDocuments();

    res.json({
      success: true,
      count: simulations.length,
      total,
      pages: Math.ceil(total / limit),
      current: page,
      data: simulations
    });
  } catch (error) {
    console.error('Simulation error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Server Error'
    });
  }
});

// Get simulation by ID
router.get('/:id', async (req, res) => {
  try {
    const simulation = await Simulation.findById(req.params.id)
      .populate('towers');

    if (!simulation) {
      return res.status(404).json({
        success: false,
        error: 'Simulation not found'
      });
    }

    res.json({
      success: true,
      data: simulation
    });
  } catch (error) {
    console.error('Simulation error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Server Error'
    });
  }
});

// Create and run simulation
router.post('/', async (req, res) => {
  try {
    const { name, description, area, parameters, towerIds, gridResolution = 100 } = req.body;

    // Get towers
    const towers = await Tower.find({ _id: { $in: towerIds } });
    
    if (towers.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No valid towers provided'
      });
    }

    // Send initial progress via Socket.io if available
    if (req.io) {
      req.io.emit('simulation-progress', { 
        simulationId: 'new', 
        progress: 10, 
        message: 'Starting simulation...' 
      });
    }

    // Generate coverage data with progress updates
    const progressCallback = (progress) => {
      if (req.io) {
        req.io.emit('simulation-progress', { 
          simulationId: 'new', 
          progress: Math.min(90, 10 + progress * 0.8),
          message: `Calculating coverage: ${Math.round(progress)}%`
        });
      }
    };

    const { coverageData, statistics } = CoverageCalculator.generateCoverageData(
      area,
      towers,
      parameters,
      gridResolution,
      progressCallback
    );

    // Create simulation record
    const simulation = await Simulation.create({
      name,
      description,
      area,
      parameters,
      towers: towerIds,
      coverageData,
      statistics,
      gridResolution
    });

    // Populate towers before sending response
    await simulation.populate('towers');

    // Send completion progress
    if (req.io) {
      req.io.emit('simulation-progress', { 
        simulationId: simulation._id, 
        progress: 100, 
        message: 'Simulation completed successfully',
        simulationId: simulation._id
      });
    }

    res.status(201).json({
      success: true,
      data: simulation
    });
  } catch (error) {
    console.error('Simulation creation error:', error);
    
    if (req.io) {
      req.io.emit('simulation-progress', { 
        simulationId: 'new', 
        progress: 0, 
        message: 'Simulation failed',
        error: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
});

// Rerun simulation
router.post('/:id/rerun', async (req, res) => {
  try {
    const simulation = await Simulation.findById(req.params.id)
      .populate('towers');

    if (!simulation) {
      return res.status(404).json({
        success: false,
        error: 'Simulation not found'
      });
    }

    // Regenerate coverage data
    const { coverageData, statistics } = CoverageCalculator.generateCoverageData(
      simulation.area,
      simulation.towers,
      simulation.parameters,
      simulation.gridResolution
    );

    // Update simulation with new data
    simulation.coverageData = coverageData;
    simulation.statistics = statistics;
    await simulation.save();

    res.json({
      success: true,
      data: simulation
    });
  } catch (error) {
    console.error('Simulation error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Server Error'
    });
  }
});

module.exports = router;

