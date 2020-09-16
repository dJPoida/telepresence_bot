export const CLIENT_COMMAND = {
  LED_POWER: 'led_power',
} as const;
export type CLIENT_COMMAND = typeof CLIENT_COMMAND;
export type A_CLIENT_COMMAND = CLIENT_COMMAND[keyof CLIENT_COMMAND];


export type ClientCommand =
| {
  type: CLIENT_COMMAND['LED_POWER'], payload: { on: boolean }
}