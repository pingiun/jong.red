addEventListener("fetch", (event) => {
  event.respondWith(
    handleRequest(event.request).catch(
      (err) => new Response(err.stack, { status: 500 })
    )
  );
});

/**
 * Many more examples available at:
 *   https://developers.cloudflare.com/workers/examples
 * @param {Request} request
 * @returns {Promise<Response>}
 */
async function handleRequest(request) {
  const { host, pathname } = new URL(request.url);

  console.debug(`Connecting user: ${request.headers.get('cf-access-authenticated-user-email')}`);

  const key = `${host}${pathname}`;
  console.debug(`Looking up key ${key}`);
  const value = await URLS.get(key, { type: "json" });

  if (value === null || !value.url) {
    return new Response("Short link not found", { status: 404 });
  }

  return new Response("Redirecting...", { status: 302, headers: { location: value.url } });
}
