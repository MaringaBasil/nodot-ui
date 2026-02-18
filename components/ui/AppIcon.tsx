import Ionicons from '@expo/vector-icons/Ionicons';
import React from 'react';
import { TextStyle } from 'react-native';

const iconMap: Record<string, keyof typeof Ionicons.glyphMap> = {
  // Search & Navigation
  search: 'search',
  'chevron-right': 'chevron-forward',
  'chevron-left': 'chevron-back',
  'arrow-forward': 'chevron-forward',
  'arrow-back': 'chevron-back',
  'expand-more': 'chevron-down',
  'expand-less': 'chevron-up',
  close: 'close',
  menu: 'menu',
  route: 'navigate-outline',
  map: 'map-outline',
  fullscreen: 'expand-outline',
  home: 'home-outline',

  // Notifications
  'notifications-none': 'notifications-outline',
  notifications: 'notifications-outline',
  'notifications-active': 'notifications',

  // Recycling & Environment
  recycling: 'leaf-outline',
  park: 'leaf-outline',
  eco: 'earth-outline',
  'local-drink': 'water-outline',
  'wine-bar': 'wine-outline',
  'inventory-2': 'cube-outline',
  inventory: 'cube-outline',
  circle: 'ellipse-outline',

  // Transport & Location
  'local-shipping': 'car-outline',
  'directions-walk': 'walk-outline',
  place: 'pin-outline',
  pin: 'pin-outline',
  'gps-fixed': 'locate-outline',
  'my-location': 'locate-outline',
  'location-searching': 'locate-outline',
  apartment: 'business-outline',
  store: 'bag-outline',
  'door-front': 'home-outline',

  // Finance & Wallet
  'account-balance-wallet': 'wallet-outline',
  payments: 'cash-outline',
  'payments-outlined': 'card-outline',
  savings: 'cash-outline',
  'local-offer': 'pricetag-outline',
  receipt: 'receipt-outline',

  // User & Profile
  person: 'person-circle-outline',
  people: 'people-outline',
  groups: 'people-outline',
  edit: 'create-outline',
  logout: 'log-out-outline',
  star: 'star',
  'star-outline': 'star-outline',

  // Camera & Scan
  camera: 'camera',
  'camera-alt': 'camera-outline',
  'qr-code': 'qr-code-outline',
  'qr-code-scanner': 'scan-outline',
  scan: 'scan-outline',
  'center-focus-weak': 'scan-outline',

  // Documents & Data
  description: 'document-text-outline',
  assignment: 'document-text-outline',
  'list-alt': 'list-outline',
  history: 'time-outline',
  analytics: 'analytics-outline',
  'auto-graph': 'bar-chart-outline',
  'query-stats': 'stats-chart-outline',
  'file-download': 'download-outline',

  // Controls & Settings
  'flash-on': 'flash',
  'flash-off': 'flash-off',
  bolt: 'flash-outline',
  settings: 'settings-outline',
  'admin-panel-settings': 'shield-checkmark-outline',
  translate: 'language-outline',
  'support-agent': 'headset-outline',

  // Status & Feedback
  verified: 'checkmark-circle-outline',
  check: 'checkmark',
  'check-circle': 'checkmark-circle',
  'error-outline': 'alert-circle-outline',
  error: 'alert-circle',
  warning: 'warning-outline',
  'warning-amber': 'warning-outline',
  info: 'information-circle',
  lightbulb: 'bulb-outline',
  'pending-actions': 'hourglass-outline',
  'watch-later': 'time-outline',
  timer: 'timer-outline',

  // Trends & Arrows
  'arrow-upward': 'arrow-up',
  'arrow-downward': 'arrow-down',
  'trending-up': 'trending-up-outline',
  'trending-down': 'trending-down-outline',

  // Actions & Features
  'auto-awesome': 'sparkles-outline',
  opacity: 'water-outline',
  layers: 'layers-outline',
  schedule: 'time-outline',
  scale: 'speedometer-outline',
  phone: 'call-outline',
  'edit-calendar': 'calendar-outline',
  add: 'add',
  remove: 'remove',
  refresh: 'refresh',
  lock: 'lock-closed-outline',
  'lock-open': 'lock-open-outline',

  // Connectivity
  'wifi-tethering': 'wifi-outline',
  'wifi-off': 'wifi-outline',

  // Fire & Streak
  'local-fire-department': 'flame',

  // Misc
  'local-bar': 'wine-outline',
  share: 'share-social-outline',
  'qr-code': 'qr-code-outline',
};

export const AppIcon = ({ name, size = 20, color = '#1A1D1A', style }: { name: string; size?: number; color?: string; style?: TextStyle }) => {
  const mapped = iconMap[name] || (name as keyof typeof Ionicons.glyphMap) || 'ellipse-outline';
  return <Ionicons name={mapped} size={size} color={color} style={style} />;
};
