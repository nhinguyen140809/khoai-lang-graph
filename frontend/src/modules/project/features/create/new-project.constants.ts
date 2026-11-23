/** The words of the action that starts a project from an idea. */
export const createProjectMessages = {
  /** The title over the prompt that starts a project, which comes in one word after another. */
  promptTitle: 'What do you want to build?',
  /** The action, wherever it is offered. */
  create: 'Create project',
  /** The section of the form that holds the settings that the runs of the project start from. */
  agentSettings: 'Agent settings',
  /** The project was created, but some of the files chosen as its sources did not go up. */
  sourcesNotUploaded: (names: string) =>
    `The project is created, but these sources were not uploaded: ${names}.`,
  /** The project was created, but its first message was not sent. */
  ideaNotSent: 'The project is created, but its idea was not sent.',
  /** The project was created, but its run settings were not saved, so its idea was held back. */
  settingsNotSaved:
    'The project is created, but its run settings were not saved, so its idea was not sent.',
}

/** The name under which the prompt that starts a project keeps its draft. */
export const newProjectDraftName = 'new-project'
