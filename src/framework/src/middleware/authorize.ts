import { FusebitContext, Next } from '../router';

interface IAccessEntry {
  resource: string;
  action: string;
}

const normalizeResource = (resource: string) => {
  const delimiter = '/';
  const rootSlash = resource[0] === delimiter ? '' : delimiter;
  const endingSlash = resource[resource.length - 1] === delimiter ? '' : delimiter;
  return `${rootSlash}${resource}${endingSlash}`;
};

function doesResourceAuthorize(grantedResource: string, requestedResource: string) {
  return requestedResource.indexOf(grantedResource) === 0;
}

function doesActionAuthorize(grantedAction: string, requestedAction: string) {
  if (grantedAction === requestedAction) {
    return true;
  }

  const grantedSegments = grantedAction.split(':');
  const requestedSegments = requestedAction.split(':');

  for (let i = 0; i < requestedSegments.length; i++) {
    if (grantedSegments[i]) {
      if (grantedSegments[i] === '*') {
        return true;
      } else if (grantedSegments[i] === requestedSegments[i]) {
        // ok, continue to check the next segment
      } else {
        return false;
      }
    } else {
      return false;
    }
  }
  return false;
}

function doesAccessEntryAuthorize(accessEntry: IAccessEntry, action: string, resource: string) {
  const actionAuth = doesActionAuthorize(accessEntry.action, action);
  const resourceAuth = doesResourceAuthorize(normalizeResource(accessEntry.resource), resource);
  return actionAuth && resourceAuth;
}

export const authorize = (action = 'instance:get') => {
  return async (ctx: FusebitContext, next: Next) => {
    const resource = normalizeResource(ctx.state.params.resourcePath);
    const allowEntries = ctx.state.fusebit?.caller?.permissions?.allow || [];

    for (const allow of allowEntries) {
      if (doesAccessEntryAuthorize(allow, action, resource)) {
        return next();
      }
    }
    return ctx.throw(403);
  };
};
