const DEFAULT_ORIGIN = 'https://xinbaopedia.vercel.app';

const HOP_BY_HOP_HEADERS = [
  'Connection',
  'Keep-Alive',
  'Proxy-Authenticate',
  'Proxy-Authorization',
  'TE',
  'Trailer',
  'Transfer-Encoding',
  'Upgrade'
];

function originFromEnv(env) {
  const configured = typeof env.ORIGIN === 'string' ? env.ORIGIN.trim() : '';
  return new URL(configured || DEFAULT_ORIGIN);
}

function requestHasBody(request) {
  return request.method !== 'GET' && request.method !== 'HEAD';
}

function shouldCacheAtEdge(url, request) {
  if (request.method !== 'GET') return false;
  if (url.pathname.startsWith('/api/')) return false;
  return (
    url.pathname.startsWith('/_next/static/') ||
    /\.(?:avif|css|gif|ico|jpe?g|js|json|png|svg|txt|webp|woff2?)$/i.test(url.pathname)
  );
}

function cacheOptions(url, request) {
  if (!shouldCacheAtEdge(url, request)) {
    return { cacheTtl: 0 };
  }

  return {
    cacheEverything: true,
    cacheTtlByStatus: {
      '200-299': 60 * 60 * 24 * 7,
      404: 60,
      '500-599': 0
    }
  };
}

function upstreamUrlFor(request, origin) {
  const url = new URL(request.url);
  const upstream = new URL(origin);
  upstream.pathname = url.pathname;
  upstream.search = url.search;
  return upstream;
}

function upstreamRequestFor(request, upstreamUrl) {
  const headers = new Headers(request.headers);
  headers.delete('host');
  headers.set('X-Forwarded-Host', new URL(request.url).host);
  headers.set('X-Forwarded-Proto', 'https');

  return new Request(upstreamUrl, {
    method: request.method,
    headers,
    body: requestHasBody(request) ? request.body : undefined,
    redirect: 'manual'
  });
}

function rewriteLocationHeader(headers, request, origin) {
  const location = headers.get('Location');
  if (!location) return;

  const edge = new URL(request.url);
  const originPrefix = origin.origin;
  if (location.startsWith(originPrefix)) {
    headers.set('Location', `${edge.origin}${location.slice(originPrefix.length)}`);
  }
}

function responseFor(upstreamResponse, request, origin) {
  const headers = new Headers(upstreamResponse.headers);
  for (const header of HOP_BY_HOP_HEADERS) {
    headers.delete(header);
  }
  rewriteLocationHeader(headers, request, origin);
  headers.set('X-Xinbaopedia-Edge', 'cloudflare');

  return new Response(upstreamResponse.body, {
    status: upstreamResponse.status,
    statusText: upstreamResponse.statusText,
    headers
  });
}

export default {
  async fetch(request, env) {
    const origin = originFromEnv(env);
    const upstreamUrl = upstreamUrlFor(request, origin);
    const upstreamRequest = upstreamRequestFor(request, upstreamUrl);
    const upstreamResponse = await fetch(upstreamRequest, {
      cf: cacheOptions(new URL(request.url), request)
    });

    return responseFor(upstreamResponse, request, origin);
  }
};
