export const FALLBACK_ISSUES = [
  {
    id: 'seed-1',
    reference_id: 'CL-849201',
    type: 'infrastructure',
    category: 'Roads & Infra',
    title: 'Severe carriageway pothole cluster near Station Road',
    description: 'Deep asphalt failure across two lanes causing heavy traffic bottlenecks and two-wheeler hazards.',
    jurisdiction: 'Kolhapur (KMC)',
    location: 'Station Road, Kolhapur',
    latitude: 16.7050,
    longitude: 74.2433,
    date: '2 hours ago',
    image_url: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=600&h=400&fit=crop',
    status: 'verified',
    confidence: 0.96,
    department_email: 'cityengineerkmc@rediffmail.com',
    upvotes: 47
  },
  {
    id: 'seed-2',
    reference_id: 'CL-738194',
    type: 'service',
    category: 'Electricity',
    title: 'High-mast street lighting outage along Ring Road',
    description: 'Feeder pillar fault leaving a 400-meter pedestrian and commuter stretch unlit at night.',
    jurisdiction: 'Pune (PMC)',
    location: 'Baner Road, Pune',
    latitude: 18.5590,
    longitude: 73.7868,
    date: '5 hours ago',
    image_url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&h=400&fit=crop',
    status: 'in-progress',
    confidence: 0.91,
    department_email: 'itsupport@punecorporation.org',
    upvotes: 32
  },
  {
    id: 'seed-3',
    reference_id: 'CL-692018',
    type: 'infrastructure',
    category: 'Water & Drainage',
    title: 'Pressurized water main rupture flooding arterial junction',
    description: 'Continuous treated water loss and sub-base erosion due to a cracked distribution pipeline.',
    jurisdiction: 'Ichalkaranji (IMC)',
    location: 'Main Road, Ichalkaranji',
    latitude: 16.6966,
    longitude: 74.4593,
    date: '1 day ago',
    image_url: 'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=600&h=400&fit=crop',
    status: 'verified',
    confidence: 0.94,
    department_email: 'imc22.waterworks@gmail.com',
    upvotes: 89
  },
  {
    id: 'seed-4',
    reference_id: 'CL-510492',
    type: 'service',
    category: 'Health & SWM',
    title: 'Uncollected solid waste overflow at secondary transfer point',
    description: 'Secondary collection bins overflowing onto carriageway for 48 hours near commercial market.',
    jurisdiction: 'Brihanmumbai (BMC)',
    location: 'Dadar West, Mumbai',
    latitude: 19.0178,
    longitude: 72.8478,
    date: '2 days ago',
    image_url: 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=600&h=400&fit=crop',
    status: 'verified',
    confidence: 0.98,
    department_email: 'dmc.swm@mcgm.gov.in',
    upvotes: 124
  }
];

export const MUNICIPALITIES = [
  'All Jurisdictions',
  'Brihanmumbai (BMC)',
  'Pune (PMC)',
  'Pimpri-Chinchwad (PCMC)',
  'Navi Mumbai (NMMC)',
  'Kalyan-Dombivli (KDMC)',
  'Thane (TMC)',
  'Nashik (NMC)',
  'Nagpur (NMC)',
  'Kolhapur (KMC)',
  'Ichalkaranji (IMC)'
];

export const BULLETINS = [
  {
    id: 1,
    title: 'Weekly Municipal Triage Bulletin',
    subtitle: 'Maharashtra Urban Corporations Audit',
    date: 'October 2026',
    stats: { reported: 145, resolved: 112, pending: 33 }
  },
  {
    id: 2,
    title: 'Monsoon Carriageway Integrity Report',
    subtitle: 'Roads & Surface Infrastructure Division',
    date: 'September 2026',
    stats: { reported: 84, resolved: 69, pending: 15 }
  },
  {
    id: 3,
    title: 'Solid Waste & Sanitation SLA Review',
    subtitle: 'Health & SWM Nodal Compliance',
    date: 'August 2026',
    stats: { reported: 210, resolved: 189, pending: 21 }
  }
];