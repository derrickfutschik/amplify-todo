import { a, defineData, type ClientSchema } from '@aws-amplify/backend';

// Feature resource: data model is owned by each feature branch.
// Add, remove, or modify models here without affecting platform auth.
const schema = a.schema({
  Todo: a
    .model({
      content: a.string().required(),
      done: a.boolean().default(false),
      priority: a.enum(['low', 'medium', 'high']),
    })
    .authorization((allow) => [allow.owner()]),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'userPool',
  },
});
