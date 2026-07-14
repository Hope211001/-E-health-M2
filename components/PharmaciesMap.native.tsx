import React, { forwardRef, useImperativeHandle, useRef, useEffect } from 'react';
import { WebView } from 'react-native-webview';
import { Pharmacy } from '../api/pharmacyService';

const MG_CENTER = { lat: -18.879, lng: 47.508, zoom: 6 };

export type UserLocation = { lat: number; lng: number };

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
  <link rel="stylesheet" href="https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.css" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.Default.css" />
  <style>
    html, body, #map { height: 100%; margin: 0; padding: 0; }
    .leaflet-popup-content b { color: #0ea5e9; }
    .user-dot { background:#0ea5e9; border:3px solid #fff; border-radius:50%; width:18px; height:18px; box-shadow:0 0 0 4px rgba(14,165,233,.3); }
  </style>
</head>
<body>
  <div id="map"></div>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script src="https://unpkg.com/leaflet.markercluster@1.5.3/dist/leaflet.markercluster.js"></script>
  <script>
    const map = L.map('map').setView([${MG_CENTER.lat}, ${MG_CENTER.lng}], ${MG_CENTER.zoom});
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap', maxZoom: 19,
    }).addTo(map);

    const pharmacies = ${markersJson};
    const markers = {};
    const cluster = L.markerClusterGroup({ chunkedLoading: true, maxClusterRadius: 50 });
    pharmacies.forEach((p) => {
      const m = L.marker([p.lat, p.lng]);
      const html = '<b>' + p.name + '</b>' +
                   (p.city ? '<br/>' + p.city : '') +
                   (p.street ? '<br/>' + p.street : '') +
                   (p.phone ? '<br/>📞 ' + p.phone : '');
      m.bindPopup(html);
      cluster.addLayer(m);
      markers[p.id] = m;
    });
    map.addLayer(cluster);

    let userMarker = null;
    function setUser(lat, lng, center) {
      const icon = L.divIcon({ className: '', html: '<div class="user-dot"></div>', iconSize: [18,18], iconAnchor: [9,9] });
      if (!userMarker) {
        userMarker = L.marker([lat, lng], { icon: icon, zIndexOffset: 1000 }).addTo(map);
        userMarker.bindPopup('Vous êtes ici');
      } else {
        userMarker.setLatLng([lat, lng]);
      }
      if (center) map.setView([lat, lng], 14, { animate: true });
    }

    document.addEventListener('message', handleMsg);
    window.addEventListener('message', handleMsg);
    function handleMsg(e) {
      try {
        const data = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
        if (!data) return;
        if (data.type === 'focus' && markers[data.id]) {
          const m = markers[data.id];
          cluster.zoomToShowLayer(m, function () {
            map.setView(m.getLatLng(), 15, { animate: true });
            m.openPopup();
          });
        } else if (data.type === 'user') {
          setUser(data.lat, data.lng, data.center !== false);
        } else if (data.type === 'centerUser' && userMarker) {
          map.setView(userMarker.getLatLng(), 14, { animate: true });
          userMarker.openPopup();
        }
      } catch (_) {}
    }
  </script>
</body>
</html>`;
}

export type PharmaciesMapHandle = {
  focusOn: (id: string) => void;
  centerOnUser: () => void;
};

type Props = { pharmacies: Pharmacy[]; userLocation?: UserLocation | null };

const PharmaciesMap = forwardRef<PharmaciesMapHandle, Props>(({ pharmacies, userLocation }, ref) => {
  const webviewRef = useRef<WebView>(null);

  const post = (payload: object) => {
    webviewRef.current?.injectJavaScript(`
      window.dispatchEvent(new MessageEvent('message', { data: ${JSON.stringify(JSON.stringify(payload))} }));
      true;
    `);
  };

  // Dès que la position arrive (ou change), on l'envoie à la carte.
  useEffect(() => {
    if (userLocation) post({ type: 'user', lat: userLocation.lat, lng: userLocation.lng });
  }, [userLocation]);

  useImperativeHandle(ref, () => ({
    focusOn: (id: string) => post({ type: 'focus', id }),
    centerOnUser: () => post({ type: 'centerUser' }),
  }));

  return (
    <WebView
      ref={webviewRef}
      originWhitelist={['*']}
      source={{ html: buildLeafletHTML(pharmacies) }}
      style={{ flex: 1 }}
      javaScriptEnabled
      domStorageEnabled
      // Ré-injecte la position quand la page a fini de charger.
      onLoadEnd={() => {
        if (userLocation) post({ type: 'user', lat: userLocation.lat, lng: userLocation.lng });
      }}
    />
  );
});

PharmaciesMap.displayName = 'PharmaciesMap';
export default PharmaciesMap;
