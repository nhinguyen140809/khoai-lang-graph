import type { Project } from '@/modules/project/entities'

/** The fields of a project that its creation takes. */
export type NewProjectRecord = Pick<Project, 'name' | 'description' | 'output_language'>
