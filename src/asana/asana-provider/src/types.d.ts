import Asana from 'asana';
import Bluebird from 'bluebird';

type FusebitAsanaClient = Omit<Asana.Client, 'webhooks'> & {
  webhooks: Asana.Client['webhooks'] & {
    fusebitCreate?: (
      resource: string | number,
      data: any,
      dispatchOptions?: any,
    ) => Bluebird<Asana.resources.Webhooks.Type>;
  };
  fusebit?: any;
};