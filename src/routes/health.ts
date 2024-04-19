/**
 * Handles health endpoints.
 *
 * @param {string} pathname - The path of the request.
 * @return {undefined | Response} - The response object or undefined if no routes are provided.
 */
export function handleHealthEndpoints(pathname: string): undefined | Response  {
    if (pathname === '/health/liveness' || pathname === '/health/readiness') {
        let body = {state: 'unknown'}
        return new Response(JSON.stringify(body), {status: 200});
    }

    return new Response(JSON.stringify({message: 'Page not found'}), {status: 404});
}