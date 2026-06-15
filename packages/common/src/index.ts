import { DerropsConventions } from 'derrops-conventions'

const env = 'prod'
const region = 'ap-southeast-2'

export const convention = new DerropsConventions({ org: 'derrops', env, region })
  .tagPrefix('derrops:')
  .tagKeys('org', 'domain', 'service')
  .domains({
    bootstrap: ['amplify'] as const,
    platform: ['auth'] as const,
    todo: ['backend', 'frontend'] as const,
  })

// SSM param path shared between platform (writer) and todo-backend (reader)
export const PLATFORM_SSM_PARAM = convention.with({ domain: 'bootstrap', service: 'amplify' }).name({ type: 'ssmParam' })

