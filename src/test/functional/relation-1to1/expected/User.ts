import { z } from 'zod';
import { CompleteKeychainInput, CompleteKeychainOutput, RelatedKeychainModel } from './index';

export const UserModel = z.object({
  id: z.string(),
});

export interface CompleteUserInput extends z.input<typeof UserModel> {
  keychain?: CompleteKeychainInput | null;
}

export interface CompleteUserOutput extends z.infer<typeof UserModel> {
  keychain?: CompleteKeychainOutput | null;
}

/**
 * RelatedUserModel contains all relations on your model in addition to the scalars
 *
 * NOTE: Lazy required in case of potential circular dependencies within schema
 */
export const RelatedUserModel: z.ZodSchema<CompleteUserOutput, z.ZodTypeDef, CompleteUserInput> =
  z.lazy(() =>
    UserModel.extend({
      keychain: RelatedKeychainModel.nullish(),
    })
  );
