import React, { forwardRef, useImperativeHandle, useMemo, useRef } from 'react';
import { Pharmacy } from '../api/pharmacyService';

const MG_CENTER = { lat: -18.879, lng: 47.508, zoom: 6 };

function buildLeafletHTML(pharmacies: Pharmacy[]) {
  const markersJson = JSON.stringify(
    pharmacies.map((p) => ({
      id: p.id, name: p.name, lat: p.lat, lng: p.lng,
      city: p.city || '', street: p.street || '', phone: p.phone || '',
    })),
  );

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <style>
    html, body, #map { height: 100%; margin: 0; padding: 0; }
    .leaflet-popup-content b { color: #0ea5e9; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script>
    const map = L.map('map').setView([${MG_CENTER.lat}, ${MG_CENTER.lng}], ${MG_CENTER.zoom});
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap', maxZoom: 19,
    }).addTo(map);
    const pharmacies = ${markersJson};
    const markers = {};
    pharmacies.forEach((p) => {
      const m = L.marker([p.lat, p.lng]).addTo(map);
      const html = '<b>' + p.name + '</b>' +
                   (p.city ? '<br/>' + p.city : '') +
                   (p.street ? '<br/>' + p.street : '') +
                   (p.phone ? '<br/>📞 ' + p.phone : '');
      m.bindPopup(html);
      markers[p.id] = m;
    });
    window.addEventListener('message', (e) => {
      try {
        const data = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
        if (data && data.type === 'focus' && markers[data.id]) {
          const m = markers[data.id];
          map.setView(m.getLatLng(), 14, { animate: true });
          m.openPopup();
        }
      } catch (_) {}
    });
  </script>
</body>
</html>`;
}

export type PharmaciesMapHandle = {
  focusOn: (id: string) => void;
};

type Props = { pharmacies: Pharmacy[] };

const PharmaciesMap = forwardRef<PharmaciesMapHandle, Props>(({ pharmacies }, ref) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const html = useMemo(() => buildLeafletHTML(pharmacies), [pharmacies]);

  useImperativeHandle(ref, () => ({
    focusOn: (id: string) => {
      iframeRef.current?.contentWindow?.postMessage(
        JSON.stringify({ type: 'focus', id }),
        '*',
      );
    },
  }));

  return (
    <iframe
      ref={iframeRef}
      srcDoc={html}
      style={{ flex: 1, width: '100%', height: '100%', border: 0 }}
      title="Carte des pharmacies"
    />
  );
});

PharmaciesMap.displayName = 'PharmaciesMap';
export default PharmaciesMap;
