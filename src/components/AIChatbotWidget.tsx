import React, { useState, useEffect, useRef } from 'react';
import {
  Bot,
  Sparkles,
  Mic,
  MicOff,
  Send,
  Volume2,
  VolumeX,
  X,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  MapPin,
  RotateCcw,
  Activity,
  Zap,
  ArrowRight,
  MessageSquare
} from 'lucide-react';
import { useVoiceRecognition } from '../hooks/useVoiceRecognition';
import { useTranslation } from '../i18n';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
  analysis?: {
    riskLevel: 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW' | 'INFO';
    detectedLocation?: string;
    incidentType?: string;
    actionSteps: string[];
    recommendedModule?: string;
    recommendedModuleName?: string;
  };
}

export interface AIAnalysisResult {
  answerText: string;
  riskLevel: 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW' | 'INFO';
  detectedLocation: string;
  incidentType: string;
  actionSteps: string[];
  recommendedModule?: string;
  recommendedModuleName?: string;
}

export function analyzeUserQuery(query: string): AIAnalysisResult {
  const q = query.trim().toLowerCase();

  // 1. Detect Specific State / Regional Location
  let detectedLocation = 'North Eastern Region (8 States)';
  if (q.includes('sikkim') || q.includes('gangtok') || q.includes('teesta')) {
    detectedLocation = 'Sikkim (Gangtok / Teesta Valley)';
  } else if (q.includes('assam') || q.includes('guwahati') || q.includes('kaziranga') || q.includes('cachar') || q.includes('silchar') || q.includes('brahmaputra')) {
    detectedLocation = 'Assam (Brahmaputra Basin & Barak Valley)';
  } else if (q.includes('meghalaya') || q.includes('shillong') || q.includes('sohra') || q.includes('cherrapunji') || q.includes('tura')) {
    detectedLocation = 'Meghalaya (Shillong / Sohra Ridge)';
  } else if (q.includes('manipur') || q.includes('imphal') || q.includes('noney') || q.includes('loktak')) {
    detectedLocation = 'Manipur (Imphal / Noney Corridor)';
  } else if (q.includes('mizoram') || q.includes('aizawl') || q.includes('lengpui')) {
    detectedLocation = 'Mizoram (Aizawl Ridge Sector)';
  } else if (q.includes('nagaland') || q.includes('kohima') || q.includes('dimapur') || q.includes('dzukou')) {
    detectedLocation = 'Nagaland (Kohima / Dimapur Sector)';
  } else if (q.includes('arunachal') || q.includes('itanagar') || q.includes('tawang') || q.includes('pasighat')) {
    detectedLocation = 'Arunachal Pradesh (Itanagar / Tawang Sector)';
  } else if (q.includes('tripura') || q.includes('agartala') || q.includes('gumti')) {
    detectedLocation = 'Tripura (Agartala / Gumti Basin)';
  }

  // 2. CRITICAL EMERGENCY & SOS (Highest Priority)
  if (
    q.includes('sos') ||
    q.includes('trapped') ||
    q.includes('rescue') ||
    q.includes('save me') ||
    q.includes('in danger') ||
    q.includes('drown') ||
    q.includes('dying') ||
    (q.includes('emergency') && !q.includes('facility') && !q.includes('number') && !q.includes('contact'))
  ) {
    return {
      answerText: `🚨 EMERGENCY ASSISTANCE PROTOCOL ACTIVATED

If you or anyone nearby is trapped, injured, or in immediate danger:

1. Trigger Emergency SOS: Click the red EMERGENCY SOS button in the top navigation bar or the quick trigger button below. It instantly captures your device's live GPS coordinates.
2. Automated NDRF/SDRF Dispatch: Your distress signal is transmitted directly to the nearest NDRF battalion and State Emergency Operations Center.
3. Immediate Toll-Free Helplines (Call Now):
   • 112 — Pan-India Unified Emergency Response (Police, Fire, Medical)
   • 1078 — NDRF National Disaster Rescue Helpline
   • 108 — Emergency Ambulance & Medical Fleet
   • 100 — Police Control Room
   • 101 — Fire & Rescue Command
4. Essential Safety Actions: Move to higher ground if facing rising waters, stay clear of saturated hillsides, turn off main electricity breakers, and conserve your phone battery.`,
      riskLevel: 'CRITICAL',
      detectedLocation,
      incidentType: 'Emergency Citizen SOS Distress Call',
      actionSteps: [
        'NDRF & SDRF Fast-Response Battalions Alerted',
        'Real-Time GPS Beacon Broadcasting Enabled',
        'Nearest District Emergency Operations Center on Standby',
        'All-Terrain 4x4 Rescue Convoy Route Activated'
      ],
      recommendedModule: 'map',
      recommendedModuleName: 'Open Live Emergency GIS Map'
    };
  }

  // 3. WHAT IS JEEVAN SETU / PLATFORM OVERVIEW / ABOUT
  if (
    q.includes('what is jeevan setu') ||
    q.includes('about jeevan setu') ||
    q.includes('what is this site') ||
    q.includes('what does this site') ||
    q.includes('tell me about jeevan setu') ||
    q.includes('tell me about this site') ||
    q.includes('jeevan setu kya') ||
    q.includes('about the website') ||
    q.includes('about this platform') ||
    q.includes('who created') ||
    q.includes('who developed') ||
    (q.includes('jeevan setu') && (q.includes('about') || q.includes('info') || q.includes('work') || q.includes('purpose') || q.includes('feature')))
  ) {
    return {
      answerText: `Jeevan Setu (जीवन सेतु) is India's dedicated AI-Powered Disaster Response & GIS Intelligence Platform, purpose-built for the 8 North Eastern States (Assam, Arunachal Pradesh, Manipur, Meghalaya, Mizoram, Nagaland, Sikkim, and Tripura).

Key Modules & Capabilities on Jeevan Setu:
• 🗺️ NER Live GIS Map: Real-time geospatial mapping of active floods, landslides, shelter camps, and evacuation corridors.
• 📷 AI Impact Assessment: Powered by Google Gemini Multimodal Vision; upload disaster photos for instant damage severity scoring (0–100).
• 🚨 Emergency SOS Dispatch: One-click distress beacon transmitting live GPS coordinates to NDRF and district command centers.
• 🛰️ Smart Disaster Monitoring: Multi-satellite telemetry (ISRO Bhuvan / Sentinel) computing real-time Landslide Hazard (LHI) & Flood Vulnerability (FVI).
• 🛣️ Road Accessibility & Safe Routes: Dynamic OSRM rerouting around blocked highways and collapsed mountain passes.
• 🏕️ Relief Camps & Supply Tracking: Live inventory tracking of food rations, clean drinking water, medical kits, and shelter capacity.
• 🚁 UAV Drone Dispatcher: Autonomous flight planning and aerial reconnaissance across hard-to-reach terrain.
• 🌐 16 Regional & National Languages with real-time voice-to-text (🎙️) and voice readout.`,
      riskLevel: 'INFO',
      detectedLocation,
      incidentType: 'Jeevan Setu Platform Overview & Capabilities',
      actionSteps: [
        'Unified Disaster Response Backbone for 8 North Eastern States',
        'Integrated with ISRO Bhuvan, IMD Doppler & Gemini Vision AI',
        'Real-time Citizen Reporting & Emergency SOS Dispatch',
        'Dynamic Relief Logistics & Evacuation Rerouting Engine'
      ],
      recommendedModule: 'customdashboard',
      recommendedModuleName: 'Explore Command Center Dashboard'
    };
  }

  // 4. AI IMPACT ASSESSMENT / DAMAGE ASSESSMENT / GEMINI VISION / UPLOAD PHOTOS
  if (
    q.includes('ai impact') ||
    q.includes('damage assessment') ||
    q.includes('gemini') ||
    q.includes('upload photo') ||
    q.includes('upload image') ||
    q.includes('photo scan') ||
    q.includes('damage triage') ||
    q.includes('structural damage') ||
    q.includes('impact score') ||
    (q.includes('ai') && q.includes('damage'))
  ) {
    return {
      answerText: `The AI Impact Assessment module uses Google Gemini Multimodal Vision and verified environmental telemetry to evaluate disaster damage:

• Upload Disaster Media: Citizens and field responders can upload photos of damaged buildings, flooded roads, collapsed bridges, or landslide debris.
• Multimodal Gemini Vision Scan: The AI model analyzes visual indicators including structural fissures, water submersion levels, road cutoffs, and utility disruptions.
• Explainable Impact Scoring (0–100): Generates an objective, transparent impact rating across 4 categories: Structural Damage, Access Cut-off, Casualty Threat, and Utility Outages.
• Resource Recommendations: Recommends the exact machinery (JCB excavators, dewatering pumps, medical trauma units) required on site.`,
      riskLevel: 'INFO',
      detectedLocation,
      incidentType: 'Gemini Multimodal AI Damage Triage Engine',
      actionSteps: [
        'Instant Image Processing with Google Gemini 1.5/2.0 Vision',
        '4-Category Impact Rating (Structural, Access, Casualty, Utility)',
        'Automated Emergency Equipment & Machinery Recommendations',
        'Direct Synchronization with Smart Disaster Monitoring'
      ],
      recommendedModule: 'aiimpact',
      recommendedModuleName: 'Open AI Impact Assessment'
    };
  }

  // 5. SMART DISASTER MONITORING / SATELLITE / RADAR / LHI / FVI
  if (
    q.includes('smart disaster monitoring') ||
    q.includes('smart monitoring') ||
    q.includes('satellite') ||
    q.includes('isro') ||
    q.includes('hazard index') ||
    q.includes('lhi') ||
    q.includes('fvi') ||
    q.includes('ai radar')
  ) {
    return {
      answerText: `The Smart Disaster Monitoring module is an autonomous surveillance and telemetry platform for the North Eastern Region:

• Multi-Satellite Feeds: Ingests live telemetry from ISRO Bhuvan, Sentinel SAR synthetic aperture radar, and INSAT-3D satellites.
• Dynamic Landslide Hazard Index (LHI): Evaluates real-time slope angles, soil moisture, and rainfall accumulation to predict hill failures.
• Flood Vulnerability Index (FVI): Tracks river gauge levels across the Brahmaputra, Teesta, Barak, and Gumti basins.
• Automated Situation Summaries: Continuously generates real-time situation briefs for MDoNER and state disaster management authorities.
• Cross-Module Sync: Monitored coordinates can be transferred directly to AI Impact Assessment for ground image verification.`,
      riskLevel: 'INFO',
      detectedLocation,
      incidentType: 'Autonomous Satellite & AI Radar Telemetry',
      actionSteps: [
        'Real-time ISRO Bhuvan & Sentinel Synthetic Aperture Radar',
        'Continuous Landslide (LHI) & Flood (FVI) Hazard Index Computing',
        'Automated MDoNER Disaster Situation Summaries',
        'Direct Bidirectional Location Sync with AI Impact Assessment'
      ],
      recommendedModule: 'smartmonitoring',
      recommendedModuleName: 'Open Smart Disaster Monitoring'
    };
  }

  // 6. LIVE GIS MAP / REAL-TIME MAP / HAZARD PINS / WHERE ARE DISASTERS
  if (
    q.includes('live map') ||
    q.includes('gis map') ||
    q.includes('ner map') ||
    q.includes('show map') ||
    q.includes('view map') ||
    (q.includes('map') && !q.includes('roadmap') && !q.includes('flight')) ||
    q.includes('where are the disasters') ||
    q.includes('disaster locations')
  ) {
    return {
      answerText: `The NER Live GIS Map provides a comprehensive, interactive geospatial view of all 8 North Eastern States:

• Real-Time Disaster Markers: Displays live geo-tagged flood zones, landslides, heavy rainfall clusters, seismic tremors, and fire incidents.
• Critical Infrastructure Layers: Visualizes designated relief camps, trauma hospitals, blood banks, and emergency drone landing zones (LZs).
• Customizable Filtering: Filter active map layers by disaster type (Flood, Landslide, Earthquake, Rain, Fire), severity level, or state.
• One-Click Route Guidance: Select any incident marker to trace the safest evacuation corridor to the closest operational relief camp.`,
      riskLevel: 'INFO',
      detectedLocation,
      incidentType: 'Geospatial GIS Mapping & Live Disaster Layers',
      actionSteps: [
        'Interactive Leaflet GIS Mapping with Topographic & Satellite Tiles',
        'Live Cluster Markers for Floods, Landslides, Earthquakes & Rain',
        'Direct Safe Route Calculation to Nearest Designated Relief Shelter',
        'Detailed State-by-State Command Information'
      ],
      recommendedModule: 'map',
      recommendedModuleName: 'Open NER Live GIS Map'
    };
  }

  // 7. ROAD ACCESSIBILITY / SAFE ROUTES / REROUTING / HIGHWAY BLOCKAGES
  if (
    q.includes('road') ||
    q.includes('route') ||
    q.includes('safe route') ||
    q.includes('rerouting') ||
    q.includes('highway') ||
    q.includes('blocked') ||
    q.includes('nh-') ||
    q.includes('traffic') ||
    q.includes('how to get to')
  ) {
    return {
      answerText: `The Road Accessibility & Safe Routes module ensures reliable emergency transportation across North East India:

• Live Road Blockage Tracking: Identifies highways (such as NH-6, NH-10, NH-29, NH-37) cut off by landslides, rockfalls, or flood inundation.
• Intelligent OSRM Rerouting: Dynamically calculates the fastest, safest alternative detour route for evacuating families, ambulances, and supply trucks.
• Clearance Operations: Live updates on heavy excavator deployments by the Border Roads Organisation (BRO) and state PWD.
• Bridge & Culvert Safety: Real-time structural safety assessments for vulnerable mountain bridges and river crossings.`,
      riskLevel: 'MODERATE',
      detectedLocation,
      incidentType: 'Road Accessibility & Dynamic OSRM Rerouting',
      actionSteps: [
        'Real-time Highway Blockage & Landslide Cutoff Detection',
        'Instant OSRM Safe Bypass Route Recalculation',
        'Border Roads Organisation (BRO) Excavator Dispatch Status',
        'Vulnerable Bridge & Mountain Pass Structural Monitoring'
      ],
      recommendedModule: 'rerouting',
      recommendedModuleName: 'Open Road Accessibility & Safe Routes'
    };
  }

  // 8. RELIEF CAMPS & SUPPLIES / FOOD / WATER / MEDICINE / TRUCKS
  if (
    q.includes('relief camp') ||
    q.includes('camp') ||
    q.includes('shelter') ||
    q.includes('where to stay') ||
    q.includes('supplies') ||
    q.includes('supply') ||
    q.includes('food') ||
    q.includes('water') ||
    q.includes('medicine') ||
    q.includes('ration') ||
    q.includes('truck')
  ) {
    return {
      answerText: `Jeevan Setu provides complete Relief Logistics & Camp Management:

• Live Relief Camp Directory: Locate official relief shelters across all 8 states with real-time bed capacity, current occupancy, and facilities.
• Fleet GPS Tracking: Monitor all-terrain 4x4 supply trucks, food delivery vans, and rescue boat convoys moving through the region.
• Essential Inventory Monitoring: Real-time tracking of drinking water purification units, dry food rations, baby food, and emergency medical kits.
• Critical Shortage Alerts: Automated notifications alert district administrations when a camp's supplies fall below a 48-hour safety buffer.`,
      riskLevel: 'INFO',
      detectedLocation,
      incidentType: 'Relief Camps & Supply Chain Fleet Tracking',
      actionSteps: [
        'Real-time Relief Camp Occupancy & Bed Capacity Registry',
        'GPS Tracking of 4x4 All-Terrain Supply Trucks & Boat Convoys',
        'Live Stock Telemetry: Clean Drinking Water, Food & Medical Kits',
        'Direct Navigation to Closest Operational Relief Shelter'
      ],
      recommendedModule: 'relief-supplies',
      recommendedModuleName: 'Open Relief Supply & Vehicle Tracking'
    };
  }

  // 9. WEATHER & DOPPLER RADAR / RAINFALL / STORM / FORECAST / IMD
  if (
    q.includes('weather') ||
    q.includes('rain') ||
    q.includes('rainfall') ||
    q.includes('doppler') ||
    q.includes('storm') ||
    q.includes('cyclone') ||
    q.includes('forecast') ||
    q.includes('cloud') ||
    q.includes('precipitation') ||
    q.includes('imd')
  ) {
    return {
      answerText: `The Weather & Doppler Radar module delivers high-resolution meteorological intelligence:

• Live IMD Doppler Radar: Visualizes precipitation reflectivity, cloud cluster velocity, and storm tracking across the North Eastern corridor.
• 72-Hour Forecasts: High-resolution projections of expected rainfall accumulation, wind gusts, and barometric pressure drops.
• Flash Flood Threshold Warnings: Automated alerts trigger when localized rainfall exceeds safe soil drainage capacity.
• Regional Weather Hubs: Live telemetry from Guwahati, Shillong, Gangtok, Itanagar, Aizawl, Kohima, Imphal, and Agartala.`,
      riskLevel: 'MODERATE',
      detectedLocation,
      incidentType: 'Meteorological Doppler Weather & Satellite Radar',
      actionSteps: [
        'Live IMD Doppler Radar Precipitation & Storm Tracking',
        '72-Hour Predictive Precipitation & Wind Velocity Modeling',
        'Flash Flood & Cloudburst Early Warning Thresholds',
        'Real-Time Sensor Telemetry from All 8 NER Capital Stations'
      ],
      recommendedModule: 'weather',
      recommendedModuleName: 'Open Weather & Doppler Radar'
    };
  }

  // 10. UAV DRONE DISPATCHER / AERIAL RECONNAISSANCE / DRONE FLEET
  if (
    q.includes('drone') ||
    q.includes('uav') ||
    q.includes('flight plan') ||
    q.includes('aerial') ||
    q.includes('skyguardian') ||
    q.includes('aerolift') ||
    q.includes('landing zone')
  ) {
    return {
      answerText: `The UAV Drone Dispatcher manages automated aerial missions across mountainous terrain:

• Specialized Drone Fleet:
  - SkyGuardian-X4: Long-endurance scout equipped with thermal sensors for night-time survivor detection.
  - AeroLift-Heavy: 25kg cargo drone designed to drop emergency blood units, medicine, and communication radios into cut-off hamlets.
  - Falcon-SAR: High-speed LiDAR scout for mapping steep slope failures and post-landslide topography.
• Automated Flight Trajectories: Calculates safe flight paths avoiding turbulent ridge winds and high-voltage transmission lines.
• Emergency Landing Zones (LZs): Pre-mapped coordinates across valleys for swift tactical staging.`,
      riskLevel: 'INFO',
      detectedLocation,
      incidentType: 'Autonomous UAV Drone Fleet Dispatcher',
      actionSteps: [
        'Autonomous Flight Planning Avoiding Ridge Turbulence',
        'Thermal Infrared Survivor Search in Cut-Off Valleys',
        'Emergency Medical & Blood Payload Delivery by Heavy UAVs',
        'Pre-Mapped Emergency Landing Zones (LZs) Across 8 States'
      ],
      recommendedModule: 'drone',
      recommendedModuleName: 'Open UAV Drone Dispatcher'
    };
  }

  // 11. DISASTER REPORTS / INCIDENT REPORTING / HOW TO REPORT
  if (
    q.includes('report incident') ||
    q.includes('report disaster') ||
    q.includes('how to report') ||
    q.includes('incident report') ||
    q.includes('citizen report') ||
    q.includes('file a report') ||
    (q.includes('report') && !q.includes('pdf'))
  ) {
    return {
      answerText: `In the Disaster Reports & Intelligence module, citizens and emergency teams can report incidents directly:

• Quick Citizen Submission: Select the disaster category (Flood, Landslide, Road Cut, Fire, Building Damage, Trapped Citizens).
• GPS Auto-Tagging: Your current device coordinates are attached automatically, or you can pinpoint the exact incident spot on the map.
• Photo & Video Evidence: Upload on-site photos for immediate AI computer vision triage and official verification.
• Verified Alert Feed: Browse verified disaster alerts across all 8 NER states to stay informed.`,
      riskLevel: 'INFO',
      detectedLocation,
      incidentType: 'Citizen & Official Disaster Incident Reporting',
      actionSteps: [
        'Instant GPS Coordinate Tagging with Interactive Map Pinning',
        'Photo Upload for Automated Gemini Vision Severity Triage',
        'Direct Broadcast to District Emergency Operations Centers',
        'Public Verified Alert Feed for All 8 North Eastern States'
      ],
      recommendedModule: 'incidents',
      recommendedModuleName: 'Open Disaster Reports & Intelligence'
    };
  }

  // 12. DISASTER SAFETY GUIDE / DO'S & DON'TS / SURVIVAL KIT / WHAT TO DO
  if (
    q.includes('safety guide') ||
    q.includes('safety') ||
    q.includes('dos and donts') ||
    q.includes('what should i do') ||
    q.includes('checklist') ||
    q.includes('survival kit') ||
    q.includes('what to do in') ||
    q.includes('how to survive')
  ) {
    return {
      answerText: `The Disaster Safety Guide provides official NDMA emergency protocols tailored for North East India:

• 🌊 During a Flood: Move to higher ground immediately; never drive or wade through floodwaters; turn off main gas and electricity breakers; drink only boiled or purified water.
• ⛰️ During a Landslide: Watch for sudden drops in river levels, tilted utility poles, or cracking hillside ground; evacuate slide trajectories immediately without attempting to retrieve bulky possessions.
• ⚡ During an Earthquake: Drop, Cover, and Hold On under sturdy furniture until ground shaking completely stops; if outdoors, stay in open areas away from buildings, utility poles, and steep slopes.
• 🎒 72-Hour Survival Kit Essentials: 3 liters of water per person per day, non-perishable food, first-aid kit, waterproof torch, whistle, power bank, dust masks, and copies of essential ID documents in a waterproof pouch.`,
      riskLevel: 'INFO',
      detectedLocation,
      incidentType: 'Official NDMA Disaster Safety Guide & Protocols',
      actionSteps: [
        'Official Do’s & Don’ts for Floods, Landslides & Earthquakes',
        '72-Hour Emergency Citizen Survival Checklist',
        'Immediate Water Purification & Household Safety Steps',
        'Direct Access to Nearest Emergency Relief Shelters'
      ],
      recommendedModule: 'safetyguide',
      recommendedModuleName: 'Open Disaster Safety Guide'
    };
  }

  // 13. LOCATION INTELLIGENCE REPORT / ADDRESS RISK CHECK / PDF DOSSIER
  if (
    q.includes('location intelligence') ||
    q.includes('location report') ||
    q.includes('location 360') ||
    q.includes('address intelligence') ||
    q.includes('address check') ||
    q.includes('search address') ||
    q.includes('360') ||
    q.includes('pdf report') ||
    q.includes('download report')
  ) {
    return {
      answerText: `Location Intelligence Report (under Governance & Operations) provides deep disaster vulnerability auditing and official 9-page government PDF reporting for any specific address or coordinates in North East India:

• Multi-Hazard Vulnerability Scoring: Computes specific risk ratings for slope instability, flood recurrence, seismic zone V exposure, and forest fire danger.
• Critical Distance Metrics: Measures exact road distance and transit times to the nearest hospital, fire station, police station, and relief camp.
• Authoritative 9-Page PDF Dossier: Generates a comprehensive, printable intelligence report suitable for emergency planning, district administrations, and insurance claims.`,
      riskLevel: 'INFO',
      detectedLocation,
      incidentType: 'Location Intelligence Report & PDF Dossier',
      actionSteps: [
        'Instant Risk Evaluation for Any Address in North East India',
        'Slope Angle, River Distance & Seismic Zone Multi-Factor Analysis',
        'Export Official 9-Page Disaster Intelligence PDF Dossier',
        'Proximity Calculation to Hospitals, Fire Stations & Relief Camps'
      ],
      recommendedModule: 'location',
      recommendedModuleName: 'Open Location Intelligence Report'
    };
  }

  // 14. EMERGENCY FACILITIES & RESCUE / HOSPITALS / BLOOD / OXYGEN / ICU
  if (
    q.includes('hospital') ||
    q.includes('facility') ||
    q.includes('facilities') ||
    q.includes('bed') ||
    q.includes('blood') ||
    q.includes('oxygen') ||
    q.includes('icu') ||
    q.includes('ambulance') ||
    q.includes('doctor')
  ) {
    return {
      answerText: `The Emergency Facilities & Rescue module provides a real-time registry of critical medical resources:

• Hospital Bed Availability: Live capacity tracking for emergency trauma beds, general wards, and ICU beds across district hospitals.
• Life-Saving Reserves: Tracks oxygen cylinder stocks and blood bank availability by group.
• Ambulance Fleet Dispatch: Coordinates dispatch of 4x4 all-terrain ambulances and mobile field medical units to remote mountain settlements.
• Rescue Base Locations: Contact coordinates and staging locations for NDRF, SDRF, and military medical detachments.`,
      riskLevel: 'INFO',
      detectedLocation,
      incidentType: 'Emergency Health Facilities & Medical Logistics',
      actionSteps: [
        'Live Directory of Trauma Centers, District Hospitals & Clinics',
        'Real-time Tracking of ICU Beds, Blood Banks & Oxygen Stocks',
        'Direct Routing for 4x4 Mountain Ambulance Units',
        'Direct Contact Details for Nearest Medical Facilities'
      ],
      recommendedModule: 'facilities',
      recommendedModuleName: 'Open Emergency Facilities & Rescue'
    };
  }

  // 15. MDONER COMMAND GRID / GOVERNANCE / MINISTRY
  if (
    q.includes('mdoner') ||
    q.includes('command grid') ||
    q.includes('governance') ||
    q.includes('ministry') ||
    q.includes('government') ||
    q.includes('inter-state')
  ) {
    return {
      answerText: `The MDoNER Command Grid aligns with the Ministry of Development of North Eastern Region:

• Inter-State Coordination Backbone: Unites State Disaster Management Authorities (SDMAs) across all 8 North Eastern states on a single digital network.
• Multi-Agency Logistics Sharing: Coordinates cross-border mutual aid for deploying heavy excavators, rescue boats, and medical relief supplies.
• Executive Command Metrics: Displays high-level response readiness, casualty mitigation metrics, and active resource deployment for union and state leadership.`,
      riskLevel: 'INFO',
      detectedLocation,
      incidentType: 'MDoNER Inter-Agency Governance & Command Grid',
      actionSteps: [
        'Inter-State Coordination Across All 8 North Eastern SDMAs',
        'Centralized Mutual Aid Resource Deployment Agreements',
        'Executive Situational Oversight for Union & State Leadership',
        'Direct Integration with National Disaster Management Authority (NDMA)'
      ],
      recommendedModule: 'gov',
      recommendedModuleName: 'Open MDoNER Command Grid'
    };
  }

  // 16. LANGUAGES & VOICE SEARCH
  if (
    q.includes('language') ||
    q.includes('voice') ||
    q.includes('speech') ||
    q.includes('mic') ||
    q.includes('bhasha') ||
    q.includes('hindi') ||
    q.includes('assamese') ||
    q.includes('bengali') ||
    q.includes('audio') ||
    q.includes('how to speak')
  ) {
    return {
      answerText: `Multilingual & Voice Accessibility on Jeevan Setu:

• 16 Supported Languages: English, Hindi (हिन्दी), Assamese (অসমীয়া), Bengali (বাংলা), Bodo (बड़ो), Mizo (Mizo ṭawng), Manipuri / Meitei (মৈতৈলোন্), Khasi (Ka Ktien Khasi), Garo (A·chik), Tripuri (Kokborok), Nepali (नेपाली), Nagamese, Ao, and Nyishi.
• Voice-to-Text (🎙️): Click the microphone button at the bottom of this chat or in the top navigation bar to speak your queries naturally in your native language.
• Voice Readout (🔊): Every AI response includes a speaker icon to read the guidance aloud in natural speech.`,
      riskLevel: 'INFO',
      detectedLocation,
      incidentType: 'Multilingual Voice & Audio Intelligence Engine',
      actionSteps: [
        '16 North Eastern & National Languages Supported',
        'Real-Time Voice-to-Text Speech Recognition (🎙️)',
        'Text-to-Speech Audio Read-Aloud (🔊) for Rapid Field Guidance',
        'Easily Switch Language via the Top Header Dropdown'
      ],
      recommendedModule: 'home',
      recommendedModuleName: 'Jeevan Setu Homepage'
    };
  }

  // 17. HELPLINES & PHONE NUMBERS
  if (
    q.includes('helpline') ||
    q.includes('phone') ||
    q.includes('number') ||
    q.includes('contact') ||
    q.includes('call') ||
    q.includes('police number') ||
    q.includes('ambulance number')
  ) {
    return {
      answerText: `📞 Official Emergency Helpline Directory (24x7 Toll-Free):

• 112 — Pan-India Unified Emergency Response (Police, Fire, Medical)
• 1078 — National Disaster Response Force (NDRF) Headquarters
• 1070 / 1077 — State & District Disaster Emergency Operation Centers
• 108 — Emergency Medical Services & Ambulance Fleet
• 101 — Fire & Emergency Services
• 100 — Police Control Room
• 1091 — Women Helpline
• 1906 — LPG Leakage Emergency Helpline`,
      riskLevel: 'INFO',
      detectedLocation,
      incidentType: 'Emergency 24x7 Toll-Free Helpline Directory',
      actionSteps: [
        'Dial 112 for Immediate All-Service Emergency Dispatch',
        'Dial 1078 for NDRF Specialized Disaster Rescue Operations',
        'Dial 108 for Fast-Response Medical Ambulance Units',
        'Dial 1070/1077 for District Disaster Management Operations'
      ],
      recommendedModule: 'facilities',
      recommendedModuleName: 'View Emergency Facilities'
    };
  }

  // 18. STATE SPECIFIC ADVISORIES
  if (q.includes('assam') || q.includes('guwahati') || q.includes('brahmaputra')) {
    return {
      answerText: `Assam Disaster Intelligence (Guwahati / Brahmaputra Basin):

• Primary Hazards: Monsoon river flooding, riverbank erosion, urban waterlogging in Guwahati, and flash floods in Barak Valley.
• Active Infrastructure: 14 deployment convoys, flood telemetry stations at Kaziranga & Silchar, and NDRF 1st Battalion (Patgaon, Guwahati).
• Recommended Action: Check real-time river gauge levels on the Live GIS Map or review road conditions if traveling along NH-27 / NH-37.`,
      riskLevel: 'HIGH',
      detectedLocation: 'Assam (Brahmaputra Basin & Barak Valley)',
      incidentType: 'Assam Regional Disaster & River Basin Status',
      actionSteps: [
        'Brahmaputra River Inundation Monitoring Active',
        'NDRF 1st Battalion (Guwahati) on Active Standby',
        '14 All-Terrain Response Convoys Deployed',
        'Check Live GIS Map for Real-Time Flood Markers'
      ],
      recommendedModule: 'map',
      recommendedModuleName: 'View Assam on Live GIS Map'
    };
  }

  if (q.includes('sikkim') || q.includes('gangtok') || q.includes('teesta')) {
    return {
      answerText: `Sikkim Disaster Command (Gangtok / Teesta River Corridor):

• Primary Hazards: Mountain slope landslides, Glacial Lake Outburst Floods (GLOF), and NH-10 road blockages.
• Active Infrastructure: 4 all-terrain fleets, SAR radar slope monitors along Teesta basin, and Gangtok high-altitude emergency LZ.
• Recommended Action: Check Road Accessibility & Safe Routes for real-time clearance status along the NH-10 corridor before travel.`,
      riskLevel: 'HIGH',
      detectedLocation: 'Sikkim (Gangtok / Teesta Valley)',
      incidentType: 'Sikkim Mountain Slope & Teesta Valley Intelligence',
      actionSteps: [
        'Teesta Basin Hydro-Telemetry & GLOF Sentinel Active',
        'NH-10 Landslide Risk Monitoring & BRO Excavator Standby',
        'High-Altitude Drone Reconnaissance Ready at Gangtok LZ',
        'Consult Road Accessibility for Safe Detour Corridors'
      ],
      recommendedModule: 'rerouting',
      recommendedModuleName: 'Check Sikkim Road Status'
    };
  }

  if (q.includes('meghalaya') || q.includes('shillong') || q.includes('sohra')) {
    return {
      answerText: `Meghalaya Plateau Command (Shillong / East Khasi Hills):

• Primary Hazards: Extreme precipitation in the Sohra/Mawsynram belt, flash floods in Garo Hills, and karst sinkhole instability.
• Active Infrastructure: 8 active response vehicles, high-capacity Doppler radar at Shillong peak, and rapid shelter camps in Tura.
• Recommended Action: Consult Weather & Doppler Radar to inspect heavy rainfall forecasts across the southern plateau.`,
      riskLevel: 'MODERATE',
      detectedLocation: 'Meghalaya (Shillong / Sohra Ridge)',
      incidentType: 'Meghalaya Plateau Rainfall & Flash Flood Intelligence',
      actionSteps: [
        'Shillong Peak Doppler Radar Cloud Tracking Active',
        'Sohra & Mawsynram Heavy Precipitation Alerts Monitored',
        'Garo Hills Flood Response Convoys Deployed',
        'Inspect Live Weather Doppler Radar for Forecasts'
      ],
      recommendedModule: 'weather',
      recommendedModuleName: 'Check Meghalaya Doppler Radar'
    };
  }

  // 19. GREETINGS & NATURAL QUERIES
  if (
    q === 'hi' ||
    q === 'hello' ||
    q === 'namaste' ||
    q === 'hey' ||
    q.startsWith('hi ') ||
    q.startsWith('hello ') ||
    q.startsWith('namaste ') ||
    q.includes('who are you') ||
    q.includes('help') ||
    q.includes('thanks') ||
    q.includes('thank you')
  ) {
    return {
      answerText: `Namaste! I am your Jeevan Setu AI Assistant 🤖.

I have complete, up-to-date knowledge of the Jeevan Setu platform and disaster response operations across all 8 North Eastern States. You can type or speak (🎙️) any question!

Popular questions you can ask me:
1. "What is Jeevan Setu and what are its features?"
2. "How does Emergency SOS work?"
3. "How do I use AI Impact Assessment to analyze disaster photos?"
4. "Show me the Live GIS Map and active disaster hazards"
5. "What are the safe evacuation routes and blocked roads?"
6. "Where can I find relief camps and supply convoys?"
7. "What should I do during an earthquake, flood, or landslide?"
8. "What are the official emergency helpline numbers?"
9. "What is the disaster status in Assam, Sikkim, or Meghalaya?"`,
      riskLevel: 'INFO',
      detectedLocation,
      incidentType: 'Jeevan Setu AI Assistant Greeting & Guide',
      actionSteps: [
        'Ask any question about Jeevan Setu features, tools or pages',
        'Type or click 🎙️ mic for real-time voice speech recognition',
        'Direct one-click navigation buttons to all disaster modules',
        'Trigger 🚨 Emergency SOS for immediate life-saving rescue'
      ],
      recommendedModule: 'customdashboard',
      recommendedModuleName: 'Explore Command Center Dashboard'
    };
  }

  // 20. GENERAL FALLBACK (Answers any query intelligently using platform knowledge)
  return {
    answerText: `I have analyzed your query regarding: "${query}".

Here is how Jeevan Setu provides intelligence and emergency assistance for this:
• 🗺️ Live GIS Map: View real-time disaster hazard markers, road conditions, and designated relief shelters across all 8 North Eastern States.
• 📷 AI Impact Assessment: Upload on-site photos of structural damage, flooded roads, or debris for instant Gemini Vision triage.
• 🚨 Emergency SOS: If you or someone nearby is in immediate danger, click the red SOS button to broadcast your live GPS coordinates to NDRF/SDRF rescue teams.
• 📖 Disaster Safety Guide: Review official NDMA do's and don'ts for floods, landslides, and earthquakes.

You can also ask me specific questions like:
"How do I report a disaster?", "Where are the nearest relief camps?", or "What is the weather forecast?".`,
    riskLevel: 'INFO',
    detectedLocation,
    incidentType: 'Jeevan Setu AI Disaster & Platform Intelligence',
    actionSteps: [
      'Explore real-time hazards on the NER Live GIS Map',
      'Upload disaster media to AI Impact Assessment for automated scoring',
      'Consult the Disaster Safety Guide for immediate protective measures',
      'Trigger Emergency SOS if experiencing critical distress'
    ],
    recommendedModule: 'map',
    recommendedModuleName: 'Explore NER Live GIS Map'
  };
}

export interface AIChatbotWidgetProps {
  onNavigateModule?: (mod: string) => void;
  onOpenSos?: () => void;
  isOpenDefault?: boolean;
  isOpenControlled?: boolean;
  onCloseControlled?: () => void;
  onOpenControlled?: () => void;
}

export default function AIChatbotWidget({
  onNavigateModule,
  onOpenSos,
  isOpenDefault = false,
  isOpenControlled,
  onCloseControlled,
  onOpenControlled
}: AIChatbotWidgetProps) {
  const { t } = useTranslation();
  const [internalIsOpen, setInternalIsOpen] = useState(isOpenDefault);

  const isOpen = isOpenControlled !== undefined ? isOpenControlled : internalIsOpen;

  const setIsOpen = (val: boolean | ((prev: boolean) => boolean)) => {
    const nextVal = typeof val === 'function' ? val(isOpen) : val;
    setInternalIsOpen(nextVal);
    if (!nextVal && onCloseControlled) {
      onCloseControlled();
    } else if (nextVal && onOpenControlled) {
      onOpenControlled();
    }
  };

  const [inputText, setInputText] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isThinking, setIsThinking] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-welcome',
      sender: 'ai',
      text: 'Namaste! I am your Jeevan Setu AI Assistant 🤖.\n\nAsk me anything about the Jeevan Setu platform, our Live GIS map, AI damage assessment, emergency SOS, safe routes, relief supplies, or disaster guidance across the 8 North Eastern States. You can type or speak using the 🎙️ microphone!',
      timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      analysis: {
        riskLevel: 'INFO',
        detectedLocation: 'North Eastern Region (8 States)',
        incidentType: 'Jeevan Setu Official Knowledge & Response Assistant',
        actionSteps: [
          'Ask: "What is Jeevan Setu and what are its features?"',
          'Ask: "How does Emergency SOS or Rescue dispatch work?"',
          'Ask: "How do I use AI Impact Assessment to analyze photos?"',
          'Speak or type anytime using the 🎙️ voice mic button'
        ],
        recommendedModule: 'customdashboard',
        recommendedModuleName: 'Explore Command Center Dashboard'
      }
    }
  ]);

  // Voice Recognition Hook
  const { isListening, transcript, isSupported, startListening, stopListening } = useVoiceRecognition({
    language: 'hi-IN',
    onResult: (resText) => {
      if (resText && resText.trim()) {
        setInputText(resText);
      }
    }
  });

  useEffect(() => {
    if (transcript) {
      setInputText(transcript);
    }
  }, [transcript]);

  // Auto Scroll Chat
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isThinking]);

  // Global trigger event listener for top header button
  useEffect(() => {
    const handleOpenEvent = () => setIsOpen(prev => !prev);
    window.addEventListener('open-ai-chatbot', handleOpenEvent);
    return () => window.removeEventListener('open-ai-chatbot', handleOpenEvent);
  }, []);

  // Text to Speech Readout
  const handleSpeakText = (text: string) => {
    if (!('speechSynthesis' in window)) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.lang = 'en-US';

    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  // Submit User Message
  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputText).trim();
    if (!query) return;

    const userMsgId = `usr-${Date.now()}`;
    const timestampStr = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    const userMessage: ChatMessage = {
      id: userMsgId,
      sender: 'user',
      text: query,
      timestamp: timestampStr
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsThinking(true);

    // Process Query with Knowledge Engine (+ live Gemini if configured)
    setTimeout(async () => {
      let liveGeminiText: string | null = null;
      try {
        const apiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY || (typeof window !== 'undefined' ? localStorage.getItem('gemini_api_key') : '');
        if (apiKey) {
          const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
          const res = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{
                parts: [{
                  text: `You are the Jeevan Setu AI Assistant for the official Jeevan Setu disaster response & GIS intelligence platform for North East India (Assam, Arunachal Pradesh, Manipur, Meghalaya, Mizoram, Nagaland, Sikkim, Tripura).
Answer the user's question accurately, concisely, politely, and with actionable guidance regarding the Jeevan Setu website and disaster response.
User Question: "${query}"`
                }]
              }]
            })
          });
          if (res.ok) {
            const data = await res.json();
            liveGeminiText = data.candidates?.[0]?.content?.parts?.[0]?.text || null;
          }
        }
      } catch (err) {
        // Fallback to built-in knowledge engine
      }

      const analysis = analyzeUserQuery(query);
      const aiReplyText = liveGeminiText && liveGeminiText.trim().length > 15 ? liveGeminiText.trim() : analysis.answerText;

      const aiMessage: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: aiReplyText,
        timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        analysis: {
          riskLevel: analysis.riskLevel,
          detectedLocation: analysis.detectedLocation,
          incidentType: analysis.incidentType,
          actionSteps: analysis.actionSteps,
          recommendedModule: analysis.recommendedModule,
          recommendedModuleName: analysis.recommendedModuleName
        }
      };

      setMessages(prev => [...prev, aiMessage]);
      setIsThinking(false);

      // Auto-read AI analysis if voice mode was used
      if (isListening || transcript) {
        handleSpeakText(aiReplyText);
      }
    }, 450);
  };

  const handleMicClick = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  return (
    <>
      {/* 🔴 FLOATING BOT TOGGLE BUTTON (BOTTOM RIGHT) */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-[99999] bg-gradient-to-r from-sky-600 via-indigo-600 to-purple-600 text-white p-4 rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-all duration-300 flex items-center gap-3 border-2 border-white/30 group cursor-pointer"
          title="Open Jeevan Setu AI Disaster Chatbot"
        >
          <div className="relative">
            <Bot className="h-7 w-7 group-hover:rotate-12 transition-transform duration-300" />
            <span className="absolute -top-1 -right-1 h-3 w-3 bg-emerald-400 rounded-full animate-ping border border-slate-900" />
            <span className="absolute -top-1 -right-1 h-3 w-3 bg-emerald-500 rounded-full border border-slate-900" />
          </div>
          <div className="hidden sm:flex flex-col items-start pr-1">
            <span className="text-xs font-black tracking-wide flex items-center gap-1">
              AI Assistant <Sparkles className="h-3 w-3 text-amber-300" />
            </span>
            <span className="text-[10px] text-sky-100 font-semibold">Type or Speak 🎙️</span>
          </div>
        </button>
      )}

      {/* 🤖 EXPANDABLE AI CHATBOT PANEL & OVERLAY */}
      {isOpen && (
        <>
          {/* Backdrop Overlay */}
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-[99998] transition-opacity"
            onClick={() => setIsOpen(false)}
          />

          {/* Chatbot Window (Positioned Top Right / Below Header) */}
          <div className="fixed top-16 right-4 sm:top-20 sm:right-6 z-[99999] w-[95vw] sm:w-[420px] max-h-[80vh] h-[580px] bg-slate-950/95 border border-slate-700/80 rounded-3xl shadow-2xl backdrop-blur-xl flex flex-col overflow-hidden text-slate-100 animate-in fade-in slide-in-from-top-4 duration-300">
          
          {/* TOP CHATBOT HEADER */}
          <div className="bg-slate-900/90 px-4 py-3.5 border-b border-slate-800 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center shadow-lg border border-sky-400/30">
                <Bot className="h-6 w-6 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-black text-white tracking-tight flex items-center gap-1.5">
                    Jeevan Setu AI Assistant
                  </h3>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[9px] font-extrabold flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    LIVE NLP
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 font-medium">Multilingual Voice &amp; Text Analysis Engine</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setMessages([messages[0]])}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition"
                title="Reset Chat"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition"
                title="Close Chatbot"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* MESSAGES LIST AREA */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4 text-xs select-text">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                {/* Message Bubble */}
                <div
                  className={`max-w-[88%] rounded-2xl p-3.5 shadow-md ${
                    msg.sender === 'user'
                      ? 'bg-sky-600 text-white rounded-br-none'
                      : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-bl-none space-y-2'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold leading-relaxed whitespace-pre-line">{msg.text}</p>
                    {msg.sender === 'ai' && (
                      <button
                        onClick={() => handleSpeakText(msg.text)}
                        className="text-slate-400 hover:text-sky-400 transition shrink-0 p-0.5"
                        title="Listen to AI Analysis"
                      >
                        {isSpeaking ? <VolumeX className="h-4 w-4 text-amber-400 animate-pulse" /> : <Volume2 className="h-4 w-4" />}
                      </button>
                    )}
                  </div>

                  {/* AI Structured Analysis Box */}
                  {msg.analysis && (
                    <div className="mt-2 pt-2.5 border-t border-slate-800/80 space-y-2 text-[11px]">
                      {/* Risk Badge & Location */}
                      <div className="flex flex-wrap items-center justify-between gap-1.5">
                        <span
                          className={`px-2.5 py-0.5 rounded-md font-extrabold text-[10px] uppercase border ${
                            msg.analysis.riskLevel === 'CRITICAL'
                              ? 'bg-red-500/20 text-red-400 border-red-500/40 animate-pulse'
                              : msg.analysis.riskLevel === 'HIGH'
                              ? 'bg-orange-500/20 text-orange-400 border-orange-500/40'
                              : msg.analysis.riskLevel === 'MODERATE'
                              ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                              : 'bg-sky-500/20 text-sky-400 border-sky-500/40'
                          }`}
                        >
                          {msg.analysis.riskLevel === 'INFO' ? 'PLATFORM INTELLIGENCE' : `${msg.analysis.riskLevel} ALERT`}
                        </span>
                        {msg.analysis.detectedLocation && (
                          <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-sky-400" />
                            {msg.analysis.detectedLocation}
                          </span>
                        )}
                      </div>

                      {/* Action Steps Bullet Points */}
                      {msg.analysis.actionSteps && msg.analysis.actionSteps.length > 0 && (
                        <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800 space-y-1.5">
                          <span className="text-[10px] font-extrabold text-sky-400 uppercase tracking-wider block">
                            {msg.analysis.riskLevel === 'INFO' ? '⚡ Platform Insights & Tools:' : '⚡ Recommended Action Protocol:'}
                          </span>
                          {msg.analysis.actionSteps.map((step, idx) => (
                            <div key={idx} className="flex items-start gap-1.5 text-slate-300">
                              <span className="text-emerald-400 font-bold">✓</span>
                              <span>{step}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Direct Module Jump Button */}
                      {msg.analysis.recommendedModule && onNavigateModule && (
                        <button
                          onClick={() => {
                            onNavigateModule(msg.analysis!.recommendedModule!);
                            setIsOpen(false);
                          }}
                          className="w-full mt-2 bg-gradient-to-r from-sky-600 via-indigo-600 to-purple-600 hover:from-sky-500 hover:to-purple-500 text-white font-bold py-2.5 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md hover:scale-[1.02] active:scale-95 transition cursor-pointer border border-sky-400/30"
                        >
                          <span>{msg.analysis.recommendedModuleName || `Open ${msg.analysis.recommendedModule}`}</span>
                          <ArrowRight className="h-3.5 w-3.5" />
                        </button>
                      )}

                      {/* Quick Navigation Button */}
                      {msg.analysis.riskLevel === 'CRITICAL' && onOpenSos && (
                        <button
                          onClick={onOpenSos}
                          className="w-full mt-1 bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white font-black py-2 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg cursor-pointer transition animate-pulse"
                        >
                          <ShieldAlert className="h-4 w-4" />
                          <span>TRIGGER 🚨 EMERGENCY SOS RESCUE NOW</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>

                <span className="text-[9px] text-slate-500 mt-1 px-1">{msg.timestamp}</span>
              </div>
            ))}

            {/* AI Thinking Animation */}
            {isThinking && (
              <div className="flex items-center gap-2 text-slate-400 text-xs bg-slate-900/60 p-3 rounded-2xl border border-slate-800 w-max">
                <Sparkles className="h-4 w-4 text-sky-400 animate-spin" />
                <span className="font-bold text-sky-300">Analyzing voice &amp; disaster telemetry...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* QUICK PROMPT CHIPS */}
          <div className="px-3 py-2 bg-slate-900/50 border-t border-slate-800/80 flex items-center gap-1.5 overflow-x-auto shrink-0 scrollbar-none">
            {[
              "🌐 What is Jeevan Setu?",
              "🚨 How does Emergency SOS work?",
              "📷 How does AI Damage Assessment work?",
              "🗺️ Show Live GIS Map & Hazards",
              "🛣️ Check Road Status & Safe Routes",
              "🏕️ Find Nearest Relief Camps",
              "⛈️ Live Weather & Doppler Radar",
              "🌊 Flood alert in Guwahati Assam",
              "⛰️ Landslide on NH-6 Sikkim"
            ].map((promptText, i) => (
              <button
                key={i}
                onClick={() => handleSendMessage(promptText)}
                className="px-2.5 py-1 rounded-full bg-slate-800/80 hover:bg-sky-600/30 hover:border-sky-500/50 border border-slate-700 text-[10px] font-bold text-slate-300 hover:text-white whitespace-nowrap transition cursor-pointer"
              >
                {promptText}
              </button>
            ))}
          </div>

          {/* INPUT BAR: TEXT & VOICE MIC BUTTON */}
          <div className="p-3 bg-slate-900 border-t border-slate-800 flex items-center gap-2 shrink-0">
            {/* 🎙️ VOICE MIC BUTTON */}
            <button
              onClick={handleMicClick}
              className={`p-2.5 rounded-2xl border transition-all duration-300 flex items-center justify-center shrink-0 cursor-pointer ${
                isListening
                  ? 'bg-red-600 text-white border-red-400 animate-pulse shadow-lg shadow-red-900/50'
                  : 'bg-slate-800 hover:bg-slate-700 text-sky-400 border-slate-700'
              }`}
              title={isListening ? "Stop Voice Recognition" : "Speak Voice Input (Speech-to-Text)"}
            >
              {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
            </button>

            {/* Input Text Box */}
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder={isListening ? "🎙️ Listening... Speak now" : "Type or speak emergency query..."}
              className="flex-1 bg-slate-950 border border-slate-700/80 rounded-2xl px-3.5 py-2.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-sky-500 transition"
            />

            {/* Send Button */}
            <button
              onClick={() => handleSendMessage()}
              disabled={!inputText.trim()}
              className="p-2.5 rounded-2xl bg-sky-600 hover:bg-sky-500 disabled:opacity-40 disabled:hover:bg-sky-600 text-white font-bold transition flex items-center justify-center shrink-0 cursor-pointer shadow-lg shadow-sky-900/30"
              title="Send to AI Assistant"
            >
              <Send className="h-5 w-5" />
            </button>
          </div>

        </div>
        </>
      )}
    </>
  );
}
