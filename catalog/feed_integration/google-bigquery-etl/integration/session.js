const superagent = require('superagent');

// Get this session
const getSession = async (ctx, sessionId) =>
  (
    await superagent
      .get(`${ctx.state.params.baseUrl}/session/${sessionId}`)
      .set('Authorization', `Bearer ${ctx.state.params.functionAccessToken}`)
  ).body;

const getPriorSession = async (ctx, sessionId, priorForm) => {
  const session = await getSession(ctx, sessionId);

  // Get the project session
  return (
    await superagent
      .get(`${ctx.state.params.baseUrl}/session/${session.dependsOn[priorForm].entityId}`)
      .set('Authorization', `Bearer ${ctx.state.params.functionAccessToken}`)
  ).body;
};

module.exports = {
  getSession,
  getPriorSession,
};
