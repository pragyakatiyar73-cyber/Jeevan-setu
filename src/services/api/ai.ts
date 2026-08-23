/**
 * 🤖 AI & Machine Learning API Client (Category 3: Google Gemini & Fallback Models)
 * 
 * Powers multimodal disaster image damage triage, SOS urgency classification,
 * and conversational disaster copilot assistance.
 */

export interface DisasterTriageReport {
  urgency: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  disasterType: 'FLOOD' | 'LANDSLIDE' | 'BUILDING_COLLAPSE' | 'FIRE' | 'CYCLONE' | 'MEDICAL_EMERGENCY' | 'OTHER';
  estimatedPeopleAffected: string;
  requiredSupplies: string[];
  infrastructureDamage: {
    roadBlocked: boolean;
    bridgeDamaged: boolean;
    powerGridDown: boolean;
  };
  recommendedActions: string[];
  summary: string;
}

/**
 * Multimodal disaster triage using Gemini API (with deterministic fallback heuristics)
 */
export async function analyzeDisasterReport(
  description: string,
  imageBase64?: string,
  apiKey?: string
): Promise<DisasterTriageReport> {
  const geminiKey = apiKey || (typeof process !== 'undefined' ? process.env.VITE_GEMINI_API_KEY : '');

  if (geminiKey) {
    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`;
      
      const contents: any[] = [];
      const parts: any[] = [
        {
          text: `You are Jeevan Setu AI Disaster Triage Assistant. Analyze this emergency report and return STRICT JSON with this schema:
          {
            "urgency": "CRITICAL" | "HIGH" | "MEDIUM" | "LOW",
            "disasterType": "FLOOD" | "LANDSLIDE" | "BUILDING_COLLAPSE" | "FIRE" | "CYCLONE" | "MEDICAL_EMERGENCY" | "OTHER",
            "estimatedPeopleAffected": "string",
            "requiredSupplies": ["string"],
            "infrastructureDamage": {
              "roadBlocked": boolean,
              "bridgeDamaged": boolean,
              "powerGridDown": boolean
            },
            "recommendedActions": ["string"],
            "summary": "string"
          }
          
          Report text: "${description}"`
        }
      ];

      if (imageBase64) {
        parts.push({
          inline_data: {
            mime_type: 'image/jpeg',
            data: imageBase64.replace(/^data:image\/[a-z]+;base64,/, '')
          }
        });
      }

      contents.push({ parts });

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents,
          generationConfig: { response_mime_type: 'application/json' }
        })
      });

      if (response.ok) {
        const result = await response.json();
        const textResponse = result.candidates?.[0]?.content?.parts?.[0]?.text;
        if (textResponse) {
          return JSON.parse(textResponse) as DisasterTriageReport;
        }
      }
    } catch (err) {
      console.warn('Gemini API call failed, falling back to heuristic engine:', err);
    }
  }

  // Resilient heuristic analysis engine (zero API key fallback)
  const lower = description.toLowerCase();
  const isCritical = lower.includes('trapped') || lower.includes('dying') || lower.includes('submerged') || lower.includes('collapsed');
  const isFlood = lower.includes('water') || lower.includes('flood') || lower.includes('drown');
  const isLandslide = lower.includes('landslide') || lower.includes('mud') || lower.includes('rockfall');

  return {
    urgency: isCritical ? 'CRITICAL' : lower.includes('urgent') ? 'HIGH' : 'MEDIUM',
    disasterType: isFlood ? 'FLOOD' : isLandslide ? 'LANDSLIDE' : 'OTHER',
    estimatedPeopleAffected: '10-50 (Estimated)',
    requiredSupplies: isFlood ? ['Inflatable Boats', 'Clean Drinking Water', 'ORSL Kits'] : ['Excavators', 'First Aid Kits', 'Ropes'],
    infrastructureDamage: {
      roadBlocked: lower.includes('road') || lower.includes('blocked') || isLandslide,
      bridgeDamaged: lower.includes('bridge'),
      powerGridDown: lower.includes('electricity') || lower.includes('power')
    },
    recommendedActions: [
      'Dispatch NDRF / SDRF local rescue unit',
      'Establish geo-fenced safe relief corridor',
      'Trigger mobile alert broadcast to adjacent panchayats'
    ],
    summary: description.slice(0, 140) + '...'
  };
}
