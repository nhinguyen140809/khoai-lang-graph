/** A value, a step, and the number it leads to. */
export const stepCases = [
  { name: 'up by one', value: 5, step: { direction: 1, step: 1 }, expected: 6 },
  { name: 'down by one', value: 5, step: { direction: -1, step: 1 }, expected: 4 },
  { name: 'up by a step of 5', value: 5, step: { direction: 1, step: 5 }, expected: 10 },
  { name: 'up by ten steps', value: 5, step: { direction: 1, step: 1, times: 10 }, expected: 15 },
  {
    name: 'tenths without a float error',
    value: 0.1,
    step: { direction: 1, step: 0.2 },
    expected: 0.3,
  },
  {
    name: 'tenths down without a float error',
    value: 0.3,
    step: { direction: -1, step: 0.1 },
    expected: 0.2,
  },
  {
    name: 'up to the maximum, not past',
    value: 9,
    step: { direction: 1, step: 5, max: 10 },
    expected: 10,
  },
  {
    name: 'down to the minimum, not past',
    value: 2,
    step: { direction: -1, step: 5, min: 0 },
    expected: 0,
  },
  {
    name: 'up from under the minimum',
    value: -5,
    step: { direction: 1, step: 1, min: 0 },
    expected: 0,
  },
  {
    name: 'down from over the maximum',
    value: 500,
    step: { direction: -1, step: 1, max: 100 },
    expected: 100,
  },
  { name: 'across zero', value: 1, step: { direction: -1, step: 3 }, expected: -2 },
  {
    name: 'a sum that rounds to a negative zero',
    value: 0.7,
    step: { direction: -1, step: 0.1, times: 7 },
    expected: 0,
  },
  { name: 'empty, up, with no limit', value: null, step: { direction: 1, step: 1 }, expected: 0 },
  {
    name: 'empty, down, with no limit',
    value: null,
    step: { direction: -1, step: 1 },
    expected: 0,
  },
  {
    name: 'empty, with a minimum above zero',
    value: null,
    step: { direction: 1, step: 1, min: 3 },
    expected: 3,
  },
  {
    name: 'empty, with a maximum under zero',
    value: null,
    step: { direction: 1, step: 1, max: -2 },
    expected: -2,
  },
] as const

/** A text typed or pasted, the options, and what the input keeps. */
export const sanitizeCases = [
  { name: 'digits', text: '123', options: { signed: true, integer: false }, expected: '123' },
  { name: 'letters', text: '12ab3', options: { signed: true, integer: false }, expected: '123' },
  { name: 'spaces', text: ' 1 2 ', options: { signed: true, integer: false }, expected: '12' },
  { name: 'a decimal', text: '1.5', options: { signed: true, integer: false }, expected: '1.5' },
  {
    name: 'a decimal point at the end',
    text: '1.',
    options: { signed: true, integer: false },
    expected: '1.',
  },
  {
    name: 'a second decimal point',
    text: '1.2.3',
    options: { signed: true, integer: false },
    expected: '1.23',
  },
  {
    name: 'a decimal of a whole number',
    text: '12.5',
    options: { signed: true, integer: true },
    expected: '12',
  },
  {
    name: 'a point alone of a whole number',
    text: '.',
    options: { signed: true, integer: true },
    expected: '',
  },
  {
    name: 'a negative number',
    text: '-5',
    options: { signed: true, integer: false },
    expected: '-5',
  },
  { name: 'a sign alone', text: '-', options: { signed: true, integer: false }, expected: '-' },
  { name: 'a log inside', text: '5-3', options: { signed: true, integer: false }, expected: '53' },
  {
    name: 'a sign when none is allowed',
    text: '-5',
    options: { signed: false, integer: false },
    expected: '5',
  },
  {
    name: 'thousands separators',
    text: '1,234,567',
    options: { signed: true, integer: false },
    expected: '1234567',
  },
  { name: 'an exponent', text: '1e5', options: { signed: true, integer: false }, expected: '15' },
  { name: 'nothing', text: '', options: { signed: true, integer: false }, expected: '' },
] as const

/** A text, and the number it holds. */
export const fromTextCases = [
  { name: 'digits', text: '42', expected: 42 },
  { name: 'a decimal', text: '4.25', expected: 4.25 },
  { name: 'a negative number', text: '-3', expected: -3 },
  { name: 'a decimal point at the end', text: '5.', expected: 5 },
  { name: 'a decimal with no whole part', text: '.5', expected: 0.5 },
  { name: 'zeros in front', text: '007', expected: 7 },
  { name: 'minus zero', text: '-0', expected: 0 },
  { name: 'nothing', text: '', expected: null },
  { name: 'spaces', text: '  ', expected: null },
  { name: 'a sign alone', text: '-', expected: null },
  { name: 'a point alone', text: '.', expected: null },
  { name: 'a sign and a point', text: '-.', expected: null },
] as const

/** A number, and its text as typed. */
export const toTextCases = [
  { name: 'nothing', value: null, expected: '' },
  { name: 'zero', value: 0, expected: '0' },
  { name: 'a whole number', value: 12, expected: '12' },
  { name: 'a decimal', value: 1.5, expected: '1.5' },
  { name: 'a negative number', value: -3, expected: '-3' },
  { name: 'a number that JavaScript writes with an exponent', value: 1e-7, expected: '0.0000001' },
  { name: 'a very large number', value: 1e21, expected: '1000000000000000000000' },
  { name: 'a negative decimal', value: -0.5, expected: '-0.5' },
] as const

/** A key, whether Shift is held, and what the key does. */
export const keyActionCases = [
  { name: 'Up', key: 'ArrowUp', shift: false, expected: { kind: 'step', direction: 1, times: 1 } },
  {
    name: 'Down',
    key: 'ArrowDown',
    shift: false,
    expected: { kind: 'step', direction: -1, times: 1 },
  },
  {
    name: 'Up with Shift',
    key: 'ArrowUp',
    shift: true,
    expected: { kind: 'step', direction: 1, times: 10 },
  },
  {
    name: 'Down with Shift',
    key: 'ArrowDown',
    shift: true,
    expected: { kind: 'step', direction: -1, times: 10 },
  },
  {
    name: 'Page Up',
    key: 'PageUp',
    shift: false,
    expected: { kind: 'step', direction: 1, times: 10 },
  },
  {
    name: 'Page Down',
    key: 'PageDown',
    shift: false,
    expected: { kind: 'step', direction: -1, times: 10 },
  },
  {
    name: 'Page Up with Shift',
    key: 'PageUp',
    shift: true,
    expected: { kind: 'step', direction: 1, times: 10 },
  },
  { name: 'Home', key: 'Home', shift: false, expected: { kind: 'limit', edge: 'min' } },
  { name: 'End', key: 'End', shift: false, expected: { kind: 'limit', edge: 'max' } },
  { name: 'a letter', key: 'a', shift: false, expected: null },
  { name: 'Enter', key: 'Enter', shift: false, expected: null },
  { name: 'Shift alone', key: 'Shift', shift: true, expected: null },
] as const

/** A value, its limits, a direction, and whether a step that way can move it. */
export const canStepCases = [
  { name: 'up from an empty value', value: null, limits: {}, direction: 1, expected: true },
  {
    name: 'down from an empty value',
    value: null,
    limits: { min: 0 },
    direction: -1,
    expected: true,
  },
  { name: 'up with no maximum', value: 5, limits: {}, direction: 1, expected: true },
  { name: 'down with no minimum', value: 5, limits: {}, direction: -1, expected: true },
  { name: 'up below the maximum', value: 4, limits: { max: 5 }, direction: 1, expected: true },
  { name: 'up at the maximum', value: 5, limits: { max: 5 }, direction: 1, expected: false },
  { name: 'up past the maximum', value: 6, limits: { max: 5 }, direction: 1, expected: false },
  { name: 'down above the minimum', value: 1, limits: { min: 0 }, direction: -1, expected: true },
  { name: 'down at the minimum', value: 0, limits: { min: 0 }, direction: -1, expected: false },
  { name: 'down below the minimum', value: -1, limits: { min: 0 }, direction: -1, expected: false },
  { name: 'up at the minimum', value: 0, limits: { min: 0 }, direction: 1, expected: true },
  { name: 'down at the maximum', value: 5, limits: { max: 5 }, direction: -1, expected: true },
] as const
