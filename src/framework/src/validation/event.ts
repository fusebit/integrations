import Joi from 'joi';

export const schema = {
  params: Joi.object({ eventMode: Joi.string().not('lifecycle').required() }),
  body: Joi.object({
    payload: Joi.array()
      .items(
        Joi.object({
          data: Joi.any().required(),
          eventType: Joi.string().required(),
          entityId: Joi.string().required(),
          webhookEventId: Joi.string().required(),
          webhookAuthId: Joi.string().required(),
        })
          .unknown(false)
          .required()
      )
      .required()
      .min(1)
      .unique((a, b) => a.entityId !== b.entityId)
      .message('All events must come from the same source'),
  }),
};
