import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const TILE_LAYERS = {
  street: {
    name: 'GIS Street',
    url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap'
  },
  satellite: {
    name: 'Satellite Ortho',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; Esri World Imagery'
  }
};

const DEFAULT_CENTER = [17.6599, 74.2433];
const DEFAULT_ZOOM = 7;

export default function IssueMap({ issues = [] }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersLayerGroupRef = useRef(null);
  const markerMapRef = useRef({});
  const tileLayerRef = useRef(null);
  const coordsDisplayRef = useRef(null);
  const prevTopRefId = useRef(null);
  const hasFittedRealData = useRef(false);
  const [mapStyle, setMapStyle] = useState('street');

  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      zoomControl: false,
      scrollWheelZoom: true
    }).setView(DEFAULT_CENTER, DEFAULT_ZOOM);

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    tileLayerRef.current = L.tileLayer(TILE_LAYERS.street.url, {
      maxZoom: 19,
      attribution: TILE_LAYERS.street.attribution
    }).addTo(map);

    markersLayerGroupRef.current = L.layerGroup().addTo(map);

    map.on('mousemove', (e) => {
      if (coordsDisplayRef.current) {
        coordsDisplayRef.current.textContent = `${e.latlng.lat.toFixed(4)}°N, ${e.latlng.lng.toFixed(4)}°E`;
      }
    });

    mapInstanceRef.current = map;

    setTimeout(() => {
      map.invalidateSize();
    }, 250);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapInstanceRef.current;
    const layerGroup = markersLayerGroupRef.current;
    if (!map || !layerGroup) return;

    map.invalidateSize();
    layerGroup.clearLayers();
    markerMapRef.current = {};

    const validCoords = [];
    const coordCounts = {};

    issues.forEach((issue, index) => {
      const rawLat = parseFloat(issue.latitude);
      const rawLng = parseFloat(issue.longitude);
      const refKey = issue.reference_id || `issue-${index}`;

      if (!isNaN(rawLat) && !isNaN(rawLng) && rawLat !== 0 && rawLng !== 0) {
        const coordKey = `${rawLat.toFixed(4)},${rawLng.toFixed(4)}`;
        const countAtSpot = coordCounts[coordKey] || 0;
        coordCounts[coordKey] = countAtSpot + 1;

        // Spiderfy offset so multiple reports at the exact same preset coordinate never cover each other
        let lat = rawLat;
        let lng = rawLng;
        if (countAtSpot > 0) {
          const angle = countAtSpot * 1.1;
          const radius = 0.0012 * Math.ceil(countAtSpot / 4);
          lat = rawLat + radius * Math.cos(angle);
          lng = rawLng + radius * Math.sin(angle);
        }

        validCoords.push([lat, lng]);

        const isSeed = String(issue.id || '').startsWith('seed-');
        const pinColor =
          issue.status === 'resolved'
            ? '#1B4332'
            : issue.status === 'in-progress'
            ? '#D97706'
            : '#D94E28';

        const customIcon = L.divIcon({
          className: 'custom-gis-pin',
          html: `
            <div style="display:flex;flex-direction:column;align-items:center;transform:translate(-50%,-100%);cursor:pointer;">
              <div style="background:${pinColor};color:#ffffff;font-family:'JetBrains Mono',monospace;font-size:10px;font-weight:700;padding:2px 6px;border:2px solid #121316;box-shadow:2px 2px 0px #121316;white-space:nowrap;">
                ${issue.reference_id || 'PIN'}
              </div>
              <div style="width:14px;height:14px;background:${pinColor};border:2.5px solid #121316;border-radius:50%;margin-top:2px;box-shadow:0 0 0 4px rgba(217,78,40,0.25);"></div>
            </div>
          `,
          iconSize: [0, 0],
          iconAnchor: [0, 0],
          popupAnchor: [0, -28]
        });

        const marker = L.marker([lat, lng], {
          icon: customIcon,
          zIndexOffset: isSeed ? 100 : 1000 - index
        }).addTo(layerGroup);

        marker.bindPopup(`
          <div style="font-family: 'Plus Jakarta Sans', sans-serif; min-width: 220px; padding: 2px;">
            <div style="font-family: 'JetBrains Mono', monospace; font-size: 10px; font-weight: 700; color: #D94E28; text-transform: uppercase;">
              ${issue.reference_id || 'VERIFIED'} // ${issue.jurisdiction || 'MAHARASHTRA'}
            </div>
            <div style="font-size: 13px; font-weight: 700; color: #121316; margin: 4px 0;">
              ${issue.title || issue.category}
            </div>
            <div style="font-size: 11px; color: #4A4D55; line-height: 1.4;">
              ${issue.ai_summary || issue.description || ''}
            </div>
            <div style="margin-top: 6px; padding-top: 4px; border-top: 1px solid #e5e7eb; font-family: 'JetBrains Mono', monospace; font-size: 10px; color: #121316;">
              STATUS: ${(issue.status || 'verified').toUpperCase()} &bull; ${rawLat.toFixed(4)}°N, ${rawLng.toFixed(4)}°E
            </div>
          </div>
        `);

        markerMapRef.current[refKey] = { marker, lat, lng };
      }
    });

    const topIssue = issues[0];
    const hasRealDbIssue = issues.some((i) => !String(i.id || '').startsWith('seed-'));

    if (topIssue && topIssue.reference_id !== prevTopRefId.current) {
      prevTopRefId.current = topIssue.reference_id;
      const target = markerMapRef.current[topIssue.reference_id];

      if (hasRealDbIssue && target) {
        map.flyTo([target.lat, target.lng], 13, { duration: 1.0 });
        setTimeout(() => target.marker.openPopup(), 400);
        hasFittedRealData.current = true;
      } else if (!hasFittedRealData.current && validCoords.length > 0) {
        map.fitBounds(L.latLngBounds(validCoords), { padding: [50, 50], maxZoom: 12 });
      }
    }
  }, [issues]);

  const switchLayer = (styleKey) => {
    setMapStyle(styleKey);
    if (mapInstanceRef.current && tileLayerRef.current) {
      mapInstanceRef.current.removeLayer(tileLayerRef.current);
      tileLayerRef.current = L.tileLayer(TILE_LAYERS[styleKey].url, {
        maxZoom: 19,
        attribution: TILE_LAYERS[styleKey].attribution
      }).addTo(mapInstanceRef.current);
    }
  };

  const handleRecenter = () => {
    const map = mapInstanceRef.current;
    if (!map) return;
    const coords = Object.values(markerMapRef.current).map((m) => [m.lat, m.lng]);
    if (coords.length > 0) {
      map.fitBounds(L.latLngBounds(coords), { padding: [55, 55], maxZoom: 12 });
    }
  };

  const focusIssuePin = (refKey) => {
    const target = markerMapRef.current[refKey];
    const map = mapInstanceRef.current;
    if (target && map) {
      map.flyTo([target.lat, target.lng], 16, { duration: 0.9 });
      target.marker.openPopup();
    }
  };

  return (
    <div className="relative w-full h-full min-h-[360px] flex flex-col bg-[#E5E2D9]">
      <div className="relative flex-1 w-full min-h-[310px]">
        <div ref={mapContainerRef} style={{ height: '330px', width: '100%' }} className="w-full h-full z-0" />

        <div className="absolute top-3 left-3 z-[400] bg-[#121316]/90 text-white px-3 py-1.5 border border-[#33363F] font-mono text-[11px] flex items-center gap-2.5 pointer-events-none">
          <span className="inline-block w-2 h-2 rounded-full bg-[#10B981]" />
          <span>PLOTTED PINS: {issues.length}</span>
          <span className="text-[#9CA3AF]">|</span>
          <span ref={coordsDisplayRef}>16.7050°N, 74.2433°E</span>
        </div>

        <div className="absolute top-3 right-3 z-[400] flex bg-white border-2 border-[#121316] hard-shadow-sm">
          {Object.keys(TILE_LAYERS).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => switchLayer(key)}
              className={`px-2.5 py-1 text-[10px] sm:text-[11px] font-mono font-semibold uppercase tracking-wider transition-colors cursor-pointer ${
                mapStyle === key
                  ? 'bg-[#121316] text-white'
                  : 'bg-white text-[#121316] hover:bg-[#F5F3EE]'
              }`}
            >
              {TILE_LAYERS[key].name}
            </button>
          ))}
          <button
            type="button"
            onClick={handleRecenter}
            className="px-2.5 py-1 text-[10px] sm:text-[11px] font-mono font-bold uppercase tracking-wider bg-[#F5F3EE] text-[#D94E28] border-l border-[#121316] hover:bg-[#121316] hover:text-white transition-colors cursor-pointer"
          >
            Fit All ({issues.length})
          </button>
        </div>
      </div>

      {/* Bottom Interactive Pin Jump Strip */}
      <div className="bg-[#121316] text-white px-3 py-2 border-t-2 border-[#121316] flex items-center gap-2 overflow-x-auto font-mono text-[10px]">
        <span className="text-[#D94E28] font-bold uppercase shrink-0">CLICK TO LOCATE PIN:</span>
        {issues.map((issue) => (
          <button
            key={issue.reference_id}
            type="button"
            onClick={() => focusIssuePin(issue.reference_id)}
            className="px-2 py-1 bg-[#2A2D34] hover:bg-[#D94E28] text-white border border-[#4A4D55] shrink-0 transition-colors cursor-pointer"
          >
            {issue.reference_id} &bull; {(issue.jurisdiction || 'City').split(' ')[0]}
          </button>
        ))}
      </div>
    </div>
  );
}