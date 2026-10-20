// The words of the status of a project on the status bar, the status of the run that needs the
// user most, and what it shows of the threads.

export const projectRunStatusMessages = {
  loading: 'Loading status',
  failed: 'Failed to load the status.',
  retry: 'Try again',
  /** Where the status leads, for assistive technology. */
  openActivity: 'open the activity',
  /** The title of the list of the threads of the project, from the one that needs the user most. */
  overview: 'Status of the project',
  noThread: 'Nothing has started yet.',
  untitledThread: 'Untitled thread',
}

/**
 * Whether the screens name each thread of a project by its title. A project has one thread for
 * now, whose title would only repeat the project, so the screens leave it out; the threads still
 * come with their titles, for when a project has several.
 */
export const threadTitles = { shown: false }
