import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Simple LHI formula calculation as provided by user
function calculateLHI({ slope, rainfall, soil, fault }) {
  return (0.35 * slope) + (0.25 * rainfall) + (0.20 * soil) + (0.20 * fault);
}

// User requested /analyze endpoint
app.post("/analyze", (req, res) => {
  const slope = req.body.slope ?? 8.0;
  const rainfall = req.body.rainfall ?? 7.5;
  const soil = req.body.soil ?? 6.0;
  const fault = req.body.fault ?? 5.5;

  const lhi = calculateLHI({ slope, rainfall, soil, fault });
  const damage = 8.8; // Mock AI damage score

  res.json({
    lhi: lhi.toFixed(1),
    damage: damage,
    actions: [
      "Dispatch 3 BRO JCB Excavators",
      "Notify NDRF 1078 Triage Team",
      "Set Avoidance Perimeter"
    ]
  });
});

// Also support /api/analyze for compatibility
app.post('/api/analyze', (req, res) => {
  const slope = req.body.slope ?? 8.0;
  const rainfall = req.body.rainfall ?? 7.5;
  const soil = req.body.soil ?? 6.0;
  const fault = req.body.fault ?? 5.5;

  const lhi = calculateLHI({ slope, rainfall, soil, fault });

  res.json({
    lhi: lhi.toFixed(1),
    lhi_score: Number(lhi.toFixed(1)),
    damage: 8.8,
    damage_score: "8.8",
    triage_steps: [
      "1. Dispatch 3 BRO JCB Excavators",
      "2. Notify NDRF 1078 Triage Team",
      "3. Set Avoidance Perimeter"
    ],
    actions: [
      "Dispatch 3 BRO JCB Excavators",
      "Notify NDRF 1078 Triage Team",
      "Set Avoidance Perimeter"
    ]
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🌉 Jeevan Setu Backend Server running on port ${PORT}`);
});
