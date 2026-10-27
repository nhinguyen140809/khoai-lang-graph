/** @type {import('prettier').Config} */
export default {
  endOfLine: 'lf',
  semi: false,
  singleQuote: true,
  trailingComma: 'all',
  printWidth: 100,
  plugins: ['prettier-plugin-tailwindcss'],
  tailwindStylesheet: './src/app/styles.css',
  tailwindFunctions: ['cn', 'cva'],
}
