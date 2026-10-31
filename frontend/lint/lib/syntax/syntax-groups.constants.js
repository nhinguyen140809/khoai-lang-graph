// The end of a class whose value is in brackets, such as `text-[0.625rem]` or
// `[scrollbar-width:none]`, with an opacity or an important mark after it. A variant in brackets,
// such as `data-[state=open]:` or `group-data-[active=true]/tab:`, ends with a colon instead.
// esquery reads a regex up to the next slash, so the slash is written \x2F.
const bracketValue = String.raw`/\](?=$|\s|!|\x2F[\w.%-]*(?:\s|$))/`

// The props that take classes, and the calls of cn outside them, so that a class is reported once.
const classAttribute = 'JSXAttribute[name.name=/[cC]lassName$/]'

// Conventions that no plugin checks, as groups of no-restricted-syntax selectors. A later block
// replaces the whole list of the rule, so each block names every group it keeps.
export const syntaxGroups = {
  persistStorage: [
    {
      selector:
        "CallExpression[callee.name='persist'] > ObjectExpression:not(:has(> Property[key.name='storage']))",
      message:
        'A persisted store passes storage: persistStorage(...) or persistStorageByEntry(...) of @/shared/lib/storage, which handles storage that is missing, blocked or full.',
    },
    {
      selector:
        "CallExpression[callee.name='persist'] > ObjectExpression > Property[key.name='name']:not([value.callee.name='storageKey'])",
      message: 'Name the key of a persisted store with storageKey(...) of @/shared/lib/storage.',
    },
  ],
  bracketClasses: [
    `${classAttribute} Literal[value=${bracketValue}]`,
    `${classAttribute} TemplateElement[value.raw=${bracketValue}]`,
    `CallExpression[callee.name='cn']:not(${classAttribute} *) Literal[value=${bracketValue}]`,
    `CallExpression[callee.name='cn']:not(${classAttribute} *) TemplateElement[value.raw=${bracketValue}]`,
  ].map((selector) => ({
    selector,
    message:
      'A class has no CSS value of its own in brackets outside src/shared/components/ui/. Use a token or a utility of the scale, or add one to src/app/styles.css (CONTRIBUTING: UI components).',
  })),
  innerHtml: [
    {
      selector: "JSXAttribute[name.name='dangerouslySetInnerHTML']",
      message:
        'Never render content as HTML: put HTML artifacts in a sandboxed iframe (CONTRIBUTING: Untrusted content).',
    },
  ],
  inlineKeys: [
    {
      selector: "Property[key.name=/^(queryKey|mutationKey)$/][value.type='ArrayExpression']",
      message:
        'Take the key from the key factory of the resource, <resource>.keys.ts (CONTRIBUTING: Query keys).',
    },
  ],
  hooksInComponents: [
    'FunctionDeclaration[id.name=/^use[A-Z]/]',
    'VariableDeclarator[id.name=/^use[A-Z]/][init.type=/^(Arrow)?FunctionExpression$/]',
  ].map((selector) => ({
    selector,
    message:
      'A hook lives in hooks/use<Name>.ts of its slice, or alone in use<Name>.ts at the root of a feature or a widget, not in the file of a component (CONTRIBUTING: Hooks of a slice).',
  })),
  // An action that deletes, stops or revokes something asks first, in a dialog (ConfirmDialog). A
  // hook named ...Command only opens that dialog from the command palette, so any file may call it.
  destructiveActions: [
    {
      selector:
        'ImportSpecifier[imported.name=/^use(Delete|Remove|Stop|Revoke|Discard|Reset)[A-Z][A-Za-z]*(?<!Dialog|Command)$/]',
      message:
        'A destructive action asks first: call this hook from a *Dialog.tsx file that renders ConfirmDialog, and open that dialog from menus, rows and commands (CONTRIBUTING: Destructive actions).',
    },
  ],
  // The address of a page that comes from data is typed with routeOfAddress, in one place.
  routeCast: [
    {
      selector: "TSAsExpression[typeAnnotation.typeName.name='Route']",
      message:
        'Do not cast to Route: write the address of a page with routes or checkedRoute, and an address that comes from data with routeOfAddress of @/shared/routes.',
    },
  ],
  // A method written as a literal is checked by its type where it is given to a function or a field
  // of the type HttpMethod, so the tests may write it; the code outside the tests uses the name.
  httpMethodLiteral: [
    {
      selector: "Property[key.name='method'] > Literal[value=/^(GET|POST|PUT|PATCH|DELETE)$/]",
      message: 'Use HttpMethod of @/shared/api/http.',
    },
  ],
  // A unit test types, pastes and presses keys with the steps of @/test/steps.
  userEventKeys: [
    {
      selector:
        'CallExpression[callee.object.name=/^(user|userEvent)$/][callee.property.name=/^(keyboard|type|paste|tab)$/]',
      message:
        'Use typeText, pasteText, pressKey, pressKeys, pressTab or clickHolding of @/test/steps.',
    },
  ],
  // A unit test gets its query cache from @/test/render.
  testQueryClient: [
    {
      selector: "NewExpression[callee.name='QueryClient']",
      message:
        'Use createTestQueryClient of @/test/render, or the cache that renderWithProviders makes.',
    },
  ],
  // The methods, statuses and headers of HTTP have names in @/shared/api/http, which is the only
  // place that writes them out.
  httpVocabulary: [
    {
      selector: "Property[key.name='status'] > Literal[raw=/^[1-5]\\d\\d$/]",
      message: 'Use HttpStatus of @/shared/api/http.',
    },
    {
      selector:
        'Literal[value=/^(Content-Type|Content-Disposition|Location|If-Match|Idempotency-Key)$/]',
      message: 'Use HttpHeader of @/shared/api/http.',
    },
    {
      selector: 'Literal[value=/^(application\\/json|application\\/problem\\+json|text\\/plain)$/]',
      message: 'Use MediaType of @/shared/api/http.',
    },
  ],
  // The paths of the API are written once, in @/shared/api/endpoints.
  apiPaths: [
    'Literal[value=/^\\/api\\/v1\\//]',
    'TemplateElement[value.raw=/^\\/api\\/v1\\//]',
  ].map((selector) => ({
    selector,
    message:
      'Write the path of the API with apiEndpoints of @/shared/api/endpoints, or apiEndpoint for a path of its own.',
  })),
  defaultExport: ['ExportDefaultDeclaration', "ExportSpecifier[exported.name='default']"].map(
    (selector) => ({
      selector,
      message: 'Use a named export; only the routing files of Next.js export a default.',
    }),
  ),
  // A utils file of a slice holds pure helpers: what reads or changes the cache of the queries, or
  // calls the API, is a hook of the slice.
  queriesInUtils: [
    "ImportDeclaration[source.value='@tanstack/react-query']",
    String.raw`ImportDeclaration[source.value=/\.api$/]`,
  ].map((selector) => ({
    selector,
    message:
      'A *.utils.ts file holds pure helpers: code that reads or changes the cache of the queries, or calls the API, is a hook in hooks/ of the slice, such as one of its use<Resource>Queries.ts (CONTRIBUTING: Inside a slice).',
  })),
  // A file of functions keeps the types that others use in the types file of its subject; a type
  // that only it uses stays in the file, unexported.
  exportedTypes: [
    "ExportNamedDeclaration[exportKind='type']",
    "ExportSpecifier[exportKind='type']",
  ].map((selector) => ({
    selector,
    message:
      'A file of functions exports no type: a type that others use goes in the types file of its subject, and one only this file uses stays here, unexported (CONTRIBUTING: Types and constants).',
  })),
  // A constants file holds only the words of the screens and the settings.
  valuesInConstants: [
    ...['TSInterfaceDeclaration', 'TSTypeAliasDeclaration'].map((type) => ({
      selector: `ExportNamedDeclaration > ${type}`,
      message:
        'A constants file exports no type: a type that others use goes in the types file of its subject (CONTRIBUTING: Types and constants).',
    })),
    ...[
      ':matches(Program, ExportNamedDeclaration) > FunctionDeclaration',
      ':matches(Program, ExportNamedDeclaration) > VariableDeclaration > VariableDeclarator[init.type=/^(Arrow)?FunctionExpression$/]',
    ].map((selector) => ({
      selector,
      message:
        'A constants file holds no function: a function goes in the utils file of its topic (CONTRIBUTING: Types and constants).',
    })),
  ],
  // A types file holds a list of values with the type made from it, so it never reads a constants
  // file, and the two never import each other.
  constantsInTypes: [
    'ImportDeclaration[source.value=/\\.constants$/]',
    'ExportNamedDeclaration[source.value=/\\.constants$/]',
    'ExportAllDeclaration[source.value=/\\.constants$/]',
  ].map((selector) => ({
    selector,
    message:
      'A types file imports no constants file: a list of values and the type made from it go in the types file (CONTRIBUTING: Types and constants).',
  })),
}
