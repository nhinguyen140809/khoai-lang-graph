/**
 * The workflow that a thread works in: its latest run gives the status of the thread, and the chat
 * follows it. A run of another workflow, such as the one that answers a message, is a run to show
 * and changes none of these. A test checks the name against the definition in the docs.
 */
export const mainWorkflowName = 'requirements_engineering'
