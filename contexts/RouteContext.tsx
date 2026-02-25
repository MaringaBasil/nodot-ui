/**
 * RouteContext.tsx
 * Single source of truth for the picker's daily route.
 * Shared across Home, Jobs, and Navigate screens.
 *
 * Architecture:
 *  - TODAY_ROUTE: static stop list (in production: fetched from dispatcher API)
 *  - RouteState: currentStopIdx, earnedTotal, kgTotal, status, currentLocation
 *  - stopETAs: computed sequentially from currentLocation → each stop's destination
 *  - Actions: START | CONFIRM_STOP | RESET
 */
import React, {
  createContext,
  useContext,
  useReducer,
  useMemo,
  type ReactNode,
} from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

export type LatLng = { lat: number; lng: number };

export type RouteStop = {
  id:       string;
  address:  string;
  weight:   number;    // kg
  material: string;
  payout:   number;    // ZAR
  phone:    string;
  from:     LatLng;
  to:       LatLng;
};

export type RouteStatus = 'idle' | 'active' | 'complete';

export type StopETA = { distance: string; eta: string };

// ─── ETA calculation ─────────────────────────────────────────────────────────
// Haversine straight-line × 1.35 road factor ÷ 25 km/h city average

const R_EARTH_KM = 6371;

function haversineKm(a: LatLng, b: LatLng): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat  = toRad(b.lat - a.lat);
  const dLng  = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return R_EARTH_KM * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

export function calcETA(from: LatLng, to: LatLng): StopETA {
  const roadKm  = haversineKm(from, to) * 1.35;
  const etaMins = Math.max(1, Math.round((roadKm / 25) * 60));
  const distance =
    roadKm < 1
      ? `${Math.round(roadKm * 1000)} m`
      : `${roadKm.toFixed(1)} km`;
  return { distance, eta: `${etaMins} min` };
}

// ─── Route data ───────────────────────────────────────────────────────────────
// Pre-assigned stops batched by the system from citizen requests.
// In production these come from the dispatcher API.

export const PICKER_ORIGIN: LatLng = { lat: -26.2048, lng: 28.0479 };

export const TODAY_ROUTE: RouteStop[] = [
  {
    id: 's1', address: '321 Oak Drive, Melville',
    weight: 8.7, material: 'Glass bottles', payout: 35, phone: '+27 11 555 0123',
    from: PICKER_ORIGIN,
    to:   { lat: -26.177,  lng: 28.011  },
  },
  {
    id: 's2', address: '45 7th Avenue, Parktown',
    weight: 6.2, material: 'PET Plastic', payout: 31, phone: '+27 83 444 7722',
    from: { lat: -26.177,  lng: 28.011  },
    to:   { lat: -26.1905, lng: 28.0385 },
  },
  {
    id: 's3', address: '78 Long St, Braamfontein',
    weight: 9.4, material: 'Cardboard', payout: 28, phone: '+27 71 333 9988',
    from: { lat: -26.1905, lng: 28.0385 },
    to:   { lat: -26.196,  lng: 28.043  },
  },
];

export const ROUTE_TOTALS = TODAY_ROUTE.reduce(
  (acc, s) => ({ payout: acc.payout + s.payout, kg: parseFloat((acc.kg + s.weight).toFixed(1)) }),
  { payout: 0, kg: 0 },
);

// ─── State / Reducer ──────────────────────────────────────────────────────────

export type RouteState = {
  currentStopIdx:  number;
  earnedTotal:     number;
  kgTotal:         number;
  status:          RouteStatus;
  currentLocation: LatLng;
};

type RouteAction =
  | { type: 'START' }
  | { type: 'CONFIRM_STOP' }
  | { type: 'RESET' };

const INITIAL_STATE: RouteState = {
  currentStopIdx:  0,
  earnedTotal:     0,
  kgTotal:         0,
  status:          'idle',
  currentLocation: PICKER_ORIGIN,
};

function routeReducer(state: RouteState, action: RouteAction): RouteState {
  switch (action.type) {
    case 'START':
      return { ...state, status: 'active' };

    case 'CONFIRM_STOP': {
      const stop       = TODAY_ROUTE[state.currentStopIdx];
      const newEarned  = state.earnedTotal + stop.payout;
      const newKg      = parseFloat((state.kgTotal + stop.weight).toFixed(1));
      const isLast     = state.currentStopIdx === TODAY_ROUTE.length - 1;
      return {
        ...state,
        earnedTotal:     newEarned,
        kgTotal:         newKg,
        currentLocation: stop.to,   // picker is now at this stop's location
        currentStopIdx:  isLast ? state.currentStopIdx : state.currentStopIdx + 1,
        status:          isLast ? 'complete' : 'active',
      };
    }

    case 'RESET':
      return INITIAL_STATE;

    default:
      return state;
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────

type RouteContextValue = {
  stops:       RouteStop[];
  routeState:  RouteState;
  /** ETA from picker's current location (or previous stop) to each stop's destination */
  stopETAs:    StopETA[];
  startRoute:  () => void;
  confirmStop: () => void;
  resetRoute:  () => void;
};

const RouteContext = createContext<RouteContextValue | null>(null);

export function RouteProvider({ children }: { children: ReactNode }) {
  const [routeState, dispatch] = useReducer(routeReducer, INITIAL_STATE);

  /**
   * Compute ETAs sequentially:
   *   stopETAs[0] = from currentLocation → stops[0].to
   *   stopETAs[n] = from stops[n-1].to   → stops[n].to
   *
   * This means after confirming a stop (currentLocation = stop.to),
   * the next stop's ETA is automatically recalculated from the new position.
   */
  const stopETAs = useMemo<StopETA[]>(() => {
    return TODAY_ROUTE.map((stop, i) => {
      const from = i === 0 ? routeState.currentLocation : TODAY_ROUTE[i - 1].to;
      return calcETA(from, stop.to);
    });
  }, [routeState.currentLocation]);

  const value = useMemo<RouteContextValue>(
    () => ({
      stops:       TODAY_ROUTE,
      routeState,
      stopETAs,
      startRoute:  () => dispatch({ type: 'START' }),
      confirmStop: () => dispatch({ type: 'CONFIRM_STOP' }),
      resetRoute:  () => dispatch({ type: 'RESET' }),
    }),
    [routeState, stopETAs],
  );

  return <RouteContext.Provider value={value}>{children}</RouteContext.Provider>;
}

export function useRoute(): RouteContextValue {
  const ctx = useContext(RouteContext);
  if (!ctx) throw new Error('useRoute must be called inside <RouteProvider>');
  return ctx;
}
