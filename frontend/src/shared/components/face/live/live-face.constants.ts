/** Where the animation file that draws a face is served from. */
export const liveFaceSrc = '/assets/agents.riv'

/** The state machine of that file that blinks the eyes and takes the data. */
export const liveFaceMachine = 'Face'

/** How many pixels of the artboard of the file are one unit of the face (the artboard is 320 wide, and the outline of the face is a little more than 32 units across). */
export const liveUnit = 8

/** How long a change of the size or the lean of an eye takes in the file, in seconds, when the user has not asked for less motion. */
export const liveEaseSeconds = 0.2

/** The number properties of the view model of the file that a face writes once: the places of the blobs, the gap of the eyes, and the size and lean of each. */
export const liveNumberNames = [
  'eyeGap',
  'coreX',
  'coreY',
  'secondX',
  'secondY',
  'eyeLeftWidth',
  'eyeLeftHeight',
  'eyeLeftTilt',
  'eyeRightWidth',
  'eyeRightHeight',
  'eyeRightTilt',
  'eyeLeftOpen',
  'eyeLeftArc',
  'eyeLeftShut',
  'eyeRightOpen',
  'eyeRightArc',
  'eyeRightShut',
  'motionSeconds',
] as const

/** The color properties of the view model of the file, and the custom property of the face that holds the color of each. */
export const liveColorTokens = {
  colorCore: '--face-a',
  colorSecond: '--face-b',
  colorBase: '--face-base',
} as const
