import Joi from 'joi';

import { FusebitContext, Next } from '../router';

/**
 * Specify a Joi schema for each of the parts of the request that requires validation.
 *
 * The 'body' can be used for the payload of the request, the 'query' for any query parameters, and 'params'
 * for any parameters specified through url path elements.
 */
export interface IValidationOptions {
  body?: Joi.Schema;
  query?: Joi.Schema;
  params?: Joi.Schema;
}
export const validate = (options: IValidationOptions) => {
  return async (ctx: FusebitContext, next: Next) => {
    const errors: { location: string; details: Joi.ValidationError[] }[] = [];
    try {
      if (options.body) {
        Joi.attempt(ctx.req.body, options.body);
      }
    } catch (err) {
      errors.push({ location: 'body', details: (err as any).details });
    }

    try {
      if (options.query) {
        Joi.attempt(ctx.query, options.query);
      }
    } catch (err) {
      errors.push({ location: 'query', details: (err as any).details });
    }

    try {
      if (options.params) {
        Joi.attempt(ctx.params, options.params);
      }
    } catch (err) {
      errors.push({ location: 'params', details: (err as any).details });
    }

    if (errors.length > 0) {
      ctx.throw(400, 'Validation failure', { details: errors });
    }

    return next();
  };
};

/**
 * The Joi module to use when specifying the validation criteria.
 * @private
 */
validate.joi = Joi;
