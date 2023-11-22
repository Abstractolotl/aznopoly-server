export function handleHealthEndpoints(routes: string[]): undefined | Response  {
    let body = {state: 'unknown'}
    return new Response(JSON.stringify(body), {status: 200});
}