import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_BASE =
  import.meta.env.VITE_API_URL ||
  (window.location.hostname === 'localhost'
    ? 'http://localhost:5000'
    : 'https://citylense.onrender.com');

const PRESET_COORDS = [
  { label: 'Ichalkaranji (IMC)', lat: '16.6966', lng: '74.4593' },
  { label: 'Kolhapur (KMC)', lat: '16.7050', lng: '74.2433' },
  { label: 'Pune (PMC)', lat: '18.5204', lng: '73.8567' },
  { label: 'Mumbai (BMC)', lat: '18.9388', lng: '72.8354' }
];

export default function ReportIssuePage({ onReportCreated, user }) {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [issueType, setIssueType] = useState('');
  const [formData, setFormData] = useState({
    category: '',
    title: '',
    description: '',
    locationName: '',
    latitude: '',
    longitude: '',
    image: null,
    imagePreview: null
  });
  const [locating, setLocating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [receipt, setReceipt] = useState(null);

  const [emailRecipient, setEmailRecipient] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [copied, setCopied] = useState(false);

  const issueTypes = [
    {
      id: 'infrastructure',
      label: 'Infrastructure Defect',
      description: 'Carriageway potholes, damaged roads, water pipeline leaks, storm drainage',
      categories: ['Roads & Infra', 'Water & Drainage', 'Encroachment & Estate']
    },
    {
      id: 'service',
      label: 'Municipal Service Issue',
      description: 'Street light outages, garbage overflow, public sanitation, gardens',
      categories: ['Health & SWM', 'Electricity', 'Environment & Gardens']
    }
  ];

  const selectedTypeObj = issueTypes.find((t) => t.id === issueType);

  const buildLegalEmailDraft = (apiData) => {
    const citizenName = user?.name || 'Registered Citizen Reporter';
    const citizenEmail = user?.email || 'Verified Field Submission';
    const lat = parseFloat(formData.latitude).toFixed(6);
    const lng = parseFloat(formData.longitude).toFixed(6);
    const mapsUrl = `https://www.google.com/maps?q=${lat},${lng}`;
    const timestamp = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

    const subject = `[OFFICIAL CIVIC DOCKET #${apiData.reference_id}] Urgent ${apiData.ai_classification.category} Defect Notice — ${apiData.jurisdiction}`;

    const body = `To,
The Nodal Officer / Executive Engineer (${apiData.ai_classification.category} Wing),
${apiData.jurisdiction} Municipal Corporation,
Maharashtra State.

SUBJECT: Statutory Civic Defect Notice & Request for Time-Bound Rectification [Docket Ref: ${apiData.reference_id}]

Respected Sir / Madam,

I am writing to formally place on record a verified civic infrastructure defect within the municipal limits of ${apiData.jurisdiction}, authenticated via the CityLense E-Governance & Spatial Triage Gateway.

1. DOCKET & SPATIAL TELEMETRY
--------------------------------------------------
- Reference Docket ID : ${apiData.reference_id}
- Reported Title      : ${formData.title}
- Location / Landmark : ${formData.locationName || apiData.jurisdiction}
- PostGIS Coordinates : ${lat}° N, ${lng}° E (WGS 84)
- Google Maps Pin     : ${mapsUrl}
- Timestamp (IST)     : ${timestamp}

2. AI COMPUTER VISION TECHNICAL ASSESSMENT
--------------------------------------------------
- Assigned Department : ${apiData.ai_classification.category}
- AI Confidence Score : ${Math.round((apiData.ai_classification.confidence || 0.95) * 100)}%
- Technical Summary   : ${apiData.ai_classification.summary}
- Citizen Field Notes : ${formData.description}
- Cloud Evidence URL  : ${apiData.image_url || 'Attached in Municipal Cloud Registry'}

3. STATUTORY REQUEST FOR ACTION
--------------------------------------------------
Pursuant to obligatory municipal duties under the Maharashtra Municipal Corporations Act regarding public safety and civic maintenance, this defect poses an active hazard to commuters and residents.

Please acknowledge receipt of Docket #${apiData.reference_id} and initiate field inspection and remedial work at the earliest.

Sincerely,
${citizenName}
${citizenEmail}`;

    setEmailRecipient(apiData.department_email || 'nodal@maharashtra.gov.in');
    setEmailSubject(subject);
    setEmailBody(body);
  };

  const handleTypeSelect = (typeId) => {
    const found = issueTypes.find((t) => t.id === typeId);
    setIssueType(typeId);
    setFormData((prev) => ({ ...prev, category: found.categories[0] }));
    setStep(2);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData((prev) => ({
        ...prev,
        image: file,
        imagePreview: URL.createObjectURL(file)
      }));
      setError(null);
    }
  };

  const acquireGps = () => {
    setLocating(true);
    setError(null);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude.toFixed(6);
          const lng = pos.coords.longitude.toFixed(6);
          setFormData((prev) => ({
            ...prev,
            latitude: lat,
            longitude: lng,
            locationName: prev.locationName || `Device GPS (${lat}, ${lng})`
          }));
          setLocating(false);
        },
        () => {
          setError('GPS permission blocked. Select a preset city below or type coordinates.');
          setLocating(false);
        },
        { enableHighAccuracy: true }
      );
    } else {
      setError('Geolocation not supported by browser.');
      setLocating(false);
    }
  };

  const applyPreset = (preset) => {
    setFormData((prev) => ({
      ...prev,
      latitude: preset.lat,
      longitude: preset.lng,
      locationName: preset.label
    }));
    setError(null);
  };

  const handleStep2Continue = (e) => {
    e.preventDefault();
    if (!formData.image) {
      setError('Please attach a field photograph.');
      return;
    }
    if (!formData.latitude || !formData.longitude) {
      setError('Please fetch GPS coordinates or select a city preset.');
      return;
    }
    setError(null);
    setStep(3);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);

    const payload = new FormData();
    payload.append('evidence', formData.image);
    payload.append('latitude', formData.latitude);
    payload.append('longitude', formData.longitude);
    payload.append('category', formData.category);
    payload.append('title', formData.title);
    payload.append('description', formData.description);

    try {
      const response = await axios.post(`${API_BASE}/api/reports/intake`, payload, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const data = response.data;
      setReceipt(data);
      buildLegalEmailDraft(data);

      if (onReportCreated) {
        onReportCreated({
          id: data.id || data.reference_id,
          reference_id: data.reference_id,
          category: data.ai_classification.category,
          title: formData.title || `${data.ai_classification.category} Defect`,
          description: data.ai_classification.summary,
          ai_summary: data.ai_classification.summary,
          jurisdiction: data.jurisdiction,
          latitude: parseFloat(formData.latitude),
          longitude: parseFloat(formData.longitude),
          date: 'Just now',
          image_url: data.image_url || formData.imagePreview,
          status: 'verified',
          confidence: data.ai_classification.confidence,
          department_email: data.department_email,
          social_post: data.social_post,
          upvotes: 1
        });
      }

      setStep(4);
    } catch (err) {
      setError(err.response?.data?.error || 'Submission failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F3EE] py-6 pb-24 md:pb-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6">
        
        {/* Step Progress Bar */}
        <div className="mb-6 bg-white border-2 border-[#121316] p-2.5 hard-shadow-sm">
          <div className="grid grid-cols-4 gap-1.5 font-mono text-[11px] uppercase font-bold">
            {[
              { s: 1, label: '1. Type' },
              { s: 2, label: '2. Details' },
              { s: 3, label: '3. Review' },
              { s: 4, label: '4. Dispatch' }
            ].map((item) => (
              <div
                key={item.s}
                className={`py-2 text-center border ${
                  step === item.s
                    ? 'bg-[#D94E28] text-white border-[#121316]'
                    : step > item.s
                    ? 'bg-[#121316] text-white border-[#121316]'
                    : 'bg-[#F5F3EE] text-[#4A4D55] border-[#D8D4C8]'
                }`}
              >
                {item.label}
              </div>
            ))}
          </div>
        </div>

        {error && (
          <div className="mb-5 bg-[#FFE8E0] border-2 border-[#D94E28] text-[#121316] p-3.5 font-mono text-xs font-bold">
            [ALERT] // {error}
          </div>
        )}

        {/* STEP 1: SELECT TYPE */}
        {step === 1 && (
          <div className="bg-white border-2 border-[#121316] p-5 sm:p-7 space-y-5 hard-shadow">
            <h1 className="font-display text-xl sm:text-2xl font-bold text-[#121316]">
              Select Defect Category
            </h1>

            <div className="space-y-3">
              {issueTypes.map((t) => (
                <button
                  key={t.id}
                  onClick={() => handleTypeSelect(t.id)}
                  className="w-full text-left p-4 sm:p-5 bg-[#F5F3EE] hover:bg-white border-2 border-[#121316] hard-shadow-sm transition-all flex items-center justify-between group cursor-pointer"
                >
                  <div className="pr-3">
                    <h3 className="font-display font-bold text-base sm:text-lg text-[#121316] group-hover:text-[#D94E28]">
                      {t.label}
                    </h3>
                    <p className="text-xs sm:text-sm text-[#4A4D55] mt-1">{t.description}</p>
                  </div>
                  <span className="font-mono text-lg font-bold text-[#121316]">&rarr;</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP 2: DETAILS, VISIBLE COORDINATES & PHOTO */}
        {step === 2 && (
          <form onSubmit={handleStep2Continue} className="bg-white border-2 border-[#121316] p-5 sm:p-7 space-y-5 hard-shadow">
            <div className="flex items-center justify-between border-b-2 border-[#121316] pb-3">
              <h1 className="font-display text-xl font-bold text-[#121316]">Issue Details &amp; Telemetry</h1>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="font-mono text-xs font-bold border border-[#121316] px-2.5 py-1 cursor-pointer"
              >
                &larr; Back
              </button>
            </div>

            <div>
              <label className="block font-mono text-xs font-bold uppercase text-[#121316] mb-2">Department Wing</label>
              <div className="flex flex-wrap gap-2">
                {selectedTypeObj?.categories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setFormData({ ...formData, category: cat })}
                    className={`px-3 py-1.5 font-mono text-xs font-bold border-2 cursor-pointer ${
                      formData.category === cat
                        ? 'bg-[#121316] text-white border-[#121316]'
                        : 'bg-[#F5F3EE] text-[#121316] border-[#121316]'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block font-mono text-xs font-bold uppercase text-[#121316] mb-1">Issue Title</label>
              <input
                type="text"
                required
                placeholder="e.g., Deep pothole cluster on Station Road"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2.5 text-sm bg-[#F5F3EE] border-2 border-[#121316] focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-mono text-xs font-bold uppercase text-[#121316] mb-1">Field Notes / Landmarks</label>
              <textarea
                rows={2}
                required
                placeholder="Describe severity, traffic hazard, or nearby landmarks..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-[#F5F3EE] border-2 border-[#121316] focus:bg-white focus:outline-none"
              />
            </div>

            {/* GPS Coordinates Box with Visible Lat/Lng Inputs */}
            <div className="bg-[#F5F3EE] border-2 border-[#121316] p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="font-mono text-xs font-bold uppercase text-[#121316]">
                  GPS Coordinates (PostGIS)
                </label>
                <button
                  type="button"
                  onClick={acquireGps}
                  disabled={locating}
                  className="bg-[#121316] hover:bg-[#D94E28] text-white font-mono text-xs font-bold px-3.5 py-2 transition-colors cursor-pointer"
                >
                  {locating ? 'Acquiring GPS...' : '⊕ Fetch Device GPS'}
                </button>
              </div>

              {/* Visible Latitude & Longitude Boxes */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <span className="block font-mono text-[10px] uppercase text-[#4A4D55] mb-1">Latitude (°N)</span>
                  <input
                    type="text"
                    required
                    placeholder="16.6966"
                    value={formData.latitude}
                    onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                    className="w-full px-3 py-2 font-mono text-xs font-bold bg-white border-2 border-[#121316] text-[#121316]"
                  />
                </div>
                <div>
                  <span className="block font-mono text-[10px] uppercase text-[#4A4D55] mb-1">Longitude (°E)</span>
                  <input
                    type="text"
                    required
                    placeholder="74.4593"
                    value={formData.longitude}
                    onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                    className="w-full px-3 py-2 font-mono text-xs font-bold bg-white border-2 border-[#121316] text-[#121316]"
                  />
                </div>
              </div>

              {formData.latitude && formData.longitude && (
                <div className="bg-[#D8F3DC] border border-[#1B4332] px-3 py-1.5 font-mono text-xs font-bold text-[#1B4332] flex items-center justify-between">
                  <span>LOCKED: {formData.latitude}° N, {formData.longitude}° E</span>
                  <span>✓</span>
                </div>
              )}

              <div>
                <span className="font-mono text-[10px] uppercase text-[#4A4D55] block mb-1.5">
                  Quick-Select Municipality Node:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {PRESET_COORDS.map((p) => (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => applyPreset(p)}
                      className={`font-mono text-[11px] px-2.5 py-1 border border-[#121316] cursor-pointer ${
                        formData.latitude === p.lat ? 'bg-[#D94E28] text-white font-bold' : 'bg-white text-[#121316]'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Photo Upload */}
            <div>
              <label className="block font-mono text-xs font-bold uppercase text-[#121316] mb-1.5">
                Photographic Evidence
              </label>
              {formData.imagePreview ? (
                <div className="relative border-2 border-[#121316] bg-[#121316]">
                  <img src={formData.imagePreview} alt="Preview" className="w-full h-52 object-cover" />
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, image: null, imagePreview: null })}
                    className="absolute top-2.5 right-2.5 bg-[#D94E28] text-white font-mono text-xs font-bold px-3 py-1 border border-[#121316] cursor-pointer"
                  >
                    Replace Photo
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-[#121316] bg-[#F5F3EE] hover:bg-white cursor-pointer">
                  <span className="font-mono text-xs font-bold uppercase text-[#121316]">
                    [ + Capture or Upload Field Photo ]
                  </span>
                  <span className="font-mono text-[11px] text-[#4A4D55] mt-1">JPG / PNG up to 10MB</span>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            <button
              type="submit"
              className="w-full bg-[#D94E28] hover:bg-[#b83d1b] text-white font-mono text-xs uppercase font-bold py-3.5 border-2 border-[#121316] hard-shadow-sm cursor-pointer"
            >
              Review Submission &rarr;
            </button>
          </form>
        )}

        {/* STEP 3: REVIEW PAYLOAD */}
        {step === 3 && (
          <div className="bg-white border-2 border-[#121316] p-5 sm:p-7 space-y-5 hard-shadow">
            <div className="flex items-center justify-between border-b-2 border-[#121316] pb-3">
              <h1 className="font-display text-xl font-bold text-[#121316]">Review Submission Payload</h1>
              <button
                type="button"
                onClick={() => setStep(2)}
                disabled={isSubmitting}
                className="font-mono text-xs font-bold border border-[#121316] px-2.5 py-1 cursor-pointer"
              >
                &larr; Edit
              </button>
            </div>

            <div className="divide-y divide-[#D8D4C8] font-mono text-xs">
              <div className="py-2.5 flex justify-between">
                <span className="text-[#4A4D55]">Target Wing</span>
                <span className="font-bold text-[#121316]">{formData.category}</span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-[#4A4D55]">Docket Title</span>
                <span className="font-bold text-[#121316]">{formData.title}</span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-[#4A4D55]">GPS Coordinates</span>
                <span className="font-bold text-[#D94E28]">{formData.latitude}° N, {formData.longitude}° E</span>
              </div>
              <div className="py-2.5">
                <span className="text-[#4A4D55] block mb-1">Field Notes</span>
                <p className="text-[#121316] font-sans text-sm">{formData.description}</p>
              </div>
              <div className="py-3">
                <span className="text-[#4A4D55] block mb-2">Attached Evidence</span>
                <img src={formData.imagePreview} alt="Review" className="w-full h-48 object-cover border-2 border-[#121316]" />
              </div>
            </div>

            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="w-full bg-[#121316] hover:bg-[#D94E28] disabled:opacity-60 text-white font-mono text-xs uppercase font-bold py-4 border-2 border-[#121316] hard-shadow-sm cursor-pointer"
            >
              {isSubmitting ? 'Running AI Vision & PostGIS Routing...' : 'Submit & Verify with AI'}
            </button>
          </div>
        )}

        {/* STEP 4: FULL RECEIPT + AI ASSESSMENT + STATUTORY EMAIL DRAFT */}
        {step === 4 && receipt && (
          <div className="bg-white border-2 border-[#121316] p-5 sm:p-7 space-y-6 hard-shadow">
            <div className="border-b-2 border-[#121316] pb-4 flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="font-mono text-xs font-bold bg-[#D8F3DC] text-[#1B4332] border border-[#1B4332] px-2.5 py-0.5">
                  STATUS // AI VERIFIED &amp; ROUTED
                </span>
                <h1 className="font-display text-2xl font-bold text-[#121316] mt-2">
                  Municipal Routing Receipt
                </h1>
              </div>
              <span className="font-mono text-base font-bold bg-[#121316] text-white px-3 py-1">
                {receipt.reference_id}
              </span>
            </div>

            {/* Routing & Telemetry Summary */}
            <div className="bg-[#F5F3EE] border-2 border-[#121316] p-4 space-y-2 font-mono text-xs">
              <div className="flex justify-between">
                <span className="text-[#4A4D55]">Matched Corporation</span>
                <span className="font-bold text-[#121316]">{receipt.jurisdiction}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#4A4D55]">AI Classification</span>
                <span className="font-bold text-[#121316]">
                  {receipt.ai_classification.category} ({Math.round((receipt.ai_classification.confidence || 0.95) * 100)}% Confidence)
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#4A4D55]">GPS Coordinates</span>
                <span className="font-bold text-[#121316]">
                  {Number(formData.latitude).toFixed(5)}° N, {Number(formData.longitude).toFixed(5)}° E
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#4A4D55]">Routed Nodal Email</span>
                <span className="font-bold text-[#D94E28] break-all ml-2">{receipt.department_email}</span>
              </div>
            </div>

            {/* Dedicated AI Vision Technical Summary Box */}
            <div className="border-l-4 border-[#121316] bg-[#F5F3EE] p-4">
              <div className="font-mono text-[10px] font-bold uppercase text-[#D94E28] mb-1">
                AI Computer Vision Technical Assessment
              </div>
              <p className="text-sm text-[#121316] leading-relaxed">
                {receipt.ai_classification.summary}
              </p>
            </div>

            {/* Full Statutory Legal Email Draft Composer */}
            <div className="border-2 border-[#121316] bg-[#F5F3EE] p-4 sm:p-5 space-y-3.5 font-mono text-xs">
              <div className="flex items-center justify-between border-b-2 border-[#121316] pb-2.5">
                <div>
                  <span className="text-[10px] font-bold uppercase text-[#D94E28] block">
                    // AUTOMATED STATUTORY NOTICE
                  </span>
                  <h2 className="font-display text-base font-bold text-[#121316]">
                    Official Legal Complaint Email Draft
                  </h2>
                </div>
                <span className="text-[10px] bg-white border border-[#121316] px-2 py-0.5 font-bold">
                  EDITABLE
                </span>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-[#4A4D55] mb-1">
                  To (Department Nodal Officer):
                </label>
                <input
                  type="text"
                  value={emailRecipient}
                  onChange={(e) => setEmailRecipient(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-[#121316] font-bold text-[#D94E28]"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-[#4A4D55] mb-1">
                  Official Docket Subject Line:
                </label>
                <input
                  type="text"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-[#121316] font-bold text-[#121316]"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-[#4A4D55] mb-1">
                  Statutory Notice Body (Includes PostGIS Telemetry &amp; AI Evidence):
                </label>
                <textarea
                  rows={12}
                  value={emailBody}
                  onChange={(e) => setEmailBody(e.target.value)}
                  className="w-full p-3 bg-white border border-[#121316] text-[#121316] leading-relaxed focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(
                      emailRecipient
                    )}&su=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
                    window.open(gmailUrl, '_blank', 'noopener,noreferrer');
                  }}
                  className="bg-[#D94E28] hover:bg-[#b83d1b] text-white font-bold py-3 px-3 border-2 border-[#121316] hard-shadow-sm cursor-pointer"
                >
                  1. Open in Gmail &rarr;
                </button>
                <button
                  type="button"
                  onClick={() => {
                    window.location.href = `mailto:${encodeURIComponent(emailRecipient)}?subject=${encodeURIComponent(
                      emailSubject
                    )}&body=${encodeURIComponent(emailBody)}`;
                  }}
                  className="bg-[#121316] text-white font-bold py-3 px-3 border-2 border-[#121316] hard-shadow-sm cursor-pointer"
                >
                  2. Open Mail App
                </button>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(`To: ${emailRecipient}\nSubject: ${emailSubject}\n\n${emailBody}`);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className="bg-white text-[#121316] font-bold py-3 px-3 border-2 border-[#121316] cursor-pointer"
                >
                  {copied ? 'Copied ✓' : '3. Copy Notice'}
                </button>
              </div>
            </div>

            <div className="flex gap-3 pt-1">
              <button
                onClick={() => navigate('/feed')}
                className="flex-1 bg-[#121316] text-white font-mono text-xs uppercase font-bold py-3 border-2 border-[#121316] cursor-pointer"
              >
                View in Public Feed
              </button>
              <button
                onClick={() => {
                  setStep(1);
                  setReceipt(null);
                  setFormData({
                    category: '',
                    title: '',
                    description: '',
                    locationName: '',
                    latitude: '',
                    longitude: '',
                    image: null,
                    imagePreview: null
                  });
                }}
                className="flex-1 bg-white text-[#121316] font-mono text-xs uppercase font-bold py-3 border-2 border-[#121316] cursor-pointer"
              >
                Submit Another
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}