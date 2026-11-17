import { projectIds } from '@/mocks/shared/db'

/**
 * Active projects of the mock data among the latest ones, by the name of each link, top to bottom:
 * a project shows its status only when it asks for the user, or works.
 */
export const sidebarRows = [
  { name: 'Mentor platform, Waiting for you', id: projectIds.mentor },
  { name: 'Campus food ordering', id: projectIds.campus },
]
