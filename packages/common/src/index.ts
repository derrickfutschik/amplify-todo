import { DerropsConventions } from 'derrops-conventions'

const env = 'prod'
const region = 'ap-southeast-2'

export const convention = new DerropsConventions({ org: 'derrops', env, region })
  .tagPrefix('derrops:')
  .tagKeys('org', 'domain', 'service')
  .domains({
    bootstrap: [] as const,
    platform: ['auth'] as const,
    todo: ['backend', 'frontend'] as const,
  })

export const platformConvention = convention.with({ domain: 'platform', service: 'auth' })
export const bootstrapConvention = convention.with({ domain: 'bootstrap' })
export const todoConvention = convention.with({ domain: 'todo' })

// SSM param path shared between platform (writer) and todo-backend (reader)
export const PLATFORM_SSM_PARAM = platformConvention.name({ type: 'ssmParam' })

