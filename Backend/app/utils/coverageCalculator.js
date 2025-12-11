class CoverageCalculator {
  static calculateSignalStrength(distance, p0 = -30, n = 3.0, frequency = 2100, txPower = 20, antennaGain = 10) {
    if (distance === 0) return p0;
    
    // Log-distance path loss model: P(d) = P₀ - 10n log₁₀(d + 1)
    let signalStrength = p0 - 10 * n * Math.log10(distance + 1);
    
    // Apply free space path loss as a lower bound
    const freeSpaceLoss = 20 * Math.log10(distance) + 20 * Math.log10(frequency) - 27.55;
    signalStrength = Math.max(signalStrength, -freeSpaceLoss);
    
    return signalStrength;
  }

  static dBmToBars(dBm, sensitivity = -100) {
    if (dBm < sensitivity) return 0;
    
    const range = Math.abs(sensitivity);
    const normalized = (dBm - sensitivity) / range;
    
    if (normalized >= 0.8) return 5;
    if (normalized >= 0.6) return 4;
    if (normalized >= 0.4) return 3;
    if (normalized >= 0.2) return 2;
    return 1;
  }

  static calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371000; // Earth radius in meters
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  static generateCoverageData(area, towers, parameters, gridResolution = 100, progressCallback = null) {
    const coverageData = [];
    const latStep = (area.northEast.latitude - area.southWest.latitude) / gridResolution;
    const lngStep = (area.northEast.longitude - area.southWest.longitude) / gridResolution;
    
    let totalPoints = 0;
    let coveredPoints = 0;
    let strongCoverage = 0;
    let weakCoverage = 0;
    let totalSignalStrength = 0;

    for (let i = 0; i <= gridResolution; i++) {
      for (let j = 0; j <= gridResolution; j++) {
        const lat = area.southWest.latitude + (i * latStep);
        const lng = area.southWest.longitude + (j * lngStep);
        
        let maxSignal = -Infinity;
        let bestNetwork = '';
        let bestTower = null;
        let bestDistance = 0;

        towers.forEach(tower => {
          const distance = this.calculateDistance(
            lat, lng, 
            tower.location.latitude, tower.location.longitude
          );
          
          const signalStrength = this.calculateSignalStrength(
            distance,
            tower.parameters.referencePower,
            parameters.pathLossExponent,
            tower.parameters.frequency,
            tower.parameters.transmitterPower,
            tower.parameters.antennaGain
          );
          
          if (signalStrength > maxSignal) {
            maxSignal = signalStrength;
            bestNetwork = tower.network;
            bestTower = tower._id;
            bestDistance = distance;
          }
        });

        const signalBars = this.dBmToBars(maxSignal, parameters.receiverSensitivity);
        
        coverageData.push({
          latitude: lat,
          longitude: lng,
          signalStrength: maxSignal,
          signalBars: signalBars,
          network: bestNetwork,
          servingTower: bestTower,
          distance: bestDistance
        });

        totalPoints++;
        totalSignalStrength += maxSignal;
        
        if (signalBars > 0) coveredPoints++;
        if (signalBars >= 4) strongCoverage++;
        if (signalBars >= 1 && signalBars <= 2) weakCoverage++;

        // Progress callback
        if (progressCallback && totalPoints % 100 === 0) {
          const progress = (totalPoints / ((gridResolution + 1) * (gridResolution + 1))) * 100;
          progressCallback(progress);
        }
      }
    }

    const statistics = {
      overallCoverage: (coveredPoints / totalPoints) * 100,
      strongCoverage: (strongCoverage / totalPoints) * 100,
      weakCoverage: (weakCoverage / totalPoints) * 100,
      noCoverage: ((totalPoints - coveredPoints) / totalPoints) * 100,
      averageSignalStrength: totalSignalStrength / totalPoints,
      coverageArea: this.calculateCoverageArea(area, coveredPoints / totalPoints)
    };

    return { coverageData, statistics };
  }

  static calculateCoverageArea(area, coverageRatio) {
    const latDistance = this.calculateDistance(
      area.southWest.latitude, area.southWest.longitude,
      area.northEast.latitude, area.southWest.longitude
    );
    
    const lngDistance = this.calculateDistance(
      area.southWest.latitude, area.southWest.longitude,
      area.southWest.latitude, area.northEast.longitude
    );
    
    const totalArea = (latDistance * lngDistance) / 1000000; // Convert to km²
    return totalArea * coverageRatio;
  }
}

module.exports = CoverageCalculator;


