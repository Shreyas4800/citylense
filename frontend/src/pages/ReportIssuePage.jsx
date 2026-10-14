import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

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
      code: 'INFRA-01',
      label: 'Civil & Surface Infrastructure Defect',
      description: 'Carriageway potholes, asphalt failure, bridge wear, pressurized water main ruptures, storm drainage',
      categories: ['Roads & Infra', 'Water & Drainage', 'Encroachment & Estate']
    },
    {
      id: 'service',
      code: 'SERV-02',
      label: 'Municipal Utility & Sanitation Failure',
      description: 'Street light feeder outages, solid waste transfer overflow, public sanitation, urban forestry',
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
- Location / Landmark : ${formData.locationName}
- PostGIS Coordinates : ${lat}° N, ${lng}° E (WGS 84)
- Google Maps Pin     : ${mapsUrl}
- Timestamp (IST)     : ${timestamp}

2. AI COMPUTER VISION TECHNICAL ASSESSMENT
--------------------------------------------------
- Assigned Department : ${apiData.ai_classification.category}
- AI Confidence Score : ${Math.round(apiData.ai_classification.confidence * 100)}%
- Technical Summary   : ${apiData.ai_classification.summary}
- Citizen Field Notes : ${formData.description}
- Cloud Evidence URL  : ${apiData.image_url || 'Attached in Municipal Cloud Registry'}

3. STATUTORY REQUEST FOR ACTION
--------------------------------------------------
Pursuant to the obligatory municipal duties under the Maharashtra Municipal Corporations Act regarding public safety and civic maintenance, this defect poses an active hazard to commuters and residents. 

Please acknowledge receipt of Docket #${apiData.reference_id} and initiate field inspection and remedial work at the earliest.

Sincerely,
${citizenName}
${citizenEmail}
Dispatched via CityLense Municipal Portal`;

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
            locationName: prev.locationName || `Hardware GPS (${lat}, ${lng})`
          }));
          setLocating(false);
        },
        () => {
          setError('Hardware GPS blocked. Use a preset node below or enable browser location.');
          setLocating(false);
        },
        { enableHighAccuracy: true }
      );
    } else {
      setError('Geolocation is not supported by this browser.');
      setLocating(false);
    }
  };

  const applyPreset = (preset) => {
    setFormData((prev) => ({
      ...prev,
      latitude: preset.lat,
      longitude: preset.lng,
      locationName: `${preset.label} Sector`
    }));
    setError(null);
  };

  const handleStep2Continue = (e) => {
    e.preventDefault();
    if (!formData.image) {
      setError('Photographic field evidence is mandatory for computer vision verification.');
      return;
    }
    if (!formData.latitude || !formData.longitude) {
      setError('Spatial coordinates are required. Click "Lock Device GPS" or select a city node.');
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
    payload.append('title', formData.title);
    payload.append('description', formData.description);
    payload.append('locationName', formData.locationName);
    payload.append('reporterName', user?.name || 'Citizen Reporter');
    payload.append('reporterEmail', user?.email || '');

    try {
      const response = await axios.post(`${API_BASE}/api/reports/intake`, payload, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const data = response.data;
      setReceipt(data);
      buildLegalEmailDraft(data);

      if (onReportCreated) {
        onReportCreated({
          id: data.reference_id,
          reference_id: data.reference_id,
          type: issueType,
          category: data.ai_classification.category,
          title: formData.title || `${data.ai_classification.category} Defect`,
          description: formData.description || data.ai_classification.summary,
          ai_summary: data.ai_classification.summary,
          jurisdiction: data.jurisdiction,
          location: formData.locationName,
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
      setError(err.response?.data?.error || 'Vision gateway rejected the image or backend is offline.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openGmailCompose = () => {
    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(
      emailRecipient
    )}&su=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
    window.open(gmailUrl, '_blank', 'noopener,noreferrer');
  };

  const openDefaultMailClient = () => {
    const mailtoUrl = `mailto:${encodeURIComponent(emailRecipient)}?subject=${encodeURIComponent(
      emailSubject
    )}&body=${encodeURIComponent(emailBody)}`;
    window.location.href = mailtoUrl;
  };

  const copyDraftToClipboard = () => {
    navigator.clipboard.writeText(`To: ${emailRecipient}\nSubject: ${emailSubject}\n\n${emailBody}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="min-h-screen bg-[#F5F3EE] py-8 pb-24 md:pb-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <div className="mb-8 bg-white border-2 border-[#121316] p-3 sm:p-4 hard-shadow-sm">
          <div className="grid grid-cols-4 gap-1.5 sm:gap-2 font-mono text-[10px] sm:text-[11px] uppercase font-bold">
            {[
              { s: 1, label: '01 / Domain' },
              { s: 2, label: '02 / Telemetry' },
              { s: 3, label: '03 / Audit' },
              { s: 4, label: '04 / Legal Notice' }
            ].map((item) => (
              <div
                key={item.s}
                className={`py-2 px-1 sm:px-2 text-center border ${
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
          <div className="mb-6 bg-[#FFE8E0] border-2 border-[#D94E28] text-[#121316] p-4 font-mono text-xs font-bold">
            [ALERT] // {error}
          </div>
        )}

        {step === 1 && (
          <div className="bg-white border-2 border-[#121316] p-6 sm:p-8 space-y-6 hard-shadow">
            <div className="border-b-2 border-[#121316] pb-4">
              <span className="font-mono text-xs font-bold text-[#D94E28] uppercase">// STAGE 01</span>
              <h1 className="font-display text-2xl font-bold text-[#121316] mt-1">
                Select Civic Defect Classification
              </h1>
            </div>

            <div className="space-y-4">
              {issueTypes.map((t) => (
                <button
                  key={t.id}
                  onClick={() => handleTypeSelect(t.id)}
                  className="w-full text-left p-5 bg-[#F5F3EE] hover:bg-white border-2 border-[#121316] hard-shadow-sm transition-all flex items-center justify-between group cursor-pointer"
                >
                  <div className="pr-4">
                    <span className="font-mono text-[10px] bg-[#121316] text-white px-2 py-0.5 font-bold">
                      {t.code}
                    </span>
                    <h3 className="font-display font-bold text-lg text-[#121316] mt-2 group-hover:text-[#D94E28]">
                      {t.label}
                    </h3>
                    <p className="text-sm text-[#4A4D55] mt-1">{t.description}</p>
                  </div>
                  <span className="font-mono text-xl font-bold text-[#121316] group-hover:translate-x-1 transition-transform">
                    &rarr;
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <form onSubmit={handleStep2Continue} className="bg-white border-2 border-[#121316] p-6 sm:p-8 space-y-6 hard-shadow">
            <div className="flex items-center justify-between border-b-2 border-[#121316] pb-4">
              <div>
                <span className="font-mono text-xs font-bold text-[#D94E28] uppercase">// STAGE 02</span>
                <h1 className="font-display text-2xl font-bold text-[#121316]">Field Evidence &amp; Spatial Lock</h1>
              </div>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="font-mono text-xs font-bold border border-[#121316] px-3 py-1.5 hover:bg-[#121316] hover:text-white cursor-pointer"
              >
                &larr; BACK
              </button>
            </div>

            <div>
              <label className="block font-mono text-xs font-bold uppercase text-[#121316] mb-2">
                Target Municipal Wing
              </label>
              <div className="flex flex-wrap gap-2">
                {selectedTypeObj?.categories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setFormData({ ...formData, category: cat })}
                    className={`px-3.5 py-2 font-mono text-xs font-bold border-2 transition-colors cursor-pointer ${
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
              <label className="block font-mono text-xs font-bold uppercase text-[#121316] mb-1.5">
                Docket Summary Title
              </label>
              <input
                type="text"
                required
                placeholder="e.g., Severe carriageway pothole cluster near Station Road"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3.5 py-2.5 text-sm bg-[#F5F3EE] border-2 border-[#121316] focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-mono text-xs font-bold uppercase text-[#121316] mb-1.5">
                Field Inspector Notes
              </label>
              <textarea
                rows={3}
                required
                placeholder="Specify lane obstruction, hazard severity, or nearby landmarks..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3.5 py-2.5 text-sm bg-[#F5F3EE] border-2 border-[#121316] focus:bg-white focus:outline-none"
              />
            </div>

            <div className="bg-[#F5F3EE] border-2 border-[#121316] p-4 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <label className="font-mono text-xs font-bold uppercase text-[#121316]">
                  PostGIS Telemetry Coordinates
                </label>
                <button
                  type="button"
                  onClick={acquireGps}
                  disabled={locating}
                  className="bg-[#121316] hover:bg-[#D94E28] text-white font-mono text-xs font-bold px-4 py-2 transition-colors cursor-pointer"
                >
                  {locating ? 'ACQUIRING SATELLITE LOCK...' : '⊕ LOCK DEVICE GPS'}
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Latitude (e.g. 16.7050)"
                  value={formData.latitude}
                  onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                  className="px-3 py-2 font-mono text-xs bg-white border border-[#121316]"
                />
                <input
                  type="text"
                  placeholder="Longitude (e.g. 74.2433)"
                  value={formData.longitude}
                  onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                  className="px-3 py-2 font-mono text-xs bg-white border border-[#121316]"
                />
              </div>

              <div>
                <span className="font-mono text-[10px] uppercase text-[#4A4D55] block mb-1.5">
                  Or quick-select Maharashtra test node:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {PRESET_COORDS.map((p) => (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => applyPreset(p)}
                      className="font-mono text-[11px] bg-white hover:bg-[#121316] hover:text-white text-[#121316] border border-[#121316] px-2.5 py-1 transition-colors cursor-pointer"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label className="block font-mono text-xs font-bold uppercase text-[#121316] mb-1.5">
                Photographic Evidence (OpenRouter Vision Input)
              </label>
              {formData.imagePreview ? (
                <div className="relative border-2 border-[#121316] bg-[#121316]">
                  <img src={formData.imagePreview} alt="Preview" className="w-full h-56 object-cover" />
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, image: null, imagePreview: null })}
                    className="absolute top-3 right-3 bg-[#D94E28] text-white font-mono text-xs font-bold px-3 py-1.5 border border-[#121316] cursor-pointer"
                  >
                    REPLACE PHOTO
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-full h-44 border-2 border-dashed border-[#121316] bg-[#F5F3EE] hover:bg-white cursor-pointer transition-colors">
                  <span className="font-mono text-xs font-bold uppercase text-[#121316]">
                    [ + ATTACH FIELD PHOTOGRAPH ]
                  </span>
                  <span className="font-mono text-[11px] text-[#4A4D55] mt-1">
                    OPENS REAR CAMERA ON MOBILE &bull; JPG/PNG UP TO 10MB
                  </span>
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

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                className="bg-[#D94E28] hover:bg-[#b83d1b] text-white font-mono text-xs uppercase tracking-wider font-bold px-6 py-3 border-2 border-[#121316] hard-shadow-sm cursor-pointer"
              >
                Proceed to Payload Audit &rarr;
              </button>
            </div>
          </form>
        )}

        {step === 3 && (
          <div className="bg-white border-2 border-[#121316] p-6 sm:p-8 space-y-6 hard-shadow">
            <div className="flex items-center justify-between border-b-2 border-[#121316] pb-4">
              <div>
                <span className="font-mono text-xs font-bold text-[#D94E28] uppercase">// STAGE 03</span>
                <h1 className="font-display text-2xl font-bold text-[#121316]">Confirm Dispatch Payload</h1>
              </div>
              <button
                type="button"
                onClick={() => setStep(2)}
                disabled={isSubmitting}
                className="font-mono text-xs font-bold border border-[#121316] px-3 py-1.5 cursor-pointer"
              >
                &larr; EDIT
              </button>
            </div>

            <div className="divide-y divide-[#D8D4C8] font-mono text-xs">
              <div className="py-3 flex justify-between">
                <span className="text-[#4A4D55]">TARGET WING</span>
                <span className="font-bold text-[#121316]">{formData.category}</span>
              </div>
              <div className="py-3 flex justify-between">
                <span className="text-[#4A4D55]">DOCKET TITLE</span>
                <span className="font-bold text-[#121316]">{formData.title}</span>
              </div>
              <div className="py-3 flex justify-between">
                <span className="text-[#4A4D55]">SPATIAL TELEMETRY</span>
                <span className="font-bold text-[#D94E28]">{formData.latitude}°N, {formData.longitude}°E</span>
              </div>
              <div className="py-3">
                <span className="text-[#4A4D55] block mb-2">EVIDENCE FRAME</span>
                <img src={formData.imagePreview} alt="Review" className="w-full h-48 object-cover border-2 border-[#121316]" />
              </div>
            </div>

            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="w-full bg-[#121316] hover:bg-[#D94E28] disabled:opacity-60 text-white font-mono text-xs uppercase tracking-widest font-bold py-4 border-2 border-[#121316] hard-shadow-sm transition-colors cursor-pointer"
            >
              {isSubmitting ? 'EXECUTING AI VISION & POSTGIS HAVERSINE ROUTING...' : 'TRANSMIT TO MUNICIPAL GATEWAY'}
            </button>
          </div>
        )}

        {step === 4 && receipt && (
          <div className="space-y-6">
            <div className="bg-white border-2 border-[#121316] p-6 sm:p-8 space-y-6 hard-shadow">
              <div className="border-b-2 border-[#121316] pb-4 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="font-mono text-xs font-bold bg-[#D8F3DC] text-[#1B4332] border border-[#1B4332] px-2.5 py-0.5">
                    STATUS // AI VERIFIED &amp; LOGGED IN POSTGRESQL
                  </span>
                  <h1 className="font-display text-2xl font-bold text-[#121316] mt-2">
                    Municipal Routing Receipt
                  </h1>
                </div>
                <span className="font-mono text-lg font-bold bg-[#121316] text-white px-3 py-1">
                  {receipt.reference_id}
                </span>
              </div>

              <div className="bg-[#F5F3EE] border-2 border-[#121316] p-4 space-y-2.5 font-mono text-xs">
                <div className="flex justify-between">
                  <span className="text-[#4A4D55]">NEAREST CORPORATION</span>
                  <span className="font-bold text-[#121316]">{receipt.jurisdiction}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#4A4D55]">AI CLASSIFICATION</span>
                  <span className="font-bold text-[#121316]">
                    {receipt.ai_classification.category} ({Math.round(receipt.ai_classification.confidence * 100)}%)
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#4A4D55]">ROUTED NODAL EMAIL</span>
                  <span className="font-bold text-[#D94E28] break-all">{receipt.department_email}</span>
                </div>
              </div>

              <div className="border-2 border-[#121316] bg-[#F5F3EE] p-5 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-[#121316] pb-3">
                  <div>
                    <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-[#D94E28] block">
                      // AUTOMATED STATUTORY NOTICE GENERATOR
                    </span>
                    <h2 className="font-display text-lg font-bold text-[#121316]">
                      Official Municipal Complaint Email Draft
                    </h2>
                  </div>
                  <span className="font-mono text-[10px] bg-white border border-[#121316] px-2 py-1 font-semibold">
                    EDITABLE BEFORE SEND
                  </span>
                </div>

                <div className="space-y-3 font-mono text-xs">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-[#4A4D55] mb-1">
                      To (Nodal Officer Email):
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
                      Statutory Complaint Body (Pre-filled with PostGIS &amp; AI Evidence):
                    </label>
                    <textarea
                      rows={12}
                      value={emailBody}
                      onChange={(e) => setEmailBody(e.target.value)}
                      className="w-full p-3 bg-white border border-[#121316] text-[#121316] leading-relaxed focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  <button
                    type="button"
                    onClick={openGmailCompose}
                    className="bg-[#D94E28] hover:bg-[#b83d1b] text-white font-mono text-xs uppercase font-bold py-3 px-4 border-2 border-[#121316] hard-shadow-sm cursor-pointer text-center"
                  >
                    1. Open in Gmail &rarr;
                  </button>
                  <button
                    type="button"
                    onClick={openDefaultMailClient}
                    className="bg-[#121316] hover:bg-[#2A2D34] text-white font-mono text-xs uppercase font-bold py-3 px-4 border-2 border-[#121316] hard-shadow-sm cursor-pointer text-center"
                  >
                    2. Open Mail App
                  </button>
                  <button
                    type="button"
                    onClick={copyDraftToClipboard}
                    className="bg-white hover:bg-[#F5F3EE] text-[#121316] font-mono text-xs uppercase font-bold py-3 px-4 border-2 border-[#121316] cursor-pointer text-center"
                  >
                    {copied ? 'COPIED TO CLIPBOARD ✓' : '3. Copy Legal Text'}
                  </button>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  onClick={() => navigate('/feed')}
                  className="flex-1 bg-[#121316] text-white font-mono text-xs uppercase font-bold py-3 border-2 border-[#121316] cursor-pointer"
                >
                  Inspect in Public Registry
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
                  File New Docket
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}