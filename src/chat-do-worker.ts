/**
 * Standalone Worker that hosts ChatConversationRoom for Cloudflare Pages.
 * Pages cannot register DO classes on its own script — bind via script_name in wrangler.jsonc.
 */
export { ChatConversationRoom, UserNotificationRoom, BroadcastRoom } from './chat-module-api'

export default {
  fetch(): Response {
    return new Response('tamweel-chat-do: HTTP is served by Pages; this Worker only hosts Durable Objects.', {
      status: 404,
    })
  },
}
