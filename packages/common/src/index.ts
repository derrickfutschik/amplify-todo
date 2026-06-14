import { DerropsConventions } from 'derrops-conventions'

export const TODO_APP_NAME = "amplify-todo";

export const convention = new DerropsConventions({ org: 'derrops', env, region })
    .domains({
        bootstrap: ['setup'] as const,
        platform: ['auth'] as const,
        app: ['function'] as const,
    })

