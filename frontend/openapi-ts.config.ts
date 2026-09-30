import { defineConfig } from '@hey-api/openapi-ts'

// Input is the schema snapshot written by `just codegen` from the backend's
// create_app().openapi() (CONTRIBUTING: API Contract). Never edit either side by hand.
export default defineConfig({
  input: './openapi.json',
  output: 'src/api/generated',
  plugins: ['@hey-api/client-fetch', '@tanstack/react-query'],
})
