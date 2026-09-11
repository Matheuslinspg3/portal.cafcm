import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createSupabaseContext } from "npm:@supabase/server@1.5.3";
import { PDFDocument, StandardFonts, rgb } from "npm:pdf-lib@1.17.1";

const DEFAULT_SITE_ORIGIN = "https://portal.cafcm.org.br";
const ALLOWED_DEPARTMENTS = new Set(["management", "personnel", "finance"]);

function normalizeOrigin(value: string) {
  try { return new URL(value).origin; } catch { return null; }
}

const CONFIGURED_SITE_ORIGINS = new Set(
  [DEFAULT_SITE_ORIGIN, ...(Deno.env.get("PORTAL_SITE_ORIGINS") ?? "").split(",")]
    .map((value) => normalizeOrigin(value.trim()))
    .filter((value): value is string => Boolean(value)),
);

function siteOrigin(req: Request) {
  const origin = normalizeOrigin(req.headers.get("origin") ?? "");
  if (origin && CONFIGURED_SITE_ORIGINS.has(origin)) return origin;
  if (origin) {
    const url = new URL(origin);
    if (url.protocol === "https:" && url.hostname.endsWith(".vercel.app")) return origin;
    if (["localhost", "127.0.0.1"].includes(url.hostname)) return origin;
  }
  return DEFAULT_SITE_ORIGIN;
}

function headers(req: Request) {
  return {
    "Access-Control-Allow-Origin": siteOrigin(req),
    "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Max-Age": "86400",
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "Vary": "Origin",
  };
}

function json(req: Request, body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: headers(req) });
}

function text(value: unknown, max = 12000) {
  return String(value ?? "").trim().slice(0, max);
}

function emailIsValid(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

async function requireOperator(req: Request) {
  const { data: ctx, error } = await createSupabaseContext(req, { auth: "user" });
  if (error || !ctx) return { response: json(req, { error: "Sua sessão expirou. Entre novamente." }, 401) };
  const userId = String(ctx.userClaims?.id ?? ctx.jwtClaims?.sub ?? "");
  const { data: profile, error: profileError } = await ctx.supabaseAdmin
    .from("profiles")
    .select("role,department,is_active")
    .eq("id", userId)
    .single();
  if (profileError || profile?.role !== "cafcm_admin" || !profile?.is_active) {
    return { response: json(req, { error: "Este acesso da equipe CAFCM não está ativo." }, 403) };
  }
  if (!ALLOWED_DEPARTMENTS.has(String(profile.department || "management"))) {
    return { response: json(req, { error: "Seu departamento não possui permissão para esta operação." }, 403) };
  }
  return { ctx, userId, department: String(profile.department || "management") };
}

function replaceTokens(template: string, values: Record<string, string>) {
  return template.replace(/\{\{([a-z0-9_]+)\}\}/gi, (_match, key) => values[key] || "Não informado");
}

function pdfSafe(value: string) {
  return value
    .replace(/[–—]/g, "-")
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/•/g, "-")
    .replace(/\u00a0/g, " ");
}

function wrapText(value: string, font: any, size: number, width: number) {
  const lines: string[] = [];
  for (const paragraph of pdfSafe(value).split(/\r?\n/)) {
    if (!paragraph.trim()) { lines.push(""); continue; }
    let current = "";
    for (const word of paragraph.split(/\s+/)) {
      const next = current ? `${current} ${word}` : word;
      if (font.widthOfTextAtSize(next, size) <= width) current = next;
      else {
        if (current) lines.push(current);
        current = word;
      }
    }
    if (current) lines.push(current);
  }
  return lines;
}

async function makePdf(title: string, body: string, protocol: string) {
  const document = await PDFDocument.create();
  const regular = await document.embedFont(StandardFonts.Helvetica);
  const bold = await document.embedFont(StandardFonts.HelveticaBold);
  const pageSize: [number, number] = [595.28, 841.89];
  const margin = 58;
  let page = document.addPage(pageSize);
  let y = pageSize[1] - 58;

  const drawHeader = () => {
    page.drawText("CAFCM", { x: margin, y, size: 18, font: bold, color: rgb(0.03, 0.29, 0.70) });
    page.drawText("Portal de aprendizagem profissional", { x: margin, y: y - 18, size: 9, font: regular, color: rgb(0.35, 0.40, 0.48) });
    page.drawLine({ start: { x: margin, y: y - 31 }, end: { x: pageSize[0] - margin, y: y - 31 }, thickness: 1, color: rgb(0.84, 0.88, 0.93) });
    y -= 64;
  };
  const newPage = () => { page = document.addPage(pageSize); y = pageSize[1] - 58; drawHeader(); };
  drawHeader();

  for (const line of wrapText(title, bold, 15, pageSize[0] - margin * 2)) {
    page.drawText(line, { x: margin, y, size: 15, font: bold, color: rgb(0.06, 0.12, 0.23) });
    y -= 20;
  }
  y -= 16;
  for (const line of wrapText(body, regular, 11, pageSize[0] - margin * 2)) {
    if (y < 88) newPage();
    if (line) page.drawText(line, { x: margin, y, size: 11, font: regular, color: rgb(0.12, 0.16, 0.23) });
    y -= line ? 17 : 10;
  }

  for (const currentPage of document.getPages()) {
    currentPage.drawLine({ start: { x: margin, y: 55 }, end: { x: pageSize[0] - margin, y: 55 }, thickness: 0.7, color: rgb(0.87, 0.90, 0.94) });
    currentPage.drawText(`Protocolo ${protocol} · Documento gerado para revisão interna`, { x: margin, y: 37, size: 8, font: regular, color: rgb(0.42, 0.47, 0.55) });
  }
  return document.save();
}

async function generateDocument(req: Request, input: Record<string, unknown>, operator: any) {
  const templateId = text(input.templateId, 80);
  const apprenticeId = text(input.apprenticeId, 80) || null;
  let companyId = text(input.companyId, 80) || null;
  if (!templateId || (!apprenticeId && !companyId)) return json(req, { error: "Selecione o modelo e vincule um jovem ou uma empresa." }, 400);

  const admin = operator.ctx.supabaseAdmin;
  const { data: template, error: templateError } = await admin.from("document_templates").select("*").eq("id", templateId).eq("is_active", true).single();
  if (templateError || !template) return json(req, { error: "O modelo selecionado não está disponível." }, 404);

  let apprenticeName = "";
  if (apprenticeId) {
    const { data: apprentice, error } = await admin.from("profiles").select("full_name,company_id,role,is_active").eq("id", apprenticeId).single();
    if (error || apprentice?.role !== "apprentice" || !apprentice?.is_active) return json(req, { error: "O jovem selecionado não está disponível." }, 400);
    apprenticeName = text(apprentice.full_name, 160);
    companyId ||= apprentice.company_id;
  }
  let companyName = "";
  if (companyId) {
    const { data: company, error } = await admin.from("companies").select("name").eq("id", companyId).single();
    if (error || !company) return json(req, { error: "A empresa selecionada não foi encontrada." }, 400);
    companyName = text(company.name, 200);
  }

  const fields = (input.fields && typeof input.fields === "object" ? input.fields : {}) as Record<string, unknown>;
  const values: Record<string, string> = {
    jovem: apprenticeName,
    empresa: companyName,
    periodo: text(fields.periodo, 300),
    documentos: text(fields.documentos, 2000),
    prazo: text(fields.prazo, 120),
    observacoes: text(fields.observacoes, 4000),
    competencia: text(fields.competencia, 120),
    descricao: text(fields.descricao, 1000),
    valor: text(fields.valor, 120),
  };
  const title = replaceTokens(template.title_template, values);
  const body = replaceTokens(template.body_template, values);
  const generationId = crypto.randomUUID();
  const protocol = `CAFCM-${new Date().toISOString().slice(0, 10).replaceAll("-", "")}-${generationId.slice(0, 8).toUpperCase()}`;
  const bytes = await makePdf(title, body, protocol);
  const path = `generated/${new Date().getUTCFullYear()}/${generationId}.pdf`;
  const { error: uploadError } = await admin.storage.from("cafcm-documents").upload(path, bytes, { contentType: "application/pdf", upsert: false });
  if (uploadError) return json(req, { error: "Não foi possível guardar o PDF gerado." }, 500);

  const category = template.category === "receipt" ? "receipt" : "documents";
  const { data: record, error: recordError } = await admin.from("document_records").insert({
    apprentice_id: apprenticeId,
    company_id: companyId,
    category,
    title,
    storage_path: path,
    mime_type: "application/pdf",
    file_size: bytes.byteLength,
    is_generated: true,
    uploaded_by: operator.userId,
    notes: `Protocolo ${protocol}. Aguardando revisão interna.`,
  }).select("id").single();
  if (recordError || !record) {
    await admin.storage.from("cafcm-documents").remove([path]);
    return json(req, { error: "O PDF foi criado, mas o registro não pôde ser salvo." }, 500);
  }

  const { count } = await admin.from("document_generations").select("id", { count: "exact", head: true }).eq("template_id", templateId).eq("apprentice_id", apprenticeId).eq("company_id", companyId);
  const { data: generation, error: generationError } = await admin.from("document_generations").insert({
    id: generationId,
    template_id: templateId,
    document_id: record.id,
    apprentice_id: apprenticeId,
    company_id: companyId,
    version: Number(count || 0) + 1,
    title,
    status: "draft",
    payload: { ...values, protocol },
    notes: text(input.notes, 12000),
    generated_by: operator.userId,
  }).select("id,status,version,document_id").single();
  if (generationError || !generation) return json(req, { error: "O documento foi guardado, mas a revisão não pôde ser criada." }, 500);
  return json(req, { ok: true, generation });
}

function bytesToBase64(bytes: Uint8Array) {
  let binary = "";
  const chunk = 0x8000;
  for (let index = 0; index < bytes.length; index += chunk) binary += String.fromCharCode(...bytes.subarray(index, index + chunk));
  return btoa(binary);
}

async function sendEmail(req: Request, input: Record<string, unknown>, operator: any) {
  const deliveryId = text(input.deliveryId, 80);
  if (!deliveryId) return json(req, { error: "Selecione o e-mail que será enviado." }, 400);
  const apiKey = Deno.env.get("RESEND_API_KEY") ?? "";
  const from = Deno.env.get("PORTAL_EMAIL_FROM") ?? "";
  if (!apiKey || !from) return json(req, { error: "O envio transacional ainda não está habilitado. Configure RESEND_API_KEY e PORTAL_EMAIL_FROM nos segredos da função." }, 503);

  const admin = operator.ctx.supabaseAdmin;
  const { data: delivery, error } = await admin.from("email_deliveries").select("*").eq("id", deliveryId).single();
  if (error || !delivery) return json(req, { error: "O e-mail selecionado não foi encontrado." }, 404);
  if (!["draft", "approved", "failed"].includes(delivery.status)) return json(req, { error: "Este e-mail não está disponível para envio." }, 409);
  if (!emailIsValid(delivery.recipient_email)) return json(req, { error: "O destinatário informado é inválido." }, 400);

  const payload: Record<string, unknown> = {
    from,
    to: [delivery.recipient_email],
    subject: delivery.subject,
    html: `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#172033;white-space:pre-line">${delivery.body.replace(/[&<>]/g, (character: string) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[character] || character)}</div>`,
  };
  if (delivery.attachment_document_id) {
    const { data: document } = await admin.from("document_records").select("title,storage_path,mime_type,file_size").eq("id", delivery.attachment_document_id).single();
    if (document?.storage_path && Number(document.file_size || 0) <= 8 * 1024 * 1024) {
      const { data: file } = await admin.storage.from("cafcm-documents").download(document.storage_path);
      if (file) payload.attachments = [{ filename: `${text(document.title, 180) || "documento"}.pdf`, content: bytesToBase64(new Uint8Array(await file.arrayBuffer())) }];
    }
  }

  await admin.from("email_deliveries").update({ status: "sending", approved_by: operator.userId, approved_at: new Date().toISOString(), last_attempt_at: new Date().toISOString(), attempt_count: Number(delivery.attempt_count || 0) + 1, error_message: null }).eq("id", delivery.id);
  const response = await fetch("https://api.resend.com/emails", { method: "POST", headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" }, body: JSON.stringify(payload) });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    await admin.from("email_deliveries").update({ status: "failed", error_message: text((result as any)?.message || "O provedor recusou o envio.", 2000) }).eq("id", delivery.id);
    return json(req, { error: "O provedor não concluiu o envio. Confira o domínio remetente e tente novamente." }, 502);
  }
  await admin.from("email_deliveries").update({ status: "sent", provider_message_id: text((result as any)?.id, 240) || null, sent_at: new Date().toISOString(), error_message: null }).eq("id", delivery.id);
  return json(req, { ok: true, providerMessageId: (result as any)?.id || null });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: headers(req) });
  if (req.method !== "POST") return json(req, { error: "Método não permitido." }, 405);
  try {
    const operator = await requireOperator(req);
    if (operator.response) return operator.response;
    const input = await req.json() as Record<string, unknown>;
    const action = text(input.action, 40);
    if (action === "generate_document") return await generateDocument(req, input, operator);
    if (action === "send_email") return await sendEmail(req, input, operator);
    return json(req, { error: "Ação inválida." }, 400);
  } catch (error) {
    console.error("portal-automation", { message: error instanceof Error ? error.message : "unknown" });
    return json(req, { error: "Não foi possível concluir a operação." }, 500);
  }
});
