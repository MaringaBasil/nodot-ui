import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Theme } from '@/constants/Colors';
import { AppIcon } from '@/components/ui/AppIcon';

export type MapMarker = {
  id: string;
  label?: string;
  lat: number;
  lng: number;
  type?: 'pickup' | 'hub' | 'you' | 'hotspot';
  status?: 'pending' | 'accepted' | 'completed';
  address?: string;
  rating?: number;
  distance?: string;
  duration?: string;
  isOpen?: boolean;
};

type MapViewProps = {
  markers: MapMarker[];
  focusId?: string;
  onMarkerPress?: (id: string) => void;
  showControls?: boolean;
  compact?: boolean;
  showTraffic?: boolean;
  showSearch?: boolean;
  showDirections?: boolean;
  onDirectionsPress?: (markerId: string) => void;
  onSearchPress?: () => void;
};

const useNativeDriver = Platform.OS !== 'web';

const projectPoint = (lat: number, lng: number, bounds: { minLat: number; maxLat: number; minLng: number; maxLng: number }) => {
  const { minLat, maxLat, minLng, maxLng } = bounds;
  const latSpan = Math.max(maxLat - minLat, 0.0005);
  const lngSpan = Math.max(maxLng - minLng, 0.0005);
  const top = ((maxLat - lat) / latSpan) * 100;
  const left = ((lng - minLng) / lngSpan) * 100;
  return { top: Math.min(Math.max(top, 8), 92), left: Math.min(Math.max(left, 8), 92) };
};

const createShadow = (nativeShadow: object, webShadow: string) => Platform.OS === 'web' ? { boxShadow: webShadow } : nativeShadow;
const markerShadow = createShadow({ shadowColor: '#0C120D', shadowOpacity: 0.25, shadowRadius: 8, shadowOffset: { width: 0, height: 3 } }, '0px 3px 8px rgba(12, 18, 13, 0.25)');
const buildingShadow = createShadow({ shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, shadowOffset: { width: 2, height: 2 } }, '2px 2px 4px rgba(0, 0, 0, 0.1)');
const cardShadow = createShadow({ shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 12, shadowOffset: { width: 0, height: 4 } }, '0px 4px 12px rgba(0, 0, 0, 0.15)');

const MARKER_COLORS = {
  you: { base: '#4285F4', ring: 'rgba(66,133,244,0.3)', icon: 'my-location', gradient: ['#4285F4', '#1967D2'] },
  hub: { base: '#FF8F00', ring: 'rgba(255,143,0,0.28)', icon: 'store', gradient: ['#FF8F00', '#E65100'] },
  hotspot: { base: '#EA4335', ring: 'rgba(234,67,53,0.28)', icon: 'local-fire-department', gradient: ['#EA4335', '#C62828'] },
  pickup: { base: '#34A853', ring: 'rgba(52,168,83,0.28)', icon: 'local-shipping', gradient: ['#34A853', '#1E7E34'] },
};

// Street data for realism
const STREETS = {
  mainH1: { name: 'Jan Smuts Ave', traffic: 'moderate' },
  mainH2: { name: 'Oxford Rd', traffic: 'light' },
  mainV1: { name: '7th Street', traffic: 'heavy' },
  mainV2: { name: 'Gleneagles Rd', traffic: 'light' },
};

// Traffic colors (Google Maps style)
const TRAFFIC_COLORS = {
  light: '#2E7D32',
  moderate: '#F57F17',
  heavy: '#D32F2F',
};

// Map types
type MapType = 'default' | 'satellite' | 'terrain';

// Animated Car Component
const AnimatedCar: React.FC<{ style: object; color: string; direction: 'h' | 'v' }> = ({ style, color, direction }) => {
  const moveAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(moveAnim, { toValue: 1, duration: 4000, useNativeDriver }),
        Animated.timing(moveAnim, { toValue: 0, duration: 0, useNativeDriver }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, []);

  return (
    <Animated.View
      style={[
        styles.car,
        style,
        direction === 'h' ? {
          transform: [{ translateX: moveAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 150] }) }],
        } : {
          transform: [{ translateY: moveAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 120] }) }],
        },
        { backgroundColor: color },
      ]}
    />
  );
};

// Traffic Light Component
const TrafficLight: React.FC<{ style: object }> = ({ style }) => {
  const [light, setLight] = useState<'red' | 'yellow' | 'green'>('green');

  useEffect(() => {
    const interval = setInterval(() => {
      setLight((prev) => prev === 'green' ? 'yellow' : prev === 'yellow' ? 'red' : 'green');
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <View style={[styles.trafficLight, style]}>
      <View style={[styles.trafficLightDot, light === 'red' && styles.trafficRed]} />
      <View style={[styles.trafficLightDot, light === 'yellow' && styles.trafficYellow]} />
      <View style={[styles.trafficLightDot, light === 'green' && styles.trafficGreen]} />
    </View>
  );
};

// Google Maps-style Search Bar
const SearchBar: React.FC<{ onPress?: () => void; compact?: boolean }> = ({ onPress, compact }) => {
  if (compact) return null;

  return (
    <Pressable style={styles.searchBar} onPress={onPress}>
      <View style={styles.searchBarContent}>
        <AppIcon name="search" size={20} color="#5F6368" />
        <Text style={styles.searchPlaceholder}>Search here</Text>
      </View>
      <View style={styles.searchBarDivider} />
      <Pressable style={styles.searchVoiceBtn}>
        <AppIcon name="mic" size={20} color="#4285F4" />
      </Pressable>
    </Pressable>
  );
};

// Google Maps-style Layers Button
const LayersButton: React.FC<{ onPress: () => void; mapType: MapType }> = ({ onPress, mapType }) => (
  <Pressable style={({ pressed }) => [styles.layersBtn, pressed && styles.controlBtnPressed]} onPress={onPress}>
    <View style={styles.layersIcon}>
      <AppIcon name="layers" size={20} color="#5F6368" />
    </View>
    <Text style={styles.layersText}>{mapType === 'default' ? 'Map' : mapType === 'satellite' ? 'Satellite' : 'Terrain'}</Text>
  </Pressable>
);

// Location Info Card (Google Maps style bottom card)
const LocationInfoCard: React.FC<{
  marker: MapMarker;
  onDirections?: () => void;
  onClose: () => void;
}> = ({ marker, onDirections, onClose }) => {
  const slideAnim = useRef(new Animated.Value(200)).current;

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver,
      friction: 8,
      tension: 40,
    }).start();
  }, []);

  const palette = MARKER_COLORS[marker.type || 'pickup'];

  return (
    <Animated.View style={[styles.locationCard, { transform: [{ translateY: slideAnim }] }]}>
      <View style={styles.locationCardHandle} />
      <View style={styles.locationCardHeader}>
        <View style={[styles.locationCardIcon, { backgroundColor: palette.ring }]}>
          <AppIcon name={palette.icon as any} size={20} color={palette.base} />
        </View>
        <View style={styles.locationCardInfo}>
          <Text style={styles.locationCardTitle}>{marker.label || 'Location'}</Text>
          {marker.address && <Text style={styles.locationCardAddress}>{marker.address}</Text>}
          <View style={styles.locationCardMeta}>
            {marker.distance && (
              <View style={styles.locationCardMetaItem}>
                <AppIcon name="directions-walk" size={12} color="#5F6368" />
                <Text style={styles.locationCardMetaText}>{marker.distance}</Text>
              </View>
            )}
            {marker.duration && (
              <View style={styles.locationCardMetaItem}>
                <AppIcon name="schedule" size={12} color="#5F6368" />
                <Text style={styles.locationCardMetaText}>{marker.duration}</Text>
              </View>
            )}
            {marker.rating && (
              <View style={styles.locationCardMetaItem}>
                <AppIcon name="star" size={12} color="#FBBC04" />
                <Text style={styles.locationCardMetaText}>{marker.rating.toFixed(1)}</Text>
              </View>
            )}
            {marker.isOpen !== undefined && (
              <Text style={[styles.locationCardStatus, { color: marker.isOpen ? '#34A853' : '#EA4335' }]}>
                {marker.isOpen ? 'Open now' : 'Closed'}
              </Text>
            )}
          </View>
        </View>
        <Pressable style={styles.locationCardClose} onPress={onClose}>
          <AppIcon name="close" size={20} color="#5F6368" />
        </Pressable>
      </View>
      <View style={styles.locationCardActions}>
        <Pressable style={[styles.locationCardBtn, styles.locationCardBtnPrimary]} onPress={onDirections}>
          <AppIcon name="directions" size={18} color="#FFFFFF" />
          <Text style={styles.locationCardBtnPrimaryText}>Directions</Text>
        </Pressable>
        <Pressable style={styles.locationCardBtn}>
          <AppIcon name="bookmark-border" size={18} color="#4285F4" />
          <Text style={styles.locationCardBtnText}>Save</Text>
        </Pressable>
        <Pressable style={styles.locationCardBtn}>
          <AppIcon name="share" size={18} color="#4285F4" />
          <Text style={styles.locationCardBtnText}>Share</Text>
        </Pressable>
      </View>
    </Animated.View>
  );
};

// Enhanced Animated Marker
const AnimatedMarker: React.FC<{
  marker: MapMarker & { position: { top: number; left: number } };
  isFocused: boolean;
  onPress: () => void;
}> = ({ marker, isFocused, onPress }) => {
  const pulseAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const bounceAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0.5)).current;
  const palette = MARKER_COLORS[marker.type || 'pickup'];

  useEffect(() => {
    if (marker.type === 'you') {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1, duration: 2000, useNativeDriver }),
          Animated.timing(pulseAnim, { toValue: 0, duration: 2000, useNativeDriver }),
        ])
      );
      const glow = Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, { toValue: 1, duration: 1500, useNativeDriver }),
          Animated.timing(glowAnim, { toValue: 0.5, duration: 1500, useNativeDriver }),
        ])
      );
      pulse.start();
      glow.start();
      return () => { pulse.stop(); glow.stop(); };
    }
  }, [marker.type, pulseAnim, glowAnim]);

  useEffect(() => {
    if (isFocused) {
      Animated.sequence([
        Animated.timing(bounceAnim, { toValue: -12, duration: 150, useNativeDriver }),
        Animated.spring(bounceAnim, { toValue: 0, friction: 4, useNativeDriver }),
      ]).start();
    }
    Animated.spring(scaleAnim, {
      toValue: isFocused ? 1.35 : 1,
      useNativeDriver,
      friction: 7,
    }).start();
  }, [isFocused, scaleAnim, bounceAnim]);

  return (
    <Pressable
      style={[styles.marker, { top: `${marker.position.top}%`, left: `${marker.position.left}%` }]}
      onPress={onPress}
      accessibilityLabel={marker.label || marker.type}
    >
      {marker.type === 'you' && (
        <>
          <Animated.View
            style={[
              styles.markerPulse,
              {
                backgroundColor: palette.ring,
                opacity: pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [0.8, 0] }),
                transform: [{ scale: pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 3.5] }) }],
              },
            ]}
          />
          <Animated.View
            style={[
              styles.markerGlow,
              {
                backgroundColor: palette.base,
                opacity: glowAnim,
                transform: [{ scale: 2 }],
              },
            ]}
          />
        </>
      )}
      <Animated.View style={[styles.markerRing, { backgroundColor: palette.ring, transform: [{ scale: scaleAnim }] }]} />
      <Animated.View
        style={[
          styles.markerDot,
          { backgroundColor: palette.base, transform: [{ scale: scaleAnim }, { translateY: bounceAnim }] },
        ]}
      >
        {marker.type === 'you' && <View style={styles.markerInnerDot} />}
        {marker.type === 'hub' && <AppIcon name="store" size={10} color="#FFF" />}
        {marker.type === 'pickup' && <AppIcon name="local-shipping" size={10} color="#FFF" />}
        {marker.type === 'hotspot' && <AppIcon name="local-fire-department" size={10} color="#FFF" />}
      </Animated.View>
      {/* Google Maps style pin shadow */}
      {marker.type !== 'you' && (
        <View style={styles.markerPinShadow} />
      )}
      {/* Mini label badge */}
      {!isFocused && marker.type === 'hub' && marker.distance && (
        <View style={styles.markerMiniBadge}>
          <Text style={styles.markerMiniBadgeText}>{marker.distance}</Text>
        </View>
      )}
    </Pressable>
  );
};

// Street Label Component
const StreetLabel: React.FC<{ name: string; style: object; vertical?: boolean; traffic?: string }> = ({ name, style, vertical, traffic }) => (
  <View style={[styles.streetLabel, style, vertical && styles.streetLabelVertical]}>
    {traffic && <View style={[styles.trafficIndicator, { backgroundColor: TRAFFIC_COLORS[traffic as keyof typeof TRAFFIC_COLORS] }]} />}
    <Text style={[styles.streetLabelText, vertical && styles.streetLabelTextVertical]}>{name}</Text>
  </View>
);

// Route Line Component (for showing directions)
const RouteLine: React.FC<{ from: { top: number; left: number }; to: { top: number; left: number } }> = ({ from, to }) => {
  const flowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(flowAnim, { toValue: 1, duration: 1200, useNativeDriver })
    ).start();
  }, []);

  const dx     = to.left - from.left;
  const dy     = to.top  - from.top;
  const length = Math.sqrt(dx * dx + dy * dy);
  const angle  = Math.atan2(dy, dx) * (180 / Math.PI);
  const cLeft  = (from.left + to.left) / 2;
  const cTop   = (from.top  + to.top)  / 2;

  const base = {
    position: 'absolute' as const,
    top:  `${cTop}%`            as any,
    left: `${cLeft - length / 2}%` as any,
    width: `${length}%`         as any,
    borderRadius: 3,
    transform: [{ rotate: `${angle}deg` }],
  };

  return (
    <View style={styles.routeLineContainer} pointerEvents="none">
      {/* Glow */}
      <View style={[base, { height: 12, backgroundColor: 'rgba(66,133,244,0.15)', marginTop: -4 }]} />
      {/* Route */}
      <View style={[base, { height: 4,  backgroundColor: '#4285F4' }]} />
    </View>
  );
};

export const MapView: React.FC<MapViewProps> = ({
  markers = [],
  focusId,
  onMarkerPress,
  showControls = true,
  compact = false,
  showTraffic = true,
  showSearch = false,
  showDirections = false,
  onDirectionsPress,
  onSearchPress,
}) => {
  const [selectedMarker, setSelectedMarker] = useState<string | null>(focusId || null);
  const [mapType, setMapType] = useState<MapType>('default');
  const [showLocationCard, setShowLocationCard] = useState(false);

  const bounds = useMemo(() => {
    if (!markers.length) return { minLat: -26.2, maxLat: -26.19, minLng: 28.04, maxLng: 28.05 };
    const lats = markers.map((m) => m.lat);
    const lngs = markers.map((m) => m.lng);
    const padding = 0.003;
    return {
      minLat: Math.min(...lats) - padding,
      maxLat: Math.max(...lats) + padding,
      minLng: Math.min(...lngs) - padding,
      maxLng: Math.max(...lngs) + padding,
    };
  }, [markers]);

  const projectedMarkers = useMemo(
    () => markers.map((m) => ({ ...m, position: projectPoint(m.lat, m.lng, bounds) })),
    [markers, bounds]
  );

  const hubCount = markers.filter((m) => m.type === 'hub').length;
  const pickupCount = markers.filter((m) => m.type === 'pickup').length;
  const actualFocusId = focusId || selectedMarker;
  const selectedMarkerData = projectedMarkers.find(m => m.id === selectedMarker);

  const handleMarkerPress = (id: string) => {
    setSelectedMarker(id);
    setShowLocationCard(true);
    onMarkerPress?.(id);
  };

  const handleCloseCard = () => {
    setShowLocationCard(false);
    setSelectedMarker(null);
  };

  const cycleMapType = () => {
    setMapType(prev => prev === 'default' ? 'satellite' : prev === 'satellite' ? 'terrain' : 'default');
  };

  // Map background colors based on type
  const mapGradient = mapType === 'satellite'
    ? ['#1A3D2B', '#1A3D2B', '#2D4A3A']
    : mapType === 'terrain'
    ? ['#E8DCC8', '#E0D4BE', '#D8CCB4']
    : ['#E8F4EA', '#E2F0E4', '#DCE8DE'];

  return (
    <View style={[styles.container, compact && styles.containerCompact]}>
      {/* Map Background with subtle texture */}
      <LinearGradient colors={mapGradient as any} style={StyleSheet.absoluteFill} />

      {/* Grid pattern for realism */}
      <View style={[styles.gridPattern, mapType === 'satellite' && styles.gridPatternDark]}>
        {Array.from({ length: 8 }).map((_, i) => (
          <View key={`h-${i}`} style={[styles.gridLine, { top: `${(i + 1) * 12}%` }]} />
        ))}
        {Array.from({ length: 8 }).map((_, i) => (
          <View key={`v-${i}`} style={[styles.gridLineV, { left: `${(i + 1) * 12}%` }]} />
        ))}
      </View>

      {/* Parks with enhanced styling */}
      <View style={[styles.parkArea, styles.park1, mapType === 'satellite' && styles.parkAreaSatellite]}>
        <View style={styles.parkPattern} />
      </View>
      <View style={[styles.parkArea, styles.park2, mapType === 'satellite' && styles.parkAreaSatellite]}>
        <View style={styles.parkPattern} />
      </View>
      <View style={[styles.parkArea, styles.park3, mapType === 'satellite' && styles.parkAreaSatellite]} />

      {/* Water Feature with waves */}
      <View style={[styles.waterBody, mapType === 'satellite' && styles.waterBodySatellite]}>
        <View style={styles.waterWave1} />
        <View style={styles.waterWave2} />
        <View style={styles.waterWave3} />
      </View>

      {/* Main Roads with lanes and traffic colors */}
      <View style={styles.roadNetwork}>
        {/* Main horizontal roads */}
        <View style={[styles.mainRoad, styles.roadH1, mapType === 'satellite' && styles.mainRoadSatellite]}>
          <View style={[styles.roadLane, styles.roadLaneTop]} />
          <View style={styles.roadCenterLine} />
          <View style={[styles.roadLane, styles.roadLaneBottom]} />
          {showTraffic && <View style={[styles.trafficOverlay, { backgroundColor: TRAFFIC_COLORS[STREETS.mainH1.traffic as keyof typeof TRAFFIC_COLORS] }]} />}
        </View>
        <View style={[styles.mainRoad, styles.roadH2, mapType === 'satellite' && styles.mainRoadSatellite]}>
          <View style={styles.roadCenterLine} />
          {showTraffic && <View style={[styles.trafficOverlay, { backgroundColor: TRAFFIC_COLORS[STREETS.mainH2.traffic as keyof typeof TRAFFIC_COLORS] }]} />}
        </View>

        {/* Main vertical roads */}
        <View style={[styles.mainRoad, styles.roadV1, mapType === 'satellite' && styles.mainRoadSatellite]}>
          <View style={[styles.roadCenterLine, styles.roadCenterLineV]} />
          {showTraffic && <View style={[styles.trafficOverlayV, { backgroundColor: TRAFFIC_COLORS[STREETS.mainV1.traffic as keyof typeof TRAFFIC_COLORS] }]} />}
        </View>
        <View style={[styles.mainRoad, styles.roadV2, mapType === 'satellite' && styles.mainRoadSatellite]}>
          <View style={[styles.roadCenterLine, styles.roadCenterLineV]} />
        </View>

        {/* Side streets with crosswalks */}
        <View style={[styles.sideStreet, styles.side1, mapType === 'satellite' && styles.sideStreetSatellite]} />
        <View style={[styles.sideStreet, styles.side2, mapType === 'satellite' && styles.sideStreetSatellite]} />
        <View style={[styles.sideStreet, styles.side3, mapType === 'satellite' && styles.sideStreetSatellite]} />
        <View style={[styles.sideStreet, styles.side4, mapType === 'satellite' && styles.sideStreetSatellite]} />
        <View style={[styles.sideStreet, styles.side5, mapType === 'satellite' && styles.sideStreetSatellite]} />
        <View style={[styles.sideStreet, styles.side6, mapType === 'satellite' && styles.sideStreetSatellite]} />
        <View style={[styles.sideStreet, styles.side7, mapType === 'satellite' && styles.sideStreetSatellite]} />
        <View style={[styles.sideStreet, styles.side8, mapType === 'satellite' && styles.sideStreetSatellite]} />

        {/* Crosswalks */}
        <View style={[styles.crosswalk, { top: '30%', left: '20%' }]} />
        <View style={[styles.crosswalk, { top: '66%', left: '70%' }]} />
        <View style={[styles.crosswalkV, { top: '45%', left: '21%' }]} />
      </View>

      {/* Street Labels with traffic indicators */}
      {!compact && mapType !== 'satellite' && (
        <>
          <StreetLabel name={STREETS.mainH1.name} style={styles.labelH1} traffic={showTraffic ? STREETS.mainH1.traffic : undefined} />
          <StreetLabel name={STREETS.mainH2.name} style={styles.labelH2} traffic={showTraffic ? STREETS.mainH2.traffic : undefined} />
          <StreetLabel name={STREETS.mainV1.name} style={styles.labelV1} vertical traffic={showTraffic ? STREETS.mainV1.traffic : undefined} />
          <StreetLabel name={STREETS.mainV2.name} style={styles.labelV2} vertical />
        </>
      )}

      {/* Traffic Lights */}
      {!compact && showTraffic && (
        <>
          <TrafficLight style={{ top: '28%', left: '18%' }} />
          <TrafficLight style={{ top: '64%', left: '68%' }} />
        </>
      )}

      {/* Animated Cars */}
      {!compact && (
        <>
          <AnimatedCar style={{ top: '31%', left: '5%' }} color="#4A5568" direction="h" />
          <AnimatedCar style={{ top: '33%', left: '40%' }} color="#E53E3E" direction="h" />
          <AnimatedCar style={{ top: '67%', left: '20%' }} color="#3182CE" direction="h" />
          <AnimatedCar style={{ top: '15%', left: '21%' }} color="#38A169" direction="v" />
          <AnimatedCar style={{ top: '50%', left: '71%' }} color="#805AD5" direction="v" />
        </>
      )}

      {/* Buildings with enhanced styling */}
      {mapType !== 'satellite' && (
        <>
          <View style={[styles.building, styles.bldg1]}>
            <View style={styles.buildingWindow} />
            <View style={[styles.buildingWindow, { left: '55%' }]} />
          </View>
          <View style={[styles.building, styles.bldg2]} />
          <View style={[styles.building, styles.bldg3]}>
            <View style={styles.buildingRoof} />
          </View>
          <View style={[styles.building, styles.bldg4]} />
          <View style={[styles.building, styles.bldg5]} />
          <View style={[styles.building, styles.bldg6]} />
          <View style={[styles.building, styles.bldg7]} />
          <View style={[styles.building, styles.bldg8]} />
          <View style={[styles.building, styles.bldg9]} />
          <View style={[styles.building, styles.bldg10]} />

          {/* Special Buildings - Mall */}
          <View style={[styles.building, styles.mallBuilding]}>
            <View style={styles.mallRoof} />
            <Text style={styles.buildingLabel}>Mall</Text>
          </View>

          {/* Parking Areas with lines */}
          <View style={[styles.parking, styles.parking1]}>
            <View style={styles.parkingLine} />
            <View style={[styles.parkingLine, { left: '50%' }]} />
          </View>
          <View style={[styles.parking, styles.parking2]} />

          {/* Roundabout with detail */}
          <View style={styles.roundabout}>
            <View style={styles.roundaboutRoad} />
            <View style={styles.roundaboutInner}>
              <View style={styles.roundaboutGrass} />
            </View>
          </View>
        </>
      )}

      {/* Trees with shadows */}
      {[
        { top: '12%', left: '6%' },
        { top: '16%', left: '10%' },
        { top: '14%', left: '14%' },
        { top: '73%', left: '80%' },
        { top: '76%', left: '85%' },
        { top: '79%', left: '82%' },
        { top: '8%', left: '45%' },
        { top: '88%', left: '42%' },
      ].map((pos, i) => (
        <View key={i} style={[styles.tree, pos, mapType === 'satellite' && styles.treeSatellite]}>
          <View style={styles.treeShadow} />
        </View>
      ))}

      {/* Bus Stop */}
      {!compact && (
        <View style={styles.busStop}>
          <View style={styles.busStopSign} />
        </View>
      )}

      {/* Markers */}
      {projectedMarkers.map((marker) => (
        <AnimatedMarker
          key={marker.id}
          marker={marker}
          isFocused={marker.id === actualFocusId}
          onPress={() => handleMarkerPress(marker.id)}
        />
      ))}

      {/* ── Route Line (navigation mode) ── */}
      {showDirections && (() => {
        const you  = projectedMarkers.find(m => m.type === 'you');
        const dest = projectedMarkers.find(m => m.id === actualFocusId && m.type !== 'you');
        return (you && dest)
          ? <RouteLine key="route" from={you.position} to={dest.position} />
          : null;
      })()}

      {/* Google Maps-style Search Bar */}
      {showSearch && !compact && (
        <SearchBar onPress={onSearchPress} compact={compact} />
      )}

      {/* Google Maps-style Controls */}
      {showControls && !compact && (
        <>
          {/* Layers Button */}
          <LayersButton onPress={cycleMapType} mapType={mapType} />

          {/* Zoom Controls */}
          <View style={styles.controls}>
            <Pressable style={({ pressed }) => [styles.controlBtn, pressed && styles.controlBtnPressed]}>
              <AppIcon name="add" size={22} color="#5F6368" />
            </Pressable>
            <View style={styles.controlDivider} />
            <Pressable style={({ pressed }) => [styles.controlBtn, pressed && styles.controlBtnPressed]}>
              <AppIcon name="remove" size={22} color="#5F6368" />
            </Pressable>
          </View>

          {/* Locate button - Google style */}
          <Pressable style={({ pressed }) => [styles.locateBtn, pressed && styles.controlBtnPressed]}>
            <AppIcon name="my-location" size={22} color="#5F6368" />
          </Pressable>

          {/* Compass */}
          <View style={styles.compass}>
            <Text style={styles.compassN}>N</Text>
            <View style={styles.compassNeedle} />
          </View>
        </>
      )}

      {/* Compact Controls */}
      {showControls && compact && (
        <View style={styles.compactControls}>
          <Pressable style={({ pressed }) => [styles.compactControlBtn, pressed && styles.controlBtnPressed]}>
            <AppIcon name="fullscreen" size={18} color="#5F6368" />
          </Pressable>
        </View>
      )}

      {/* Traffic Legend - Google style */}
      {showControls && showTraffic && !compact && (
        <View style={styles.trafficLegend}>
          <Text style={styles.trafficLegendTitle}>Live traffic</Text>
          <View style={styles.trafficLegendBar}>
            <View style={[styles.trafficLegendSegment, { backgroundColor: TRAFFIC_COLORS.light }]} />
            <View style={[styles.trafficLegendSegment, { backgroundColor: TRAFFIC_COLORS.moderate }]} />
            <View style={[styles.trafficLegendSegment, { backgroundColor: TRAFFIC_COLORS.heavy }]} />
          </View>
          <View style={styles.trafficLegendLabels}>
            <Text style={styles.trafficLegendLabel}>Fast</Text>
            <Text style={styles.trafficLegendLabel}>Slow</Text>
          </View>
        </View>
      )}

      {/* Scale Bar */}
      {!compact && (
        <View style={styles.scaleBar}>
          <View style={styles.scaleBarLine}>
            <View style={styles.scaleBarTick} />
            <View style={[styles.scaleBarTick, { left: '50%' }]} />
            <View style={[styles.scaleBarTick, { left: '100%' }]} />
          </View>
          <Text style={styles.scaleBarText}>500 m</Text>
        </View>
      )}

      {/* Location Info Card */}
      {showLocationCard && selectedMarkerData && selectedMarkerData.type !== 'you' && (
        <LocationInfoCard
          marker={selectedMarkerData}
          onDirections={() => onDirectionsPress?.(selectedMarkerData.id)}
          onClose={handleCloseCard}
        />
      )}

      {/* Floating Action Button for Directions */}
      {showDirections && !compact && !showLocationCard && (
        <Pressable style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]}>
          <AppIcon name="directions" size={24} color="#FFFFFF" />
        </Pressable>
      )}

      {/* Google Logo placeholder */}
      {!compact && (
        <View style={styles.googleLogo}>
          <Text style={styles.googleLogoText}>NoDot Maps</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minHeight: 220,
    backgroundColor: '#E8F4E8',
    borderRadius: Theme.radius.m,
    overflow: 'hidden',
    position: 'relative',
  },
  containerCompact: {
    minHeight: 160,
  },

  // Search Bar - Google style
  searchBar: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    height: 48,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    ...cardShadow,
    zIndex: 100,
  },
  searchBarContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  searchPlaceholder: {
    fontSize: 16,
    fontFamily: Theme.fonts.body,
    color: '#5F6368',
  },
  searchBarDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 12,
  },
  searchVoiceBtn: {
    padding: 4,
  },

  // Layers Button
  layersBtn: {
    position: 'absolute',
    right: 12,
    top: 70,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
    ...cardShadow,
  },
  layersIcon: {
    width: 28,
    height: 28,
    borderRadius: 4,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  layersText: {
    fontSize: 10,
    fontFamily: Theme.fonts.body,
    color: '#5F6368',
  },

  // Location Info Card
  locationCard: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingTop: 8,
    paddingBottom: 20,
    paddingHorizontal: 16,
    ...cardShadow,
    zIndex: 100,
  },
  locationCardHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 12,
  },
  locationCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  locationCardIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationCardInfo: {
    flex: 1,
  },
  locationCardTitle: {
    fontSize: 18,
    fontFamily: Theme.fonts.display,
    color: '#202124',
    marginBottom: 2,
  },
  locationCardAddress: {
    fontSize: 14,
    fontFamily: Theme.fonts.body,
    color: '#5F6368',
    marginBottom: 6,
  },
  locationCardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
  },
  locationCardMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationCardMetaText: {
    fontSize: 12,
    fontFamily: Theme.fonts.body,
    color: '#5F6368',
  },
  locationCardStatus: {
    fontSize: 12,
    fontFamily: Theme.fonts.display,
  },
  locationCardClose: {
    padding: 4,
  },
  locationCardActions: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 8,
  },
  locationCardBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
  },
  locationCardBtnPrimary: {
    backgroundColor: '#4285F4',
    flex: 1.5,
  },
  locationCardBtnText: {
    fontSize: 13,
    fontFamily: Theme.fonts.display,
    color: '#4285F4',
  },
  locationCardBtnPrimaryText: {
    fontSize: 13,
    fontFamily: Theme.fonts.display,
    color: '#FFFFFF',
  },

  // Floating Action Button
  fab: {
    position: 'absolute',
    right: 12,
    bottom: 90,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#4285F4',
    alignItems: 'center',
    justifyContent: 'center',
    ...cardShadow,
  },
  fabPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.95 }],
  },

  // Google Logo
  googleLogo: {
    position: 'absolute',
    left: 8,
    bottom: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 4,
  },
  googleLogoText: {
    fontSize: 10,
    fontFamily: Theme.fonts.display,
    color: '#5F6368',
  },

  // Compact Controls
  compactControls: {
    position: 'absolute',
    right: 8,
    top: 8,
  },
  compactControlBtn: {
    width: 32,
    height: 32,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    ...cardShadow,
  },

  // Grid pattern
  gridPattern: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.12,
  },
  gridPatternDark: {
    opacity: 0.08,
  },
  gridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: '#9E9E9E',
  },
  gridLineV: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: '#9E9E9E',
  },

  // Parks
  parkArea: {
    position: 'absolute',
    backgroundColor: 'rgba(102,187,106,0.45)',
    borderRadius: 8,
  },
  parkAreaSatellite: {
    backgroundColor: 'rgba(76,175,80,0.6)',
  },
  parkPattern: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(129,199,132,0.3)',
    borderRadius: 8,
  },
  park1: { left: '2%', top: '5%', width: '24%', height: '28%', borderRadius: 40 },
  park2: { right: '3%', bottom: '5%', width: '20%', height: '25%', borderRadius: 35 },
  park3: { left: '38%', bottom: '3%', width: '14%', height: '18%', borderRadius: 25 },

  // Water
  waterBody: {
    position: 'absolute',
    right: '-5%',
    top: '12%',
    width: '30%',
    height: '32%',
    backgroundColor: 'rgba(79,195,247,0.4)',
    borderRadius: 90,
    transform: [{ rotate: '-18deg' }],
  },
  waterBodySatellite: {
    backgroundColor: 'rgba(33,150,243,0.5)',
  },
  waterWave1: {
    position: 'absolute',
    top: '20%',
    left: '20%',
    width: '60%',
    height: '60%',
    borderRadius: 100,
    borderWidth: 1.5,
    borderColor: 'rgba(79,195,247,0.35)',
  },
  waterWave2: {
    position: 'absolute',
    top: '30%',
    left: '30%',
    width: '40%',
    height: '40%',
    borderRadius: 100,
    borderWidth: 1,
    borderColor: 'rgba(79,195,247,0.25)',
  },
  waterWave3: {
    position: 'absolute',
    top: '40%',
    left: '40%',
    width: '20%',
    height: '20%',
    borderRadius: 100,
    borderWidth: 0.5,
    borderColor: 'rgba(79,195,247,0.2)',
  },

  // Roads
  roadNetwork: {
    ...StyleSheet.absoluteFillObject,
  },
  mainRoad: {
    position: 'absolute',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  mainRoadSatellite: {
    backgroundColor: 'rgba(200,200,200,0.7)',
  },
  roadLane: {
    position: 'absolute',
    width: '100%',
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.08)',
  },
  roadLaneTop: { top: '25%' },
  roadLaneBottom: { bottom: '25%' },
  roadCenterLine: {
    position: 'absolute',
    height: 2,
    width: '100%',
    backgroundColor: 'rgba(255,193,7,0.6)',
  },
  roadCenterLineV: {
    width: 2,
    height: '100%',
  },
  trafficOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    opacity: 0.6,
  },
  trafficOverlayV: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: 3,
    opacity: 0.6,
  },
  roadH1: { height: 14, width: '120%', top: '30%', left: '-10%' },
  roadH2: { height: 12, width: '115%', top: '66%', left: '-7%' },
  roadV1: { width: 14, height: '120%', left: '20%', top: '-10%' },
  roadV2: { width: 12, height: '115%', left: '70%', top: '-7%' },

  // Side streets
  sideStreet: {
    position: 'absolute',
    backgroundColor: 'rgba(255,255,255,0.95)',
    height: 6,
    borderRadius: 1,
  },
  sideStreetSatellite: {
    backgroundColor: 'rgba(200,200,200,0.7)',
  },
  side1: { width: '20%', top: '15%', left: '3%' },
  side2: { width: '24%', top: '45%', left: '26%' },
  side3: { width: '18%', top: '50%', left: '76%' },
  side4: { width: '22%', top: '80%', left: '23%' },
  side5: { width: '14%', top: '20%', left: '52%' },
  side6: { width: '18%', top: '85%', left: '52%' },
  side7: { width: '15%', top: '55%', left: '3%' },
  side8: { width: '12%', top: '75%', left: '76%' },

  // Crosswalks
  crosswalk: {
    position: 'absolute',
    width: 12,
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  crosswalkV: {
    position: 'absolute',
    width: 8,
    height: 12,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },

  // Street Labels
  streetLabel: {
    position: 'absolute',
    backgroundColor: 'rgba(255,255,255,0.92)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  streetLabelVertical: {
    transform: [{ rotate: '-90deg' }],
  },
  streetLabelText: {
    fontSize: 8,
    fontFamily: Theme.fonts.display,
    color: 'rgba(0,0,0,0.65)',
    letterSpacing: 0.3,
  },
  streetLabelTextVertical: {},
  trafficIndicator: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  labelH1: { top: '27%', left: '38%' },
  labelH2: { top: '63%', left: '33%' },
  labelV1: { top: '43%', left: '15%' },
  labelV2: { top: '38%', left: '66%' },

  // Traffic lights
  trafficLight: {
    position: 'absolute',
    width: 8,
    height: 18,
    backgroundColor: '#424242',
    borderRadius: 2,
    padding: 2,
    justifyContent: 'space-between',
  },
  trafficLightDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  trafficRed: { backgroundColor: '#F44336' },
  trafficYellow: { backgroundColor: '#FFC107' },
  trafficGreen: { backgroundColor: '#4CAF50' },

  // Cars
  car: {
    position: 'absolute',
    width: 10,
    height: 6,
    borderRadius: 2,
  },

  // Buildings
  building: {
    position: 'absolute',
    backgroundColor: 'rgba(176,190,197,0.35)',
    borderRadius: 3,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    ...buildingShadow,
    overflow: 'hidden',
  },
  buildingRoof: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: 'rgba(144,164,174,0.4)',
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
  },
  buildingWindow: {
    position: 'absolute',
    top: '30%',
    left: '20%',
    width: '25%',
    height: '35%',
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderRadius: 1,
  },
  buildingLabel: {
    position: 'absolute',
    bottom: 2,
    left: 0,
    right: 0,
    textAlign: 'center',
    fontSize: 5,
    fontFamily: Theme.fonts.body,
    color: 'rgba(0,0,0,0.5)',
  },
  mallRoof: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 5,
    backgroundColor: 'rgba(121,85,72,0.4)',
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
  },
  bldg1: { width: '11%', height: '13%', top: '36%', left: '4%' },
  bldg2: { width: '9%', height: '11%', top: '38%', left: '30%' },
  bldg3: { width: '13%', height: '9%', top: '10%', left: '36%' },
  bldg4: { width: '10%', height: '12%', top: '73%', left: '6%' },
  bldg5: { width: '8%', height: '10%', top: '53%', left: '56%' },
  bldg6: { width: '12%', height: '8%', top: '40%', left: '78%' },
  bldg7: { width: '9%', height: '11%', top: '13%', left: '76%' },
  bldg8: { width: '11%', height: '9%', top: '86%', left: '76%' },
  bldg9: { width: '8%', height: '10%', top: '58%', left: '78%' },
  bldg10: { width: '10%', height: '8%', top: '93%', left: '56%' },
  mallBuilding: { width: '16%', height: '12%', top: '36%', left: '46%', backgroundColor: 'rgba(161,136,127,0.35)' },

  // Parking
  parking: {
    position: 'absolute',
    backgroundColor: 'rgba(117,117,117,0.18)',
    borderRadius: 2,
  },
  parkingLine: {
    position: 'absolute',
    top: '30%',
    left: '25%',
    width: 1,
    height: '40%',
    backgroundColor: 'rgba(255,255,255,0.7)',
  },
  parking1: { width: '7%', height: '6%', top: '33%', left: '62%' },
  parking2: { width: '6%', height: '5%', top: '71%', left: '36%' },

  // Roundabout
  roundabout: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    top: '28%',
    left: '18%',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  roundaboutRoad: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.8)',
  },
  roundaboutInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(129,199,132,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  roundaboutGrass: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(76,175,80,0.5)',
  },

  // Trees
  tree: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(67,160,71,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  treeSatellite: {
    backgroundColor: 'rgba(46,125,50,0.8)',
  },
  treeShadow: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(0,0,0,0.1)',
    zIndex: -1,
  },

  // Bus Stop
  busStop: {
    position: 'absolute',
    top: '29%',
    left: '35%',
    width: 8,
    height: 12,
    backgroundColor: 'rgba(33,150,243,0.8)',
    borderRadius: 2,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 2,
  },
  busStopSign: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#FFFFFF',
  },

  // Route Line
  routeLineContainer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 50,
  },
  routeLine: {
    position: 'absolute',
    height: 4,
    backgroundColor: '#4285F4',
    borderRadius: 2,
  },

  // Markers
  marker: {
    position: 'absolute',
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -26,
    marginTop: -26,
  },
  markerPulse: {
    position: 'absolute',
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  markerGlow: {
    position: 'absolute',
    width: 26,
    height: 26,
    borderRadius: 13,
    opacity: 0.3,
  },
  markerRing: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  markerDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    ...markerShadow,
  },
  markerInnerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
  },
  markerPinShadow: {
    position: 'absolute',
    bottom: -4,
    width: 12,
    height: 4,
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 6,
    transform: [{ scaleX: 2 }],
  },
  markerMiniBadge: {
    position: 'absolute',
    top: -4,
    right: -8,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    ...cardShadow,
  },
  markerMiniBadgeText: {
    fontSize: 9,
    fontFamily: Theme.fonts.display,
    color: '#5F6368',
  },
  markerLabel: {
    position: 'absolute',
    top: '100%',
    marginTop: 10,
    backgroundColor: 'rgba(33,33,33,0.92)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    minWidth: 100,
    alignItems: 'center',
  },
  markerLabelText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontFamily: Theme.fonts.display,
  },
  markerLabelSub: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 11,
    fontFamily: Theme.fonts.body,
    marginTop: 3,
  },

  // Traffic Legend - Google style
  trafficLegend: {
    position: 'absolute',
    left: 12,
    bottom: 32,
    backgroundColor: 'rgba(255,255,255,0.96)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    ...cardShadow,
  },
  trafficLegendTitle: {
    fontSize: 11,
    fontFamily: Theme.fonts.display,
    color: '#202124',
    marginBottom: 6,
  },
  trafficLegendBar: {
    flexDirection: 'row',
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  trafficLegendSegment: {
    flex: 1,
  },
  trafficLegendLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  trafficLegendLabel: {
    fontSize: 9,
    fontFamily: Theme.fonts.body,
    color: '#5F6368',
  },
  trafficLegendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  trafficLegendDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  trafficLegendText: {
    fontSize: 8,
    fontFamily: Theme.fonts.body,
    color: Theme.colors.muted,
  },

  // Controls - Google style
  controls: {
    position: 'absolute',
    right: 12,
    bottom: 90,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    overflow: 'hidden',
    ...cardShadow,
  },
  controlBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlBtnPressed: {
    backgroundColor: 'rgba(0,0,0,0.06)',
  },
  controlDivider: {
    height: 1,
    backgroundColor: '#E0E0E0',
  },
  locateBtn: {
    position: 'absolute',
    right: 12,
    bottom: 32,
    width: 44,
    height: 44,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    ...cardShadow,
  },

  // Compass
  compass: {
    position: 'absolute',
    right: 12,
    top: 130,
    width: 36,
    height: 36,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    ...cardShadow,
  },
  compassN: {
    fontSize: 10,
    fontFamily: Theme.fonts.display,
    color: '#EA4335',
    position: 'absolute',
    top: 4,
  },
  compassNeedle: {
    width: 2,
    height: 14,
    backgroundColor: '#EA4335',
    borderRadius: 1,
  },

  // Scale Bar - Google style
  scaleBar: {
    position: 'absolute',
    right: 70,
    bottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  scaleBarLine: {
    width: 60,
    height: 2,
    backgroundColor: '#5F6368',
    position: 'relative',
  },
  scaleBarTick: {
    position: 'absolute',
    left: 0,
    top: -2,
    width: 2,
    height: 6,
    backgroundColor: '#5F6368',
  },
  scaleBarText: {
    fontSize: 10,
    fontFamily: Theme.fonts.body,
    color: '#5F6368',
  },

  // Legend (old style kept for compact mode)
  legend: {
    position: 'absolute',
    left: 8,
    top: 8,
    backgroundColor: 'rgba(255,255,255,0.96)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  legendCompact: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    gap: 10,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  legendDotInner: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#FFFFFF',
  },
  legendText: {
    fontSize: 11,
    fontFamily: Theme.fonts.body,
    color: Theme.colors.ink,
  },
});
