import { DerropsConventions } from 'derrops-conventions'
import type { ResourceType } from 'derrops-conventions'
import { DerropsStack } from './derrops-stack'

const env = 'prod'
const region = 'ap-southeast-2'

export const convention = new DerropsConventions({ org: 'derrops', env, region })
  .arnContext({ accountId: process.env.AWS_ACCOUNT_ID! })
  .tagPrefix('derrops:')
  .tagKeys('org', 'domain', 'service')
  .domains({
    bootstrap: ['amplify'] as const,
    platform: ['auth'] as const,
    todo: ['backend', 'frontend'] as const,
  })

export type Convention = typeof convention

// SSM param path shared between platform (writer) and todo-backend (reader)
export const PLATFORM_SSM_PARAM = convention.with({ domain: 'bootstrap', service: 'amplify' }).name({ type: 'ssmParam' })

export { DerropsStack }
export type { ResourceType }