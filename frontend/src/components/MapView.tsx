import { CircleMarker, MapContainer, TileLayer, useMap } from 'react-leaflet';
import { useEffect } from 'react';
import type { FieldSummary } from '../types';
import { scoreColor } from '../lib/score';

const STORY_COUNTY_CENTER: [number, number] = [42.0308, -93.4668];

function FitFields({ fields }: { fields: FieldSummary[] }) {
  const map = useMap();
  useEffect(() => {
    if (fields.length === 0) return;
    const bounds = fields.map((f) => [f.lat, f.lng] as [number, number]);
    // Leave room for the field list: along the bottom on phones, on the left on wider screens.
    const narrow = map.getSize().x < 640;
    map.fitBounds(bounds, {
      paddingTopLeft: narrow ? [30, 30] : [370, 50],
      paddingBottomRight: narrow ? [30, 190] : [50, 50],
    });
  }, [fields, map]);
  return null;
}

interface MapViewProps {
  fields: FieldSummary[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function MapView({ fields, selectedId, onSelect }: MapViewProps) {
  return (
    <MapContainer
      center={STORY_COUNTY_CENTER}
      zoom={11}
      className="h-full w-full"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FitFields fields={fields} />
      {fields.map((field) => (
        <CircleMarker
          key={field.id}
          center={[field.lat, field.lng]}
          radius={field.id === selectedId ? 18 : 14}
          pathOptions={{
            color:
              field.id === selectedId ? '#E9B730' : field.scoreValue < 35 ? '#2A1B12' : '#F6EFE1',
            weight: field.id === selectedId ? 4 : 2.5,
            fillColor: scoreColor(field.scoreValue),
            fillOpacity: 0.85,
          }}
          eventHandlers={{ click: () => onSelect(field.id) }}
        />
      ))}
    </MapContainer>
  );
}
