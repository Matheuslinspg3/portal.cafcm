import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.115.0";

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });

function unavailable(status = 404) {
  return new Response(`<!doctype html><html lang="pt-BR"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Link indisponível</title><body style="font-family:system-ui;max-width:38rem;margin:12vh auto;padding:1.5rem;color:#18212f"><h1>Este link não está mais disponível.</h1><p>Confirme se você recebeu o endereço correto ou entre em contato com a CAFCM.</p></body></html>`, { status, headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" } });
}

function tokenFrom(request: Request) {
  const token = new URL(request.url).pathname.split("/").filter(Boolean).pop() ?? "";
  return /^[A-Za-z0-9_-]{12,128}$/.test(token) ? token : null;
}

Deno.serve(async (request) => {
  if (request.method !== "GET" && request.method !== "HEAD") return unavailable(405);
  const token = tokenFrom(request);
  if (!token || !supabaseUrl || !serviceRoleKey) return unavailable();

  const { data: recipient } = await admin.from("tracked_link_recipients").select("id,tracked_link_id").eq("tracking_token", token).maybeSingle();
  const linkQuery = admin.from("tracked_links").select("id,destination_url,is_active,expires_at");
  const { data: link } = recipient
    ? await linkQuery.eq("id", recipient.tracked_link_id).maybeSingle()
    : await linkQuery.eq("token", token).maybeSingle();
  if (!link || !link.is_active || (link.expires_at && new Date(link.expires_at).getTime() <= Date.now())) return unavailable();

  let destination: URL;
  try { destination = new URL(link.destination_url); } catch { return unavailable(); }
  if (!/^https?:$/.test(destination.protocol)) return unavailable();

  if (request.method === "GET") {
    const referrer = request.headers.get("referer") || "";
    let referrerOrigin: string | null = null;
    try { referrerOrigin = referrer ? new URL(referrer).origin : null; } catch { /* keep null */ }
    const event = admin.from("tracked_link_events").insert({
      tracked_link_id: link.id,
      tracked_link_recipient_id: recipient?.id ?? null,
      user_agent: (request.headers.get("user-agent") || "").slice(0, 400) || null,
      referrer_origin: referrerOrigin,
    });
    // Analytics is best-effort: never delay or block the destination redirect.
    (globalThis as any).EdgeRuntime?.waitUntil?.(event.then(() => undefined).catch(() => undefined));
  }
  return Response.redirect(destination.toString(), 302);
});
