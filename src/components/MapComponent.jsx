import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import { useEffect, useMemo } from 'react';
import { Navigation } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { MAP_TILES, DEFAULT_ZOOM } from '../constants/mapConfig';
import { formatDistance } from '../utils/format';
import './MapComponent.css';

const tile = MAP_TILES.dark;

const createDivIcon = (html, size, anchor) =>
    L.divIcon({
        className: 'leaflet-custom-icon',
        html,
        iconSize: size,
        iconAnchor: anchor,
        popupAnchor: [0, -anchor[1] + 8],
    });

const userIcon = createDivIcon(
    '<div class="map-user-marker"><span class="map-user-pulse"></span><span class="map-user-dot"></span></div>',
    [32, 32],
    [16, 16]
);

const mechanicIcon = (available, name) =>
    createDivIcon(
        `<div class="map-mechanic-marker ${available ? 'online' : 'offline'}">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
            <span class="map-mechanic-label">${(name || 'M').charAt(0)}</span>
        </div>`,
        [40, 48],
        [20, 44]
    );

const trackingMechanicIcon = createDivIcon(
    '<div class="map-tracking-mechanic"><span class="map-tracking-pulse"></span>🚗</div>',
    [36, 36],
    [18, 18]
);

function ChangeView({ center, zoom }) {
    const map = useMap();
    useEffect(() => {
        if (center?.[0] && center?.[1]) {
            map.setView(center, zoom ?? map.getZoom(), { animate: true });
        }
    }, [center, zoom, map]);
    return null;
}

function FitBounds({ points }) {
    const map = useMap();
    useEffect(() => {
        const valid = (points || []).filter((p) => p?.[0] != null && p?.[1] != null);
        if (valid.length > 1) {
            map.fitBounds(L.latLngBounds(valid), { padding: [48, 48], maxZoom: 16, animate: true });
        }
    }, [points, map]);
    return null;
}

function LocateControl({ onLocate }) {
    const map = useMap();
    return (
        <button
            type="button"
            className="map-locate-btn"
            onClick={() => {
                if (onLocate) onLocate();
                else if (navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition((pos) => {
                        map.setView([pos.coords.latitude, pos.coords.longitude], 15, { animate: true });
                    });
                }
            }}
            aria-label="Center on my location"
        >
            <Navigation size={18} />
        </button>
    );
}

export function MapComponent({
    center = [6.5244, 3.3792],
    zoom = DEFAULT_ZOOM,
    markers = [],
    trackingMechanic = null,
    showUserLocation = true,
    showLocateButton = true,
    fitToMarkers = false,
    scrollWheelZoom = true,
    onMarkerClick,
    className = '',
    accuracyMeters = 80,
}) {
    const boundsPoints = useMemo(() => {
        const pts = [];
        if (showUserLocation && center) pts.push(center);
        markers.forEach((m) => {
            if (m.lat != null && m.lng != null) pts.push([m.lat, m.lng]);
        });
        if (trackingMechanic?.lat != null) pts.push([trackingMechanic.lat, trackingMechanic.lng]);
        return pts;
    }, [center, markers, trackingMechanic, showUserLocation]);

    return (
        <div className={`map-wrapper ${className}`}>
            <MapContainer
                center={center}
                zoom={zoom}
                scrollWheelZoom={scrollWheelZoom}
                className="leaflet-map-element"
                zoomControl={false}
            >
                <ChangeView center={center} zoom={zoom} />
                {fitToMarkers && <FitBounds points={boundsPoints} />}

                <TileLayer
                    attribution={tile.attribution}
                    url={tile.url}
                    subdomains={tile.subdomains}
                    maxZoom={tile.maxZoom}
                />

                {showUserLocation && center?.[0] != null && (
                    <>
                        <Circle
                            center={center}
                            radius={accuracyMeters}
                            pathOptions={{
                                color: '#3B82F6',
                                fillColor: '#3B82F6',
                                fillOpacity: 0.12,
                                weight: 1,
                            }}
                        />
                        <Marker position={center} icon={userIcon} zIndexOffset={1000}>
                            <Popup>You are here</Popup>
                        </Marker>
                    </>
                )}

                {markers.map((mech) =>
                    mech.lat != null && mech.lng != null ? (
                        <Marker
                            key={mech.id}
                            position={[mech.lat, mech.lng]}
                            icon={mechanicIcon(mech.is_available, mech.name)}
                            eventHandlers={{
                                click: () => onMarkerClick?.(mech),
                            }}
                        >
                            <Popup>
                                <div className="map-popup">
                                    <strong>{mech.name}</strong>
                                    <span>{mech.specialty}</span>
                                    <span className={mech.is_available ? 'online' : 'offline'}>
                                        {mech.is_available ? '● Online now' : '○ Offline'}
                                    </span>
                                    {mech.distance_meters != null && (
                                        <span>{formatDistance(mech.distance_meters)} away</span>
                                    )}
                                </div>
                            </Popup>
                        </Marker>
                    ) : null
                )}

                {trackingMechanic?.lat != null && trackingMechanic?.lng != null && (
                    <Marker
                        position={[trackingMechanic.lat, trackingMechanic.lng]}
                        icon={trackingMechanicIcon}
                        zIndexOffset={900}
                    >
                        <Popup>
                            {trackingMechanic.name || 'Mechanic'} — en route
                        </Popup>
                    </Marker>
                )}

                {showLocateButton && <LocateControl />}
            </MapContainer>

            <div className="map-attribution-badge">Live map · OpenStreetMap</div>
        </div>
    );
}
