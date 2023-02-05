import { z } from 'zod';
import { CompleteUserInput, CompleteUserOutput, RelatedUserModel } from './index';

export const KeychainModel = z.object({
  userID: z.string(),
});

export interface CompleteKeychainInput extends z.input<typeof KeychainModel> {
  owner: CompleteUserInput;
}

export interface CompleteKeychainOutput extends z.infer<typeof KeychainModel> {
  owner: CompleteUserOutput;
}

/**
 * RelatedKeychainModel contains all relations on your model in addition to the scalars
 *
 * NOTE: Lazy required in case of potential circular dependencies within schema
 */
export const RelatedKeychainModel: z.ZodSchema<
  CompleteKeychainOutput,
  z.ZodTypeDef,
  CompleteKeychainInput
> = z.lazy(() =>
  KeychainModel.extend({
    owner: RelatedUserModel,
  })
);
