export const proxyEnvKeys = [
  'http_proxy',
  'https_proxy',
  'HTTP_PROXY',
  'HTTPS_PROXY',
  'all_proxy',
  'ALL_PROXY',
];

export function withoutProxyEnv(source = process.env) {
  const env = { ...source };
  for (const key of [...proxyEnvKeys, 'NODE_TLS_REJECT_UNAUTHORIZED']) {
    delete env[key];
  }
  return env;
}

export function withConfiguredProxy(baseEnv, source = process.env) {
  const env = { ...baseEnv };
  for (const key of proxyEnvKeys) {
    if (source[key]) env[key] = source[key];
  }
  return env;
}

export function stagedSmokeRoutes(baseEnv, source = process.env, requestedMode = source.STAGED_SMOKE_ROUTE || 'auto') {
  if (!['auto', 'direct', 'proxy'].includes(requestedMode)) {
    throw new Error(`unsupported STAGED_SMOKE_ROUTE=${requestedMode}; expected auto, direct, or proxy`);
  }

  const direct = { env: withoutProxyEnv(baseEnv), name: 'direct' };
  const hasProxy = proxyEnvKeys.some((key) => Boolean(source[key]));
  const proxy = hasProxy ? { env: withConfiguredProxy(direct.env, source), name: 'proxy' } : null;

  if (requestedMode === 'direct') return [direct];
  if (requestedMode === 'proxy') {
    if (!proxy) throw new Error('STAGED_SMOKE_ROUTE=proxy requested but no proxy is configured');
    return [proxy];
  }
  return proxy ? [direct, proxy] : [direct];
}

export function preferStagedSmokeRoute(routes, preferredRouteName) {
  if (!preferredRouteName) return routes;
  const preferredRoute = routes.find((route) => route.name === preferredRouteName);
  if (!preferredRoute) return routes;
  return [preferredRoute, ...routes.filter((route) => route !== preferredRoute)];
}

export function stagedSmokeRequestBudget(route, routeCount) {
  const hasDistinctFallback = route.name === 'direct' && routeCount > 1;
  return hasDistinctFallback
    ? { curlSeconds: 10, parentMs: 20_000 }
    : { curlSeconds: 30, parentMs: 45_000 };
}
