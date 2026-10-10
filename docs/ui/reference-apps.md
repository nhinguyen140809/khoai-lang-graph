# UI Reference Apps

Applications close to this system, grouped by the UI pattern they use, with screenshots and what each pattern can give the web app. This page is input for the UI design; none of the options below is decided.

The screenshots are linked from the sites of the products and can change or disappear. The web app as designed so far is described in [Web App](../architecture/web-app.md).

## Contents

- [UI Reference Apps](#ui-reference-apps)
  - [Contents](#contents)
  - [1. Overview](#1-overview)
  - [2. Chat and document side by side](#2-chat-and-document-side-by-side)
  - [3. Agent workspace with a progress timeline](#3-agent-workspace-with-a-progress-timeline)
  - [4. Review inbox and review card](#4-review-inbox-and-review-card)
  - [5. Requirements management](#5-requirements-management)
  - [6. Research repository](#6-research-repository)
  - [7. Whiteboard and story map](#7-whiteboard-and-story-map)
  - [8. LLM observability](#8-llm-observability)
  - [9. Sources](#9-sources)

---

## 1. Overview

| Pattern | Apps | Part of this system it fits |
|---|---|---|
| Chat and document side by side | ChatGPT Canvas, Claude Artifacts, Open Canvas, ChatPRD, Kiro | The thread screen: the conversation next to the artifact being worked on |
| Agent workspace with a progress timeline | LangGraph Studio, Devin, Manus | The workflow graph and the progress of a run |
| Review inbox and review card | Agent Inbox, Gemini Deep Research, CopilotKit | The review panel of the human checkpoints |
| Requirements management | Jama Connect, ReqView, IBM DOORS Next, Siemens Polarion | The requirement specification, the item detail and the trace links |
| Research repository | Dovetail | The interview transcripts and the quotes of `evidenced_by` |
| Whiteboard and story map | Miro, StoriesOnBoard | Secondary views of the personas and the product backlog |
| LLM observability | Langfuse | Experiments and debugging |

## 2. Chat and document side by side

**Apps.** ChatGPT Canvas, Claude Artifacts, Open Canvas (open source, by LangChain, built on LangGraph), ChatPRD, Kiro.

**Layout.** The chat is on the left and the document on the right. The agent edits the document in place; the user edits it by hand, or selects a passage and asks the agent to change it.

Open Canvas: the chat next to an editable document.

![Open Canvas](https://raw.githubusercontent.com/langchain-ai/open-canvas/main/static/screenshot.png)

Kiro: the chat panel next to `requirements.md`. Kiro writes `requirements.md`, `design.md` and `tasks.md` one after the other, and the user reviews each file before the next one is written.

![Kiro chat next to requirements.md](https://kiro.dev/images/blogs/from-chat-to-specs-deep-dive/blog-1.png)

More: [Kiro spec files (GIF)](https://kiro.dev/images/blogs/from-chat-to-specs-deep-dive/spec-files-carousel.gif), [ChatGPT Canvas](https://openai.com/index/introducing-canvas/), [ChatPRD](https://www.chatprd.ai/docs/writing-your-first-prd).

**For this system.** Kiro is the closest in content: requirements produced in steps, with a review between steps. The thread screen can show the conversation or an interview transcript on the left and the artifact under review on the right.

## 3. Agent workspace with a progress timeline

**Apps.** LangGraph Studio, Devin, Manus.

**Layout.** The graph or the plan of the agent on one side, the steps of the run on the other; each step opens its details.

LangGraph Studio, graph mode: the graph on the left with the running node highlighted, and the thread on the right as a timeline of nodes, each with its input and output.

![LangGraph Studio graph mode](https://mintcdn.com/langchain-5e9cc07a/TCDks4pdsHdxWmuJ/oss/images/studio_create-agent.png)

Devin, Progress tab: the steps of a session in one list; selecting a step shows its shell commands, code edits and browser activity.

![Devin Progress tab](https://mintcdn.com/cognitionai/jXY34FCFVGnmuB3S/images/work-with-devin/devin-progress-tab.gif?s=b8f3d2f5fb24f229e04adf6487c92f1c)

**For this system.** The workflow graph and the progress of a run in [Web App](../architecture/web-app.md#3-workflow-graph) follow this pattern. The list of steps can sit next to the graph as in Studio, each step with its agent role, its status and the artifact versions it wrote.

## 4. Review inbox and review card

**Apps.** Agent Inbox (by LangChain), Gemini Deep Research, CopilotKit.

**Layout.** Two forms:

- An inbox: one list of the interrupts waiting for a person, across agents, filtered by status.
- A card in the conversation: the request for review appears in the chat at the point where the run paused, with its buttons.

Agent Inbox: the tabs All, Interrupted, Idle, Busy and Error; each row is one interrupt marked "Requires Action".

![Agent Inbox](https://raw.githubusercontent.com/langchain-ai/agent-inbox/main/public/inbox_screenshot.png)

Gemini Deep Research shows its research plan as a card with "Edit plan" and "Start research" before it starts ([blog post](https://blog.google/products/gemini/google-gemini-deep-research/)). CopilotKit renders a LangGraph interrupt as a component inside the chat ([docs](https://docs.copilotkit.ai/langgraph-python/generative-ui/interactive)).

**For this system.**

- The human checkpoints `persona_review`, `analysis_review` and `specification_review` can open their review panel as a card in the conversation, at the point where the run paused.
- `persona_review` is the closest to the plan card of Deep Research: the user checks the personas before the interviews start.
- An inbox page that lists the pending interrupts of all projects of the user helps when several runs wait at the same time.

## 5. Requirements management

**Apps.** Jama Connect, ReqView, IBM DOORS Next, Siemens Polarion.

**Layout.** The document tree on the left, the table of requirements with their attribute columns in the middle, and the detail of one requirement with its trace links on the right. A traceability diagram or matrix shows the coverage between levels.

Jama Connect, Live Trace Explorer: groups of items joined by their relationships, each edge with its coverage percentage, and a trace score for the project.

![Jama Connect Live Trace Explorer](https://help.jamasoftware.com/ah/en/image/img-dc4702e6e3e53c2707b2875ecb869a2c.png)

ReqView: the specification as a table with numbered headings and a panel of attributes, and below it a traceability matrix that marks a requirement with missing verification links.

![ReqView overview](https://www.reqview.com/static/8f241dfdab5a32d896f2b6214d722469/8386d/reqview-requirements-management.png)

**For this system.**

- The `heading` and `table` displays of the requirement specification follow the table of ReqView.
- The item detail lists the links of the item by link type (`derived_from`, `depends_on`, `concerns`, ...), both outgoing and incoming.
- A coverage view counts the gaps along the main chain, for example raw requirements without `evidenced_by`, analyzed requirements that no spec requirement is derived from, and spec requirements without a backlog item.

## 6. Research repository

**Apps.** Dovetail.

**Layout.** A transcript in which passages are highlighted and grouped under tags; an insight links back to the highlighted quotes.

![Dovetail highlights](https://mintcdn.com/dovetail-e5aa4160/mN7xFQnMVduaQRDY/help/projects/highlights/Highlightshero.png?fit=max&auto=format&n=mN7xFQnMVduaQRDY&q=85&s=2b144d0bf789fe5bf1492e7a934804b1)

**For this system.** A link `evidenced_by` holds `{message, quote}`. Opening a raw requirement or a latent need can highlight its quote in the interview transcript, and each message of the transcript can list the items that cite it.

## 7. Whiteboard and story map

**Apps.** Miro (user story map template, AI user story generator), StoriesOnBoard.

**Layout.** A free canvas of sticky notes. A story map puts the user activities in one row and the stories below them, grouped by release.

Links: [Miro user story map](https://miro.com/templates/user-story-map-basic/), [StoriesOnBoard](https://storiesonboard.com/).

**For this system.** This pattern fits secondary views, such as the personas side by side or the product backlog as a story map. It does not fit the main screen, since every item has a fixed schema and a canvas has none.

## 8. LLM observability

**Apps.** Langfuse.

**Layout.** A trace as a tree of nested observations, with timing, input, output and metadata.

![Langfuse trace](https://langfuse.com/images/docs/tracing-overview.png)

**For this system.** Langfuse is part of the stack, so the web app can link a step to its trace instead of drawing the trace again.

## 9. Sources

- [Kiro: from chat to specs](https://kiro.dev/blog/from-chat-to-specs-deep-dive/)
- [Open Canvas repository](https://github.com/langchain-ai/open-canvas)
- [ChatGPT Canvas](https://openai.com/index/introducing-canvas/)
- [ChatPRD: writing your first PRD](https://www.chatprd.ai/docs/writing-your-first-prd)
- [LangGraph Studio](https://docs.langchain.com/oss/python/langgraph/studio)
- [Devin session tools](https://docs.devin.ai/work-with-devin/devin-session-tools)
- [Agent Inbox repository](https://github.com/langchain-ai/agent-inbox)
- [Gemini Deep Research](https://blog.google/products/gemini/google-gemini-deep-research/)
- [CopilotKit interactive generative UI](https://docs.copilotkit.ai/langgraph-python/generative-ui/interactive)
- [Jama Connect Live Trace Explorer](https://help.jamasoftware.com/ah/en/manage-content/coverage-and-traceability/live-trace-explorer.html)
- [ReqView](https://www.reqview.com/)
- [Dovetail highlights](https://docs.dovetail.com/help/highlights)
- [Miro user story map](https://miro.com/templates/user-story-map-basic/)
- [StoriesOnBoard](https://storiesonboard.com/)
- [Langfuse observability overview](https://langfuse.com/docs/observability/overview)
