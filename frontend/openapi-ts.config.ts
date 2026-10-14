import { defineConfig } from '@hey-api/openapi-ts'

// Input is the schema snapshot written by `just codegen` from the backend's
// create_app().openapi() (CONTRIBUTING: API Contract). Never edit either side by hand.
export default defineConfig({
  input: './openapi.json',
  output: 'src/shared/api/generated',
  plugins: [
    // A call throws on an error status, as apiRequest of src/shared/api does.
    { name: '@hey-api/client-fetch', throwOnError: true },
    // Answers are checked with zod at run time, as the hand-written schemas check them.
    'zod',
    { name: '@hey-api/sdk', validator: true },
  ],
})
