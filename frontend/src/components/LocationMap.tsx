import { CircleMarker, MapContainer, TileLayer, useMapEvents } from 'react-leaflet';

function ClickToMove({ onMove }: { onMove: (lat: number, lng: number) => void }) {
  useMapEvents({ click: (e) => onMove(e.latlng.lat, e.latlng.lng) });
  return null;
}

interface LocationMapProps {
  lat: number;
  lng: number;
  onMove: (lat: number, lng: number) => void;
}

export function LocationMap({ lat, lng, onMove }: LocationMapProps) {
  return (
    <MapContainer center={[lat, lng]} zoom={13} className="h-full w-full" scrollWheelZoom={false}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <ClickToMove onMove={onMove} />
      <CircleMarker
        center={[lat, lng]}
        radius={12}
        pathOptions={{ color: '#F6EFE1', weight: 4, fillColor: '#C2542D', fillOpacity: 1 }}
      />
    </MapContainer>
  );
}
