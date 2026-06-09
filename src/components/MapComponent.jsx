import { MapContainer, TileLayer, Marker, Popup, Circle, useMap, ZoomControl } from 'react-leaflet';
import { useEffect, useMemo, useState } from 'react';
import { Navigation, Radio } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { MAP_TILES, DEFAULT_ZOOM, MIN_LABEL_ZOOM, resolveMapStyle } from '../constants/mapConfig';
import { useTheme } from '../context/ThemeContext';
import { formatDistance } from '../utils/format';
import './MapComponent.css';

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

const mechanicIcon = (available, name, showName) =>
    createDivIcon(
        `<div class="map-mechanic-marker ${available ? 'online' : 'offline'} ${showName ? 'with-name' : ''}">
            ${showName ? `<span class="map-mechanic-name">${(name || 'Mechanic').split(' ')[0]}</span>` : ''}
        </div>`,
        showName ? [56, 58] : [40, 48],
        showName ? [28, 50] : [20, 44]
    );

const trackingMechanicIcon = createDivIcon(
    '<div class="map-tracking-mechanic"><span class="map-tracking-pulse"></span><span class="map-tracking-car">🚗</span><span class="map-tracking-label">En route</span></div>',
    [72, 56],
    [36, 28]
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
            map.fitBounds(L.latLngBounds(valid), { padding: [48, 48], maxZoom: 17, animate: true });
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
                        map.setView([pos.coords.latitude, pos.coords.longitude], 17, { animate: true });
                    });
                }
            }}
            aria-label="Center on my location"
        >
            <Navigation size={18} />
        </button>
    );
}

function ZoomTracker({ onZoomChange }) {
    const map = useMap();
    useEffect(() => {
        const update = () => onZoomChange(map.getZoom());
        update();
        map.on('zoomend', update);
        return () => map.off('zoomend', update);
    }, [map, onZoomChange]);
    return null;
}

function MapTiles({ style = 'live' }) {
    if ((style === 'live' || style === 'liveLight') && MAP_TILES[style]) {
        const { base, labels } = MAP_TILES[style];
        return (
            <>
                <TileLayer
                    attribution={base.attribution}
                    url={base.url}
                    subdomains={base.subdomains}
                    maxZoom={base.maxZoom}
                    minZoom={11}
                />
                <TileLayer
                    url={labels.url}
                    subdomains={labels.subdomains}
                    maxZoom={labels.maxZoom}
                    minZoom={11}
                    pane="overlayPane"
                    opacity={1}
                />
            </>
        );
    }

    const tile = MAP_TILES[style] || MAP_TILES.voyager;
    return (
        <TileLayer
            attribution={tile.attribution}
            url={tile.url}
            subdomains={tile.subdomains}
            maxZoom={tile.maxZoom}
            minZoom={11}
        />
    );
}

export function MapComponent({
    center = [6.5244, 3.3792],
    zoom = DEFAULT_ZOOM,
    markers = [],
    trackingMechanic = null,
    showUserLocation = true,
    showLocateButton = true,
    showLiveBadge = true,
    fitToMarkers = false,
    scrollWheelZoom = true,
    mapStyle = 'auto',
    onMarkerClick,
    className = '',
    accuracyMeters = 80,
}) {
    const { isDark } = useTheme();
    const resolvedMapStyle = resolveMapStyle(mapStyle, isDark);
    const [currentZoom, setCurrentZoom] = useState(zoom);
    const showMechanicNames = currentZoom >= MIN_LABEL_ZOOM;

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
                minZoom={11}
                maxZoom={20}
            >
                <ChangeView center={center} zoom={zoom} />
                <ZoomTracker onZoomChange={setCurrentZoom} />
                {fitToMarkers && <FitBounds points={boundsPoints} />}

                <MapTiles style={resolvedMapStyle} />
                <ZoomControl position="topright" />

                {showUserLocation && center?.[0] != null && (
                    <>
                        <Circle
                            center={center}
                            radius={accuracyMeters}
                            pathOptions={{
                                color: '#3B82F6',
                                fillColor: '#3B82F6',
                                fillOpacity: 0.15,
                                weight: 2,
                                dashArray: '6 4',
                            }}
                        />
                        <Marker position={center} icon={userIcon} zIndexOffset={1000}>
                            <Popup>
                                <div className="map-popup">
                                    <strong>You are here</strong>
                                    <span>Zoom in to see road & junction names</span>
                                </div>
                            </Popup>
                        </Marker>
                    </>
                )}

                {markers.map((mech) =>
                    mech.lat != null && mech.lng != null ? (
                        <Marker
                            key={mech.id}
                            position={[mech.lat, mech.lng]}
                            icon={mechanicIcon(mech.is_available, mech.name, showMechanicNames)}
                            eventHandlers={{
                                click: () => onMarkerClick?.(mech),
                            }}
                        >
                            <Popup>
                                <div className="map-popup">
                                    <strong>{mech.name}</strong>
                                    <span>{mech.specialty}</span>
                                    {mech.address && <span>{mech.address}</span>}
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
                            {trackingMechanic.name || 'Mechanic'} — en route to you
                        </Popup>
                    </Marker>
                )}

                {showLocateButton && <LocateControl />}
            </MapContainer>

            {showLiveBadge && (
                <div className="map-live-badge">
                    <span className="map-live-dot" />
                    <Radio size={12} />
                    LIVE MAP
                </div>
            )}

            <div className="map-attribution-badge">
                Streets & junctions · OpenStreetMap
            </div>

            {currentZoom < MIN_LABEL_ZOOM && (
                <div className="map-zoom-hint">Zoom in for road names</div>
            )}
        </div>
    );
}
