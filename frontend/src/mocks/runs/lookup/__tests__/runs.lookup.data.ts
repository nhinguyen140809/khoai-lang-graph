import { defaultRunConfigFixture } from '../../fixtures/runs.fixtures'

// The settings of the user in the fixtures: the model settings choose Claude Opus 5 for the analyst,
// and GPT-4.1 mini for the persona agent, which the default already uses; the run defaults of the
// user set 60 steps at most.
const userModels = { analyst: 'anthropic:claude-opus-5' }
const withUserModels = {
  ...defaultRunConfigFixture,
  max_steps: 60,
  models: { ...defaultRunConfigFixture.models, ...userModels },
}

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
    project: { run_config: noSettings, output_language: 'en' as const, model_overrides: {} },
    override: undefined,
    models: undefined,
    config: withUserModels,
  },
  {
    name: 'no project',
    project: undefined,
    override: undefined,
    models: undefined,
    config: withUserModels,
  },
  {
    name: 'a setting of the project, and its language',
    project: {
      run_config: { ...noSettings, max_cost_usd: 5, review_checkpoints: [] },
      output_language: 'vi' as const,
      model_overrides: {},
    },
    override: undefined,
    models: undefined,
    config: {
      ...withUserModels,
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
      model_overrides: {},
    },
    override: { ...noSettings, max_steps: 10 },
    models: undefined,
    config: { ...withUserModels, max_steps: 10, max_cost_usd: 5 },
  },
  {
    name: 'parameters, each from the first level that sets it',
    project: {
      run_config: { ...noSettings, parameters: { max_turns: 9, max_personas: 4 } },
      output_language: 'en' as const,
      model_overrides: {},
    },
    override: { ...noSettings, parameters: { max_personas: 2 } },
    models: undefined,
    config: {
      ...withUserModels,
      parameters: { ...withUserModels.parameters, max_turns: 9, max_personas: 2 },
    },
  },
  {
    name: 'a model of the project over the one of the user',
    project: {
      run_config: noSettings,
      output_language: 'en' as const,
      model_overrides: { analyst: 'openai:gpt-4.1', planner: 'anthropic:claude-opus-5' },
    },
    override: undefined,
    models: undefined,
    config: {
      ...withUserModels,
      models: {
        ...withUserModels.models,
        analyst: 'openai:gpt-4.1',
        planner: 'anthropic:claude-opus-5',
      },
    },
  },
  {
    name: 'a model of the request over the ones of the project and the user',
    project: {
      run_config: noSettings,
      output_language: 'en' as const,
      model_overrides: { analyst: 'openai:gpt-4.1' },
    },
    override: undefined,
    models: { analyst: 'anthropic:claude-haiku-5' },
    config: {
      ...withUserModels,
      models: { ...withUserModels.models, analyst: 'anthropic:claude-haiku-5' },
    },
  },
]
