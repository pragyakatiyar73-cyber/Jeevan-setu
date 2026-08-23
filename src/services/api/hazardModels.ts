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
