/** The words of the action that starts a project from an idea. */
export const createProjectMessages = {
  /** The action, wherever it is offered. */
  create: 'Create project',
  /** The project was created, but its first message was not sent. */
  ideaNotSent: 'The project is created, but its idea was not sent.',
}

// TODO: read the parameters and the checkpoints from the workflow definition, and send the
// settings of the runs with the first message, once the client has their endpoints.
/** The defaults of the runs that the new project dialog shows, until they can be changed. */
export const runDefaultsPreview = {
  personas: 3,
  reviews: ['Finalize the interviewees', 'Review the analysis', 'Review the specification'],
}
