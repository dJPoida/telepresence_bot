export const ICON = {
  TELEPRESENCE_BOT: 'telepresence-bot',
  MENU_HAMBURGER: 'menu-hamburger',
  SETTINGS: 'settings',
  MENU_HORIZONTAL: 'menu-horizontal',
  MENU_VERTICAL: 'menu-vertical',
  CHECK_CIRCLE: 'check-circle',
  CROSS_CIRCLE: 'cross-circle',
  ADD_CIRCLE: 'add-circle',
  MINUS_CIRCLE: 'minus-circle',
  WARNING: 'warning',
  HELP_CIRCLE: 'help-circle',
  INFO_CIRCLE: 'info-circle',
  DANGER: 'danger',
  CHECKBOX: 'checkbox',
  CHECKBOX_CHECKED: 'checkbox-checked',
  RADIO_BUTTON: 'radio-button',
  RADIO_BUTTON_CHECKED: 'radio-button-checked',
  EDIT: 'edit',
  CHECK: 'check',
  CROSS: 'cross',
  BLOCK: 'block',
  REFRESH: 'refresh',
  FULLSCREEN: 'fullscreen',
  FULLSCREEN_EXIT: 'fullscreen-exit',
  WIFI: 'wifi',
  WIFI_OFF: 'wifi-off',
  MIC: 'mic',
  MIC_OFF: 'mic-off',
  VIDEOCAM: 'videocam',
  VIDEOCAM_OFF: 'videocam-off',
  VOLUME_MUTE: 'volume-mute',
  VOLUME_DOWN: 'volume-down',
  VOLUME_UP: 'volume-up',
  VOLUME_OFF: 'volume-off',
  BELL: 'bell',
  BELL_OFF: 'bell-off',
  BELL_RINGING: 'bell-ringing',
  CALL: 'call',
  PHONE_TALK: 'phone-talk',
  CALL_END: 'call-end',
  CONTROL_CAMERA: 'control-camera',
  GAMEPAD: 'gamepad',
  CAMERA_FLIP: 'camera-flip',
  CHAT: 'chat',
  ARROW_LEFT: 'arrow-left',
  ARROW_RIGHT: 'arrow-right',
  ARROW_UP: 'arrow-up',
  ARROW_DOWN: 'arrow-down',
  ROTATE_LEFT: 'rotate-left',
  ROTATE_RIGHT: 'rotate-right',
  360: '360',
  CHEVRON_UP: 'chevron-up',
  CHEVRON_DOWN: 'chevron-down',
} as const;
export type ICON = typeof ICON;
export type AN_ICON = ICON[keyof ICON];