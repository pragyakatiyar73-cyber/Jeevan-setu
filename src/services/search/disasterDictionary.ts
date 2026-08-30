/**
 * 📚 Comprehensive Disaster Vocabulary, Misspellings & Hinglish Normalization Map
 */

export interface DisasterTerm {
  canonical: string;
  category: 'DISASTER' | 'INFRASTRUCTURE' | 'RELIEF' | 'EMERGENCY' | 'LOCATION';
  synonyms: string[];
}

export const DISASTER_TERMS: DisasterTerm[] = [
  {
    canonical: 'flood area',
    category: 'DISASTER',
    synonyms: ['flood', 'flooding', 'flod', 'floood', 'flud', 'inundation', 'overflow', 'waterlogging', 'baadh', 'badh', 'baad', 'badh aane par']
  },
  {
    canonical: 'landslide risk',
    category: 'DISASTER',
    synonyms: ['landslide', 'landslied', 'landsliede', 'landslip', 'mudslide', 'rockfall', 'slope collapse', 'bhooskhalan', 'bhuskalan', 'pahar girna']
  },
  {
    canonical: 'road blocked',
    category: 'INFRASTRUCTURE',
    synonyms: ['road blocked', 'road blockd', 'roadblock', 'road bloked', 'highway breach', 'raasta band', 'road band', 'route closed', 'road closed']
  },
  {
    canonical: 'relief camp',
    category: 'RELIEF',
    synonyms: ['relief camp', 'relif camp', 'releif camp', 'shelter', 'shalter', 'rahat camp', 'rahat shivir', 'refugee camp', 'safe shelter']
  },
  {
    canonical: 'emergency ambulance',
    category: 'EMERGENCY',
    synonyms: ['ambulance', 'ambulnce', 'ambulans', 'emergncy', 'emergency', 'madad', 'aspataal', 'hospital', 'medical triage']
  },
  {
    canonical: 'rescue team',
    category: 'EMERGENCY',
    synonyms: ['rescue', 'rescue team', 'squad', 'ndrf', 'sdrf', 'rescue operation', 'bachav', 'bachao', 'help']
  },
  {
    canonical: 'drinking water supplies',
    category: 'RELIEF',
    synonyms: ['water supplies', 'drinking water', 'paani', 'pene ka pani', 'water packets', 'rations', 'food supplies']
  },
  {
    canonical: 'heavy rainfall alert',
    category: 'DISASTER',
    synonyms: ['rainfall', 'heavy rain', 'baarish', 'barish', 'baarish ka pani', 'cloudburst', 'storm watch']
  }
];

export const COMMON_TYPOS: Record<string, string> = {
  // English Typos
  'flod': 'flood',
  'floood': 'flood',
  'flud': 'flood',
  'landslied': 'landslide',
  'landsliede': 'landslide',
  'landslp': 'landslide',
  'relif': 'relief',
  'releif': 'relief',
  'blockd': 'blocked',
  'bloked': 'blocked',
  'emergncy': 'emergency',
  'ambulnce': 'ambulance',
  'shalter': 'shelter',
  'kannpur': 'Kanpur',
  'kanpurr': 'Kanpur',
  'shilong': 'Shillong',
  'guhati': 'Guwahati',
  'tawng': 'Tawang',
  'aizwal': 'Aizawl',
  'gangtokk': 'Gangtok',
  'imphal': 'Imphal',
  'silchar': 'Silchar',

  // Hinglish Normalizations
  'baadh': 'flood',
  'badh': 'flood',
  'baad': 'flood',
  'bad': 'flood',
  'baarish': 'rainfall',
  'barish': 'rainfall',
  'raasta': 'road',
  'rasta': 'road',
  'band': 'blocked',
  'rahat': 'relief',
  'shivir': 'camp',
  'aspataal': 'hospital',
  'aspatal': 'hospital',
  'madad': 'help',
  'bachao': 'rescue'
};
