addEventListener("fetch", (event) => {
  event.respondWith(
    handleRequest(event.request).catch(
      (err) => new Response(err.stack, { status: 500 })
    )
  );
});

/**
 * @param {Request} request
 * @returns {Promise<Response>}
 */
async function handleAdmin(request, userEmail) {
  const { host, pathname, searchParams } = new URL(request.url);

  if (pathname.startsWith('/admin/list')) {
    const cursor = searchParams.get('cursor');
    return new Response(JSON.stringify(await URLS.list({ cursor })))
  }
  if (request.method === "PUT" && pathname.startsWith('/admin/put')) {
    try {
      const content = await request.json();
      if (content.key && content.value) {
        const key = `${host}/${content.key}`;
        if (await URLS.get(key)) {
          return new Response("Key already exists", { status: 409 });
        }
        await URLS.put(key, JSON.stringify({ url: content.value, created_by: userEmail }), { metadata: { url: content.value } });
        return new Response("OK");
      }
      return new Response("Bad request", { status: 403 });
    } catch {
      return new Response("Bad JSON", { status: 403 });
    }
  }
}

/**
 * Many more examples available at:
 *   https://developers.cloudflare.com/workers/examples
 * @param {Request} request
 * @returns {Promise<Response>}
 */
async function handleRequest(request) {
  const { host, pathname } = new URL(request.url);

  const userEmail = request.headers.get('cf-access-authenticated-user-email');

  if (pathname.startsWith('/admin/')) {
    return handleAdmin(request, userEmail);
  }

  console.debug(`Connecting user: ${request.headers.get('cf-access-authenticated-user-email')}`);

  const key = `${host}${pathname}`;
  console.debug(`Looking up key ${key}`);
  const value = await URLS.get(key, { type: "json" });

  if (value === null || !value.url) {
    return new Response("Short link not found", { status: 404 });
  }

  return new Response("Redirecting...", { status: 302, headers: { location: value.url } });
}
