import { defaultRunConfigFixture } from '../../fixtures/runs.fixtures'

const noSettings = {
  review_checkpoints: null,
  max_steps: null,
  max_cost_usd: null,
  parameters: null,
}

/** The levels that set a run, and the settings of the run that starts. */
export const resolveCases = [
  {
    name: 'no level that sets anything',
    project: { run_config: noSettings, output_language: 'en' as const },
    override: undefined,
    config: defaultRunConfigFixture,
  },
  {
    name: 'no project',
    project: undefined,
    override: undefined,
    config: defaultRunConfigFixture,
  },
  {
    name: 'a setting of the project, and its language',
    project: {
      run_config: { ...noSettings, max_cost_usd: 5, review_checkpoints: [] },
      output_language: 'vi' as const,
    },
    override: undefined,
    config: {
      ...defaultRunConfigFixture,
      max_cost_usd: 5,
      review_checkpoints: [],
      output_language: 'vi',
    },
  },
  {
    name: 'a setting of the request over the one of the project',
    project: {
      run_config: { ...noSettings, max_steps: 20, max_cost_usd: 5 },
      output_language: 'en' as const,
    },
    override: { ...noSettings, max_steps: 10 },
    config: { ...defaultRunConfigFixture, max_steps: 10, max_cost_usd: 5 },
  },
  {
    name: 'parameters, each from the first level that sets it',
    project: {
      run_config: { ...noSettings, parameters: { max_turns: 9, max_personas: 4 } },
      output_language: 'en' as const,
    },
    override: { ...noSettings, parameters: { max_personas: 2 } },
    config: {
      ...defaultRunConfigFixture,
      parameters: { ...defaultRunConfigFixture.parameters, max_turns: 9, max_personas: 2 },
    },
  },
]
