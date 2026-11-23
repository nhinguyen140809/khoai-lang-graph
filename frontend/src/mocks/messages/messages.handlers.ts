import { http, HttpResponse } from 'msw'

import { apiEndpoints } from '@/shared/api/endpoints'

import { idempotent, pathParam, readBodyFields } from '../shared/http/request'
import { created, emptyPage, paginate, validationFailed } from '../shared/http/response'
import { answerScenario } from '../shared/scenario'
import { findThread } from '../threads/threads.lookup'
import { threadNotFound } from '../threads/threads.problems'
import { assistanceDefinitionFixture } from '../workflow/workflow.fixtures'
import { addMessage, finishAnswer } from './messages.changes'
import { answerDelayMs } from './messages.constants'
import { messagesOfThread } from './messages.lookup'
import { validateSentMessageBody } from './messages.validators'

export const messageHandlers = [
  http.get(apiEndpoints.threadMessages.pattern, async ({ params, request }) => {
    const scenario = await answerScenario('messages')
    const threadId = pathParam(params, 'threadId')
    if (findThread(threadId) === undefined) return threadNotFound()
    if (scenario === 'empty') return HttpResponse.json(emptyPage)
    return HttpResponse.json(paginate(messagesOfThread(threadId), request))
  }),

  // A message about the app is taken in by a run of the assistant, which answers a moment later; a
  // message about the work to a thread without an unfinished run starts a run, and one to the
  // unfinished run of the thread waits for it. The request goes with an idempotency key.
  http.post(
    apiEndpoints.threadMessages.pattern,
    idempotent(async ({ params, request }) => {
      await answerScenario('send-message')
      const thread = findThread(pathParam(params, 'threadId'))
      if (thread === undefined) return threadNotFound()
      const checked = validateSentMessageBody(await readBodyFields(request))
      if ('problems' in checked) return validationFailed(checked.problems)
      const sent = addMessage(thread, checked.message)
      // The assistant works on an answer after the message is taken in.
      if (sent.run.workflow_name === assistanceDefinitionFixture.name) {
        setTimeout(() => {
          finishAnswer(sent.run.id)
        }, answerDelayMs)
      }
      return created(sent)
    }),
  ),
]
