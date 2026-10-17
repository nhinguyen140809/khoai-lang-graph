// The words of the projects: their actions, their states, and the toasts after a change.

export const projectMessages = {
  /** The action that starts a project from an idea, wherever it is offered. */
  create: 'Create project',
  /** The way to the list of every project. */
  all: 'All projects',
  /** The projects of a list or a menu while they load. */
  listLoading: 'Loading projects...',
  /** A menu of projects without any. */
  none: 'No projects',
  /** The project was created, but its first message was not sent. */
  ideaNotSent: 'The project is created, but its idea was not sent.',
  /** The projects of a menu failed to load; choosing the entry loads them again. */
  listFailed: 'Failed to load projects. Try again',
  /** The project of the address does not exist, or was deleted. */
  notFound: 'Project not found',
  notFoundHint: 'No project exists at this address, or it was deleted.',
  /** The project failed to load for another reason. */
  unavailable: 'Project unavailable',
  /** The action that renames a project, and the title of its dialog. */
  rename: 'Rename project',
  /** The toasts after a change of a project, which name it. */
  renamed: 'Project renamed',
  archived: 'Project archived',
  restored: 'Project restored',
  deleted: 'Project deleted',
  /** The action of the toast of an archived project, which restores it. */
  undo: 'Undo',
}
