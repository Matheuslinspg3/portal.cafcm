import { createSupabaseContext } from "npm:@supabase/server@1.5.3";

const DEFAULT_SITE_ORIGIN = "https://portal.cafcm.org.br";
const BOOTSTRAP_HASH = Deno.env.get("PORTAL_BOOTSTRAP_HASH") ?? "";
const ROLE_VALUES = new Set(["cafcm_admin", "apprentice", "company"]);

function normalizeOrigin(value: string) {
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

const CONFIGURED_SITE_ORIGINS = new Set(
  [DEFAULT_SITE_ORIGIN, ...(Deno.env.get("PORTAL_SITE_ORIGINS") ?? "").split(",")]
    .map((value) => normalizeOrigin(value.trim()))
    .filter((value): value is string => Boolean(value)),
);

function isAllowedSiteOrigin(value: string) {
  const origin = normalizeOrigin(value);
  if (!origin) return false;
  if (CONFIGURED_SITE_ORIGINS.has(origin)) return true;

  const url = new URL(origin);
  if (url.protocol === "https:" && url.hostname.endsWith(".vercel.app")) return true;
  return ["localhost", "127.0.0.1"].includes(url.hostname) && ["http:", "https:"].includes(url.protocol);
}

function siteOrigin(req: Request) {
  const requestOrigin = req.headers.get("origin") ?? "";
  return isAllowedSiteOrigin(requestOrigin) ? new URL(requestOrigin).origin : DEFAULT_SITE_ORIGIN;
}

function corsHeaders(req: Request) {
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
  return new Response(JSON.stringify(body), { status, headers: corsHeaders(req) });
}

function cleanText(value: unknown, maxLength: number) {
  return String(value ?? "").trim().slice(0, maxLength);
}

function validEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function generateTemporaryPassword() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#%";
  const bytes = new Uint8Array(18);
  crypto.getRandomValues(bytes);
  let value = "Ca9!";
  for (const byte of bytes) value += alphabet[byte % alphabet.length];
  return value;
}

function authErrorResponse(req: Request, error: any, fallback: string) {
  const message = String(error?.message ?? "").toLowerCase();
  const code = String(error?.code ?? "").toLowerCase();

  if (message.includes("email address not authorized") || code.includes("email_address_not_authorized")) {
    return json(req, {
      error: "Este e-mail não está autorizado no envio padrão do Supabase. Configure um SMTP próprio para convidar jovens e empresas.",
      code: "smtp_email_not_authorized",
    }, 400);
  }

  if (message.includes("rate limit") || code.includes("rate_limit") || error?.status === 429) {
    return json(req, {
      error: "O limite temporário de envio de e-mails foi atingido. Aguarde antes de tentar novamente ou configure um SMTP próprio.",
      code: "email_rate_limit",
    }, 429);
  }

  if (message.includes("registered") || message.includes("already exists") || code.includes("user_already_exists") || code.includes("email_exists")) {
    return json(req, {
      error: "Já existe uma conta com este e-mail. Use a opção Alterar ou Reenviar acesso na lista de pessoas.",
      code: "email_already_registered",
    }, 409);
  }

  if (message.includes("invalid email") || code.includes("email_address_invalid")) {
    return json(req, { error: "O endereço de e-mail informado é inválido.", code: "invalid_email" }, 400);
  }

  console.error("portal-admin auth error", { code: error?.code, status: error?.status });
  return json(req, { error: fallback, code: "auth_operation_failed" }, 400);
}

function friendlyAuthError(error: any, fallback: string) {
  const message = String(error?.message ?? "").toLowerCase();
  const code = String(error?.code ?? "").toLowerCase();
  if (message.includes("email address not authorized") || code.includes("email_address_not_authorized")) {
    return { message: "E-mail não autorizado pelo envio padrão. Configure um SMTP próprio.", code: "smtp_email_not_authorized" };
  }
  if (message.includes("rate limit") || code.includes("rate_limit") || error?.status === 429) {
    return { message: "Limite temporário de envio de e-mails atingido.", code: "email_rate_limit" };
  }
  if (message.includes("registered") || message.includes("already exists") || code.includes("user_already_exists") || code.includes("email_exists")) {
    return { message: "Já existe uma conta com este e-mail.", code: "email_already_registered" };
  }
  if (message.includes("invalid email") || code.includes("email_address_invalid")) {
    return { message: "O endereço de e-mail é inválido.", code: "invalid_email" };
  }
  return { message: fallback, code: "auth_operation_failed" };
}

async function writeAudit(
  admin: any,
  actorId: string | null,
  action: string,
  entityType: string,
  entityId: string,
  details: Record<string, unknown> = {},
  subjectUserId: string | null = null,
) {
  const { error } = await admin.from("audit_logs").insert({
    actor_id: actorId,
    subject_user_id: subjectUserId,
    action,
    entity_type: entityType,
    entity_id: entityId,
    details,
  });
  if (error) console.error("portal-admin audit error", { action, code: error.code });
}

async function requireCafcmAdmin(req: Request) {
  const { data: ctx, error } = await createSupabaseContext(req, { auth: "user" });
  if (error || !ctx) return { response: json(req, { error: "Sua sessão expirou. Entre novamente." }, 401) };

  const requesterId = String(ctx.userClaims?.id ?? ctx.jwtClaims?.sub ?? "");
  const { data: requester, error: requesterError } = await ctx.supabaseAdmin
    .from("profiles")
    .select("role")
    .eq("id", requesterId)
    .single();

  if (requesterError || requester?.role !== "cafcm_admin") {
    return { response: json(req, { error: "Somente a equipe CAFCM pode gerenciar pessoas e convites." }, 403) };
  }

  return { ctx, requesterId };
}

async function listAllAuthUsers(admin: any) {
  const users: any[] = [];
  for (let page = 1; page <= 10; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;
    const batch = data?.users ?? [];
    users.push(...batch);
    if (batch.length < 1000) break;
  }
  return users;
}

async function findAuthUserByEmail(admin: any, email: string) {
  const users = await listAllAuthUsers(admin);
  return users.find((user) => String(user.email ?? "").toLowerCase() === email.toLowerCase()) ?? null;
}

async function validateCompanyLink(admin: any, role: string, companyId: string | null) {
  if (role === "company" && !companyId) return "Selecione a empresa vinculada a este acesso.";
  if (!companyId) return null;

  const { data: company, error } = await admin
    .from("companies")
    .select("id,is_active")
    .eq("id", companyId)
    .maybeSingle();

  if (error || !company) return "A empresa selecionada não foi encontrada.";
  if (!company.is_active) return "A empresa selecionada está inativa.";
  return null;
}

async function sha256(value: string) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function anonymousContext(req: Request) {
  return createSupabaseContext(req, { auth: "none" });
}

async function ensureBootstrapRow(admin: any) {
  const { data, error } = await admin
    .from("internal_settings")
    .select("key,value,claimed_at,claim_token,used_at")
    .eq("key", "bootstrap_hash")
    .maybeSingle();

  if (error) throw error;
  if (data) return data;

  if (!BOOTSTRAP_HASH) {
    throw new Error("PORTAL_BOOTSTRAP_HASH não foi configurado para esta implantação.");
  }

  const { data: created, error: createError } = await admin
    .from("internal_settings")
    .insert({ key: "bootstrap_hash", value: BOOTSTRAP_HASH })
    .select("key,value,claimed_at,claim_token,used_at")
    .single();

  if (createError && createError.code !== "23505") throw createError;
  if (created) return created;

  const { data: existing, error: existingError } = await admin
    .from("internal_settings")
    .select("key,value,claimed_at,claim_token,used_at")
    .eq("key", "bootstrap_hash")
    .single();

  if (existingError) throw existingError;
  return existing;
}

async function setupStatus(req: Request) {
  const { data: ctx, error } = await anonymousContext(req);
  if (error || !ctx) return json(req, { error: "Não foi possível consultar a configuração inicial." }, 500);

  const setting = await ensureBootstrapRow(ctx.supabaseAdmin);
  const { count, error: countError } = await ctx.supabaseAdmin
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("role", "cafcm_admin");

  if (countError) throw countError;
  return json(req, { setupRequired: (count ?? 0) === 0 && !setting.used_at });
}

async function bootstrapAdmin(req: Request, input: Record<string, unknown>) {
  const email = cleanText(input.email, 254).toLowerCase();
  const fullName = cleanText(input.fullName, 160);
  const password = String(input.password ?? "");
  const code = cleanText(input.code, 200);

  if (!validEmail(email) || fullName.length < 2 || password.length < 10 || code.length < 20) {
    return json(req, { error: "Preencha nome, e-mail, senha com 10 caracteres e a chave inicial." }, 400);
  }

  const { data: ctx, error } = await anonymousContext(req);
  if (error || !ctx) return json(req, { error: "Não foi possível iniciar a configuração." }, 500);
  const admin = ctx.supabaseAdmin;
  let setting = await ensureBootstrapRow(admin);

  const { count } = await admin
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("role", "cafcm_admin");

  if ((count ?? 0) > 0 || setting.used_at) {
    return json(req, { error: "O primeiro acesso da CAFCM já foi configurado." }, 409);
  }

  if ((await sha256(code)) !== setting.value) {
    return json(req, { error: "A chave inicial não confere." }, 403);
  }

  if (setting.claimed_at) {
    const stale = Date.now() - new Date(setting.claimed_at).getTime() > 10 * 60 * 1000;
    if (!stale) return json(req, { error: "A configuração inicial já está em andamento." }, 409);
    await admin
      .from("internal_settings")
      .update({ claimed_at: null, claim_token: null })
      .eq("key", "bootstrap_hash")
      .is("used_at", null);
    setting = await ensureBootstrapRow(admin);
  }

  const claimToken = crypto.randomUUID();
  const { data: claimed, error: claimError } = await admin
    .from("internal_settings")
    .update({ claimed_at: new Date().toISOString(), claim_token: claimToken })
    .eq("key", "bootstrap_hash")
    .is("claimed_at", null)
    .is("used_at", null)
    .select("key")
    .maybeSingle();

  if (claimError || !claimed) {
    return json(req, { error: "A configuração inicial já está em andamento." }, 409);
  }

  const { error: pendingError } = await admin.from("pending_invites").upsert({
    email,
    full_name: fullName,
    role: "cafcm_admin",
    company_id: null,
    created_by: null,
    created_at: new Date().toISOString(),
  }, { onConflict: "email" });

  if (pendingError) {
    await admin
      .from("internal_settings")
      .update({ claimed_at: null, claim_token: null })
      .eq("key", "bootstrap_hash")
      .eq("claim_token", claimToken)
      .is("used_at", null);
    return json(req, { error: "Não foi possível preparar o primeiro acesso." }, 500);
  }

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
    app_metadata: { portal_role: "cafcm_admin" },
  });

  if (createError || !created.user) {
    await admin.from("pending_invites").delete().eq("email", email);
    await admin
      .from("internal_settings")
      .update({ claimed_at: null, claim_token: null })
      .eq("key", "bootstrap_hash")
      .eq("claim_token", claimToken)
      .is("used_at", null);

    const message = createError?.message?.toLowerCase().includes("registered")
      ? "Este e-mail já possui uma conta. Use outro e-mail ou entre em contato com o suporte."
      : "Não foi possível criar o primeiro acesso.";
    return json(req, { error: message }, 400);
  }

  const userId = created.user.id;
  const { error: profileError } = await admin.from("profiles").upsert({
    id: userId,
    full_name: fullName,
    role: "cafcm_admin",
    company_id: null,
  });
  const { error: contactError } = await admin.from("profile_contacts").upsert({ id: userId, email });

  if (profileError || contactError) {
    await admin.auth.admin.deleteUser(userId);
    await admin.from("pending_invites").delete().eq("email", email);
    await admin
      .from("internal_settings")
      .update({ claimed_at: null, claim_token: null })
      .eq("key", "bootstrap_hash")
      .eq("claim_token", claimToken)
      .is("used_at", null);
    return json(req, { error: "Não foi possível concluir o cadastro inicial." }, 500);
  }

  await admin.from("pending_invites").delete().eq("email", email);

  await admin
    .from("internal_settings")
    .update({
      used_at: new Date().toISOString(),
      used_by: userId,
      claimed_at: null,
      claim_token: null,
    })
    .eq("key", "bootstrap_hash")
    .eq("claim_token", claimToken);

  return json(req, { ok: true });
}

async function provisionInvitedUser(
  req: Request,
  admin: any,
  requesterId: string,
  person: { email: string; fullName: string; role: string; companyId: string | null; password?: string },
) {
  const initialPassword = person.password || generateTemporaryPassword();
  const { error: pendingError } = await admin.from("pending_invites").upsert({
    email: person.email,
    full_name: person.fullName,
    role: person.role,
    company_id: person.companyId,
    created_by: requesterId,
    created_at: new Date().toISOString(),
  }, { onConflict: "email" });

  if (pendingError) throw new Error("Não foi possível preparar o convite.");

  const { data: invited, error: inviteError } = await admin.auth.admin.inviteUserByEmail(person.email, {
    data: { full_name: person.fullName },
    redirectTo: siteOrigin(req),
  });

  if (inviteError || !invited.user) {
    await admin.from("pending_invites").delete().eq("email", person.email);
    throw inviteError || new Error("Não foi possível criar o acesso.");
  }

  const appMetadata: Record<string, unknown> = { portal_role: person.role };
  if (person.companyId) appMetadata.company_id = person.companyId;

  const { error: updateError } = await admin.auth.admin.updateUserById(invited.user.id, {
    password: initialPassword,
    user_metadata: { full_name: person.fullName },
    app_metadata: appMetadata,
  });

  if (updateError) {
    await admin.auth.admin.deleteUser(invited.user.id);
    await admin.from("pending_invites").delete().eq("email", person.email);
    throw updateError;
  }

  const { error: profileError } = await admin.from("profiles").upsert({
    id: invited.user.id,
    full_name: person.fullName,
    role: person.role,
    company_id: person.companyId,
    is_active: true,
    archived_at: null,
    archived_by: null,
  });
  const { error: contactError } = await admin.from("profile_contacts").upsert({ id: invited.user.id, email: person.email });

  if (profileError || contactError) {
    await admin.auth.admin.deleteUser(invited.user.id);
    await admin.from("pending_invites").delete().eq("email", person.email);
    throw new Error("O perfil não pôde ser salvo.");
  }

  await admin.from("pending_invites").delete().eq("email", person.email);
  return { user: invited.user, temporaryPassword: initialPassword };
}

async function inviteUser(req: Request, input: Record<string, unknown>) {
  const access = await requireCafcmAdmin(req);
  if ("response" in access) return access.response;
  const { ctx, requesterId } = access;

  const email = cleanText(input.email, 254).toLowerCase();
  const fullName = cleanText(input.fullName, 160);
  const role = cleanText(input.role, 32);
  const suppliedCompanyId = cleanText(input.companyId, 36) || null;
  const companyId = role === "cafcm_admin" ? null : suppliedCompanyId;
  const requestedPassword = String(input.password ?? "");

  if (!validEmail(email) || fullName.length < 2 || !ROLE_VALUES.has(role)) {
    return json(req, { error: "Revise o nome, o e-mail e o tipo de acesso." }, 400);
  }

  if (requestedPassword && (requestedPassword.length < 10 || requestedPassword.length > 128)) {
    return json(req, { error: "A senha informada deve ter entre 10 e 128 caracteres." }, 400);
  }

  const companyError = await validateCompanyLink(ctx.supabaseAdmin, role, companyId);
  if (companyError) return json(req, { error: companyError }, 400);

  const existingUser = await findAuthUserByEmail(ctx.supabaseAdmin, email);
  if (existingUser) {
    return json(req, {
      error: "Já existe uma conta com este e-mail. Use a opção Alterar ou Reenviar acesso na lista de pessoas.",
      code: "email_already_registered",
    }, 409);
  }

  try {
    const result = await provisionInvitedUser(req, ctx.supabaseAdmin, requesterId, {
      email,
      fullName,
      role,
      companyId,
      password: requestedPassword || undefined,
    });
    await writeAudit(ctx.supabaseAdmin, requesterId, "user.invited", "profile", result.user.id, {
      email,
      role,
      company_id: companyId,
    }, result.user.id);
    return json(req, { ok: true, userId: result.user.id, temporaryPassword: result.temporaryPassword });
  } catch (error) {
    return authErrorResponse(req, error, "Não foi possível enviar o convite. Verifique o e-mail e tente novamente.");
  }
}

async function listPortalUsers(req: Request) {
  const access = await requireCafcmAdmin(req);
  if ("response" in access) return access.response;
  const { ctx } = access;

  const [authUsers, profileResult, contactResult] = await Promise.all([
    listAllAuthUsers(ctx.supabaseAdmin),
    ctx.supabaseAdmin.from("profiles").select("id,full_name,role,company_id,is_active,archived_at,archived_by,created_at"),
    ctx.supabaseAdmin.from("profile_contacts").select("id,email"),
  ]);

  if (profileResult.error || contactResult.error) {
    return json(req, { error: "Não foi possível carregar as pessoas cadastradas." }, 500);
  }

  const authMap = new Map(authUsers.map((user: any) => [user.id, user]));
  const contactMap = new Map((contactResult.data ?? []).map((contact: any) => [contact.id, contact.email]));
  const now = Date.now();
  const users = (profileResult.data ?? [])
    .map((profile: any) => {
      const authUser: any = authMap.get(profile.id);
      const role = profile?.role ?? authUser?.app_metadata?.portal_role ?? null;
      if (!ROLE_VALUES.has(role)) return null;
      const bannedUntil = authUser?.banned_until ?? null;
      const accessExists = Boolean(authUser);
      const banExpired = !bannedUntil || new Date(bannedUntil).getTime() <= now;
      return {
        id: profile.id,
        fullName: profile?.full_name || authUser?.user_metadata?.full_name || "",
        email: contactMap.get(profile.id) || authUser?.email || "",
        role,
        companyId: profile?.company_id ?? authUser?.app_metadata?.company_id ?? null,
        createdAt: authUser?.created_at ?? profile?.created_at ?? null,
        emailConfirmedAt: authUser?.email_confirmed_at ?? authUser?.confirmed_at ?? null,
        lastSignInAt: authUser?.last_sign_in_at ?? null,
        bannedUntil,
        accessExists,
        isActive: Boolean(profile.is_active && accessExists && banExpired),
        archivedAt: profile.archived_at ?? null,
      };
    })
    .filter(Boolean)
    .sort((a: any, b: any) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime());

  return json(req, { users });
}

async function updatePortalUser(req: Request, input: Record<string, unknown>) {
  const access = await requireCafcmAdmin(req);
  if ("response" in access) return access.response;
  const { ctx, requesterId } = access;

  const userId = cleanText(input.userId, 36);
  const fullName = cleanText(input.fullName, 160);
  const email = cleanText(input.email, 254).toLowerCase();
  const role = cleanText(input.role, 32);
  const suppliedCompanyId = cleanText(input.companyId, 36) || null;
  const companyId = role === "cafcm_admin" ? null : suppliedCompanyId;
  const passwordMode = cleanText(input.passwordMode, 16) || "keep";
  const requestedPassword = String(input.password ?? "");
  const temporaryPassword = passwordMode === "random" ? generateTemporaryPassword() : passwordMode === "manual" ? requestedPassword : null;

  if (!/^[0-9a-f-]{36}$/i.test(userId) || fullName.length < 2 || !validEmail(email) || !ROLE_VALUES.has(role)) {
    return json(req, { error: "Revise o nome, o e-mail e o tipo de acesso." }, 400);
  }

  if (!new Set(["keep", "random", "manual"]).has(passwordMode)) {
    return json(req, { error: "A opção de senha informada é inválida." }, 400);
  }
  if (temporaryPassword && (temporaryPassword.length < 10 || temporaryPassword.length > 128)) {
    return json(req, { error: "A nova senha deve ter entre 10 e 128 caracteres." }, 400);
  }

  const companyError = await validateCompanyLink(ctx.supabaseAdmin, role, companyId);
  if (companyError) return json(req, { error: companyError }, 400);

  const { data: targetResult, error: targetError } = await ctx.supabaseAdmin.auth.admin.getUserById(userId);
  const target = targetResult?.user;
  if (targetError || !target) return json(req, { error: "A pessoa selecionada não foi encontrada." }, 404);

  const currentRole = String(target.app_metadata?.portal_role ?? "");
  if (userId === requesterId && role !== currentRole) {
    return json(req, { error: "Você não pode alterar o tipo do seu próprio acesso." }, 400);
  }

  if (currentRole === "cafcm_admin" && role !== "cafcm_admin") {
    const { count } = await ctx.supabaseAdmin.from("profiles").select("id", { count: "exact", head: true }).eq("role", "cafcm_admin").eq("is_active", true);
    if ((count ?? 0) <= 1) return json(req, { error: "Mantenha pelo menos um acesso da equipe CAFCM." }, 400);
  }

  if (String(target.email ?? "").toLowerCase() !== email) {
    const existing = await findAuthUserByEmail(ctx.supabaseAdmin, email);
    if (existing && existing.id !== userId) {
      return json(req, { error: "Já existe uma conta com este e-mail.", code: "email_already_registered" }, 409);
    }
  }

  const appMetadata: Record<string, unknown> = { ...(target.app_metadata ?? {}), portal_role: role };
  if (companyId) appMetadata.company_id = companyId;
  else delete appMetadata.company_id;

  const attributes: Record<string, unknown> = {
    user_metadata: { ...(target.user_metadata ?? {}), full_name: fullName },
    app_metadata: appMetadata,
  };
  const emailChanged = String(target.email ?? "").toLowerCase() !== email;
  if (emailChanged) {
    attributes.email = email;
    if (target.email_confirmed_at ?? target.confirmed_at) attributes.email_confirm = true;
  }
  if (temporaryPassword) attributes.password = temporaryPassword;

  const { error: updateError } = await ctx.supabaseAdmin.auth.admin.updateUserById(userId, attributes);
  if (updateError) return authErrorResponse(req, updateError, "Não foi possível alterar os dados desta pessoa.");

  const { error: profileError } = await ctx.supabaseAdmin.from("profiles").upsert({
    id: userId,
    full_name: fullName,
    role,
    company_id: companyId,
  });
  const { error: contactError } = await ctx.supabaseAdmin.from("profile_contacts").upsert({ id: userId, email });
  if (profileError || contactError) return json(req, { error: "O acesso foi alterado, mas o perfil não pôde ser sincronizado." }, 500);

  const changedFields = [
    ...(fullName !== String(target.user_metadata?.full_name ?? "") ? ["full_name"] : []),
    ...(emailChanged ? ["email"] : []),
    ...(role !== currentRole ? ["role"] : []),
    ...(companyId !== (target.app_metadata?.company_id ?? null) ? ["company_id"] : []),
    ...(temporaryPassword ? ["password"] : []),
  ];
  await writeAudit(ctx.supabaseAdmin, requesterId, "user.updated", "profile", userId, {
    changed_fields: changedFields,
    password_changed: Boolean(temporaryPassword),
  }, userId);

  return json(req, {
    ok: true,
    emailChanged,
    needsInviteResend: emailChanged && !(target.email_confirmed_at ?? target.confirmed_at),
    permissionsChanged: role !== currentRole || companyId !== (target.app_metadata?.company_id ?? null),
    temporaryPassword,
  });
}

async function setPortalUserStatus(req: Request, input: Record<string, unknown>) {
  const access = await requireCafcmAdmin(req);
  if ("response" in access) return access.response;
  const { ctx, requesterId } = access;
  const userId = cleanText(input.userId, 36);
  const active = input.active === true;
  if (!/^[0-9a-f-]{36}$/i.test(userId)) return json(req, { error: "A pessoa selecionada é inválida." }, 400);
  if (userId === requesterId && !active) return json(req, { error: "Você não pode excluir ou inativar o próprio acesso." }, 400);

  const { data: profile, error: profileError } = await ctx.supabaseAdmin
    .from("profiles")
    .select("id,full_name,role,is_active")
    .eq("id", userId)
    .maybeSingle();
  if (profileError || !profile) return json(req, { error: "A pessoa selecionada não foi encontrada." }, 404);

  if (!active && profile.role === "cafcm_admin") {
    const { count } = await ctx.supabaseAdmin
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("role", "cafcm_admin")
      .eq("is_active", true);
    if ((count ?? 0) <= 1) return json(req, { error: "Mantenha pelo menos um acesso ativo da equipe CAFCM." }, 400);
  }

  const { data: targetResult, error: targetError } = await ctx.supabaseAdmin.auth.admin.getUserById(userId);
  const target = targetResult?.user;
  if (active && (targetError || !target)) {
    return json(req, { error: "Este acesso já foi removido do provedor de autenticação. Crie um novo convite para restaurá-lo." }, 409);
  }

  if (target) {
    const { error: authError } = await ctx.supabaseAdmin.auth.admin.updateUserById(userId, {
      ban_duration: active ? "none" : "876000h",
    });
    if (authError) return authErrorResponse(req, authError, active ? "Não foi possível reativar este acesso." : "Não foi possível excluir este acesso.");
  }

  const now = new Date().toISOString();
  const { error: updateError } = await ctx.supabaseAdmin.from("profiles").update({
    is_active: active,
    archived_at: active ? null : now,
    archived_by: active ? null : requesterId,
  }).eq("id", userId);
  if (updateError) return json(req, { error: "A credencial foi alterada, mas o perfil não pôde ser atualizado." }, 500);

  await writeAudit(
    ctx.supabaseAdmin,
    requesterId,
    active ? "user.access_restored" : "user.access_archived",
    "profile",
    userId,
    { full_name: profile.full_name, previous_active: profile.is_active },
    userId,
  );

  return json(req, { ok: true, active });
}

async function getPersonHistory(req: Request, input: Record<string, unknown>) {
  const access = await requireCafcmAdmin(req);
  if ("response" in access) return access.response;
  const { ctx } = access;
  const userId = cleanText(input.userId, 36);
  if (!/^[0-9a-f-]{36}$/i.test(userId)) return json(req, { error: "A pessoa selecionada é inválida." }, 400);

  const [enrollments, progress, attempts, audit] = await Promise.all([
    ctx.supabaseAdmin
      .from("enrollments")
      .select("course_id,assigned_at,courses(id,title,status)")
      .eq("apprentice_id", userId)
      .order("assigned_at", { ascending: false }),
    ctx.supabaseAdmin
      .from("lesson_progress")
      .select("lesson_id,course_id,completed_at,lessons(id,title,position),courses(id,title)")
      .eq("apprentice_id", userId)
      .order("completed_at", { ascending: false }),
    ctx.supabaseAdmin
      .from("activity_attempts")
      .select("activity_id,status,submitted_at,reviewed_at,activities(id,title,course_id,courses(id,title))")
      .eq("apprentice_id", userId)
      .order("submitted_at", { ascending: false }),
    ctx.supabaseAdmin
      .from("audit_logs")
      .select("id,actor_id,subject_user_id,action,entity_type,entity_id,details,occurred_at")
      .or(`actor_id.eq.${userId},subject_user_id.eq.${userId}`)
      .order("occurred_at", { ascending: false })
      .limit(100),
  ]);

  const firstError = enrollments.error || progress.error || attempts.error || audit.error;
  if (firstError) return json(req, { error: "Não foi possível carregar o histórico desta pessoa." }, 500);
  return json(req, {
    enrollments: enrollments.data ?? [],
    completedLessons: progress.data ?? [],
    activityAttempts: attempts.data ?? [],
    audit: audit.data ?? [],
  });
}

function validUuid(value: unknown) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value ?? ""));
}

async function importPortalPeople(req: Request, input: Record<string, unknown>) {
  const access = await requireCafcmAdmin(req);
  if ("response" in access) return access.response;
  const { ctx, requesterId } = access;
  const rawPeople = Array.isArray(input.people) ? input.people.slice(0, 100) : [];
  if (!rawPeople.length) return json(req, { error: "O arquivo não contém pessoas para importar." }, 400);

  const [authUsers, companiesResult] = await Promise.all([
    listAllAuthUsers(ctx.supabaseAdmin),
    ctx.supabaseAdmin.from("companies").select("id,is_active"),
  ]);
  if (companiesResult.error) return json(req, { error: "Não foi possível validar as empresas." }, 500);
  const authByEmail = new Map(authUsers.map((user: any) => [String(user.email ?? "").toLowerCase(), user]));
  const validCompanies = new Map((companiesResult.data ?? []).map((company: any) => [company.id, company.is_active]));
  const results: any[] = [];
  const idBySource = new Map<string, string>();
  const idByEmail = new Map<string, string>();

  for (const raw of rawPeople as any[]) {
    const email = cleanText(raw?.email, 254).toLowerCase();
    const fullName = cleanText(raw?.fullName ?? raw?.full_name, 160);
    let role = cleanText(raw?.role, 32);
    const companyId = role === "cafcm_admin" ? null : cleanText(raw?.companyId ?? raw?.company_id, 36) || null;
    const password = String(raw?.password ?? "");
    const sourceId = cleanText(raw?.sourceId ?? raw?.id, 64);

    if (!validEmail(email) || fullName.length < 2 || !ROLE_VALUES.has(role)) {
      results.push({ email, ok: false, message: "Nome, e-mail ou perfil inválido." });
      continue;
    }
    if (role === "company" && !companyId) {
      results.push({ email, ok: false, message: "Representante sem empresa vinculada." });
      continue;
    }
    if (companyId && !validCompanies.get(companyId)) {
      results.push({ email, ok: false, message: "Empresa inexistente ou inativa." });
      continue;
    }
    if (password && (password.length < 10 || password.length > 128)) {
      results.push({ email, ok: false, message: "A senha deve ter entre 10 e 128 caracteres." });
      continue;
    }

    const existing: any = authByEmail.get(email);
    try {
      let userId: string;
      let temporaryPassword: string | null = null;
      let resultType = "updated";

      if (existing) {
        userId = existing.id;
        if (userId === requesterId) role = String(existing.app_metadata?.portal_role ?? "cafcm_admin");
        const appMetadata: Record<string, unknown> = { ...(existing.app_metadata ?? {}), portal_role: role };
        if (companyId) appMetadata.company_id = companyId;
        else delete appMetadata.company_id;
        const attributes: Record<string, unknown> = {
          app_metadata: appMetadata,
          user_metadata: { ...(existing.user_metadata ?? {}), full_name: fullName },
        };
        if (password) attributes.password = password;
        const { error: updateError } = await ctx.supabaseAdmin.auth.admin.updateUserById(userId, attributes);
        if (updateError) throw updateError;
        const { error: profileError } = await ctx.supabaseAdmin.from("profiles").upsert({
          id: userId,
          full_name: fullName,
          role,
          company_id: companyId,
        });
        const { error: contactError } = await ctx.supabaseAdmin.from("profile_contacts").upsert({ id: userId, email });
        if (profileError || contactError) throw new Error("Não foi possível atualizar o perfil.");
      } else {
        const created = await provisionInvitedUser(req, ctx.supabaseAdmin, requesterId, {
          email,
          fullName,
          role,
          companyId,
          password: password || undefined,
        });
        userId = created.user.id;
        temporaryPassword = created.temporaryPassword;
        resultType = "invited";
        authByEmail.set(email, created.user);
      }

      idByEmail.set(email, userId);
      if (sourceId) idBySource.set(sourceId, userId);
      await writeAudit(ctx.supabaseAdmin, requesterId, resultType === "invited" ? "user.import_invited" : "user.import_updated", "profile", userId, {
        email,
        role,
        company_id: companyId,
      }, userId);
      results.push({ email, ok: true, type: resultType, userId, temporaryPassword });
    } catch (error) {
      const friendly = friendlyAuthError(error, "Não foi possível importar esta pessoa.");
      results.push({ email, ok: false, message: friendly.message, code: friendly.code });
      if (friendly.code === "email_rate_limit" || friendly.code === "smtp_email_not_authorized") break;
    }
  }

  if (results.length < rawPeople.length) {
    for (const raw of rawPeople.slice(results.length) as any[]) {
      results.push({
        email: cleanText(raw?.email, 254).toLowerCase(),
        ok: false,
        message: "Não processada porque o serviço de e-mail interrompeu a importação.",
        code: "email_delivery_blocked",
      });
    }
  }

  const history = input.history && typeof input.history === "object" ? input.history as Record<string, unknown> : {};
  let historyRestored = 0;
  let historyFailed = 0;
  const targetFor = (row: any) => idByEmail.get(cleanText(row?.email, 254).toLowerCase()) || idBySource.get(cleanText(row?.sourceId ?? row?.apprenticeId, 64));
  const restoreRows = async (table: string, rows: any[], mapper: (row: any, userId: string) => Record<string, unknown> | null) => {
    const payload = rows.slice(0, 5000).map((row) => {
      const userId = targetFor(row);
      return userId ? mapper(row, userId) : null;
    }).filter(Boolean);
    if (!payload.length) return;
    const { error } = await ctx.supabaseAdmin.from(table).upsert(payload);
    if (error) historyFailed += payload.length;
    else historyRestored += payload.length;
  };

  await restoreRows("enrollments", Array.isArray(history.enrollments) ? history.enrollments as any[] : [], (row, userId) =>
    validUuid(row.courseId) ? { course_id: row.courseId, apprentice_id: userId, assigned_at: row.assignedAt || new Date().toISOString() } : null);
  await restoreRows("lesson_progress", Array.isArray(history.lessonProgress) ? history.lessonProgress as any[] : [], (row, userId) =>
    validUuid(row.lessonId) ? { lesson_id: row.lessonId, apprentice_id: userId, completed_at: row.completedAt || new Date().toISOString() } : null);
  await restoreRows("activity_attempts", Array.isArray(history.activityAttempts) ? history.activityAttempts as any[] : [], (row, userId) =>
    validUuid(row.activityId) ? {
      activity_id: row.activityId,
      apprentice_id: userId,
      status: row.status === "reviewed" ? "reviewed" : "submitted",
      submitted_at: row.submittedAt || new Date().toISOString(),
      reviewed_at: row.reviewedAt || null,
    } : null);
  await restoreRows("activity_responses", Array.isArray(history.activityResponses) ? history.activityResponses as any[] : [], (row, userId) =>
    validUuid(row.activityId) && cleanText(row.responseText, 20000) ? {
      activity_id: row.activityId,
      apprentice_id: userId,
      response_text: cleanText(row.responseText, 20000),
    } : null);

  const imported = results.filter((item) => item.ok).length;
  await writeAudit(ctx.supabaseAdmin, requesterId, "people.imported", "profiles", "batch", {
    requested: rawPeople.length,
    imported,
    failed: results.length - imported,
    history_restored: historyRestored,
    history_failed: historyFailed,
  });

  return json(req, { ok: true, results, historyRestored, historyFailed });
}

async function logPortalEvent(req: Request, input: Record<string, unknown>) {
  const { data: ctx, error } = await createSupabaseContext(req, { auth: "user" });
  if (error || !ctx) return json(req, { error: "Sua sessão expirou." }, 401);
  const userId = String(ctx.userClaims?.id ?? ctx.jwtClaims?.sub ?? "");
  const action = cleanText(input.event, 80);
  const allowed = new Set(["session.started", "session.ended", "course.opened", "lesson.opened", "profile.password_changed"]);
  if (!allowed.has(action)) return json(req, { error: "Evento inválido." }, 400);
  const entityId = cleanText(input.entityId, 80) || userId;
  const entityType = action.includes("course") ? "course" : action.includes("lesson") ? "lesson" : "profile";
  await writeAudit(ctx.supabaseAdmin, userId, action, entityType, entityId, {}, userId);
  return json(req, { ok: true });
}

async function resendPortalAccess(req: Request, input: Record<string, unknown>) {
  const access = await requireCafcmAdmin(req);
  if ("response" in access) return access.response;
  const { ctx, requesterId } = access;
  const userId = cleanText(input.userId, 36);
  if (!/^[0-9a-f-]{36}$/i.test(userId)) return json(req, { error: "A pessoa selecionada é inválida." }, 400);

  const { data, error } = await ctx.supabaseAdmin.auth.admin.getUserById(userId);
  const user = data?.user;
  if (error || !user?.email) return json(req, { error: "A pessoa selecionada não foi encontrada." }, 404);

  const confirmed = Boolean(user.email_confirmed_at ?? user.confirmed_at);
  if (confirmed) {
    const { error: resetError } = await ctx.supabaseAdmin.auth.resetPasswordForEmail(user.email, { redirectTo: siteOrigin(req) });
    if (resetError) return authErrorResponse(req, resetError, "Não foi possível enviar o e-mail de recuperação.");
    await writeAudit(ctx.supabaseAdmin, requesterId, "user.recovery_sent", "profile", userId, {}, userId);
    return json(req, { ok: true, mode: "recovery" });
  }

  const { error: resendError } = await ctx.supabaseAdmin.auth.resend({
    type: "invite",
    email: user.email,
    options: { emailRedirectTo: siteOrigin(req) },
  });
  if (resendError) return authErrorResponse(req, resendError, "Não foi possível reenviar o convite.");
  await writeAudit(ctx.supabaseAdmin, requesterId, "user.invite_resent", "profile", userId, {}, userId);
  return json(req, { ok: true, mode: "confirmation" });
}

export default {
  async fetch(req: Request) {
    if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders(req) });
    if (req.method !== "POST") return json(req, { error: "Método não permitido." }, 405);

    try {
      const input = await req.json() as Record<string, unknown>;
      const action = cleanText(input.action, 40);
      if (action === "status") return await setupStatus(req);
      if (action === "bootstrap") return await bootstrapAdmin(req, input);
      if (action === "invite") return await inviteUser(req, input);
      if (action === "list_users") return await listPortalUsers(req);
      if (action === "update_user") return await updatePortalUser(req, input);
      if (action === "set_user_status") return await setPortalUserStatus(req, input);
      if (action === "person_history") return await getPersonHistory(req, input);
      if (action === "import_people") return await importPortalPeople(req, input);
      if (action === "log_event") return await logPortalEvent(req, input);
      if (action === "resend_access") return await resendPortalAccess(req, input);
      return json(req, { error: "Ação inválida." }, 400);
    } catch (error) {
      console.error("portal-admin", error);
      return json(req, { error: "Não foi possível concluir a operação." }, 500);
    }
  },
};
