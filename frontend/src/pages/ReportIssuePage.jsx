import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_BASE =
  import.meta.env.VITE_API_URL ||
  (window.location.hostname === 'localhost'
    ? 'http://localhost:5000'
    : 'https://citylense.onrender.com');

const PRESET_COORDS = [
  { label: 'Ichalkaranji', lat: '16.6966', lng: '74.4593' },
  { label: 'Kolhapur', lat: '16.7050', lng: '74.2433' },
  { label: 'Pune', lat: '18.5204', lng: '73.8567' },
  { label: 'Mumbai', lat: '18.9388', lng: '72.8354' }
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
      label: 'Infrastructure Issue',
      description: 'Potholes, damaged roads, water leaks, drainage',
      categories: ['Roads & Infra', 'Water & Drainage', 'Encroachment & Estate']
    },
    {
      id: 'service',
      label: 'Municipal Service Issue',
      description: 'Street lights, garbage collection, public sanitation, gardens',
      categories: ['Health & SWM', 'Electricity', 'Environment & Gardens']
    }
  ];

  const selectedTypeObj = issueTypes.find((t) => t.id === issueType);

  const buildLegalEmailDraft = (apiData) => {
    const citizenName = user?.name || 'Citizen Reporter';
    const lat = parseFloat(formData.latitude).toFixed(6);
    const lng = parseFloat(formData.longitude).toFixed(6);
    const mapsUrl = `https://www.google.com/maps?q=${lat},${lng}`;

    const subject = `[Docket #${apiData.reference_id}] ${apiData.ai_classification.category} Defect — ${apiData.jurisdiction}`;

    const body = `To,
The Nodal Officer (${apiData.ai_classification.category}),
${apiData.jurisdiction} Municipal Corporation.

Subject: Official Civic Defect Notice [Ref: ${apiData.reference_id}]

Respected Sir / Madam,

I am reporting a verified civic defect within ${apiData.jurisdiction}:

- Docket ID   : ${apiData.reference_id}
- Issue       : ${formData.title}
- AI Summary  : ${apiData.ai_classification.summary}
- Coordinates : ${lat}° N, ${lng}° E
- Google Maps : ${mapsUrl}
- Evidence    : ${apiData.image_url || 'Attached'}

Please acknowledge receipt and initiate necessary rectification.

Sincerely,
${citizenName}
${user?.email || ''}`;

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
            locationName: prev.locationName || `GPS (${lat}, ${lng})`
          }));
          setLocating(false);
        },
        () => {
          setError('GPS blocked. Select a preset city below or allow location access.');
          setLocating(false);
        },
        { enableHighAccuracy: true }
      );
    } else {
      setError('Geolocation not supported.');
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
      setError('Please attach a photo.');
      return;
    }
    if (!formData.latitude || !formData.longitude) {
      setError('Please lock GPS or select a city.');
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
        
        {/* Compact Step Bar */}
        <div className="mb-6 bg-white border-2 border-[#121316] p-2.5 hard-shadow-sm">
          <div className="grid grid-cols-4 gap-1.5 font-mono text-[11px] uppercase font-bold">
            {[
              { s: 1, label: '1. Type' },
              { s: 2, label: '2. Details' },
              { s: 3, label: '3. Review' },
              { s: 4, label: '4. Done' }
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
            {error}
          </div>
        )}

        {/* STEP 1 */}
        {step === 1 && (
          <div className="bg-white border-2 border-[#121316] p-5 sm:p-7 space-y-5 hard-shadow">
            <h1 className="font-display text-xl sm:text-2xl font-bold text-[#121316]">
              What type of issue are you reporting?
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

        {/* STEP 2 */}
        {step === 2 && (
          <form onSubmit={handleStep2Continue} className="bg-white border-2 border-[#121316] p-5 sm:p-7 space-y-5 hard-shadow">
            <div className="flex items-center justify-between border-b-2 border-[#121316] pb-3">
              <h1 className="font-display text-xl font-bold text-[#121316]">Issue Details</h1>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="font-mono text-xs font-bold border border-[#121316] px-2.5 py-1 cursor-pointer"
              >
                &larr; Back
              </button>
            </div>

            <div>
              <label className="block font-mono text-xs font-bold uppercase text-[#121316] mb-2">Category</label>
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
              <label className="block font-mono text-xs font-bold uppercase text-[#121316] mb-1">Title</label>
              <input
                type="text"
                required
                placeholder="Brief title of the defect"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2.5 text-sm bg-[#F5F3EE] border-2 border-[#121316] focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-mono text-xs font-bold uppercase text-[#121316] mb-1">Description</label>
              <textarea
                rows={2}
                required
                placeholder="Landmarks or severity details..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-[#F5F3EE] border-2 border-[#121316] focus:bg-white focus:outline-none"
              />
            </div>

            {/* Compact GPS Box */}
            <div className="bg-[#F5F3EE] border-2 border-[#121316] p-3.5 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-xs font-bold uppercase">Location GPS</span>
                <button
                  type="button"
                  onClick={acquireGps}
                  disabled={locating}
                  className="bg-[#121316] hover:bg-[#D94E28] text-white font-mono text-xs font-bold px-3 py-1.5 cursor-pointer"
                >
                  {locating ? 'Locating...' : formData.latitude ? 'GPS Locked ✓' : '⊕ Use My GPS'}
                </button>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {PRESET_COORDS.map((p) => (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => applyPreset(p)}
                    className={`font-mono text-[11px] px-2.5 py-1 border border-[#121316] cursor-pointer ${
                      formData.locationName === p.label ? 'bg-[#D94E28] text-white font-bold' : 'bg-white text-[#121316]'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Photo Upload */}
            <div>
              <label className="block font-mono text-xs font-bold uppercase text-[#121316] mb-1">Photo Evidence</label>
              {formData.imagePreview ? (
                <div className="relative border-2 border-[#121316]">
                  <img src={formData.imagePreview} alt="Preview" className="w-full h-48 object-cover" />
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, image: null, imagePreview: null })}
                    className="absolute top-2 right-2 bg-[#D94E28] text-white font-mono text-xs font-bold px-2.5 py-1 border border-[#121316] cursor-pointer"
                  >
                    Change
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed border-[#121316] bg-[#F5F3EE] hover:bg-white cursor-pointer">
                  <span className="font-mono text-xs font-bold uppercase text-[#121316]">+ Tap to Take / Upload Photo</span>
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
              Review Report &rarr;
            </button>
          </form>
        )}

        {/* STEP 3 */}
        {step === 3 && (
          <div className="bg-white border-2 border-[#121316] p-5 sm:p-7 space-y-5 hard-shadow">
            <div className="flex items-center justify-between border-b-2 border-[#121316] pb-3">
              <h1 className="font-display text-xl font-bold text-[#121316]">Review &amp; Submit</h1>
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
                <span className="text-[#4A4D55]">Category</span>
                <span className="font-bold">{formData.category}</span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-[#4A4D55]">Title</span>
                <span className="font-bold">{formData.title}</span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-[#4A4D55]">Coordinates</span>
                <span className="font-bold text-[#D94E28]">{formData.latitude}, {formData.longitude}</span>
              </div>
              <div className="py-3">
                <img src={formData.imagePreview} alt="Review" className="w-full h-44 object-cover border-2 border-[#121316]" />
              </div>
            </div>

            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="w-full bg-[#121316] hover:bg-[#D94E28] disabled:opacity-60 text-white font-mono text-xs uppercase font-bold py-3.5 border-2 border-[#121316] hard-shadow-sm cursor-pointer"
            >
              {isSubmitting ? 'Verifying with AI...' : 'Submit Report'}
            </button>
          </div>
        )}

        {/* STEP 4 */}
        {step === 4 && receipt && (
          <div className="bg-white border-2 border-[#121316] p-5 sm:p-7 space-y-5 hard-shadow">
            <div className="border-b-2 border-[#121316] pb-3 flex items-center justify-between">
              <div>
                <span className="font-mono text-[11px] font-bold text-[#1B4332]">✓ VERIFIED</span>
                <h1 className="font-display text-xl font-bold text-[#121316]">Report Logged</h1>
              </div>
              <span className="font-mono text-sm font-bold bg-[#121316] text-white px-2.5 py-1">
                {receipt.reference_id}
              </span>
            </div>

            <div className="bg-[#F5F3EE] border-2 border-[#121316] p-3.5 space-y-2 font-mono text-xs">
              <div className="flex justify-between">
                <span className="text-[#4A4D55]">Municipality</span>
                <span className="font-bold">{receipt.jurisdiction}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#4A4D55]">Department</span>
                <span className="font-bold">{receipt.ai_classification.category}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#4A4D55]">Nodal Email</span>
                <span className="font-bold text-[#D94E28] truncate ml-2">{receipt.department_email}</span>
              </div>
            </div>

            {/* Clean Legal Email Composer */}
            <div className="border-2 border-[#121316] bg-[#F5F3EE] p-4 space-y-3 font-mono text-xs">
              <div className="font-display text-sm font-bold text-[#121316]">
                Official Complaint Email Draft
              </div>

              <input
                type="text"
                value={emailRecipient}
                onChange={(e) => setEmailRecipient(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-white border border-[#121316] font-bold text-[#D94E28]"
              />
              <textarea
                rows={7}
                value={emailBody}
                onChange={(e) => setEmailBody(e.target.value)}
                className="w-full p-2.5 bg-white border border-[#121316] leading-relaxed"
              />

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(
                      emailRecipient
                    )}&su=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
                    window.open(gmailUrl, '_blank', 'noopener,noreferrer');
                  }}
                  className="bg-[#D94E28] text-white font-bold py-2.5 px-3 border-2 border-[#121316] cursor-pointer"
                >
                  Open Gmail
                </button>
                <button
                  type="button"
                  onClick={() => {
                    window.location.href = `mailto:${encodeURIComponent(emailRecipient)}?subject=${encodeURIComponent(
                      emailSubject
                    )}&body=${encodeURIComponent(emailBody)}`;
                  }}
                  className="bg-[#121316] text-white font-bold py-2.5 px-3 border-2 border-[#121316] cursor-pointer"
                >
                  Mail App
                </button>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(emailBody);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className="bg-white text-[#121316] font-bold py-2.5 px-3 border-2 border-[#121316] cursor-pointer"
                >
                  {copied ? 'Copied ✓' : 'Copy Text'}
                </button>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => navigate('/feed')}
                className="flex-1 bg-[#121316] text-white font-mono text-xs uppercase font-bold py-3 border-2 border-[#121316] cursor-pointer"
              >
                Public Feed
              </button>
              <button
                onClick={() => {
                  setStep(1);
                  setReceipt(null);
                }}
                className="flex-1 bg-white text-[#121316] font-mono text-xs uppercase font-bold py-3 border-2 border-[#121316] cursor-pointer"
              >
                New Report
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}