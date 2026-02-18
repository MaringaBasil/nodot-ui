import Ionicons from '@expo/vector-icons/Ionicons';
import { SymbolWeight } from 'expo-symbols';
import { ComponentProps } from 'react';
import { OpaqueColorValue, type StyleProp, type TextStyle } from 'react-native';

export type IconSymbolName = string;

const MAPPING: Record<string, ComponentProps<typeof Ionicons>['name']> = {
  // Navigation icons - iOS SF Symbols style
  'house.fill': 'home',
  'house': 'home-outline',
  'paperplane.fill': 'paper-plane',
  'paperplane': 'paper-plane-outline',
  'chevron.left.forwardslash.chevron.right': 'code-slash',
  'chevron.right': 'chevron-forward',
  'chevron.left': 'chevron-back',
  'chevron.down': 'chevron-down',
  'chevron.up': 'chevron-up',

  // Scan - QR code style (iOS Camera/Scanner)
  'viewfinder': 'scan',
  'qrcode': 'qr-code',
  'qrcode.viewfinder': 'scan-outline',
  'barcode.viewfinder': 'barcode-outline',
  'camera.viewfinder': 'scan-circle-outline',

  // Shipping/Pickup (iOS style)
  'shippingbox.fill': 'cube',
  'shippingbox': 'cube-outline',
  'truck.box.fill': 'car',
  'truck.box': 'car-outline',
  'box.truck.fill': 'bus',

  // Profile (iOS style)
  'person.fill': 'person',
  'person': 'person-outline',
  'person.crop.circle.fill': 'person-circle',
  'person.crop.circle': 'person-circle-outline',
  'person.2.fill': 'people',
  'person.2': 'people-outline',

  // Settings & Preferences (iOS style)
  'gearshape.fill': 'settings',
  'gearshape': 'settings-outline',
  'slider.horizontal.3': 'options-outline',
  'switch.2': 'toggle-outline',

  // Notifications (iOS style)
  'bell.fill': 'notifications',
  'bell': 'notifications-outline',
  'bell.badge.fill': 'notifications',
  'bell.badge': 'notifications-outline',

  // Favorites & Rating (iOS style)
  'heart.fill': 'heart',
  'heart': 'heart-outline',
  'star.fill': 'star',
  'star': 'star-outline',
  'bookmark.fill': 'bookmark',
  'bookmark': 'bookmark-outline',

  // Location & Maps (iOS style)
  'location.fill': 'location',
  'location': 'location-outline',
  'map.fill': 'map',
  'map': 'map-outline',
  'mappin': 'pin-outline',
  'mappin.circle.fill': 'pin',
  'compass.fill': 'compass',
  'compass': 'compass-outline',
  'location.north.fill': 'navigate',
  'location.north': 'navigate-outline',

  // Wallet & Finance (iOS style)
  'wallet.pass.fill': 'wallet',
  'wallet.pass': 'wallet-outline',
  'creditcard.fill': 'card',
  'creditcard': 'card-outline',
  'banknote.fill': 'cash',
  'banknote': 'cash-outline',

  // Nature & Environment (iOS style)
  'leaf.fill': 'leaf',
  'leaf': 'leaf-outline',
  'tree.fill': 'flower',
  'drop.fill': 'water',
  'drop': 'water-outline',
  'flame.fill': 'flame',
  'flame': 'flame-outline',
  'sun.max.fill': 'sunny',
  'sun.max': 'sunny-outline',
  'moon.fill': 'moon',
  'moon': 'moon-outline',
  'cloud.fill': 'cloud',
  'cloud': 'cloud-outline',

  // Actions (iOS style)
  'plus': 'add',
  'plus.circle.fill': 'add-circle',
  'plus.circle': 'add-circle-outline',
  'minus': 'remove',
  'minus.circle.fill': 'remove-circle',
  'minus.circle': 'remove-circle-outline',
  'xmark': 'close',
  'xmark.circle.fill': 'close-circle',
  'xmark.circle': 'close-circle-outline',
  'checkmark': 'checkmark',
  'checkmark.circle.fill': 'checkmark-circle',
  'checkmark.circle': 'checkmark-circle-outline',

  // Communication (iOS style)
  'message.fill': 'chatbubble',
  'message': 'chatbubble-outline',
  'phone.fill': 'call',
  'phone': 'call-outline',
  'envelope.fill': 'mail',
  'envelope': 'mail-outline',
  'paperclip': 'attach',

  // Media (iOS style)
  'photo.fill': 'image',
  'photo': 'image-outline',
  'camera.fill': 'camera',
  'camera': 'camera-outline',
  'video.fill': 'videocam',
  'video': 'videocam-outline',
  'play.fill': 'play',
  'play': 'play-outline',
  'pause.fill': 'pause',
  'pause': 'pause-outline',

  // Time & Calendar (iOS style)
  'clock.fill': 'time',
  'clock': 'time-outline',
  'calendar': 'calendar-outline',
  'calendar.badge.plus': 'calendar',
  'hourglass': 'hourglass-outline',
  'timer': 'timer-outline',

  // Search & Filter (iOS style)
  'magnifyingglass': 'search',
  'line.3.horizontal.decrease': 'filter',
  'arrow.up.arrow.down': 'swap-vertical',

  // Share & Export (iOS style)
  'square.and.arrow.up': 'share-outline',
  'square.and.arrow.up.fill': 'share',
  'link': 'link',
  'doc.on.doc': 'copy-outline',
  'doc.on.doc.fill': 'copy',

  // Info & Help (iOS style)
  'info.circle.fill': 'information-circle',
  'info.circle': 'information-circle-outline',
  'questionmark.circle.fill': 'help-circle',
  'questionmark.circle': 'help-circle-outline',
  'exclamationmark.circle.fill': 'alert-circle',
  'exclamationmark.circle': 'alert-circle-outline',
  'exclamationmark.triangle.fill': 'warning',
  'exclamationmark.triangle': 'warning-outline',

  // Arrows (iOS style)
  'arrow.right': 'arrow-forward',
  'arrow.left': 'arrow-back',
  'arrow.up': 'arrow-up',
  'arrow.down': 'arrow-down',
  'arrow.clockwise': 'refresh',
  'arrow.counterclockwise': 'refresh',

  // Miscellaneous (iOS style)
  'ellipsis': 'ellipsis-horizontal',
  'ellipsis.circle': 'ellipsis-horizontal-circle-outline',
  'line.3.horizontal': 'menu',
  'square.grid.2x2.fill': 'grid',
  'square.grid.2x2': 'grid-outline',
  'list.bullet': 'list',
  'trash.fill': 'trash',
  'trash': 'trash-outline',
  'pencil': 'pencil',
  'pencil.circle.fill': 'create',
  'shield.fill': 'shield',
  'shield': 'shield-outline',
  'lock.fill': 'lock-closed',
  'lock': 'lock-closed-outline',
  'lock.open.fill': 'lock-open',
  'lock.open': 'lock-open-outline',
  'eye.fill': 'eye',
  'eye': 'eye-outline',
  'eye.slash.fill': 'eye-off',
  'eye.slash': 'eye-off-outline',
  'hand.thumbsup.fill': 'thumbs-up',
  'hand.thumbsup': 'thumbs-up-outline',
  'bolt.fill': 'flash',
  'bolt': 'flash-outline',
  'bolt.slash.fill': 'flash-off',
  'bolt.slash': 'flash-off-outline',
  'sparkles': 'sparkles',
  'wand.and.stars': 'color-wand-outline',
  'gift.fill': 'gift',
  'gift': 'gift-outline',
  'trophy.fill': 'trophy',
  'trophy': 'trophy-outline',
  'rosette': 'ribbon-outline',
  'medal.fill': 'medal',
  'medal': 'medal-outline',
};

export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  const ionName = MAPPING[name] || 'help-circle-outline';
  return <Ionicons color={color} size={size} name={ionName} style={style} />;
}
