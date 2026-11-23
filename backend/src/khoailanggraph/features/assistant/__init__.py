"""The assistant: the app answers a message about itself, beside the workflow.

A message in the chat is classified before anything else happens. One about the idea or the
documents enters the workflow as it always did; one about the application itself — "open the
interview with Minh", "what is the cost limit here" — is answered here, and the UI actions it
asks for go back to the client. It never writes an artifact, never starts a run and never
touches the graph.
"""

from khoailanggraph.features.assistant.schemas import AssistantAction, AssistantReply

__all__ = ["AssistantAction", "AssistantReply"]
