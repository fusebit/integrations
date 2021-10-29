import Asana from 'asana';

type FusebitAsanaClient = Omit<Asana.Client, 'webhooks'> & {
  webhooks: Asana.Client['webhooks'] & {
    fusebitCreate?: (
      resource: string | number,
      data: any,
      dispatchOptions?: any
    ) => Promise<Asana.resources.Webhooks.Type>;
  };
  fusebit?: any;
};
