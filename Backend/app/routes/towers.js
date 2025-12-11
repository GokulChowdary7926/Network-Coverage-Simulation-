const express = require('express');
const Tower = require('../models/Tower');
const router = express.Router();

// Get all towers with filtering
router.get('/', async (req, res) => {
  try {
    const { network, status, technology, page = 1, limit = 200 } = req.query; // Increased default limit to show all towers
    let filter = {};
    
    if (network) filter.network = network;
    if (status) filter.status = status;
    if (technology) filter.technology = { $in: [technology] };

    const towers = await Tower.find(filter)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await Tower.countDocuments(filter);

    res.json({
      success: true,
      count: towers.length,
      total,
      pages: Math.ceil(total / limit),
      current: page,
      data: towers
    });
  } catch (error) {
    console.error('Error in GET /towers:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Server Error'
    });
  }
});

// Get tower by ID
router.get('/:id', async (req, res) => {
  try {
    const tower = await Tower.findById(req.params.id);
    
    if (!tower) {
      return res.status(404).json({
        success: false,
        error: 'Tower not found'
      });
    }

    res.json({
      success: true,
      data: tower
    });
  } catch (error) {
    console.error('Error in GET /towers:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Server Error'
    });
  }
});

// Create new tower
router.post('/', async (req, res) => {
  try {
    console.log('Creating tower with data:', JSON.stringify(req.body, null, 2));
    
    // Validate required fields
    if (!req.body.towerId || !req.body.name) {
      return res.status(400).json({
        success: false,
        error: 'Tower ID and name are required'
      });
    }

    if (!req.body.location || !req.body.location.latitude || !req.body.location.longitude) {
      return res.status(400).json({
        success: false,
        error: 'Location with latitude and longitude are required'
      });
    }

    const tower = await Tower.create(req.body);
    
    res.status(201).json({
      success: true,
      data: tower
    });
  } catch (error) {
    console.error('Tower creation error:', error);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        error: messages.join(', ')
      });
    } else if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: `Tower ID "${req.body.towerId}" already exists. Please use a unique ID.`
      });
    } else {
      res.status(500).json({
        success: false,
        error: error.message || 'Server Error'
      });
    }
  }
});

// Update tower
router.put('/:id', async (req, res) => {
  try {
    console.log('Updating tower:', req.params.id);
    
    const tower = await Tower.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );

    if (!tower) {
      return res.status(404).json({
        success: false,
        error: 'Tower not found'
      });
    }

    res.json({
      success: true,
      data: tower
    });
  } catch (error) {
    console.error('Tower update error:', error);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        error: messages.join(', ')
      });
    } else if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: `Tower ID "${req.body.towerId}" already exists. Please use a unique ID.`
      });
    }
    
    res.status(500).json({
      success: false,
      error: error.message || 'Server Error'
    });
  }
});

// Delete tower
router.delete('/:id', async (req, res) => {
  try {
    const tower = await Tower.findById(req.params.id);

    if (!tower) {
      return res.status(404).json({
        success: false,
        error: 'Tower not found'
      });
    }

    await tower.deleteOne();

    res.json({
      success: true,
      data: {}
    });
  } catch (error) {
    console.error('Error in GET /towers:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Server Error'
    });
  }
});

// Get nearby towers
router.get('/nearby/:lat/:lng', async (req, res) => {
  try {
    const { lat, lng } = req.params;
    const maxDistance = req.query.distance || 10000;

    const towers = await Tower.find({
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(lng), parseFloat(lat)]
          },
          $maxDistance: parseInt(maxDistance)
        }
      }
    });

    res.json({
      success: true,
      count: towers.length,
      data: towers
    });
  } catch (error) {
    console.error('Error in GET /towers:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Server Error'
    });
  }
});

// Seed demo towers around a location
router.post('/seed-location', async (req, res) => {
  try {
    const { latitude, longitude, clearExisting = false } = req.body;

    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        error: 'Latitude and longitude are required'
      });
    }

    // Only clear existing towers if explicitly requested
    if (clearExisting) {
      await Tower.deleteMany({});
      console.log('Cleared existing towers');
    }

    // Function to generate random offset in kilometers
    function randomOffset(maxKm) {
      const offsetKm = (Math.random() - 0.5) * 2 * maxKm;
      return offsetKm / 111; // Convert to degrees (1 degree ≈ 111 km)
    }

    const networks = ['telco1', 'telco2', 'telco3', 'multi'];
    const technologies = [['2G'], ['3G'], ['4G'], ['5G'], ['4G', '5G']];
    const statuses = ['active', 'active', 'active', 'maintenance'];

    const towerNames = [
      'Main Tower', 'North Tower', 'South Tower', 'East Tower', 'West Tower',
      'Central Tower', 'Primary Tower', 'Secondary Tower', 'Tower Alpha', 'Tower Beta',
      'Tower Gamma', 'Tower Delta', 'Tower Echo', 'Tower Foxtrot', 'Tower Golf'
    ];

    // Get existing tower IDs to avoid duplicates
    const existingTowers = await Tower.find({}, 'towerId');
    const existingIds = new Set(existingTowers.map(t => t.towerId));
    
    // Find next available tower number
    let towerNumber = 1;
    if (!clearExisting && existingTowers.length > 0) {
      const towerNumbers = existingTowers
        .map(t => {
          const match = t.towerId.match(/^TOWER-(\d+)$/);
          return match ? parseInt(match[1]) : 0;
        })
        .filter(n => n > 0);
      
      if (towerNumbers.length > 0) {
        towerNumber = Math.max(...towerNumbers) + 1;
      }
    }

    const towers = [];
    const numTowers = 120; // Generate 120 towers for better coverage visualization

    for (let i = 0; i < numTowers; i++) {
      // Better distribution: mix of random and circular patterns for 120 towers
      let latOffset, lngOffset;
      
      if (i % 3 === 0) {
        // Circular distribution for better coverage visualization
        const angle = (i / numTowers) * 2 * Math.PI;
        const radius = 3 + (i % 10) * 0.5; // Vary radius 3-8km
        latOffset = Math.cos(angle) * radius / 111;
        lngOffset = Math.sin(angle) * radius / 111;
      } else {
        // Random distribution within 10km radius
        latOffset = randomOffset(10);
        lngOffset = randomOffset(10);
      }
      
      const lat = parseFloat(latitude) + latOffset;
      const lng = parseFloat(longitude) + lngOffset;

      // Generate unique tower ID
      let towerId;
      do {
        towerId = `TOWER-${String(towerNumber).padStart(3, '0')}`;
        towerNumber++;
      } while (existingIds.has(towerId) && !clearExisting);

      const tower = {
        towerId: towerId,
        name: towerNames[i % towerNames.length] + ` ${towerNumber - 1}`,
        location: {
          latitude: parseFloat(lat.toFixed(6)),
          longitude: parseFloat(lng.toFixed(6)),
          address: `Tower Location ${i + 1}, Near Your Area`
        },
        network: networks[i % networks.length],
        technology: technologies[i % technologies.length],
        parameters: {
          referencePower: -30 + Math.random() * 10 - 5,
          pathLossExponent: 2.5 + Math.random() * 1.5,
          frequency: [800, 900, 1800, 2100, 2600][Math.floor(Math.random() * 5)],
          antennaHeight: 20 + Math.random() * 40,
          transmitterPower: 15 + Math.random() * 15,
          antennaGain: 8 + Math.random() * 12
        },
        capacity: Math.floor(500 + Math.random() * 1500),
        coverageRadius: Math.floor(2000 + Math.random() * 5000), // 2-7km coverage
        status: statuses[Math.floor(Math.random() * statuses.length)],
        installedDate: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000 * 2),
        lastMaintenance: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000),
        notes: `Demo tower placed around your location`
      };

      towers.push(tower);
    }

    // Insert towers
    const createdTowers = await Tower.insertMany(towers);

    res.json({
      success: true,
      count: createdTowers.length,
      cleared: clearExisting,
      message: clearExisting 
        ? `Successfully placed ${createdTowers.length} demo towers around your location (existing towers cleared)`
        : `Successfully added ${createdTowers.length} demo towers around your location (existing towers kept)`,
      center: { latitude, longitude }
    });
  } catch (error) {
    console.error('Error seeding towers:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Server Error'
    });
  }
});

module.exports = router;

