import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

// Enable CORS for all origins
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// LHI Formula Calculation
function calculateLHI({ slope, rainfall, soil, fault }) {
  const s = Number(slope) || 8.0;
  const r = Number(rainfall) || 7.5;
  const so = Number(soil) || 6.0;
  const f = Number(fault) || 5.5;
  return (0.35 * s) + (0.25 * r) + (0.20 * so) + (0.20 * f);
}

// Health Check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', server: 'Jeevan Setu Disaster Intelligence API', time: new Date().toISOString() });
});

// Photo Upload Endpoint: /citizen/photo
app.post('/citizen/photo', (req, res) => {
  console.log('📸 Photo uploaded to /citizen/photo:', {
    location: req.body?.location,
    incident: req.body?.incident,
    photoName: req.body?.photoName
  });

  res.json({
    status: 'success',
    photoId: `ph_${Date.now()}`,
    message: 'Disaster site photo uploaded successfully',
    timestamp: new Date().toISOString()
  });
});

// Disaster Intelligence Analyze Endpoint: /citizen/analyze
app.post('/citizen/analyze', async (req, res) => {
  console.log('🔍 Analysis requested at /citizen/analyze:', {
    location: req.body?.location,
    incident: req.body?.incident
  });

  const slope = req.body?.slope ?? 8.0;
  const rainfall = req.body?.rainfall ?? 7.5;
  const soil = req.body?.soil ?? 6.0;
  const fault = req.body?.fault ?? 5.5;

  const rawLhi = calculateLHI({ slope, rainfall, soil, fault });
  const lhiNum = Number(rawLhi.toFixed(1));
  
  let riskLevel = "Critical Risk";
  if (lhiNum < 3.0) riskLevel = "Low Risk";
  else if (lhiNum < 6.0) riskLevel = "Moderate Risk";
  else if (lhiNum < 8.0) riskLevel = "High Risk";

  const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
  let customActions = [
    "Dispatch 3 BRO JCB Excavators to clearing point",
    "Notify NDRF 1078 Triage Command Center",
    "Set Avoidance Perimeter & Close NH-6 Route",
    "Evacuate high-risk slope residential zone"
  ];

  if (apiKey && req.body?.photo && typeof req.body.photo === 'string' && req.body.photo.length > 100) {
    try {
      const base64Data = req.body.photo.includes(',') ? req.body.photo.split(',')[1] : req.body.photo;
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
      
      const gRes = await fetch(geminiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: "Analyze disaster damage in this photo. Return 4 urgent rescue action steps." },
              { inline_data: { mime_type: "image/jpeg", data: base64Data } }
            ]
          }]
        })
      });

      if (gRes.ok) {
        const gData = await gRes.json();
        const text = gData?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          const lines = text.split('\n').map(l => l.replace(/^[0-9+*-.\s]+/, '').trim()).filter(l => l.length > 5);
          if (lines.length >= 3) customActions = lines.slice(0, 4);
        }
      }
    } catch (err) {
      console.warn("Gemini vision API warning:", err.message);
    }
  }

  res.json({
    damageScore: "8.8 Severe Damage",
    lhiScore: `${lhiNum} ${riskLevel}`,
    lhi: lhiNum,
    damage: 8.8,
    riskLevel: riskLevel,
    actions: customActions,
    detections: {
      disasterType: req.body?.incident || "Landslide",
      damageSeverity: "Severe Damage",
      roadStatus: "Blocked (350m Breach)",
      estimatedRisk: riskLevel,
      structuralDamage: "Heavy Debris & Slope Washout",
      casualtiesDetected: "None Detected",
      vehiclesAffected: "2 Vehicles Blocked"
    },
    timeline: [
      { day: "Tue", level: "Low", value: 20 },
      { day: "Wed", level: "Moderate", value: 55 },
      { day: "Thu", level: "High", value: 90 }
    ],
    cutoff: 350,
    rainfall: 115
  });
});

app.get('/citizen/analyze', (req, res) => {
  res.json({
    damageScore: "8.8 Severe Damage",
    lhiScore: "8.2 High Risk",
    lhi: 8.2,
    damage: 8.8,
    riskLevel: "High Risk",
    actions: [
      "Dispatch 3 BRO JCB Excavators",
      "Notify NDRF 1078 Triage Team",
      "Set Avoidance Perimeter",
      "Evacuate high-risk slope residential zone"
    ],
    detections: {
      disasterType: "Landslide",
      damageSeverity: "Severe Damage",
      roadStatus: "Blocked (350m Breach)",
      estimatedRisk: "High Risk",
      structuralDamage: "Heavy Debris & Slope Washout",
      casualtiesDetected: "None Detected",
      vehiclesAffected: "2 Vehicles Blocked"
    },
    timeline: [
      { day: "Tue", level: "Low", value: 20 },
      { day: "Wed", level: "Moderate", value: 55 },
      { day: "Thu", level: "High", value: 90 }
    ],
    cutoff: 350,
    rainfall: 115
  });
});

// Direct /analyze Endpoint
app.post('/analyze', (req, res) => {
  const slope = req.body?.slope ?? 8.0;
  const rainfall = req.body?.rainfall ?? 7.5;
  const soil = req.body?.soil ?? 6.0;
  const fault = req.body?.fault ?? 5.5;
  const rawLhi = calculateLHI({ slope, rainfall, soil, fault });
  const lhiNum = Number(rawLhi.toFixed(1));

  res.json({
    lhi: lhiNum,
    lhiScore: `${lhiNum} High Risk`,
    damage: 8.8,
    damageScore: "8.8 Severe Damage",
    cutoff: 350,
    rainfall: 115,
    actions: [
      "Dispatch 3 BRO JCB Excavators",
      "Notify NDRF 1078 Triage Team",
      "Set Avoidance Perimeter",
      "Evacuate high-risk slope residential zone"
    ],
    timeline: [
      { day: "Tue", level: "Low" },
      { day: "Wed", level: "Moderate" },
      { day: "Thu", level: "High" }
    ]
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🌉 Jeevan Setu Disaster Intelligence Backend running on http://localhost:${PORT}`);
});
