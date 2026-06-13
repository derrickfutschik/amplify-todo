import { defineAuth } from '@aws-amplify/backend';

// Platform resource: deployed once from the main/release branch.
// All feature branches consume this auth definition — do not add
// feature-specific configuration here.
export const auth = defineAuth({
  loginWith: {
    email: true,
  },
});
