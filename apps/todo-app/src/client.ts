import { generateClient } from 'aws-amplify/data';
import type { Schema } from '@feature-backend/amplify/data/resource';

export const client = generateClient<Schema>();
export type { Schema };
export type TodoItem = Schema['Todo']['type'];
