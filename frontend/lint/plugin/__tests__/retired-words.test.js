import { retiredWords as retiredWordList } from '../../lib/names/retired-words.constants.js'
import { retiredWords } from '../retired-words.js'
import { createRuleTester } from './typed-rule-tester.js'

const options = [{ retired: retiredWordList }]

createRuleTester().run('retired-words', retiredWords, {
  valid: [
    { code: 'const logIn = 1', options },
    { code: 'const signature = 1', options },
    { code: 'const signInput = 1', options },
    // a name from a library is used, not given
    { code: 'authClient.signIn()', options },
  ],
  invalid: [
    { code: 'const signIn = 1', options, errors: [{ messageId: 'retired' }] },
    { code: 'function sign_out() {}', options, errors: [{ messageId: 'retired' }] },
    { code: 'const handlers = { signUp: 1 }', options, errors: [{ messageId: 'retired' }] },
    { code: 'const createAccountForm = 1', options, errors: [{ messageId: 'retired' }] },
  ],
})
