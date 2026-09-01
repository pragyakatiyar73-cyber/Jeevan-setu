/**
 * 📊 Hazard & Machine Learning Risk Models (Category 3 ML Core)
 * 
 * Mathematical and algorithmic models calculating Landslide Hazard Index (LHI),
 * Flood Vulnerability Index (FVI), and Road Disruption Risk.
 */

export interface LandslideHazardInput {
  slopeDegrees: number;        // 0 to 90 degrees
  rainfall24h: number;         // mm of rain
  soilMoisturePercent: number; // 0 to 100%
  vegetationIndex: number;     // 0 (barren/deforested) to 1 (dense canopy)
}

export interface FloodVulnerabilityInput {
  precipitationHourly: number; // mm/hr
  riverDistanceMeters: number;  // meters to closest waterbody
  elevationMeters: number;      // altitude
  drainageQuality: number;      // 0 (poor) to 1 (excellent)
}

export interface HazardAssessment {
  score: number; // 0 to 100
  riskLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  contributingFactors: string[];
  safeForHeavyConvoys: boolean;
}

/**
 * Calculates Landslide Hazard Index (LHI)
 * Based on multi-criteria evaluation (MCE) matrix used in disaster engineering
 */
export function calculateLandslideHazardIndex(input: LandslideHazardInput): HazardAssessment {
  const { slopeDegrees, rainfall24h, soilMoisturePercent, vegetationIndex } = input;

  // Normalized weights
  const wSlope = 0.40;
  const wRain = 0.30;
  const wSoil = 0.20;
  const wVeg = 0.10;

  const slopeScore = Math.min(100, (slopeDegrees / 60) * 100);
  const rainScore = Math.min(100, (rainfall24h / 150) * 100);
  const soilScore = soilMoisturePercent;
  const vegRiskScore = (1 - vegetationIndex) * 100;

  const compositeScore = Math.round(
    slopeScore * wSlope +
    rainScore * wRain +
    soilScore * wSoil +
    vegRiskScore * wVeg
  );

  const factors: string[] = [];
  if (slopeDegrees > 35) factors.push(`Steep slope gradient (${slopeDegrees}°)`);
  if (rainfall24h > 75) factors.push(`Excessive 24h rainfall (${rainfall24h}mm)`);
  if (soilMoisturePercent > 80) factors.push(`Soil saturation near critical limit (${soilMoisturePercent}%)`);
  if (vegetationIndex < 0.3) factors.push('Low vegetation/deforestation increases slip probability');

  let riskLevel: HazardAssessment['riskLevel'] = 'LOW';
  if (compositeScore >= 75) riskLevel = 'CRITICAL';
  else if (compositeScore >= 50) riskLevel = 'HIGH';
  else if (compositeScore >= 30) riskLevel = 'MODERATE';

  return {
    score: compositeScore,
    riskLevel,
    contributingFactors: factors,
    safeForHeavyConvoys: compositeScore < 50
  };
}

/**
 * Calculates Flood Vulnerability Index (FVI)
 */
export function calculateFloodVulnerabilityIndex(input: FloodVulnerabilityInput): HazardAssessment {
  const { precipitationHourly, riverDistanceMeters, elevationMeters, drainageQuality } = input;

  const rainFactor = Math.min(100, (precipitationHourly / 80) * 100) * 0.45;
  const proximityFactor = Math.max(0, 100 - (riverDistanceMeters / 500) * 100) * 0.30;
  const elevationSafety = Math.max(0, 100 - (elevationMeters / 100) * 100) * 0.15;
  const drainagePenalty = (1 - drainageQuality) * 100 * 0.10;

  const compositeScore = Math.round(rainFactor + proximityFactor + elevationSafety + drainagePenalty);

  const factors: string[] = [];
  if (precipitationHourly > 30) factors.push(`Heavy torrential downpour (${precipitationHourly}mm/hr)`);
  if (riverDistanceMeters < 200) factors.push(`High proximity to riverbank (${riverDistanceMeters}m)`);
  if (elevationMeters < 15) factors.push(`Low-lying basin elevation (${elevationMeters}m MSL)`);
  if (drainageQuality < 0.4) factors.push('Severe drainage congestion');

  let riskLevel: HazardAssessment['riskLevel'] = 'LOW';
  if (compositeScore >= 70) riskLevel = 'CRITICAL';
  else if (compositeScore >= 45) riskLevel = 'HIGH';
  else if (compositeScore >= 25) riskLevel = 'MODERATE';

  return {
    score: Math.min(100, compositeScore),
    riskLevel,
    contributingFactors: factors,
    safeForHeavyConvoys: compositeScore < 45
  };
}

export interface NorthIndiaStateDisasterProfile {
  state: string;
  regionCategory: 'MOUNTAIN' | 'DESERT' | 'AGRICULTURAL' | 'URBAN' | 'HIGH_ALTITUDE' | 'PLAINS';
  primaryHazards: string[];
  hillRoadStatus?: '🟢 Safe' | '🟡 Risky' | '🔴 Blocked';
  waterPriority?: {
    urgency: 'CRITICAL' | 'HIGH' | 'MODERATE' | 'NORMAL';
    drinkingWaterRequiredLiters: number;
    coolingSheltersNeeded: number;
    supplies: string[];
  };
  agriImpact?: {
    cropDamageRiskPercent: number;
    floodedAgriHectares: number;
    affectedVillagesCount: number;
    villageAccessStatus: string;
  };
  highAltitudeRisk?: {
    extremeColdRating: string;
    avalancheRiskLevel: string;
    rescueDifficultyIndex: string;
    vehicleSuitability: string;
  };
  urbanImpact?: {
    waterloggingSeverity: string;
    trafficDisruptionLevel: string;
    hospitalRouteStatus: string;
    denseFogWarning: boolean;
  };
  recommendedVehicles: string[];
  recommendedResources: string[];
}

/**
 * Region-Aware AI Disaster Intelligence Engine
 * Dynamically computes state-specific disaster profiles, road statuses, resource requirements, and vehicle selections.
 */
export function calculateStateSpecificDisasterProfile(
  stateName: string,
  lat: number,
  lon: number,
  precipHourly: number = 0,
  tempC: number = 25,
  windGustKmH: number = 15,
  slopeDegrees: number = 10,
  soilMoisture: number = 50
): NorthIndiaStateDisasterProfile {
  const normState = stateName.toLowerCase();

  // 🏔️ 1. UTTARAKHAND (Mountain Disaster Intelligence)
  if (normState.includes('uttarakhand') || normState.includes('uk') || (lat >= 29.0 && lat <= 31.5 && lon >= 77.5 && lon <= 81.0)) {
    const isSevereRain = precipHourly > 25 || (precipHourly > 10 && slopeDegrees > 25) || soilMoisture > 80;
    const isRisky = precipHourly > 8 || slopeDegrees > 20 || soilMoisture > 65;

    let hillRoadStatus: '🟢 Safe' | '🟡 Risky' | '🔴 Blocked' = '🟢 Safe';
    if (isSevereRain) hillRoadStatus = '🔴 Blocked';
    else if (isRisky) hillRoadStatus = '🟡 Risky';

    return {
      state: 'Uttarakhand',
      regionCategory: 'MOUNTAIN',
      primaryHazards: ['⛰️ Landslides', '🌊 Flash Floods', '🏔️ Glacier Lake Outburst (GLOF)', '🌧️ Cloudbursts', '🛣️ Mountain Road Blockages'],
      hillRoadStatus,
      recommendedVehicles: ['🚜 Heavy Machinery (Excavators/JCBs)', '🚙 4x4 Off-Road Rescue Vehicles', '🚁 IAF / SDRF Helicopters'],
      recommendedResources: ['Excavators & Bulldozers', 'Emergency Ropes & Harnesses', 'High-Altitude Tents', 'Satellite Phones', 'Medical Trauma Kits']
    };
  }

  // 🏔️ 2. HIMACHAL PRADESH (Mountain & Snow Intelligence)
  if (normState.includes('himachal') || normState.includes('hp') || (lat >= 31.0 && lat <= 33.3 && lon >= 75.5 && lon <= 79.0)) {
    const isSevere = precipHourly > 20 || tempC < -5 || windGustKmH > 50;
    const isRisky = precipHourly > 8 || tempC < 0;

    let hillRoadStatus: '🟢 Safe' | '🟡 Risky' | '🔴 Blocked' = '🟢 Safe';
    if (isSevere) hillRoadStatus = '🔴 Blocked';
    else if (isRisky) hillRoadStatus = '🟡 Risky';

    return {
      state: 'Himachal Pradesh',
      regionCategory: 'MOUNTAIN',
      primaryHazards: ['⛰️ Mountain Landslides', '❄️ Heavy Snowstorms', '🏔️ Avalanche Hazard', '🌧️ Cloudbursts', '🌊 River Floods'],
      hillRoadStatus,
      highAltitudeRisk: {
        extremeColdRating: tempC < -5 ? 'EXTREME' : tempC < 2 ? 'MODERATE' : 'LOW',
        avalancheRiskLevel: tempC < 0 && precipHourly > 10 ? 'HIGH' : 'LOW',
        rescueDifficultyIndex: 'HIGH (Mountain Terrain)',
        vehicleSuitability: 'Snow Chains & Heavy 4x4 Only'
      },
      recommendedVehicles: ['🚜 Snow Blowers & JCB Excavators', '🚙 Heavy Duty 4x4 Rescue Trucks', '🚁 Air Evacuation Helicopter'],
      recommendedResources: ['Snow Chains', 'Thermal Blankets', 'De-icing Salt', 'Emergency Fuel Buffers', 'Ration Packs']
    };
  }

  // 🏜️ 3. RAJASTHAN (Desert Disaster Intelligence & Water Priority System)
  if (normState.includes('rajasthan') || normState.includes('rj') || (lat >= 23.5 && lat <= 30.2 && lon >= 69.5 && lon <= 78.2)) {
    const isExtremeHeat = tempC >= 42;
    const isHeatwave = tempC >= 38;

    return {
      state: 'Rajasthan',
      regionCategory: 'DESERT',
      primaryHazards: ['🔥 Extreme Heatwaves', '💧 Severe Water Scarcity', '🌪️ Dust Storms (Andhi)', '🌧️ Flash Floods', '⚡ Lightning Strikes'],
      waterPriority: {
        urgency: isExtremeHeat ? 'CRITICAL' : isHeatwave ? 'HIGH' : 'MODERATE',
        drinkingWaterRequiredLiters: isExtremeHeat ? 150000 : 75000,
        coolingSheltersNeeded: isExtremeHeat ? 24 : 12,
        supplies: ['Mobile Water Tankers', 'Oral Rehydration Salts (ORS)', 'Shade Tents', 'Cooling Misting Fans']
      },
      recommendedVehicles: ['🚚 Water Tanker Convoys', '🚙 Desert 4x4 Off-Road Ambulances', '🚒 Mobile Cooling & Mist Vehicles'],
      recommendedResources: ['Mobile Drinking Water Tankers', 'ORS & Electrolytes', 'Cooling Shelter Kits', 'Emergency Heatstroke Medical Kits']
    };
  }

  // 🌾 4. PUNJAB (Agricultural & River Flood Impact System)
  if (normState.includes('punjab') || normState.includes('pb') || (lat >= 29.5 && lat <= 32.5 && lon >= 73.8 && lon <= 76.9)) {
    const isFlooding = precipHourly > 15 || soilMoisture > 80;
    const cropDamage = isFlooding ? Math.min(95, Math.round(precipHourly * 3.5 + soilMoisture * 0.4)) : 10;

    return {
      state: 'Punjab',
      regionCategory: 'AGRICULTURAL',
      primaryHazards: ['🌊 River Flooding (Sutlej/Beas/Ravi)', '🌧️ Heavy Rainfall', '🌾 Crop Damage', '🌫️ Dense Winter Fog', '🔥 Summer Heatwaves'],
      agriImpact: {
        cropDamageRiskPercent: cropDamage,
        floodedAgriHectares: isFlooding ? Math.round(cropDamage * 450) : 500,
        affectedVillagesCount: isFlooding ? Math.round(cropDamage * 2.2) : 12,
        villageAccessStatus: isFlooding ? 'Partially Submerged Feeder Roads' : 'Clear Farm Access'
      },
      recommendedVehicles: ['🚤 NDRF Motorized Rescue Boats', '🚜 Heavy Agricultural De-watering Pumps', '🚑 All-Terrain Relief Ambulances'],
      recommendedResources: ['De-watering High-Volume Pumps', 'Inflatable Motor Boats', 'Fodder for Livestock', 'Water Purification Tablets']
    };
  }

  // 🌾 5. HARYANA (Urban & Agricultural Emergency System)
  if (normState.includes('haryana') || normState.includes('hr') || (lat >= 27.6 && lat <= 30.9 && lon >= 74.5 && lon <= 77.6)) {
    const isFlooding = precipHourly > 18;
    const cropDamage = isFlooding ? Math.min(85, Math.round(precipHourly * 3.0 + 20)) : 15;

    return {
      state: 'Haryana',
      regionCategory: 'AGRICULTURAL',
      primaryHazards: ['🌊 Yamuna / Ghaggar Flooding', '🏙️ Urban Highway Waterlogging', '🔥 Extreme Heatwaves', '🌫️ Dense Smog/Fog', '🌧️ Heavy Torrential Rain'],
      agriImpact: {
        cropDamageRiskPercent: cropDamage,
        floodedAgriHectares: isFlooding ? Math.round(cropDamage * 320) : 300,
        affectedVillagesCount: isFlooding ? Math.round(cropDamage * 1.8) : 8,
        villageAccessStatus: isFlooding ? 'Submerged Feeder Arterials' : 'Nominal Transit'
      },
      urbanImpact: {
        waterloggingSeverity: isFlooding ? 'HIGH' : 'LOW',
        trafficDisruptionLevel: isFlooding ? 'MAJOR DIVERSIONS' : 'NORMAL',
        hospitalRouteStatus: 'Priority Corridor Active',
        denseFogWarning: tempC < 12
      },
      recommendedVehicles: ['🚜 High-Capacity Water Extraction Trucks', '🚤 Rescue Inflatable Boats', '🚑 Expressway Emergency Ambulances'],
      recommendedResources: ['Submersible De-watering Pumps', 'Expressway Traffic Diverters', 'Crop Insurance Assessment Units', 'Medical Kits']
    };
  }

  // 🏔️ 6. JAMMU & KASHMIR (High Altitude Emergency System)
  if (normState.includes('jammu') || normState.includes('kashmir') || normState.includes('j&k') || (lat >= 32.2 && lat <= 35.2 && lon >= 73.5 && lon <= 77.8)) {
    const isCold = tempC < -2;
    const isSevereSnow = precipHourly > 12 || tempC < -8;

    let hillRoadStatus: '🟢 Safe' | '🟡 Risky' | '🔴 Blocked' = '🟢 Safe';
    if (isSevereSnow) hillRoadStatus = '🔴 Blocked';
    else if (precipHourly > 5 || isCold) hillRoadStatus = '🟡 Risky';

    return {
      state: 'Jammu & Kashmir',
      regionCategory: 'HIGH_ALTITUDE',
      primaryHazards: ['🏔️ Alpine Landslides', '❄️ Extreme Snowstorms', '🏔️ Avalanches', '🛣️ NH-44 Highway Blockages', '🌊 River Surge (Jhelum)'],
      hillRoadStatus,
      highAltitudeRisk: {
        extremeColdRating: tempC < -10 ? 'EXTREME' : tempC < 0 ? 'HIGH' : 'MODERATE',
        avalancheRiskLevel: isCold && precipHourly > 8 ? 'CRITICAL' : 'MODERATE',
        rescueDifficultyIndex: 'SEVERE (Alpine Slopes)',
        vehicleSuitability: 'Heavy Snow Chains & Air Evacuation Required'
      },
      recommendedVehicles: ['🚜 Snow Clearance Heavy JCBs', '🚙 4x4 All-Wheel Rescue Transports', '🚁 Air Force Rescue Helicopters'],
      recommendedResources: ['High-Altitude Sleeping Bags', 'Oxygen Cylinders', 'Snow Chains', 'Kerosene Heaters', 'Dry Ration Supplies']
    };
  }

  // 🏔️ 7. LADAKH (High Altitude Cold & Extreme Rescue System)
  if (normState.includes('ladakh') || normState.includes('leh') || normState.includes('kargil') || (lat >= 32.5 && lat <= 36.0 && lon >= 75.5 && lon <= 80.5)) {
    return {
      state: 'Ladakh',
      regionCategory: 'HIGH_ALTITUDE',
      primaryHazards: ['🏔️ High-Altitude Avalanches', '❄️ Extreme Sub-Zero Cold', '🌊 Glacial Flash Floods', '⛰️ Landslides', '🛣️ Remote Pass Isolation'],
      hillRoadStatus: tempC < -5 || precipHourly > 5 ? '🔴 Blocked' : '🟡 Risky',
      highAltitudeRisk: {
        extremeColdRating: tempC < -15 ? 'CRITICAL (-20°C+ Sub-Zero)' : 'EXTREME',
        avalancheRiskLevel: 'HIGH ALERT',
        rescueDifficultyIndex: 'MAXIMUM (Remote Passes >5,000m MSL)',
        vehicleSuitability: 'Specialized High-Altitude Air Evacuation & Snow Crawlers'
      },
      recommendedVehicles: ['🚁 Air Force High-Altitude Helicopters', '🚜 Heavy Snow Blowers & Dozers', '🚙 Specialized Military 4x4 Ambulances'],
      recommendedResources: ['High-Altitude Medical Oxygen', 'Extreme Sub-Zero Thermal Gear', 'Satellite Emergency Beacons', 'De-icing Equipment']
    };
  }

  // 🏙️ 8. DELHI (NCT) (Urban Disaster Intelligence System)
  if (normState.includes('delhi') || normState.includes('nct') || (lat >= 28.4 && lat <= 28.9 && lon >= 76.8 && lon <= 77.4)) {
    const isWaterlogged = precipHourly > 15;
    const isHeatwave = tempC >= 40;

    return {
      state: 'Delhi (NCT)',
      regionCategory: 'URBAN',
      primaryHazards: ['🌧️ Urban Flooding & Drainage Overflow', '🔥 Extreme Heatwaves', '🌫️ Severe Air Pollution & Smog', '🌫️ Dense Winter Fog', '⚡ Severe Storm Cells'],
      urbanImpact: {
        waterloggingSeverity: isWaterlogged ? 'CRITICAL (Underpass & Arterial Inundation)' : 'LOW',
        trafficDisruptionLevel: isWaterlogged ? 'SEVERE CONGESTION & DIVERSIONS' : 'NORMAL',
        hospitalRouteStatus: 'Green Corridor Active for Emergency Vehicles',
        denseFogWarning: tempC < 10
      },
      waterPriority: isHeatwave ? {
        urgency: 'HIGH',
        drinkingWaterRequiredLiters: 100000,
        coolingSheltersNeeded: 18,
        supplies: ['Mobile Water Vans', 'ORS Centers', 'Public Cooling Stations']
      } : undefined,
      recommendedVehicles: ['🚑 Green Corridor Emergency Ambulances', '🚜 Super-Sucker Drainage Extraction Vehicles', '🚒 Fire & Rescue Response Trucks'],
      recommendedResources: ['High-Capacity Drainage Pumps', 'Traffic Diversion Digital Boards', 'Air Quality Respirators', 'Heatstroke Triage Kits']
    };
  }

  // 🏙️ 9. CHANDIGARH (Smart City Emergency System)
  if (normState.includes('chandigarh') || (lat >= 30.65 && lat <= 30.80 && lon >= 76.70 && lon <= 76.85)) {
    const isWaterlogged = precipHourly > 18;

    return {
      state: 'Chandigarh',
      regionCategory: 'URBAN',
      primaryHazards: ['🌧️ Smart City Urban Inundation', '🔥 Extreme Summer Heatwaves', '🌫️ Dense Winter Fog', '⚡ Severe Thunderstorms'],
      urbanImpact: {
        waterloggingSeverity: isWaterlogged ? 'MODERATE (Sector Underpass Waterlogging)' : 'LOW',
        trafficDisruptionLevel: isWaterlogged ? 'SECTOR DIVERSIONS ACTIVE' : 'NOMINAL',
        hospitalRouteStatus: 'PGI / GMCH Green Emergency Corridor Active',
        denseFogWarning: tempC < 10
      },
      recommendedVehicles: ['🚑 Quick Response Emergency Ambulances', '🚜 Municipal Water Extraction Vans', '🚒 Rapid Rescue Response Units'],
      recommendedResources: ['Municipal Water Pumps', 'Hospital Transit Corridors', 'Emergency Public Notification System']
    };
  }

  // 🟢 10. UTTAR PRADESH (River Flooding & Agriculture System)
  if (normState.includes('uttar pradesh') || normState.includes('up') || (lat >= 23.8 && lat <= 30.5 && lon >= 77.0 && lon <= 84.6)) {
    const isFlood = precipHourly > 20 || soilMoisture > 75;
    const cropDamage = isFlood ? Math.min(90, Math.round(precipHourly * 3.2 + 25)) : 12;

    return {
      state: 'Uttar Pradesh',
      regionCategory: 'PLAINS',
      primaryHazards: ['🌊 River Flooding (Ganga/Yamuna/Ghaghara)', '🌧️ Heavy Torrential Rainfall', '🔥 Summer Heatwaves', '🌫️ Dense Winter Fog', '⚡ Lightning Strikes', '🌾 Crop Damage'],
      agriImpact: {
        cropDamageRiskPercent: cropDamage,
        floodedAgriHectares: isFlood ? Math.round(cropDamage * 600) : 400,
        affectedVillagesCount: isFlood ? Math.round(cropDamage * 3.5) : 15,
        villageAccessStatus: isFlood ? 'Riverbank Inundation & Boat Access Only' : 'Clear Rural Arterials'
      },
      recommendedVehicles: ['🚤 NDRF Motorized Rescue Boats', '🚚 Relief Supply Distribution Trucks', '🚑 Rural Health Mobile Ambulances'],
      recommendedResources: ['Inflatable Rescue Boats', 'Dry Ration Packets', 'Water Purification Kits', 'Lightning Safety Arresters']
    };
  }

  // 🌿 11. DEFAULT / PRESERVED NORTH-EAST & BIHAR STATES
  return {
    state: stateName || 'Regional Disaster Zone',
    regionCategory: slopeDegrees > 20 ? 'MOUNTAIN' : 'PLAINS',
    primaryHazards: ['🌊 River Flooding', '⛰️ Landslide Risk', '🌧️ Heavy Rainfall', '🛣️ Highway Access Disruption'],
    hillRoadStatus: slopeDegrees > 20 ? (precipHourly > 20 ? '🔴 Blocked' : precipHourly > 8 ? '🟡 Risky' : '🟢 Safe') : undefined,
    recommendedVehicles: ['🚤 NDRF Motorized Rescue Boats', '🚜 Heavy Machinery (JCBs)', '🚑 Emergency Relief Ambulances'],
    recommendedResources: ['Rescue Inflatable Boats', 'Water Extraction Pumps', 'Emergency Relief Food Kits', 'Medical Triage Packs']
  };
}
