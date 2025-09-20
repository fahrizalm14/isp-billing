"use client";

import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect } from "react";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";

export interface OdpMapData {
  id: string;
  name: string;
  coordinate: string;
  portCapacity?: number;
  usedPorts?: number;
  districtName?: string;
}

interface OdpMapProps {
  data: OdpMapData[];
}

// Fix icon not showing issue
const fixLeafletIcon = () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl:
      "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  });
};

export function OdpMap({ data }: OdpMapProps) {
  const center: [number, number] = [-6.2, 106.8];

  useEffect(() => {
    fixLeafletIcon();
  }, []);

  return (
    <MapContainer
      center={center}
      zoom={10}
      style={{
        height: "100%",
        width: "100%",
      }}
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      {data.map((odp) => {
        const [lat, lng] = odp.coordinate.split(",").map(Number);
        if (isNaN(lat) || isNaN(lng)) return null;

        return (
          <Marker key={odp.id} position={[lat, lng]}>
            <Popup>
              <div
                style={{
                  minWidth: 200,
                  padding: 12,
                  borderRadius: 8,
                  boxShadow: "0 2px 10px rgba(0,0,0,0.15)",
                  backgroundColor: "white",
                  fontFamily: "Arial, sans-serif",
                }}
              >
                <h3 style={{ margin: "0 0 8px 0", fontSize: 18 }}>
                  {odp.name}
                </h3>
                <p style={{ margin: 0, fontSize: 14, color: "#555" }}>
                  District: {odp.districtName ?? "-"}
                </p>
                <p style={{ margin: 0, fontSize: 14, color: "#555" }}>
                  Capacity: {odp.portCapacity ?? "-"} ports
                </p>
                <p style={{ margin: 0, fontSize: 14, color: "#555" }}>
                  Used: {odp.usedPorts ?? "-"} ports
                </p>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
