import type { ReaderView } from '../reader.types'

const documents: ReaderView = { kind: 'documents' }
const document: ReaderView = { kind: 'document', artifactId: 'a1' }
const item: ReaderView = { kind: 'item', itemId: 'i1' }
const overview: ReaderView = { kind: 'overview', artifactId: 'a1' }
const group: ReaderView = { kind: 'group', documentKind: 'interview_transcript' }
const folder: ReaderView = { kind: 'folder', artifactId: 'a1', nodeId: 'section:s1' }

/** The query parameters of a page, and what the reader shows for them. */
export const viewCases: {
  name: string
  params: {
    documentId: string | null
    folderId: string | null
    groupKind: string | null
    itemId: string | null
    reader: string | null
  }
  view: ReaderView | null
}[] = [
  {
    name: 'no parameter',
    params: { groupKind: null, folderId: null, documentId: null, itemId: null, reader: null },
    view: null,
  },
  {
    name: 'a document',
    params: { groupKind: null, folderId: null, documentId: 'a1', itemId: null, reader: null },
    view: document,
  },
  {
    name: 'an item',
    params: { groupKind: null, folderId: null, documentId: null, itemId: 'i1', reader: null },
    view: item,
  },
  {
    name: 'the list of the documents',
    params: { groupKind: null, folderId: null, documentId: null, itemId: null, reader: 'documents' },
    view: documents,
  },
  {
    name: 'a reader that does not exist, as nothing',
    params: { groupKind: null, folderId: null, documentId: null, itemId: null, reader: 'trace' },
    view: null,
  },
  {
    name: 'the overview of a document',
    params: { groupKind: null, documentId: 'a1', folderId: 'overview', itemId: null, reader: null },
    view: overview,
  },
  {
    name: 'a folder of a document',
    params: { groupKind: null, documentId: 'a1', folderId: 'section:s1', itemId: null, reader: null },
    view: folder,
  },
  {
    name: 'the folder of the documents of one kind',
    params: {
      groupKind: 'interview_transcript',
      documentId: null,
      folderId: null,
      itemId: null,
      reader: null,
    },
    view: group,
  },
  {
    name: 'a folder without a document, as nothing',
    params: { groupKind: null, documentId: null, folderId: 'section:s1', itemId: null, reader: null },
    view: null,
  },
  {
    name: 'a document and an item, as the document',
    params: { groupKind: null, folderId: null, documentId: 'a1', itemId: 'i1', reader: 'documents' },
    view: document,
  },
]

/** Two views, and whether they show the same thing. */
export const sameViewCases: {
  name: string
  first: ReaderView | null
  second: ReaderView | null
  isSame: boolean
}[] = [
  { name: 'one document twice', first: document, second: { ...document }, isSame: true },
  { name: 'one item twice', first: item, second: { ...item }, isSame: true },
  { name: 'the list twice', first: documents, second: { kind: 'documents' }, isSame: true },
  { name: 'one group twice', first: group, second: { ...group }, isSame: true },
  {
    name: 'a group and the list',
    first: group,
    second: documents,
    isSame: false,
  },
  {
    name: 'two documents',
    first: document,
    second: { kind: 'document', artifactId: 'a2' },
    isSame: false,
  },
  {
    name: 'an item whose id is the id of a document',
    first: document,
    second: { kind: 'item', itemId: 'a1' },
    isSame: false,
  },
  { name: 'nothing and an item', first: null, second: item, isSame: false },
]

/** A view, and the address of the chat with the reader open on it. */
export const addressCases: { name: string; view: ReaderView; address: string }[] = [
  { name: 'the list of the documents', view: documents, address: '/projects/p1?reader=documents' },
  { name: 'a document', view: document, address: '/projects/p1?document=a1' },
  { name: 'an item', view: item, address: '/projects/p1?item=i1' },
  {
    name: 'the folder of the documents of one kind',
    view: group,
    address: '/projects/p1?group=interview_transcript',
  },
  {
    name: 'the overview of a document',
    view: overview,
    address: '/projects/p1?document=a1&folder=overview',
  },
  {
    name: 'a folder of a document',
    view: folder,
    address: '/projects/p1?document=a1&folder=section%3As1',
  },
  {
    name: 'an id that needs encoding',
    view: { kind: 'item', itemId: 'a b/c' },
    address: '/projects/p1?item=a+b%2Fc',
  },
]

const secondDocument: ReaderView = { kind: 'document', artifactId: 'a2' }

export const trailCases: {
  name: string
  trail: ReaderView[]
  view: ReaderView | null
  result: ReaderView[]
}[] = [
  { name: 'a first view', trail: [], view: documents, result: [documents] },
  { name: 'the same view again', trail: [documents], view: documents, result: [documents] },
  { name: 'another view', trail: [documents], view: document, result: [documents, document] },
  {
    name: 'a third view',
    trail: [documents, document],
    view: item,
    result: [documents, document, item],
  },
  {
    name: 'the view before, which takes the last off',
    trail: [documents, document],
    view: documents,
    result: [documents],
  },
  { name: 'a closed reader', trail: [documents, secondDocument], view: null, result: [] },
]
