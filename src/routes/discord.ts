export async function handleDiscordAuthentication(request: Request): Promise<Response> {
    if (request.headers.get('content-type') !== 'application/json') {
        return new Response(JSON.stringify({ message: 'Invalid content-type' }), { status: 400 })
    }

    let body = await request.json();
    if (!body?.code) {
        return new Response(JSON.stringify({ message: 'No code provided' }), { status: 400 })
    }

    const response = await fetch('https://discord.com/api/oauth2/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
            client_id: process.env.DISCORD_CLIENT_ID ?? '',
            client_secret: process.env.DISCORD_CLIENT_SECRET ?? '',
            grant_type: 'authorization_code',
            code: body?.code,
        })
    })

    const { access_token } = (await response.json()) as { access_token: string }

    return new Response(JSON.stringify(access_token), { status: 200 })
}