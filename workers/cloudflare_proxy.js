/*
Cloudflare Worker proxy example
- Deploy this code to Cloudflare Workers (https://workers.cloudflare.com/)
- It forwards the target URL provided in the `url` query parameter and adds
  Access-Control-Allow-Origin: * so browsers can fetch cross-origin resources.

Usage:
1) Deploy the worker, e.g. you'll get a URL like https://my-proxy.example.workers.dev
2) From the client, request: https://my-proxy.example.workers.dev/?url=https%3A%2F%2Freadallcomics.com%2Fpage
   The worker will fetch the target and return the response.

Security notes:
- This example is intentionally minimal for testing. Consider adding:
  - origin checks (allowlist) to prevent abuse
  - caching
  - rate limiting
- Do NOT use a public proxy for sensitive data.
*/

addEventListener("fetch", (event) => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  const url = new URL(request.url);
  const target = url.searchParams.get("url");
  if (!target) {
    return new Response('Missing "url" query parameter', { status: 400 });
  }

  try {
    const res = await fetch(target, {
      headers: {
        // Forward User-Agent? Cloudflare sets its own. You can forward some headers here if needed.
      },
    });

    // clone response and add CORS headers
    const newHeaders = new Headers(res.headers);
    newHeaders.set("Access-Control-Allow-Origin", "*");
    newHeaders.set("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS");

    const body = await res.arrayBuffer();
    return new Response(body, {
      status: res.status,
      statusText: res.statusText,
      headers: newHeaders,
    });
  } catch (err) {
    return new Response("Fetch error: " + err.message, { status: 502 });
  }
}
