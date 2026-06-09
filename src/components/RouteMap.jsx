import { MapContainer, TileLayer, Polyline, Marker, Popup, Circle, useMap } from 'react-leaflet';
import { useEffect } from 'react';
import L from 'leaflet';
import { MAP_TILES, resolveMapStyle } from '../constants/mapConfig';
import { useTheme } from '../context/ThemeContext';
import './RouteMap.css';

const pinIcon = (color, label) =>
    L.divIcon({
        className: 'route-pin-icon',
        html: `<div class="route-pin ${color}"><span>${label}</span></div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
    });

function FitRoute({ path, userLocation }) {
    const map = useMap();
    useEffect(() => {
        const points = [...(path || [])];
        if (userLocation?.lat != null) points.push([userLocation.lat, userLocation.lng]);
        if (points.length > 1) {
            map.fitBounds(L.latLngBounds(points), { padding: [48, 48], maxZoom: 14, animate: true });
        }
    }, [path, userLocation, map]);
    return null;
}

export function RouteMap({
    path = [],
    start,
    end,
    mechanics = [],
    userLocation = null,
    height = 280,
    className = '',
}) {
    const { isDark } = useTheme();
    const tileKey = resolveMapStyle('live', isDark);
    const tile = MAP_TILES[tileKey];
    const center = path[0] || (start ? [start.lat, start.lng] : [6.5244, 3.3792]);

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

                <FitRoute path={path} userLocation={userLocation} />

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

                {userLocation?.lat != null && (
                    <>
                        <Circle
                            center={[userLocation.lat, userLocation.lng]}
                            radius={userLocation.accuracy || 80}
                            pathOptions={{
                                color: '#3B82F6',
                                fillColor: '#3B82F6',
                                fillOpacity: 0.15,
                                weight: 2,
                            }}
                        />
                        <Marker position={[userLocation.lat, userLocation.lng]} icon={pinIcon('user', '●')}>
                            <Popup>
                                <strong>You are here</strong>
                                <br />{userLocation.label || 'Current GPS position'}
                            </Popup>
                        </Marker>
                    </>
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
