import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from 'react-leaflet';
import { useEffect } from 'react';
import L from 'leaflet';
import { MAP_TILES } from '../constants/mapConfig';
import './RouteMap.css';

const pinIcon = (color, label) =>
    L.divIcon({
        className: 'route-pin-icon',
        html: `<div class="route-pin ${color}"><span>${label}</span></div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
    });

function FitRoute({ path }) {
    const map = useMap();
    useEffect(() => {
        if (path?.length > 1) {
            map.fitBounds(L.latLngBounds(path), { padding: [40, 40], maxZoom: 12, animate: true });
        }
    }, [path, map]);
    return null;
}

export function RouteMap({
    path = [],
    start,
    end,
    mechanics = [],
    height = 280,
    className = '',
}) {
    const center = path[0] || (start ? [start.lat, start.lng] : [6.5244, 3.3792]);
    const tile = MAP_TILES.live;

    return (
        <div className={`route-map-wrapper ${className}`} style={{ height }}>
            <MapContainer
                center={center}
                zoom={8}
                scrollWheelZoom
                className="route-map-element"
                zoomControl
            >
                <TileLayer
                    attribution={tile.base.attribution}
                    url={tile.base.url}
                    subdomains={tile.base.subdomains}
                    maxZoom={20}
                />
                <TileLayer
                    url={tile.labels.url}
                    subdomains={tile.labels.subdomains}
                    maxZoom={20}
                    pane="overlayPane"
                />

                <FitRoute path={path} />

                {path.length > 1 && (
                    <>
                        <Polyline
                            positions={path}
                            pathOptions={{
                                color: '#FF6B35',
                                weight: 5,
                                opacity: 0.9,
                                lineCap: 'round',
                                lineJoin: 'round',
                            }}
                        />
                        <Polyline
                            positions={path}
                            pathOptions={{
                                color: '#FFB347',
                                weight: 10,
                                opacity: 0.25,
                                lineCap: 'round',
                            }}
                        />
                    </>
                )}

                {start?.lat != null && (
                    <Marker position={[start.lat, start.lng]} icon={pinIcon('start', 'A')}>
                        <Popup><strong>Start</strong><br />{start.label || start.name}</Popup>
                    </Marker>
                )}

                {end?.lat != null && (
                    <Marker position={[end.lat, end.lng]} icon={pinIcon('end', 'B')}>
                        <Popup><strong>Destination</strong><br />{end.label || end.name}</Popup>
                    </Marker>
                )}

                {mechanics.map((m) =>
                    m.lat != null && m.lng != null ? (
                        <Marker
                            key={m.id}
                            position={[m.lat, m.lng]}
                            icon={pinIcon('mech', '🔧')}
                        >
                            <Popup>
                                <strong>{m.name}</strong>
                                <br />{m.specialty}
                            </Popup>
                        </Marker>
                    ) : null
                )}
            </MapContainer>
        </div>
    );
}
