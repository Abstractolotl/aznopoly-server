/**
 * Handles health endpoints.
 *
 * @param {string[]} routes - The array of routes to handle.
 * @return {undefined | Response} - The response object or undefined if no routes are provided.
 */
export function handleHealthEndpoints(routes: string[]): undefined | Response  {
    if(routes.length < 3) {
        return new Response(JSON.stringify({message: 'Page not found'}), {status: 404});
    }

    // Only allow readiness/liveness as endpoints
    if(routes[2].toLowerCase() === 'readiness' || routes[2].toLowerCase() === 'liveness') {
        let body = {state: 'unknown'}
        return new Response(JSON.stringify(body), {status: 200});
    }

    return new Response(JSON.stringify({message: 'Page not found'}), {status: 404});
}