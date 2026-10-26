/** Props of the input, what the user types, and the number the input reports last. */
export const typedCases = [
  { name: 'digits', props: {}, typed: '42', text: '42', reported: 42 },
  { name: 'letters between digits', props: {}, typed: '4a2b', text: '42', reported: 42 },
  { name: 'a decimal', props: {}, typed: '1.5', text: '1.5', reported: 1.5 },
  {
    name: 'a decimal of a whole number',
    props: { integer: true },
    typed: '1.5',
    text: '15',
    reported: 15,
  },
  { name: 'a negative number', props: {}, typed: '-3', text: '-3', reported: -3 },
  {
    name: 'a negative sign when the minimum is zero',
    props: { min: 0 },
    typed: '-3',
    text: '3',
    reported: 3,
  },
  {
    name: 'a negative sign when the minimum is below zero',
    props: { min: -10 },
    typed: '-3',
    text: '-3',
    reported: -3,
  },
  { name: 'a sign alone', props: {}, typed: '-', text: '-', reported: null },
  {
    name: 'a number past the maximum, which is not cut',
    props: { max: 10 },
    typed: '55',
    text: '55',
    reported: 55,
  },
] as const

/** Props, the key pressed with the input holding `start`, and the number reported. */
export const keyCases = [
  { name: 'Up', props: {}, start: '5', key: '{ArrowUp}', reported: 6 },
  { name: 'Down', props: {}, start: '5', key: '{ArrowDown}', reported: 4 },
  { name: 'Up with a step of 5', props: { step: 5 }, start: '5', key: '{ArrowUp}', reported: 10 },
  { name: 'Shift and Up', props: {}, start: '5', key: '{Shift>}{ArrowUp}{/Shift}', reported: 15 },
  { name: 'Page Up', props: {}, start: '5', key: '{PageUp}', reported: 15 },
  { name: 'Page Down', props: {}, start: '50', key: '{PageDown}', reported: 40 },
  { name: 'Up at the maximum', props: { max: 5 }, start: '5', key: '{ArrowUp}', reported: 5 },
  { name: 'Down at the minimum', props: { min: 0 }, start: '0', key: '{ArrowDown}', reported: 0 },
  { name: 'Up over the maximum', props: { max: 10 }, start: '55', key: '{ArrowUp}', reported: 10 },
  { name: 'Home', props: { min: 1, max: 9 }, start: '5', key: '{Home}', reported: 1 },
  { name: 'End', props: { min: 1, max: 9 }, start: '5', key: '{End}', reported: 9 },
  {
    name: 'Up with a decimal step',
    props: { step: 0.1 },
    start: '0.2',
    key: '{ArrowUp}',
    reported: 0.3,
  },
] as const

/** Props, the text typed, and the text on screen after the input has lost the focus. */
export const blurCases = [
  { name: 'zeros in front', props: {}, typed: '007', text: '7' },
  { name: 'a decimal point at the end', props: {}, typed: '1.', text: '1' },
  { name: 'a sign alone', props: {}, typed: '-', text: '' },
  { name: 'a number past the maximum, which stays', props: { max: 10 }, typed: '55', text: '55' },
] as const

// The cases below walk the number line: the kinds of number that a field of a form takes, each with
// the props that shape it.
const whole = { integer: true }
const nonNegative = { min: 0, integer: true }
const positive = { min: 1, integer: true }
const money = { min: 0, step: 0.01 }
const signedDecimal = { min: -10, max: 10, step: 0.5 }
const negativeOnly = { min: -100, max: -1, integer: true }
const percent = { min: 0, max: 100, step: 5, integer: true }
const tiny = { step: 0.001 }

/** The kind of number, what the user types, the text on screen and the number reported. */
export const numberLineTypedCases = [
  { name: 'a whole number', props: whole, typed: '-12', text: '-12', reported: -12 },
  { name: 'a whole number with two signs', props: whole, typed: '--3', text: '-3', reported: -3 },
  {
    name: 'a whole number with a sign at the end',
    props: whole,
    typed: '3-',
    text: '3',
    reported: 3,
  },
  {
    name: 'a whole number with a decimal point',
    props: whole,
    typed: '3.9',
    text: '39',
    reported: 39,
  },
  {
    name: 'a number that is not negative, typed with a sign',
    props: nonNegative,
    typed: '-1',
    text: '1',
    reported: 1,
  },
  {
    name: 'a number that is not negative, typed with a decimal',
    props: nonNegative,
    typed: '3.7',
    text: '37',
    reported: 37,
  },
  {
    name: 'zero for a positive number, which the schema refuses',
    props: positive,
    typed: '0',
    text: '0',
    reported: 0,
  },
  { name: 'an amount of money', props: money, typed: '12.34', text: '12.34', reported: 12.34 },
  {
    name: 'an amount that starts with the point',
    props: money,
    typed: '.5',
    text: '.5',
    reported: 0.5,
  },
  {
    name: 'an amount with more decimals than its step',
    props: money,
    typed: '1.234',
    text: '1.234',
    reported: 1.234,
  },
  { name: 'a negative decimal', props: signedDecimal, typed: '-0.5', text: '-0.5', reported: -0.5 },
  {
    name: 'a negative decimal that starts with the point',
    props: signedDecimal,
    typed: '-.5',
    text: '-.5',
    reported: -0.5,
  },
  {
    name: 'minus zero, reported as zero',
    props: signedDecimal,
    typed: '-0',
    text: '-0',
    reported: 0,
  },
  {
    name: 'a number past the limits, which is not cut',
    props: signedDecimal,
    typed: '55',
    text: '55',
    reported: 55,
  },
  {
    name: 'a number under zero, with only negative numbers allowed',
    props: negativeOnly,
    typed: '-3',
    text: '-3',
    reported: -3,
  },
  {
    name: 'a number over zero, with only negative numbers allowed',
    props: negativeOnly,
    typed: '3',
    text: '3',
    reported: 3,
  },
  { name: 'a percentage', props: percent, typed: '100', text: '100', reported: 100 },
  {
    name: 'a large number',
    props: whole,
    typed: '1000000000000',
    text: '1000000000000',
    reported: 1e12,
  },
  { name: 'a small decimal', props: tiny, typed: '0.001', text: '0.001', reported: 0.001 },
] as const

/** The kind of number, where the steps start, the keys, and the number they lead to. */
export const numberLineStepCases = [
  {
    name: 'whole numbers across zero',
    props: {},
    from: 1,
    keys: '{ArrowDown}{ArrowDown}{ArrowDown}',
    to: -2,
  },
  {
    name: 'whole numbers up across zero',
    props: {},
    from: -2,
    keys: '{ArrowUp}{ArrowUp}{ArrowUp}',
    to: 1,
  },
  {
    name: 'zero between a negative and a positive number',
    props: {},
    from: -1,
    keys: '{ArrowUp}',
    to: 0,
  },
  {
    name: 'a number that is not negative stops at zero',
    props: nonNegative,
    from: 1,
    keys: '{ArrowDown}{ArrowDown}{ArrowDown}',
    to: 0,
  },
  {
    name: 'a positive number stops at one',
    props: positive,
    from: 2,
    keys: '{ArrowDown}{ArrowDown}{ArrowDown}',
    to: 1,
  },
  { name: 'tenths up', props: { step: 0.1 }, from: 0.1, keys: '{ArrowUp}{ArrowUp}', to: 0.3 },
  {
    name: 'tenths down across zero',
    props: { step: 0.1 },
    from: 0.1,
    keys: '{ArrowDown}{ArrowDown}',
    to: -0.1,
  },
  { name: 'tenths up to zero', props: { step: 0.1 }, from: -0.1, keys: '{ArrowUp}', to: 0 },
  {
    name: 'tenths down by ten steps, across zero',
    props: { step: 0.1 },
    from: 0.7,
    keys: '{PageDown}',
    to: -0.3,
  },
  { name: 'money by cents', props: money, from: 0.29, keys: '{ArrowUp}', to: 0.3 },
  { name: 'money stops at zero', props: money, from: 0.01, keys: '{ArrowDown}{ArrowDown}', to: 0 },
  {
    name: 'a signed decimal by halves up to its maximum',
    props: signedDecimal,
    from: 9,
    keys: '{ArrowUp}{ArrowUp}{ArrowUp}',
    to: 10,
  },
  {
    name: 'a signed decimal by halves down to its minimum',
    props: signedDecimal,
    from: -9.5,
    keys: '{ArrowDown}{ArrowDown}',
    to: -10,
  },
  {
    name: 'a signed decimal across zero',
    props: signedDecimal,
    from: 0.5,
    keys: '{ArrowDown}{ArrowDown}',
    to: -0.5,
  },
  {
    name: 'negative numbers up to their maximum',
    props: negativeOnly,
    from: -3,
    keys: '{ArrowUp}{ArrowUp}{ArrowUp}{ArrowUp}{ArrowUp}',
    to: -1,
  },
  {
    name: 'negative numbers down to their minimum',
    props: negativeOnly,
    from: -98,
    keys: '{ArrowDown}{ArrowDown}{ArrowDown}{ArrowDown}{ArrowDown}',
    to: -100,
  },
  {
    name: 'a percentage by fives to its maximum',
    props: percent,
    from: 95,
    keys: '{ArrowUp}{ArrowUp}{ArrowUp}',
    to: 100,
  },
  {
    name: 'a percentage by fifty with Shift',
    props: percent,
    from: 0,
    keys: '{Shift>}{ArrowUp}{/Shift}',
    to: 50,
  },
  {
    name: 'a percentage by Page Up',
    props: percent,
    from: 0,
    keys: '{PageUp}{PageUp}{PageUp}',
    to: 100,
  },
  {
    name: 'a large number',
    props: whole,
    from: 999_999_999_999,
    keys: '{ArrowUp}',
    to: 1_000_000_000_000,
  },
  { name: 'a small decimal up', props: tiny, from: 0.001, keys: '{ArrowUp}', to: 0.002 },
  {
    name: 'a small decimal down to zero',
    props: tiny,
    from: 0.003,
    keys: '{ArrowDown}{ArrowDown}{ArrowDown}',
    to: 0,
  },
  {
    name: 'an empty input of a number that is not negative',
    props: nonNegative,
    from: null,
    keys: '{ArrowUp}',
    to: 0,
  },
  {
    name: 'an empty input with a minimum above zero',
    props: { min: 5 },
    from: null,
    keys: '{ArrowUp}',
    to: 5,
  },
  {
    name: 'an empty input with a maximum under zero',
    props: { max: -5 },
    from: null,
    keys: '{ArrowDown}',
    to: -5,
  },
] as const
