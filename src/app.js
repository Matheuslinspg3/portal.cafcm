import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://cyovnmnxzrfptyfrivdr.supabase.co";
const SUPABASE_KEY = "sb_publishable_otxl6dKO3VJ4G3qsNkfyoA_cP_EY6Lg";
const SITE_ORIGIN = window.location.origin;
const ADMIN_FUNCTION = `${SUPABASE_URL}/functions/v1/portal-admin`;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

const app = document.querySelector("#app");

const state = {
  session: null,
  profile: null,
  view: null,
  selectedCourseId: null,
  selectedLessonId: null,
  lessonStepIndex: 0,
  blockSlideIndex: 0,
  selectedActivityId: null,
  auditPersonId: null,
  sessionLogged: false,
  wizardOpen: false,
  wizardStep: 0,
  setupRequired: false,
  repairedAuthLink: false,
  people: [],
  importResults: [],
};

const roleLabels = {
  cafcm_admin: "Equipe CAFCM",
  apprentice: "Jovem aprendiz",
  company: "Representante da empresa",
};

const blockTypeLabels = {
  text: "Texto e imagem",
  slides: "Apresentação em slides",
  video: "Vídeo",
  considerations: "Considerações finais",
};

const auditActionLabels = {
  "user.invited": "Pessoa convidada",
  "user.updated": "Perfil ou credencial alterada",
  "user.recovery_sent": "Recuperação de senha enviada",
  "user.invite_resent": "Convite reenviado",
  "user.access_archived": "Acesso excluído e arquivado",
  "user.access_restored": "Acesso restaurado",
  "user.import_invited": "Pessoa convidada por importação",
  "user.import_updated": "Perfil atualizado por importação",
  "people.imported": "Importação de pessoas",
  "session.started": "Entrada no portal",
  "session.ended": "Saída do portal",
  "course.opened": "Curso aberto",
  "lesson.opened": "Aula aberta",
  "profile.password_changed": "Senha pessoal alterada",
  "companies.insert": "Empresa cadastrada",
  "companies.update": "Empresa alterada",
  "companies.delete": "Empresa excluída",
  "profiles.update": "Perfil alterado",
  "courses.insert": "Curso criado",
  "courses.update": "Curso alterado",
  "courses.delete": "Curso excluído",
  "lessons.insert": "Aula criada",
  "lessons.update": "Aula alterada",
  "lessons.delete": "Aula excluída",
  "lesson_blocks.insert": "Linha de aprendizagem criada",
  "lesson_blocks.update": "Linha de aprendizagem alterada",
  "lesson_blocks.delete": "Linha de aprendizagem excluída",
  "activities.insert": "Atividade criada",
  "activities.update": "Atividade alterada",
  "activities.delete": "Atividade excluída",
  "enrollments.insert": "Matrícula criada",
  "enrollments.delete": "Matrícula removida",
  "lesson_progress.insert": "Aula concluída",
  "lesson_progress.delete": "Conclusão de aula desmarcada",
  "activity_attempts.insert": "Atividade enviada",
  "activity_attempts.update": "Atividade atualizada",
  "activity_responses.insert": "Resposta registrada",
  "activity_responses.update": "Resposta alterada",
};

const navigation = {
  cafcm_admin: [
    ["overview", "Visão geral", "grid"],
    ["companies", "Empresas", "building"],
    ["people", "Pessoas e convites", "users"],
    ["courses", "Cursos", "book"],
    ["enrollments", "Matrículas", "link"],
    ["audit", "Auditoria", "history"],
  ],
  apprentice: [
    ["student-home", "Início", "home"],
    ["student-courses", "Meus cursos", "book"],
    ["student-activities", "Atividades", "check"],
  ],
  company: [
    ["company-home", "Visão geral", "grid"],
    ["company-apprentices", "Aprendizes", "users"],
  ],
};

const wizardContent = {
  cafcm_admin: [
    ["Comece pelas empresas", "Cadastre identificação, responsável e endereço. Empresas inativas permanecem no histórico, mas não aparecem em novos vínculos."],
    ["Monte a formação", "Crie o curso, organize cada aula em linhas de aprendizagem — texto, slides, vídeo e considerações — e finalize com atividades."],
    ["Convide as pessoas", "Escolha o perfil, envie o convite por e-mail e guarde a senha inicial exibida. A equipe CAFCM não precisa de empresa vinculada."],
    ["Faça as matrículas", "Vincule cada jovem a um curso e publique a formação quando ela estiver pronta."],
    ["Proteja o histórico", "Use o backup de pessoas e a auditoria. Ao excluir um acesso, o registro fica arquivado para não apagar conclusões e atividades."],
  ],
  apprentice: [
    ["Sua página inicial", "Aqui você encontra somente os cursos em que a CAFCM realizou sua matrícula."],
    ["Aulas e progresso", "Abra uma aula e avance etapa por etapa. A conclusão é registrada ao chegar ao final da linha de aprendizagem."],
    ["Envio de atividades", "Responda às atividades dentro do prazo. A empresa vê o status, mas não vê sua resposta."],
  ],
  company: [
    ["Comece pela Visão geral", "Use os cartões do início para conferir quantos jovens estão vinculados, quantos já possuem matrícula e quantas atividades foram enviadas."],
    ["Abra a lista de Aprendizes", "No menu Aprendizes, localize o jovem que deseja acompanhar. Os cursos vinculados aparecem logo abaixo do nome."],
    ["Leia o progresso do curso", "A barra mostra o percentual de aulas concluídas. A linha de detalhes informa quantas aulas foram finalizadas e quantas atividades já foram enviadas."],
    ["Avalie a situação", "Use os indicadores Ainda não iniciou, Em andamento e Concluído para identificar rapidamente quem precisa de atenção ou orientação."],
    ["Defina a próxima ação", "Se notar pouco avanço ou atividades ainda não enviadas, converse com o jovem e alinhe o acompanhamento com a CAFCM. As respostas das atividades permanecem protegidas."],
  ],
};

const icons = {
  grid: '<rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/>',
  home: '<path d="m3 11 9-8 9 8"/><path d="M5 10v10h14V10M9 20v-6h6v6"/>',
  building: '<path d="M4 21V3h11v18M15 9h5v12M8 7h3M8 11h3M8 15h3M7 21h14"/>',
  users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
  book: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V4H6.5A2.5 2.5 0 0 0 4 6.5z"/><path d="M4 6.5v13M8 8h8"/>',
  link: '<path d="M10 13a5 5 0 0 0 7.5.5l2-2a5 5 0 0 0-7-7l-1.1 1.1"/><path d="M14 11a5 5 0 0 0-7.5-.5l-2 2a5 5 0 0 0 7 7l1.1-1.1"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  arrow: '<path d="M5 12h14m-5-5 5 5-5 5"/>',
  logout: '<path d="M10 17l5-5-5-5M15 12H3M14 4h5a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-5"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  close: '<path d="m6 6 12 12M18 6 6 18"/>',
  help: '<circle cx="12" cy="12" r="9"/><path d="M9.6 9a2.5 2.5 0 1 1 4.1 1.9c-1 .8-1.7 1.2-1.7 2.6M12 17h.01"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="3"/><path d="m4 7 8 6 8-6"/>',
  lock: '<rect x="4" y="10" width="16" height="11" rx="3"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v6l4 2"/>',
  shield: '<path d="M12 3 4 6v5c0 5 3.4 8.6 8 10 4.6-1.4 8-5 8-10V6z"/><path d="m9 12 2 2 4-4"/>',
  empty: '<path d="M4 7.5 12 3l8 4.5v9L12 21l-8-4.5z"/><path d="m4 7.5 8 4.5 8-4.5M12 12v9"/>',
  chevron: '<path d="m9 18 6-6-6-6"/>',
  edit: '<path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4z"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M8 3v4M16 3v4M3 10h18"/>',
  trash: '<path d="M4 7h16M9 7V4h6v3M7 7l1 14h8l1-14M10 11v6M14 11v6"/>',
  archive: '<rect x="3" y="4" width="18" height="5" rx="1"/><path d="M5 9v11h14V9M10 13h4"/>',
  copy: '<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M15 9V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h3"/>',
  history: '<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5M12 7v5l3 2"/>',
  download: '<path d="M12 3v12M7 10l5 5 5-5M4 21h16"/>',
  upload: '<path d="M12 16V4M7 9l5-5 5 5M4 21h16"/>',
  play: '<circle cx="12" cy="12" r="9"/><path d="m10 8 6 4-6 4z"/>',
  image: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-5-5L5 20"/>',
  presentation: '<path d="M4 3h16v12H4zM8 21l4-6 4 6M2 3h20"/>',
};

function icon(name, className = "") {
  return `<svg class="icon ${className}" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${icons[name] || icons.grid}</svg>`;
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  })[character]);
}

function initials(name) {
  return String(name || "CA").trim().split(/\s+/).slice(0, 2).map((part) => part[0] || "").join("").toUpperCase();
}

function formatDate(value, withTime = false) {
  if (!value) return "Sem prazo";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Sem prazo";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  }).format(date);
}

function digitsOnly(value) {
  return String(value || "").replace(/\D/g, "");
}

function normalizeCnpj(value) {
  return String(value || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
}

function valueOrNull(value) {
  const cleaned = String(value || "").trim();
  return cleaned || null;
}

function formatCnpj(value) {
  const characters = normalizeCnpj(value);
  if (characters.length !== 14) return value || "CNPJ não informado";
  return characters.replace(/^(.{2})(.{3})(.{3})(.{4})(.{2})$/, "$1.$2.$3/$4-$5");
}

function isValidCnpj(value) {
  const characters = normalizeCnpj(value);
  if (!/^[A-Z0-9]{12}\d{2}$/.test(characters) || /^(.)\1+$/.test(characters)) return false;
  const values = [...characters].map((character) => character.charCodeAt(0) - 48);
  const calculateDigit = (length, weights) => {
    const sum = values.slice(0, length).reduce((total, character, index) => total + character * weights[index], 0);
    const remainder = sum % 11;
    return remainder < 2 ? 0 : 11 - remainder;
  };
  const first = calculateDigit(12, [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  const second = calculateDigit(13, [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  return Number(characters[12]) === first && Number(characters[13]) === second;
}

function formatPhone(value) {
  const digits = digitsOnly(value);
  if (digits.length === 11) return digits.replace(/^(\d{2})(\d{5})(\d{4})$/, "($1) $2-$3");
  if (digits.length === 10) return digits.replace(/^(\d{2})(\d{4})(\d{4})$/, "($1) $2-$3");
  return value || "Não informado";
}

function formatWorkload(value) {
  const hours = Number(value || 0);
  if (!hours) return "Carga horária não informada";
  return `${new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 }).format(hours)} h`;
}

function formatDateTimeInput(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

function progressPercent(completed, total) {
  if (!total) return 0;
  return Math.min(100, Math.round((completed / total) * 100));
}

function compactText(value, max = 170) {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  return text.length > max ? `${text.slice(0, max).trim()}…` : text;
}

function parseSlides(value) {
  return String(value || "")
    .split(/\n\s*---\s*\n/g)
    .map((part, index) => {
      const lines = part.trim().split("\n");
      return { title: lines.shift()?.trim() || `Slide ${index + 1}`, body: lines.join("\n").trim() };
    })
    .filter((slide) => slide.title || slide.body);
}

function safeHttpUrl(value) {
  try {
    const url = new URL(String(value || ""));
    return ["http:", "https:"].includes(url.protocol) ? url.toString() : "";
  } catch {
    return "";
  }
}

function defaultView(role) {
  return role === "cafcm_admin" ? "overview" : role === "company" ? "company-home" : "student-home";
}

function viewTitle(view) {
  const titles = {
    overview: ["Visão geral", "Situação real do portal"],
    companies: ["Empresas", "Parceiros vinculados aos aprendizes"],
    people: ["Pessoas e convites", "Acessos criados pela CAFCM"],
    courses: ["Cursos", "Formações, aulas e atividades"],
    "course-editor": ["Editor do curso", "Conteúdo pedagógico"],
    "lesson-editor": ["Estrutura da aula", "Linhas de aprendizagem"],
    enrollments: ["Matrículas", "Vínculos entre jovens e cursos"],
    audit: ["Auditoria", "Histórico das ações no portal"],
    "student-home": ["Início", "Sua formação no Portal CAFCM"],
    "student-courses": ["Meus cursos", "Conteúdos liberados pela CAFCM"],
    "student-activities": ["Atividades", "Acompanhe seus envios"],
    "student-course": ["Curso", "Aulas e atividades"],
    "company-home": ["Visão geral", "Progresso dos jovens da sua empresa"],
    "company-apprentices": ["Aprendizes", "Jovens vinculados à sua empresa"],
  };
  return titles[view] || ["Portal CAFCM", "Aprendizagem"];
}

function brand(inverse = false) {
  return `<span class="brand ${inverse ? "brand-inverse" : ""}">
    <span class="brand-mark">CA</span>
    <span class="brand-copy"><strong>Portal CAFCM</strong><small>Aprendizagem profissional</small></span>
  </span>`;
}

function setBusy(form, busy, label = "Processando...") {
  const button = form?.querySelector('button[type="submit"]');
  if (!button) return;
  if (busy) {
    button.dataset.originalLabel = button.innerHTML;
    button.disabled = true;
    button.textContent = label;
  } else {
    button.disabled = false;
    button.innerHTML = button.dataset.originalLabel || "Continuar";
  }
}

function showToast(message, type = "success") {
  const toast = document.querySelector("#toast");
  if (!toast) return;
  toast.textContent = message;
  toast.className = `toast show ${type}`;
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => toast.classList.remove("show"), 3800);
}

function friendlyError(error) {
  const message = String(error?.message || "");
  if (error?.code === "23505" && message.includes("companies_cnpj_unique_idx")) return "Já existe uma empresa cadastrada com este CNPJ.";
  if (error?.code === "23514") return "Revise os dados informados: um dos campos está fora do formato permitido.";
  if (message.toLowerCase().includes("failed to fetch")) return "Não foi possível conectar ao serviço. Verifique sua internet e tente novamente.";
  return message || "Não foi possível concluir.";
}

function showFormError(form, message) {
  form?.querySelector(".form-error")?.remove();
  if (!form) return;
  const alert = document.createElement("div");
  alert.className = "form-error";
  alert.setAttribute("role", "alert");
  alert.textContent = message;
  form.prepend(alert);
}

function renderBoot() {
  app.innerHTML = `<main class="boot"><span class="brand-mark">CA</span><div class="spinner"></div><p>Preparando o Portal CAFCM...</p></main>`;
}

async function callAdmin(payload, authenticated = false) {
  const headers = {
    "Content-Type": "application/json",
    apikey: SUPABASE_KEY,
  };
  if (authenticated) {
    const { data } = await supabase.auth.getSession();
    if (!data.session?.access_token) throw new Error("Sua sessão expirou. Entre novamente.");
    headers.Authorization = `Bearer ${data.session.access_token}`;
  }
  const response = await fetch(ADMIN_FUNCTION, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(body.error || "Não foi possível concluir a operação.");
    error.code = body.code || null;
    error.status = response.status;
    throw error;
  }
  return body;
}

async function renderLogin(mode = "login") {
  state.profile = null;
  state.view = null;
  const loginMode = mode === "login";
  const recoverMode = mode === "recover";
  const bootstrapMode = mode === "bootstrap";
  const repairMode = mode === "repair";
  const heading = bootstrapMode
    ? "Configure o primeiro acesso."
    : recoverMode
      ? "Recupere sua senha."
      : repairMode
        ? "Corrija seu link de acesso."
        : "Entre no Portal CAFCM.";
  const intro = bootstrapMode
    ? "Use a chave inicial fornecida nesta implantação. Depois disso, novos acessos serão criados somente por convite."
    : recoverMode
      ? "Informe o e-mail cadastrado para receber o link de recuperação."
      : repairMode
        ? "Se o e-mail abriu uma página localhost, cole abaixo o endereço completo que apareceu no navegador. A leitura acontece somente neste dispositivo."
        : "O acesso é enviado pela CAFCM. Jovens, empresas e equipe visualizam somente o que corresponde ao seu perfil.";

  app.innerHTML = `
    <main class="auth-shell">
      <section class="auth-panel">
        ${brand()}
        <div class="auth-main">
          <p class="eyebrow">Acesso institucional</p>
          <h1>${heading}</h1>
          <p class="auth-intro">${intro}</p>

          ${loginMode ? `
            <form id="login-form" class="stack-form">
              <label>E-mail<input name="email" type="email" autocomplete="email" required placeholder="voce@exemplo.com" /></label>
              <label>Senha<input name="password" type="password" autocomplete="current-password" required placeholder="Digite sua senha" /></label>
              <button class="btn btn-primary btn-block" type="submit">Entrar no portal ${icon("arrow")}</button>
            </form>
            <div class="auth-links">
              <button type="button" class="text-link" data-auth-mode="recover">Esqueci minha senha</button>
              <button type="button" class="text-link" data-auth-mode="repair">O link abriu localhost?</button>
              <button type="button" class="text-link setup-link" data-auth-mode="bootstrap" hidden>Configurar primeiro acesso da CAFCM</button>
            </div>
          ` : ""}

          ${recoverMode ? `
            <form id="recover-form" class="stack-form">
              <label>E-mail<input name="email" type="email" autocomplete="email" required placeholder="voce@exemplo.com" /></label>
              <button class="btn btn-primary btn-block" type="submit">Enviar link de recuperação</button>
            </form>
            <button type="button" class="text-link back-link" data-auth-mode="login">Voltar para o acesso</button>
          ` : ""}

          ${repairMode ? `
            <form id="link-repair-form" class="stack-form">
              <label>Endereço que abriu no navegador
                <textarea name="confirmationLink" rows="5" required autocomplete="off" spellcheck="false" placeholder="http://localhost:3000/#access_token=..."></textarea>
                <small>O portal valida o link diretamente com o Supabase, remove os dados da tela e pede uma nova senha.</small>
              </label>
              <div class="privacy-note">Use somente o link que chegou no seu próprio e-mail. Nunca envie esse endereço por mensagem para outra pessoa.</div>
              <button class="btn btn-primary btn-block" type="submit">Validar link com segurança</button>
            </form>
            <button type="button" class="text-link back-link" data-auth-mode="login">Voltar para o acesso</button>
          ` : ""}

          ${bootstrapMode ? `
            <form id="bootstrap-form" class="stack-form">
              <label>Nome completo<input name="fullName" autocomplete="name" required maxlength="160" /></label>
              <label>E-mail administrativo<input name="email" type="email" autocomplete="email" required /></label>
              <label>Crie uma senha<input name="password" type="password" autocomplete="new-password" minlength="10" required /><small>Mínimo de 10 caracteres.</small></label>
              <label>Chave inicial<input name="code" type="password" autocomplete="off" required /></label>
              <button class="btn btn-primary btn-block" type="submit">Criar acesso da CAFCM</button>
            </form>
            <button type="button" class="text-link back-link" data-auth-mode="login">Voltar para o acesso</button>
          ` : ""}
        </div>
        <p class="auth-foot">Ambiente de aprendizagem administrado pela CAFCM.</p>
      </section>
      <aside class="auth-context">
        <div class="context-content">
          <span class="context-kicker">Acesso protegido por perfil</span>
          <h2>Um portal para coordenar, aprender e acompanhar.</h2>
          <div class="context-list">
            <article>${icon("shield")}<div><strong>CAFCM</strong><p>Organiza empresas, pessoas, cursos e matrículas.</p></div></article>
            <article>${icon("book")}<div><strong>Jovem aprendiz</strong><p>Acessa aulas, registra progresso e envia atividades.</p></div></article>
            <article>${icon("building")}<div><strong>Representante da empresa</strong><p>Consulta o desenvolvimento dos jovens vinculados à organização.</p></div></article>
          </div>
        </div>
      </aside>
      <div id="toast" class="toast" role="status" aria-live="polite"></div>
    </main>
  `;

  if (loginMode) {
    try {
      const result = await callAdmin({ action: "status" });
      state.setupRequired = Boolean(result.setupRequired);
      const setupLink = document.querySelector(".setup-link");
      if (setupLink) setupLink.hidden = !state.setupRequired;
    } catch {
      state.setupRequired = false;
    }
  }
}

function renderPasswordSetup() {
  const repairedLink = state.repairedAuthLink;
  app.innerHTML = `
    <main class="auth-shell compact-auth">
      <section class="auth-panel">
        ${brand()}
        <div class="auth-main">
          <p class="eyebrow">Primeiro acesso</p>
          <h1>Crie sua senha.</h1>
          <p class="auth-intro">${repairedLink
            ? "O link foi validado. Defina uma senha pessoal; depois, você entrará novamente para invalidar o endereço antigo."
            : "Defina uma senha pessoal para concluir o convite ou a recuperação da conta."}</p>
          <form id="password-form" class="stack-form">
            <label>Nova senha<input name="password" type="password" autocomplete="new-password" minlength="10" required /><small>Mínimo de 10 caracteres.</small></label>
            <label>Confirme a senha<input name="confirmation" type="password" autocomplete="new-password" minlength="10" required /></label>
            <button class="btn btn-primary btn-block" type="submit">${repairedLink ? "Salvar senha com segurança" : "Salvar senha e entrar"}</button>
          </form>
        </div>
        <p class="auth-foot">Nunca compartilhe sua senha com terceiros.</p>
      </section>
      <aside class="auth-context password-context"><div class="context-content">${icon("shield")}<h2>Seu acesso foi confirmado.</h2><p>${repairedLink ? "Depois de salvar, entre novamente com a nova senha. O endereço antigo deixará de manter sua sessão ativa." : "Depois de criar a senha, o guia rápido mostrará como usar o portal conforme o seu perfil."}</p></div></aside>
      <div id="toast" class="toast" role="status" aria-live="polite"></div>
    </main>
  `;
}

function renderNoAccess() {
  app.innerHTML = `<main class="message-page">${brand()}<div class="message-card">${icon("shield")}<h1>Acesso aguardando configuração</h1><p>Sua conta existe, mas ainda não recebeu um perfil no Portal CAFCM. Solicite a conferência do convite à equipe responsável.</p><button class="btn btn-secondary" data-logout>Sair</button></div><div id="toast" class="toast"></div></main>`;
}

async function loadPortal() {
  const { data: sessionData } = await supabase.auth.getSession();
  state.session = sessionData.session;
  if (!state.session) return renderLogin();

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id,full_name,role,company_id,onboarding_completed,is_active")
    .eq("id", state.session.user.id)
    .single();

  if (error || !profile?.role) return renderNoAccess();
  if (!profile.is_active) {
    await supabase.auth.signOut();
    await renderLogin();
    return showToast("Este acesso foi arquivado pela CAFCM.", "error");
  }

  state.profile = profile;
  state.view = state.view && navigation[profile.role]?.some(([id]) => id === state.view)
    ? state.view
    : defaultView(profile.role);
  state.wizardOpen = !profile.onboarding_completed;
  state.wizardStep = 0;
  if (!state.sessionLogged) {
    state.sessionLogged = true;
    callAdmin({ action: "log_event", event: "session.started" }, true).catch(() => {});
  }
  await renderPortal();
}

async function renderPortal() {
  const profile = state.profile;
  if (!profile) return;
  const nav = navigation[profile.role] || [];
  const [title, subtitle] = viewTitle(state.view);
  const activeBase = ["course-editor", "lesson-editor"].includes(state.view) ? "courses" : state.view === "student-course" ? "student-courses" : state.view;

  app.innerHTML = `
    <div class="portal-shell">
      <button class="sidebar-scrim" data-close-menu aria-label="Fechar menu"></button>
      <aside class="sidebar">
        <div class="sidebar-head">${brand(true)}<button class="icon-btn sidebar-close" data-close-menu aria-label="Fechar menu">${icon("close")}</button></div>
        <nav aria-label="Navegação principal">
          <span class="nav-label">${roleLabels[profile.role]}</span>
          ${nav.map(([id, label, iconName]) => `<button class="nav-item ${activeBase === id ? "active" : ""}" data-nav="${id}">${icon(iconName)}<span>${label}</span></button>`).join("")}
        </nav>
        <button class="guide-card" data-open-wizard>${icon("help")}<span><strong>Guia rápido</strong><small>Rever como usar</small></span></button>
        <div class="sidebar-user"><span class="avatar">${escapeHtml(initials(profile.full_name))}</span><span><strong>${escapeHtml(profile.full_name || roleLabels[profile.role])}</strong><small>${roleLabels[profile.role]}</small></span></div>
      </aside>
      <section class="portal-main">
        <header class="topbar">
          <button class="icon-btn menu-button" data-open-menu aria-label="Abrir menu">${icon("menu")}</button>
          <div><strong>${title}</strong><small>${subtitle}</small></div>
          <button class="btn btn-quiet" data-dialog="my-profile">${icon("users")} <span>Minha conta</span></button>
          <button class="btn btn-quiet help-topbar" data-open-wizard>${icon("help")} <span>Como usar</span></button>
          <button class="icon-btn" data-logout aria-label="Sair do portal">${icon("logout")}</button>
        </header>
        <main id="main-content" class="content"><div class="content-loading"><div class="spinner"></div><p>Carregando informações...</p></div></main>
      </section>
      <div id="overlay-root"></div>
      <div id="toast" class="toast" role="status" aria-live="polite"></div>
    </div>
  `;

  await renderView();
  if (state.wizardOpen) renderWizard();
}

async function renderView() {
  const content = document.querySelector("#main-content");
  if (!content) return;
  try {
    const renderers = {
      overview: renderAdminOverview,
      companies: renderCompanies,
      people: renderPeople,
      courses: renderCourses,
      "course-editor": renderCourseEditor,
      "lesson-editor": renderLessonEditor,
      enrollments: renderEnrollments,
      audit: renderAudit,
      "student-home": renderStudentHome,
      "student-courses": renderStudentCourses,
      "student-activities": renderStudentActivities,
      "student-course": renderStudentCourse,
      "company-home": renderCompanyHome,
      "company-apprentices": renderCompanyApprentices,
    };
    await (renderers[state.view] || renderers[defaultView(state.profile.role)])(content);
  } catch (error) {
    console.error(error);
    content.innerHTML = errorState(error.message);
  }
}

function pageHead(title, text, action = "") {
  return `<header class="page-head"><div><h1>${title}</h1><p>${text}</p></div>${action}</header>`;
}

function emptyState(title, text, action = "") {
  return `<div class="empty-state"><span>${icon("empty")}</span><h2>${title}</h2><p>${text}</p>${action}</div>`;
}

function errorState(message) {
  return `<div class="empty-state error-state"><span>!</span><h2>Não foi possível carregar</h2><p>${escapeHtml(message || "Tente novamente em instantes.")}</p><button class="btn btn-secondary" data-reload>Carregar novamente</button></div>`;
}

function metric(label, value, iconName, note = "") {
  return `<article class="metric"><span class="metric-icon">${icon(iconName)}</span><div><small>${label}</small><strong>${value}</strong>${note ? `<p>${note}</p>` : ""}</div></article>`;
}

function statusBadge(status) {
  const labels = { draft: "Rascunho", published: "Publicado", archived: "Arquivado", submitted: "Enviada", reviewed: "Revisada" };
  return `<span class="status status-${status}">${labels[status] || status}</span>`;
}

async function countRows(table, filter) {
  let query = supabase.from(table).select("*", { count: "exact", head: true });
  if (filter) query = filter(query);
  const { count, error } = await query;
  if (error) throw error;
  return count || 0;
}

async function renderAdminOverview(content) {
  const [companies, apprentices, courses, activities] = await Promise.all([
    countRows("companies", (query) => query.eq("is_active", true)),
    countRows("profiles", (query) => query.eq("role", "apprentice").eq("is_active", true)),
    countRows("courses"),
    countRows("activities"),
  ]);

  const ready = companies > 0 && courses > 0 && apprentices > 0;
  content.innerHTML = `
    ${pageHead("Visão geral", "Os números abaixo vêm diretamente dos cadastros do portal.")}
    <section class="metric-grid">
      ${metric("Empresas ativas", companies, "building")}
      ${metric("Jovens convidados", apprentices, "users")}
      ${metric("Cursos", courses, "book")}
      ${metric("Atividades", activities, "check")}
    </section>
    <section class="split-grid">
      <article class="card checklist-card">
        <div class="card-head"><div><span class="eyebrow">Primeiros passos</span><h2>Prepare a operação da CAFCM</h2></div></div>
        ${checklistItem("Cadastrar uma empresa", companies > 0, "companies")}
        ${checklistItem("Criar o primeiro curso", courses > 0, "courses")}
        ${checklistItem("Convidar um jovem", apprentices > 0, "people")}
        ${checklistItem("Matricular o jovem no curso", ready, "enrollments")}
      </article>
      <article class="card privacy-card">
        <span class="privacy-icon">${icon("shield")}</span>
        <h2>Separação de acessos ativa</h2>
        <p>Jovens acessam apenas as próprias matrículas. Empresas visualizam somente aprendizes vinculados. Respostas das atividades permanecem entre o jovem e a CAFCM.</p>
        <button class="text-link" data-open-wizard>Rever o guia da plataforma</button>
      </article>
    </section>
  `;
}

function checklistItem(label, done, destination) {
  return `<button class="checklist-item" data-nav="${destination}"><span class="check-circle ${done ? "done" : ""}">${done ? icon("check") : ""}</span><span>${label}</span>${icon("chevron")}</button>`;
}

async function renderCompanies(content) {
  const [{ data, error }, { data: linkedProfiles }] = await Promise.all([
    supabase.from("companies").select("*").order("is_active", { ascending: false }).order("name"),
    supabase.from("profiles").select("company_id").not("company_id", "is", null),
  ]);
  if (error) throw error;
  const linkedCount = new Map();
  for (const profile of linkedProfiles || []) {
    linkedCount.set(profile.company_id, (linkedCount.get(profile.company_id) || 0) + 1);
  }

  content.innerHTML = `
    ${pageHead("Empresas parceiras", "Mantenha identificação, contatos e situação de cada organização acompanhada pela CAFCM.",
      `<button class="btn btn-primary" data-dialog="company">${icon("plus")} Nova empresa</button>`)}
    ${data.length ? `<section class="company-grid">
      ${data.map((company) => {
        const address = [company.street, company.street_number, company.district, company.city, company.state].filter(Boolean).join(", ");
        const people = linkedCount.get(company.id) || 0;
        return `<article class="company-card ${company.is_active ? "" : "company-inactive"}">
          <header class="company-card-head">
            <span class="company-mark">${icon("building")}</span>
            <div><h2>${escapeHtml(company.name)}</h2><p>${escapeHtml(company.legal_name || "Razão social não informada")}</p></div>
            <span class="status ${company.is_active ? "status-published" : "status-archived"}">${company.is_active ? "Ativa" : "Inativa"}</span>
          </header>
          <div class="company-facts">
            <div><small>CNPJ</small><strong>${escapeHtml(formatCnpj(company.cnpj))}</strong></div>
            <div><small>Pessoas vinculadas</small><strong>${people}</strong></div>
            <div><small>Contato</small><strong>${escapeHtml(company.contact_name || "Não informado")}</strong><span>${escapeHtml([company.contact_role, company.contact_email || company.email || formatPhone(company.contact_phone || company.phone)].filter(Boolean).join(" · "))}</span></div>
            <div><small>Localização</small><strong>${escapeHtml(address || "Endereço não informado")}</strong></div>
          </div>
          <footer class="company-actions">
            <button class="btn btn-small btn-secondary" data-edit-company="${company.id}">${icon("edit")} Alterar</button>
            <button class="btn btn-small btn-quiet" data-toggle-company="${company.id}" data-company-active="${company.is_active}">${company.is_active ? "Inativar" : "Reativar"}</button>
            <button class="icon-btn danger-button" data-delete-company="${company.id}" data-company-name="${escapeHtml(company.name)}" aria-label="Excluir ${escapeHtml(company.name)}">${icon("trash")}</button>
          </footer>
        </article>`;
      }).join("")}
    </section>` : `<section class="card">${emptyState("Nenhuma empresa cadastrada", "Cadastre a primeira empresa para depois vincular seus representantes e aprendizes.", `<button class="btn btn-primary" data-dialog="company">Cadastrar empresa</button>`)}</section>`}
  `;
}

async function renderPeople(content) {
  const [result, { data: companies, error: companiesError }] = await Promise.all([
    callAdmin({ action: "list_users" }, true),
    supabase.from("companies").select("id,name").order("name"),
  ]);
  if (companiesError) throw companiesError;
  const people = result.users || [];
  state.people = people;
  const companyMap = new Map((companies || []).map((item) => [item.id, item.name]));
  const pendingCount = people.filter((person) => person.accessExists && person.isActive && !person.emailConfirmedAt).length;
  const activeCount = people.filter((person) => person.emailConfirmedAt && person.isActive).length;
  const archivedCount = people.filter((person) => !person.isActive).length;

  content.innerHTML = `
    ${pageHead("Pessoas e convites", "Gerencie perfis, credenciais, histórico de aprendizagem e acessos criados pela CAFCM.",
      `<div class="page-actions">
        <button class="btn btn-quiet" data-download-people-template>${icon("download")} Modelo CSV</button>
        <button class="btn btn-secondary" data-export-people>${icon("download")} Salvar backup</button>
        <button class="btn btn-secondary" data-dialog="people-import">${icon("upload")} Importar</button>
        <button class="btn btn-primary" data-dialog="invite">${icon("mail")} Enviar convite</button>
      </div>`)}
    <section class="people-summary">
      <span><strong>${people.length}</strong> pessoas</span>
      <span><strong>${activeCount}</strong> acessos confirmados</span>
      <span><strong>${pendingCount}</strong> ${pendingCount === 1 ? "convite pendente" : "convites pendentes"}</span>
      <span><strong>${archivedCount}</strong> ${archivedCount === 1 ? "acesso arquivado" : "acessos arquivados"}</span>
    </section>
    ${pendingCount ? `<div class="notice">Há ${pendingCount} ${pendingCount === 1 ? "pessoa que ainda não confirmou" : "pessoas que ainda não confirmaram"} o e-mail. Use “Reenviar convite” na pessoa correspondente.</div>` : ""}
    <section class="card">
      ${people.length ? `<div class="people-list">
        ${people.map((person) => {
          const pending = person.accessExists && person.isActive && !person.emailConfirmedAt;
          const inactive = !person.isActive;
          const statusLabel = !person.accessExists ? "Acesso removido" : inactive ? "Arquivado" : pending ? "Convite pendente" : "Ativo";
          const statusClass = inactive ? "status-archived" : pending ? "status-draft" : "status-published";
          const organization = person.role === "cafcm_admin"
            ? "CAFCM"
            : person.companyId
              ? companyMap.get(person.companyId) || "Empresa vinculada"
              : "Sem empresa vinculada";
          return `
          <article class="person-row">
            <span class="avatar">${escapeHtml(initials(person.fullName))}</span>
            <div class="person-main"><strong>${escapeHtml(person.fullName || "Nome não informado")}</strong><small>${escapeHtml(person.email || "E-mail não disponível")}</small><small>${escapeHtml(organization)}</small></div>
            <div class="person-access"><span class="role-pill">${roleLabels[person.role] || "Pendente"}</span><span class="status ${statusClass}">${statusLabel}</span></div>
            <div class="person-dates"><small>Criado em ${formatDate(person.createdAt, true)}</small><small>${person.lastSignInAt ? `Último acesso em ${formatDate(person.lastSignInAt, true)}` : "Ainda não acessou"}</small></div>
            <div class="person-actions">
              <button class="btn btn-small btn-secondary" data-person-history="${person.id}">${icon("history")} Histórico</button>
              ${person.accessExists && person.isActive ? `<button class="btn btn-small btn-secondary" data-edit-person="${person.id}">${icon("edit")} Perfil e senha</button>` : ""}
              ${person.accessExists && person.isActive ? `<button class="btn btn-small btn-quiet" data-resend-access="${person.id}" data-access-pending="${pending}">${pending ? "Reenviar convite" : "Enviar recuperação"}</button>` : ""}
              ${person.id !== state.profile.id && person.accessExists ? `<button class="btn btn-small ${inactive ? "btn-secondary" : "btn-danger-soft"}" data-set-person-active="${person.id}" data-person-active="${inactive ? "true" : "false"}" data-person-name="${escapeHtml(person.fullName)}">${inactive ? "Restaurar acesso" : "Excluir acesso"}</button>` : ""}
            </div>
          </article>
        `;}).join("")}
      </div>` : emptyState("Nenhum convite enviado", "Depois de cadastrar as empresas, convide jovens e representantes para acessar o portal.", `<button class="btn btn-primary" data-dialog="invite">Enviar primeiro convite</button>`)}
    </section>
  `;
}

async function renderAudit(content) {
  let auditQuery = supabase
    .from("audit_logs")
    .select("id,actor_id,subject_user_id,action,entity_type,entity_id,details,occurred_at")
    .order("occurred_at", { ascending: false })
    .limit(250);
  if (state.auditPersonId) auditQuery = auditQuery.or(`actor_id.eq.${state.auditPersonId},subject_user_id.eq.${state.auditPersonId}`);

  const [{ data: logs, error }, { data: profiles, error: profilesError }] = await Promise.all([
    auditQuery,
    supabase.from("profiles").select("id,full_name").order("full_name"),
  ]);
  if (error || profilesError) throw error || profilesError;

  const profileMap = new Map((profiles || []).map((profile) => [profile.id, profile.full_name]));
  const selectedName = state.auditPersonId ? profileMap.get(state.auditPersonId) || "Pessoa selecionada" : null;
  const today = new Date().toISOString().slice(0, 10);
  const todayCount = (logs || []).filter((log) => String(log.occurred_at || "").slice(0, 10) === today).length;
  const userActions = (logs || []).filter((log) => log.actor_id).length;

  content.innerHTML = `
    ${pageHead("Auditoria do portal", selectedName ? `Mostrando as ações relacionadas a ${escapeHtml(selectedName)}.` : "Registro cronológico das ações relevantes de usuários e da equipe CAFCM.",
      selectedName ? `<button class="btn btn-secondary" data-clear-audit-filter>Ver todas as ações</button>` : "")}
    <section class="metric-grid three audit-metrics">
      ${metric("Registros exibidos", (logs || []).length, "history")}
      ${metric("Ações de usuários", userActions, "users")}
      ${metric("Registradas hoje", todayCount, "clock")}
    </section>
    <section class="card audit-card">
      <div class="card-head"><div><span class="eyebrow">Trilha de auditoria</span><h2>Atividade mais recente</h2></div></div>
      ${(logs || []).length ? `<div class="audit-list">${logs.map((log) => {
        const actor = log.actor_id ? profileMap.get(log.actor_id) || "Usuário arquivado" : "Sistema";
        const subject = log.subject_user_id && log.subject_user_id !== log.actor_id ? profileMap.get(log.subject_user_id) : null;
        const detail = log.details?.label || subject || "";
        return `<article class="audit-row">
          <span class="audit-dot">${icon(log.action.includes("lesson") || log.action.includes("course") ? "book" : log.action.includes("user") || log.action.includes("profile") ? "users" : "history")}</span>
          <div><strong>${escapeHtml(auditActionLabels[log.action] || log.action)}</strong><p>${escapeHtml(actor)}${subject ? ` · relacionado a ${escapeHtml(subject)}` : ""}${detail && detail !== subject ? ` · ${escapeHtml(detail)}` : ""}</p></div>
          <time datetime="${escapeHtml(log.occurred_at)}">${formatDate(log.occurred_at, true)}</time>
        </article>`;
      }).join("")}</div>` : emptyState("Nenhuma ação registrada", "Os novos acessos, alterações, conclusões e envios aparecerão aqui.")}
    </section>
  `;
}

async function renderCourses(content) {
  const [{ data, error }, { data: enrollments }] = await Promise.all([
    supabase.from("courses").select("*").order("updated_at", { ascending: false }),
    supabase.from("enrollments").select("course_id"),
  ]);
  if (error) throw error;
  const enrollmentCount = new Map();
  for (const enrollment of enrollments || []) {
    enrollmentCount.set(enrollment.course_id, (enrollmentCount.get(enrollment.course_id) || 0) + 1);
  }
  content.innerHTML = `
    ${pageHead("Cursos", "Organize objetivos, carga horária, aulas e atividades antes de liberar a formação.",
      `<button class="btn btn-primary" data-dialog="course">${icon("plus")} Novo curso</button>`)}
    <section class="course-grid">
      ${data.length ? data.map((course) => `
        <article class="course-card">
          <div class="course-card-top"><span class="course-symbol">${icon("book")}</span>${statusBadge(course.status)}</div>
          <span class="course-category">${escapeHtml(course.category || "Sem categoria")}</span>
          <h2>${escapeHtml(course.title)}</h2>
          <p>${escapeHtml(course.description || "Sem descrição cadastrada.")}</p>
          <div class="course-counts">
            <span><strong>${course.lessons_count}</strong> aulas</span>
            <span><strong>${course.activities_count}</strong> atividades</span>
            <span><strong>${enrollmentCount.get(course.id) || 0}</strong> matrículas</span>
          </div>
          <small class="course-workload">${formatWorkload(course.workload_hours)}</small>
          <button class="btn btn-secondary btn-block" data-open-course="${course.id}">Gerenciar curso ${icon("arrow")}</button>
        </article>
      `).join("") : emptyState("Nenhum curso criado", "Crie o primeiro curso. Ele permanecerá como rascunho até a publicação.", `<button class="btn btn-primary" data-dialog="course">Criar primeiro curso</button>`)}
    </section>
  `;
}

async function renderCourseEditor(content) {
  if (!state.selectedCourseId) return navigate("courses");
  const [{ data: course, error }, { data: lessons }, { data: activities }, { count: enrollmentCount }] = await Promise.all([
    supabase.from("courses").select("*").eq("id", state.selectedCourseId).single(),
    supabase.from("lessons").select("*,lesson_blocks(id,block_type,title,position)").eq("course_id", state.selectedCourseId).order("position"),
    supabase.from("activities").select("*").eq("course_id", state.selectedCourseId).order("position"),
    supabase.from("enrollments").select("*", { count: "exact", head: true }).eq("course_id", state.selectedCourseId),
  ]);
  if (error || !course) throw error || new Error("Curso não encontrado.");
  const lessonMap = new Map((lessons || []).map((lesson) => [lesson.id, lesson.title]));
  const detailsReady = Boolean(course.description?.trim() && course.objectives?.trim() && Number(course.workload_hours) > 0);
  const structuredLessons = Boolean(lessons?.length) && lessons.every((lesson) => lesson.lesson_blocks?.length);

  content.innerHTML = `
    <button class="back-button" data-nav="courses">← Voltar aos cursos</button>
    <header class="editor-head">
      <div>
        <div class="editor-meta">${statusBadge(course.status)}<span>${escapeHtml(course.category || "Sem categoria")}</span><span>${formatWorkload(course.workload_hours)}</span><span>${enrollmentCount || 0} matrículas</span></div>
        <h1>${escapeHtml(course.title)}</h1>
        <p>${escapeHtml(course.description || "Sem descrição cadastrada.")}</p>
      </div>
      <div class="editor-actions">
        <button class="btn btn-secondary" data-edit-course="${course.id}">${icon("edit")} Alterar dados</button>
        ${course.status !== "archived" ? `<button class="btn ${course.status === "published" ? "btn-secondary" : "btn-primary"}" data-toggle-course-status="${course.id}" data-current-status="${course.status}">${course.status === "published" ? "Voltar para rascunho" : "Publicar curso"}</button>` : ""}
        <button class="btn btn-quiet" data-archive-course="${course.id}" data-course-status="${course.status}">${icon("archive")} ${course.status === "archived" ? "Reabrir" : "Arquivar"}</button>
        <button class="icon-btn danger-button" data-delete-course="${course.id}" data-course-title="${escapeHtml(course.title)}" aria-label="Excluir curso">${icon("trash")}</button>
      </div>
    </header>
    <section class="course-admin-summary">
      <article class="card readiness-card">
        <div class="card-head"><div><span class="eyebrow">Preparação</span><h2>Pronto para publicar?</h2></div></div>
        ${readinessItem("Dados pedagógicos preenchidos", detailsReady, "Inclua descrição, objetivos e carga horária.")}
        ${readinessItem("Ao menos uma aula", Boolean(lessons?.length), "Obrigatório para publicar.")}
        ${readinessItem("Todas as aulas estruturadas", structuredLessons, "Cada aula precisa de ao menos uma linha de aprendizagem.")}
        ${readinessItem("Atividade prática", Boolean(activities?.length), "Recomendado para acompanhar a aprendizagem.")}
      </article>
      <article class="card objectives-card">
        <span class="eyebrow">Objetivos de aprendizagem</span>
        <p>${escapeHtml(course.objectives || "Ainda não informados. Use “Alterar dados” para registrar o que o jovem deverá aprender.")}</p>
      </article>
    </section>
    <div class="editor-grid">
      <section class="card">
        <div class="card-head"><div><span class="eyebrow">Conteúdo</span><h2>Aulas</h2></div><button class="btn btn-small btn-secondary" data-dialog="lesson">${icon("plus")} Adicionar</button></div>
        ${lessons?.length ? `<ol class="editor-list lesson-admin-list">${lessons.map((lesson) => {
          const blocks = [...(lesson.lesson_blocks || [])].sort((a, b) => a.position - b.position);
          return `<li><span>${lesson.position}</span><div><strong>${escapeHtml(lesson.title)}</strong><p>${escapeHtml(lesson.summary || "Resumo ainda não informado.")}</p><div class="lesson-structure-summary"><b>${blocks.length} ${blocks.length === 1 ? "linha" : "linhas"}</b>${lesson.estimated_minutes ? `<small>${lesson.estimated_minutes} min</small>` : ""}${blocks.slice(0, 4).map((block) => `<small>${escapeHtml(blockTypeLabels[block.block_type] || block.block_type)}</small>`).join("")}</div><div class="item-actions"><button class="text-link" data-open-lesson-editor="${lesson.id}">Estruturar aula</button><button class="text-link" data-edit-lesson="${lesson.id}">Alterar dados</button><button class="text-link danger-button" data-delete-lesson="${lesson.id}" data-item-title="${escapeHtml(lesson.title)}">Excluir</button></div></div></li>`;
        }).join("")}</ol>` : emptyState("Nenhuma aula", "Adicione ao menos uma aula antes de publicar.")}
      </section>
      <section class="card">
        <div class="card-head"><div><span class="eyebrow">Prática</span><h2>Atividades</h2></div><button class="btn btn-small btn-secondary" data-dialog="activity">${icon("plus")} Adicionar</button></div>
        ${activities?.length ? `<div class="editor-list activities-editor">${activities.map((activity) => `<article><span>${activity.position}</span><div><strong>${escapeHtml(activity.title)}</strong><p>${escapeHtml(activity.instructions || "Sem instruções.")}</p><small>${activity.lesson_id ? `Aula: ${escapeHtml(lessonMap.get(activity.lesson_id) || "Relacionada")}` : "Sem aula específica"} · ${formatDate(activity.due_at, true)}</small><div class="item-actions"><button class="text-link" data-edit-activity="${activity.id}">Alterar</button><button class="text-link danger-button" data-delete-activity="${activity.id}" data-item-title="${escapeHtml(activity.title)}">Excluir</button></div></div></article>`).join("")}</div>` : emptyState("Nenhuma atividade", "As atividades são opcionais e podem ser acrescentadas depois.")}
      </section>
    </div>
  `;
}

async function renderLessonEditor(content) {
  if (!state.selectedCourseId || !state.selectedLessonId) return navigate("courses");
  const [{ data: course, error: courseError }, { data: lesson, error: lessonError }, { data: blocks }, { data: activities }] = await Promise.all([
    supabase.from("courses").select("id,title,status").eq("id", state.selectedCourseId).single(),
    supabase.from("lessons").select("*").eq("id", state.selectedLessonId).eq("course_id", state.selectedCourseId).single(),
    supabase.from("lesson_blocks").select("*").eq("lesson_id", state.selectedLessonId).order("position"),
    supabase.from("activities").select("*").eq("lesson_id", state.selectedLessonId).order("position"),
  ]);
  if (courseError || lessonError || !course || !lesson) throw courseError || lessonError || new Error("Aula não encontrada.");

  content.innerHTML = `
    <button class="back-button" data-return-course-editor>← Voltar ao curso</button>
    <header class="editor-head lesson-editor-head">
      <div><div class="editor-meta"><span>Aula ${lesson.position}</span>${lesson.estimated_minutes ? `<span>${lesson.estimated_minutes} minutos</span>` : ""}${statusBadge(course.status)}</div><h1>${escapeHtml(lesson.title)}</h1><p>${escapeHtml(lesson.summary || "Organize abaixo o caminho que o jovem percorrerá nesta aula.")}</p></div>
      <div class="editor-actions"><button class="btn btn-secondary" data-edit-lesson="${lesson.id}">${icon("edit")} Alterar dados</button><button class="btn btn-primary" data-dialog="block">${icon("plus")} Nova linha</button></div>
    </header>
    <section class="learning-builder-intro">
      <div><strong>Como esta aula funciona</strong><p>Cada linha abaixo vira uma etapa em tela cheia para o jovem. Ele avança como em uma apresentação e conclui a aula no final.</p></div>
      <div class="builder-flow"><span>Texto</span><i>→</i><span>Slides</span><i>→</i><span>Vídeo</span><i>→</i><span>Considerações</span><i>→</i><span>Atividade</span></div>
    </section>
    <section class="card learning-builder">
      <div class="card-head"><div><span class="eyebrow">Sequência pedagógica</span><h2>Linhas de aprendizagem</h2></div><button class="btn btn-small btn-secondary" data-dialog="block">${icon("plus")} Adicionar etapa</button></div>
      ${(blocks || []).length ? `<div class="block-admin-list">${blocks.map((block, index) => {
        const slides = block.block_type === "slides" ? parseSlides(block.content) : [];
        return `<article class="block-admin-card">
          <span class="block-number">${index + 1}</span>
          <span class="block-kind">${icon(block.block_type === "video" ? "play" : block.block_type === "slides" ? "presentation" : block.block_type === "text" ? "image" : "book")} ${escapeHtml(blockTypeLabels[block.block_type] || block.block_type)}</span>
          <div class="block-admin-copy"><h3>${escapeHtml(block.title || blockTypeLabels[block.block_type])}</h3><p>${escapeHtml(compactText(block.content || (block.media_url ? "Mídia vinculada à etapa." : "Sem conteúdo.")))}</p>${slides.length ? `<small>${slides.length} slides</small>` : ""}${block.media_url ? `<small class="media-reference">Mídia: ${escapeHtml(compactText(block.media_url, 80))}</small>` : ""}</div>
          <div class="block-admin-actions"><button class="icon-btn" data-move-block="${block.id}" data-move-direction="up" ${index === 0 ? "disabled" : ""} aria-label="Mover para cima">↑</button><button class="icon-btn" data-move-block="${block.id}" data-move-direction="down" ${index === blocks.length - 1 ? "disabled" : ""} aria-label="Mover para baixo">↓</button><button class="btn btn-small btn-secondary" data-edit-block="${block.id}">Alterar</button><button class="icon-btn danger-button" data-delete-block="${block.id}" data-item-title="${escapeHtml(block.title || blockTypeLabels[block.block_type])}" aria-label="Excluir linha">${icon("trash")}</button></div>
        </article>`;
      }).join("")}</div>` : emptyState("A aula ainda está vazia", "Adicione a primeira linha de aprendizagem. O texto antigo, quando existente, já foi convertido automaticamente.", `<button class="btn btn-primary" data-dialog="block">Criar primeira linha</button>`)}
    </section>
    <section class="card lesson-activity-builder">
      <div class="card-head"><div><span class="eyebrow">Etapa final</span><h2>Atividade da aula</h2></div><button class="btn btn-small btn-secondary" data-dialog="activity">${icon("plus")} Adicionar atividade</button></div>
      ${(activities || []).length ? `<div class="editor-list activities-editor">${activities.map((activity) => `<article><span>${activity.position}</span><div><strong>${escapeHtml(activity.title)}</strong><p>${escapeHtml(activity.instructions || "Sem instruções.")}</p><small>${formatDate(activity.due_at, true)}</small><div class="item-actions"><button class="text-link" data-edit-activity="${activity.id}">Alterar</button><button class="text-link danger-button" data-delete-activity="${activity.id}" data-item-title="${escapeHtml(activity.title)}">Excluir</button></div></div></article>`).join("")}</div>` : `<p class="muted-note">Opcional. Quando criada, a atividade aparece depois da última linha de aprendizagem.</p>`}
    </section>
  `;
}

function readinessItem(label, ready, note) {
  return `<div class="readiness-item"><span class="check-circle ${ready ? "done" : ""}">${ready ? icon("check") : ""}</span><div><strong>${label}</strong><small>${note}</small></div></div>`;
}

async function renderEnrollments(content) {
  const [{ data: apprentices, error }, { data: courses }, { data: enrollments }] = await Promise.all([
    supabase.from("profiles").select("id,full_name").eq("role", "apprentice").eq("is_active", true).order("full_name"),
    supabase.from("courses").select("id,title,status").neq("status", "archived").order("title"),
    supabase.from("enrollments").select("course_id,apprentice_id,assigned_at").order("assigned_at", { ascending: false }),
  ]);
  if (error) throw error;
  const apprenticeMap = new Map((apprentices || []).map((item) => [item.id, item.full_name]));
  const courseMap = new Map((courses || []).map((item) => [item.id, item.title]));

  content.innerHTML = `
    ${pageHead("Matrículas", "Vincule um jovem já convidado a um curso criado pela CAFCM.",
      `<button class="btn btn-primary" data-dialog="enrollment" ${!apprentices?.length || !courses?.length ? "disabled" : ""}>${icon("link")} Nova matrícula</button>`)}
    ${!apprentices?.length || !courses?.length ? `<div class="notice">Para matricular, é necessário ter pelo menos um jovem convidado e um curso criado.</div>` : ""}
    <section class="card">
      ${enrollments?.length ? `<div class="list-table">
        <div class="list-row enrollment-row list-header"><span>Jovem</span><span>Curso</span><span>Data</span><span></span></div>
        ${enrollments.map((item) => `<div class="list-row enrollment-row"><strong>${escapeHtml(apprenticeMap.get(item.apprentice_id) || "Jovem")}</strong><span>${escapeHtml(courseMap.get(item.course_id) || "Curso")}</span><span>${formatDate(item.assigned_at)}</span><button class="icon-btn danger-button" data-remove-enrollment="${item.course_id}" data-apprentice="${item.apprentice_id}" aria-label="Remover matrícula">×</button></div>`).join("")}
      </div>` : emptyState("Nenhuma matrícula", "Quando houver jovens e cursos, crie aqui o primeiro vínculo.")}
    </section>
  `;
}

async function getStudentData() {
  const userId = state.profile.id;
  const [{ data: enrollments, error }, { data: progress }, { data: attempts }] = await Promise.all([
    supabase.from("enrollments").select("course_id,assigned_at").eq("apprentice_id", userId),
    supabase.from("lesson_progress").select("lesson_id,completed_at").eq("apprentice_id", userId),
    supabase.from("activity_attempts").select("activity_id,status,submitted_at").eq("apprentice_id", userId),
  ]);
  if (error) throw error;
  const ids = (enrollments || []).map((item) => item.course_id);
  let courses = [];
  let lessons = [];
  if (ids.length) {
    const [courseResult, lessonResult] = await Promise.all([
      supabase.from("courses").select("*").in("id", ids).order("title"),
      supabase.from("lessons").select("id,course_id").in("course_id", ids),
    ]);
    if (courseResult.error) throw courseResult.error;
    courses = courseResult.data || [];
    lessons = lessonResult.data || [];
  }
  const lessonCourse = new Map(lessons.map((lesson) => [lesson.id, lesson.course_id]));
  const enrichedProgress = (progress || []).map((item) => ({ ...item, course_id: lessonCourse.get(item.lesson_id) }));
  return { enrollments: enrollments || [], courses, lessons, progress: enrichedProgress, attempts: attempts || [] };
}

async function renderStudentHome(content) {
  const data = await getStudentData();
  const totalLessons = data.courses.reduce((sum, course) => sum + course.lessons_count, 0);
  const completedLessons = data.progress.length;
  const totalActivities = data.courses.reduce((sum, course) => sum + course.activities_count, 0);
  const submitted = data.attempts.length;

  content.innerHTML = `
    ${pageHead(`Olá, ${escapeHtml(state.profile.full_name || "aprendiz")}!`, "Seu progresso é atualizado conforme você conclui aulas e envia atividades.")}
    <section class="metric-grid three">
      ${metric("Cursos matriculados", data.courses.length, "book")}
      ${metric("Aulas concluídas", `${completedLessons} de ${totalLessons}`, "check")}
      ${metric("Atividades enviadas", `${submitted} de ${totalActivities}`, "mail")}
    </section>
    <section class="card">
      <div class="card-head"><div><span class="eyebrow">Continuar aprendendo</span><h2>Seus cursos</h2></div><button class="text-link" data-nav="student-courses">Ver todos</button></div>
      ${data.courses.length ? `<div class="student-course-list">${data.courses.slice(0, 3).map((course) => studentCourseCard(course, data.progress)).join("")}</div>` : emptyState("Nenhum curso liberado", "Sua conta está ativa. Quando a CAFCM realizar uma matrícula, o curso aparecerá aqui.")}
    </section>
  `;
}

function studentCourseCard(course, progress) {
  const completed = progress.filter((item) => item.course_id === course.id).length;
  const percent = progressPercent(completed, course.lessons_count);
  return `<button class="student-course-row" data-open-course="${course.id}"><span class="course-symbol">${icon("book")}</span><div><strong>${escapeHtml(course.title)}</strong><small>${escapeHtml(course.category || "Formação")} · ${formatWorkload(course.workload_hours)}</small><small>${course.lessons_count} aulas · ${course.activities_count} atividades</small><span class="progress-bar"><i style="width:${percent}%"></i></span></div><b>${percent}%</b>${icon("chevron")}</button>`;
}

async function renderStudentCourses(content) {
  const data = await getStudentData();
  const progressByCourse = new Map();
  for (const item of data.progress) {
    if (item.course_id) progressByCourse.set(item.course_id, (progressByCourse.get(item.course_id) || 0) + 1);
  }

  content.innerHTML = `
    ${pageHead("Meus cursos", "Apenas formações publicadas e vinculadas à sua conta aparecem aqui.")}
    <section class="course-grid">
      ${data.courses.length ? data.courses.map((course) => {
        const completed = progressByCourse.get(course.id) || 0;
        const percent = progressPercent(completed, course.lessons_count);
        return `<article class="course-card student-card"><span class="course-symbol">${icon("book")}</span><span class="course-category">${escapeHtml(course.category || "Formação")}</span><h2>${escapeHtml(course.title)}</h2><p>${escapeHtml(course.description || "Sem descrição cadastrada.")}</p><small class="course-workload">${formatWorkload(course.workload_hours)}</small><div class="progress-line"><span><i style="width:${percent}%"></i></span><b>${percent}%</b></div><button class="btn btn-primary btn-block" data-open-course="${course.id}">Abrir curso ${icon("arrow")}</button></article>`;
      }).join("") : emptyState("Nenhum curso liberado", "Aguarde a CAFCM realizar sua matrícula em uma formação publicada.")}
    </section>
  `;
}

async function renderStudentActivities(content) {
  const userId = state.profile.id;
  const [{ data: enrollments, error }, { data: attempts }] = await Promise.all([
    supabase.from("enrollments").select("course_id").eq("apprentice_id", userId),
    supabase.from("activity_attempts").select("activity_id,status,submitted_at").eq("apprentice_id", userId),
  ]);
  if (error) throw error;
  const courseIds = (enrollments || []).map((item) => item.course_id);
  let activities = [];
  let courses = [];
  if (courseIds.length) {
    const [activityResult, courseResult] = await Promise.all([
      supabase.from("activities").select("*").in("course_id", courseIds).order("due_at", { ascending: true, nullsFirst: false }),
      supabase.from("courses").select("id,title").in("id", courseIds),
    ]);
    activities = activityResult.data || [];
    courses = courseResult.data || [];
  }
  const attemptMap = new Map((attempts || []).map((item) => [item.activity_id, item]));
  const courseMap = new Map(courses.map((item) => [item.id, item.title]));

  content.innerHTML = `
    ${pageHead("Atividades", "Suas respostas ficam disponíveis para você e para a equipe CAFCM.")}
    <section class="activity-grid">
      ${activities.length ? activities.map((activity) => {
        const attempt = attemptMap.get(activity.id);
        return `<article class="activity-card"><div><span class="eyebrow">${escapeHtml(courseMap.get(activity.course_id) || "Curso")}</span><h2>${escapeHtml(activity.title)}</h2><p>${escapeHtml(activity.instructions || "Sem instruções cadastradas.")}</p></div><div class="activity-foot"><span>${icon("calendar")} ${formatDate(activity.due_at, true)}</span>${attempt ? statusBadge(attempt.status) : `<button class="btn btn-primary btn-small" data-answer-activity="${activity.id}">Responder</button>`}</div></article>`;
      }).join("") : emptyState("Nenhuma atividade disponível", "As atividades dos seus cursos aparecerão aqui.")}
    </section>
  `;
}

async function renderStudentCourse(content) {
  if (!state.selectedCourseId) return navigate("student-courses");
  if (state.selectedLessonId) return renderStudentLesson(content);
  const userId = state.profile.id;
  const [{ data: course, error }, { data: lessons }, { data: activities }, { data: progress }, { data: attempts }] = await Promise.all([
    supabase.from("courses").select("*").eq("id", state.selectedCourseId).single(),
    supabase.from("lessons").select("*,lesson_blocks(id)").eq("course_id", state.selectedCourseId).order("position"),
    supabase.from("activities").select("*").eq("course_id", state.selectedCourseId).order("position"),
    supabase.from("lesson_progress").select("lesson_id").eq("apprentice_id", userId),
    supabase.from("activity_attempts").select("activity_id,status").eq("apprentice_id", userId),
  ]);
  if (error || !course) throw error || new Error("Curso não encontrado.");
  const completed = new Set((progress || []).map((item) => item.lesson_id));
  const attemptMap = new Map((attempts || []).map((item) => [item.activity_id, item.status]));
  const percent = progressPercent((lessons || []).filter((item) => completed.has(item.id)).length, lessons?.length || 0);

  content.innerHTML = `
    <button class="back-button" data-nav="student-courses">← Voltar aos cursos</button>
    <header class="student-course-head"><div><span class="eyebrow">${escapeHtml(course.category || "Curso")}</span><h1>${escapeHtml(course.title)}</h1><p>${escapeHtml(course.description || "Sem descrição cadastrada.")}</p><small class="student-workload">${formatWorkload(course.workload_hours)}</small></div><div class="progress-ring"><strong>${percent}%</strong><small>concluído</small></div></header>
    ${course.objectives ? `<section class="card student-objectives"><span class="eyebrow">O que você vai aprender</span><p>${escapeHtml(course.objectives)}</p></section>` : ""}
    <div class="course-learning-grid">
      <section class="card learning-list">
        <div class="card-head"><div><span class="eyebrow">Conteúdo</span><h2>Aulas</h2></div></div>
        ${lessons?.length ? lessons.map((lesson) => `
          <article class="lesson-item ${completed.has(lesson.id) ? "complete" : ""}">
            <span class="lesson-toggle">${completed.has(lesson.id) ? icon("check") : lesson.position}</span>
            <div><small>Aula ${lesson.position}${lesson.estimated_minutes ? ` · ${lesson.estimated_minutes} min` : ""}</small><h3>${escapeHtml(lesson.title)}</h3><p>${escapeHtml(lesson.summary || "Abra a aula para percorrer as linhas de aprendizagem.")}</p><small>${lesson.lesson_blocks?.length || (lesson.content ? 1 : 0)} etapas de conteúdo</small></div>
            <button class="btn btn-small ${completed.has(lesson.id) ? "btn-secondary" : "btn-primary"}" data-open-lesson="${lesson.id}">${completed.has(lesson.id) ? "Rever aula" : "Abrir aula"} ${icon("arrow")}</button>
          </article>
        `).join("") : emptyState("Nenhuma aula disponível", "A CAFCM ainda está preparando este curso.")}
      </section>
      <aside class="card course-activities">
        <div class="card-head"><div><span class="eyebrow">Prática</span><h2>Atividades complementares</h2></div></div>
        ${activities?.filter((activity) => !activity.lesson_id).length ? activities.filter((activity) => !activity.lesson_id).map((activity) => `<article><div><strong>${escapeHtml(activity.title)}</strong><small>${formatDate(activity.due_at, true)}</small></div>${attemptMap.has(activity.id) ? statusBadge(attemptMap.get(activity.id)) : `<button class="btn btn-small btn-secondary" data-answer-activity="${activity.id}">Responder</button>`}</article>`).join("") : `<p class="muted-note">As atividades ligadas a uma aula aparecem como etapa final dentro dela.</p>`}
      </aside>
    </div>
  `;
}

function videoMarkup(rawUrl, title) {
  const safeUrl = safeHttpUrl(rawUrl);
  if (!safeUrl) return `<div class="media-placeholder">${icon("play")}<p>Adicione uma URL de vídeo válida a esta etapa.</p></div>`;
  const url = new URL(safeUrl);
  let embed = "";
  if (url.hostname === "youtu.be") embed = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(url.pathname.slice(1))}`;
  if (url.hostname.endsWith("youtube.com") && url.searchParams.get("v")) embed = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(url.searchParams.get("v"))}`;
  if (url.hostname.endsWith("vimeo.com") && /^\/\d+/.test(url.pathname)) embed = `https://player.vimeo.com/video/${encodeURIComponent(url.pathname.split("/")[1])}`;
  if (embed) return `<div class="video-frame"><iframe src="${escapeHtml(embed)}" title="${escapeHtml(title || "Vídeo da aula")}" loading="lazy" allow="fullscreen; picture-in-picture" allowfullscreen></iframe></div>`;
  if (/\.(mp4|webm|ogg)(\?|$)/i.test(safeUrl)) return `<video class="lesson-video" controls preload="metadata" src="${escapeHtml(safeUrl)}"></video>`;
  return `<a class="external-media" href="${escapeHtml(safeUrl)}" target="_blank" rel="noopener noreferrer">${icon("play")} Abrir vídeo em uma nova janela</a>`;
}

function renderLearningBlock(block) {
  const mediaUrl = safeHttpUrl(block.media_url);
  const content = escapeHtml(block.content || "").replace(/\n/g, "<br>");
  if (block.block_type === "slides") {
    const slides = parseSlides(block.content);
    const index = Math.min(state.blockSlideIndex, Math.max(0, slides.length - 1));
    const slide = slides[index] || { title: "Apresentação", body: "Nenhum slide foi cadastrado." };
    return `<div class="inner-slide-deck"><div class="inner-slide"><small>Slide ${index + 1} de ${Math.max(1, slides.length)}</small><h2>${escapeHtml(slide.title)}</h2><p>${escapeHtml(slide.body).replace(/\n/g, "<br>")}</p>${mediaUrl ? `<img src="${escapeHtml(mediaUrl)}" alt="${escapeHtml(block.title || slide.title)}" loading="lazy" />` : ""}</div><div class="inner-slide-controls"><button class="btn btn-secondary" data-block-slide="back" ${index === 0 ? "disabled" : ""}>Anterior</button><div class="slide-dots">${slides.map((_, dot) => `<span class="${dot === index ? "active" : ""}"></span>`).join("")}</div><button class="btn btn-secondary" data-block-slide="next" ${index >= slides.length - 1 ? "disabled" : ""}>Próximo slide</button></div></div>`;
  }
  if (block.block_type === "video") {
    return `<div class="learning-video">${videoMarkup(block.media_url, block.title)}${content ? `<p class="supporting-text">${content}</p>` : ""}</div>`;
  }
  if (block.block_type === "considerations") {
    return `<div class="considerations-box">${icon("book")}<div><h2>${escapeHtml(block.title || "Considerações")}</h2><p>${content || "Sem considerações cadastradas."}</p></div></div>`;
  }
  return `<div class="text-learning-block"><div class="learning-copy"><p>${content || "Conteúdo ainda não informado."}</p></div>${mediaUrl ? `<figure><img src="${escapeHtml(mediaUrl)}" alt="${escapeHtml(block.title || "Imagem da aula")}" loading="lazy" /><figcaption>${escapeHtml(block.title || "Imagem de apoio")}</figcaption></figure>` : ""}</div>`;
}

async function renderStudentLesson(content) {
  const userId = state.profile.id;
  const [{ data: course, error: courseError }, { data: lesson, error: lessonError }, { data: blocks }, { data: activities }, { data: progress }] = await Promise.all([
    supabase.from("courses").select("id,title,category").eq("id", state.selectedCourseId).single(),
    supabase.from("lessons").select("*").eq("id", state.selectedLessonId).eq("course_id", state.selectedCourseId).single(),
    supabase.from("lesson_blocks").select("*").eq("lesson_id", state.selectedLessonId).order("position"),
    supabase.from("activities").select("*").eq("lesson_id", state.selectedLessonId).order("position"),
    supabase.from("lesson_progress").select("lesson_id,completed_at").eq("lesson_id", state.selectedLessonId).eq("apprentice_id", userId).maybeSingle(),
  ]);
  if (courseError || lessonError || !course || !lesson) throw courseError || lessonError || new Error("Aula não encontrada.");
  const learningBlocks = (blocks || []).length ? blocks : lesson.content ? [{ id: `legacy-${lesson.id}`, block_type: "text", title: "Conteúdo", content: lesson.content, media_url: null }] : [];
  const steps = [...learningBlocks, ...((activities || []).length ? [{ id: `activities-${lesson.id}`, block_type: "activity", title: "Atividade" }] : [])];
  const index = Math.min(state.lessonStepIndex, Math.max(0, steps.length - 1));
  state.lessonStepIndex = index;
  const step = steps[index];
  const isLast = index >= steps.length - 1;
  const completed = Boolean(progress);

  content.innerHTML = `
    <div class="lesson-player-shell">
      <header class="lesson-player-top"><button class="back-button" data-return-student-course>← Voltar ao curso</button><div><small>${escapeHtml(course.title)} · Aula ${lesson.position}</small><strong>${escapeHtml(lesson.title)}</strong></div><span>${steps.length ? `${index + 1}/${steps.length}` : "0/0"}</span></header>
      <div class="lesson-player-progress"><i style="width:${steps.length ? ((index + 1) / steps.length) * 100 : 0}%"></i></div>
      ${steps.length ? `<main class="lesson-stage"><div class="lesson-stage-label"><span>${step.block_type === "activity" ? icon("check") : icon(step.block_type === "video" ? "play" : step.block_type === "slides" ? "presentation" : step.block_type === "text" ? "image" : "book")}</span><small>${step.block_type === "activity" ? "Atividade da aula" : blockTypeLabels[step.block_type]}</small></div><h1>${escapeHtml(step.title || blockTypeLabels[step.block_type] || "Etapa da aula")}</h1>${step.block_type === "activity" ? `<div class="lesson-activity-step">${activities.map((activity) => `<article><div><strong>${escapeHtml(activity.title)}</strong><p>${escapeHtml(activity.instructions || "Responda à atividade proposta.")}</p><small>${formatDate(activity.due_at, true)}</small></div><button class="btn btn-primary" data-answer-activity="${activity.id}">Responder atividade</button></article>`).join("")}</div>` : renderLearningBlock(step)}</main>` : `<main class="lesson-stage">${emptyState("Aula sem conteúdo", "A CAFCM ainda está preparando as linhas de aprendizagem desta aula.")}</main>`}
      <footer class="lesson-player-actions"><button class="btn btn-secondary" data-lesson-step="back" ${index === 0 ? "disabled" : ""}>← Etapa anterior</button><span>${completed ? `${icon("check")} Aula já concluída` : "Seu avanço é salvo ao concluir"}</span>${isLast ? `<button class="btn btn-primary" data-complete-lesson="${lesson.id}">${completed ? "Voltar ao curso" : `Concluir aula ${icon("check")}`}</button>` : `<button class="btn btn-primary" data-lesson-step="next">Próxima etapa ${icon("arrow")}</button>`}</footer>
    </div>
  `;
}

async function getCompanyData() {
  const [{ data: apprentices, error }, { data: enrollments }, { data: progress }, { data: attempts }] = await Promise.all([
    supabase.from("profiles").select("id,full_name").eq("role", "apprentice").order("full_name"),
    supabase.from("enrollments").select("course_id,apprentice_id,assigned_at"),
    supabase.from("lesson_progress").select("lesson_id,course_id,apprentice_id"),
    supabase.from("activity_attempts").select("activity_id,apprentice_id,status,submitted_at"),
  ]);
  if (error) throw error;
  const courseIds = [...new Set((enrollments || []).map((item) => item.course_id))];
  let courses = [];
  let activities = [];
  if (courseIds.length) {
    const [c, a] = await Promise.all([
      supabase.from("courses").select("id,title,lessons_count,activities_count").in("id", courseIds),
      supabase.from("activities").select("id,course_id,title").in("course_id", courseIds),
    ]);
    courses = c.data || [];
    activities = a.data || [];
  }
  return { apprentices: apprentices || [], enrollments: enrollments || [], progress: progress || [], attempts: attempts || [], courses, activities };
}

async function renderCompanyHome(content) {
  const data = await getCompanyData();
  const enrolled = new Set(data.enrollments.map((item) => item.apprentice_id)).size;
  const submissions = data.attempts.length;
  content.innerHTML = `
    ${pageHead("Acompanhamento dos jovens", "Consulte o avanço nos cursos e os envios de atividades dos aprendizes vinculados à sua empresa.")}
    <section class="metric-grid three">
      ${metric("Jovens vinculados", data.apprentices.length, "users")}
      ${metric("Jovens com matrícula", enrolled, "book")}
      ${metric("Atividades enviadas", submissions, "check")}
    </section>
    <section class="card">
      <div class="card-head"><div><span class="eyebrow">Resumo</span><h2>Progresso dos aprendizes</h2></div><button class="text-link" data-nav="company-apprentices">Ver detalhes</button></div>
      ${data.apprentices.length ? companyRows(data) : emptyState("Nenhum jovem vinculado", "Quando a CAFCM associar aprendizes à empresa, o acompanhamento aparecerá aqui.")}
    </section>
  `;
}

async function renderCompanyApprentices(content) {
  const data = await getCompanyData();
  content.innerHTML = `
    ${pageHead("Aprendizes vinculados", "Use os indicadores de cada curso para acompanhar o estudo e orientar os próximos passos com o jovem e a CAFCM.")}
    <section class="card">${data.apprentices.length ? companyRows(data, true) : emptyState("Nenhum jovem vinculado", "A CAFCM é responsável por criar e atualizar os vínculos.")}</section>
  `;
}

function companyRows(data, detailed = false) {
  const courseMap = new Map(data.courses.map((item) => [item.id, item]));
  return `<div class="company-list">${data.apprentices.map((apprentice) => {
    const enrollments = data.enrollments.filter((item) => item.apprentice_id === apprentice.id);
    return `<article class="company-person"><div class="company-person-head"><span class="avatar">${escapeHtml(initials(apprentice.full_name))}</span><div><h2>${escapeHtml(apprentice.full_name || "Aprendiz")}</h2><small>${enrollments.length} ${enrollments.length === 1 ? "curso" : "cursos"}</small></div></div>
      ${enrollments.length ? `<div class="company-course-list">${enrollments.map((enrollment) => {
        const course = courseMap.get(enrollment.course_id);
        if (!course) return "";
        const completed = data.progress.filter((item) => item.apprentice_id === apprentice.id && item.course_id === course.id).length;
        const submitted = data.attempts.filter((item) => item.apprentice_id === apprentice.id && data.activities.some((activity) => activity.id === item.activity_id && activity.course_id === course.id)).length;
        const percent = progressPercent(completed, course.lessons_count);
        const activityTotal = Number(course.activities_count || 0);
        const studyStatus = percent === 100 && submitted >= activityTotal
          ? ["Concluído", "complete"]
          : completed === 0 && submitted === 0
            ? ["Ainda não iniciou", "not-started"]
            : ["Em andamento", "in-progress"];
        return `<div class="company-course"><div><strong>${escapeHtml(course.title)}</strong><small>Matrícula em ${formatDate(enrollment.assigned_at)}</small>${detailed ? `<span class="study-status study-status-${studyStatus[1]}">${studyStatus[0]}</span>` : ""}</div><div class="company-progress"><span><i style="width:${percent}%"></i></span><b>${percent}%</b></div>${detailed ? `<small class="company-course-summary">${completed}/${course.lessons_count} aulas concluídas · ${submitted}/${activityTotal} atividades enviadas</small>` : ""}</div>`;
      }).join("")}</div>` : `<p class="muted-note">Ainda sem matrícula em curso.</p>`}
    </article>`;
  }).join("")}</div>`;
}

function renderWizard() {
  const root = document.querySelector("#overlay-root");
  if (!root || !state.profile) return;
  const steps = wizardContent[state.profile.role] || [];
  const index = Math.min(state.wizardStep, steps.length - 1);
  const [title, text] = steps[index];
  root.innerHTML = `
    <div class="dialog-backdrop">
      <section class="wizard" role="dialog" aria-modal="true" aria-labelledby="wizard-title">
        <button class="dialog-close" data-close-wizard aria-label="Fechar guia">${icon("close")}</button>
        <div class="wizard-visual"><span>${icon(index === 0 ? "home" : index === steps.length - 1 ? "shield" : "arrow")}</span><small>Guia de uso</small><strong>${roleLabels[state.profile.role]}</strong></div>
        <div class="wizard-copy">
          <div class="wizard-progress">${steps.map((_, stepIndex) => `<span class="${stepIndex <= index ? "active" : ""}"></span>`).join("")}</div>
          <p class="eyebrow">Passo ${index + 1} de ${steps.length}</p>
          <h2 id="wizard-title">${title}</h2>
          <p>${text}</p>
          <div class="wizard-actions">
            <button class="btn btn-quiet" data-wizard-back ${index === 0 ? "disabled" : ""}>Voltar</button>
            ${index === steps.length - 1
              ? `<button class="btn btn-primary" data-wizard-finish>Concluir guia</button>`
              : `<button class="btn btn-primary" data-wizard-next>Próximo ${icon("arrow")}</button>`}
          </div>
        </div>
      </section>
    </div>
  `;
}

async function openDialog(type, recordId = null) {
  const root = document.querySelector("#overlay-root");
  if (!root) return;
  let body = "";

  if (type === "my-profile") {
    body = `<form id="my-profile-form" class="dialog-form">
      <div class="form-grid two-columns">
        <label>Nome completo<input name="fullName" required minlength="2" maxlength="160" autofocus value="${escapeHtml(state.profile.full_name || "")}" /></label>
        <label>E-mail de acesso<input value="${escapeHtml(state.session?.user?.email || "")}" disabled /><small>O e-mail é alterado pela equipe CAFCM em Pessoas e convites.</small></label>
      </div>
      <div class="form-section"><span>Segurança</span></div>
      <label>Nova senha<input name="password" type="password" minlength="10" maxlength="128" autocomplete="new-password" placeholder="Deixe em branco para manter a atual" /><small>Use pelo menos 10 caracteres.</small></label>
      <label>Confirmar nova senha<input name="confirmation" type="password" minlength="10" maxlength="128" autocomplete="new-password" /></label>
      <p class="form-note">A troca de senha é feita diretamente no serviço de autenticação e o conteúdo da senha não é registrado.</p>
      <button class="btn btn-primary" type="submit">Salvar meu perfil</button>
    </form>`;
  }

  if (type === "company") {
    let company = {};
    if (recordId) {
      const { data, error } = await supabase.from("companies").select("*").eq("id", recordId).single();
      if (error) throw error;
      company = data;
    }
    body = `<form id="company-form" class="dialog-form wide-form">
      <input type="hidden" name="companyId" value="${escapeHtml(company.id || "")}" />
      <div class="form-section"><span>Identificação</span></div>
      <div class="form-grid two-columns">
        <label>Nome fantasia<input name="name" required minlength="2" maxlength="160" autofocus value="${escapeHtml(company.name || "")}" /></label>
        <label>Razão social<input name="legalName" minlength="2" maxlength="200" value="${escapeHtml(company.legal_name || "")}" /></label>
        <label>CNPJ<input name="cnpj" inputmode="text" autocapitalize="characters" spellcheck="false" maxlength="18" placeholder="00.000.000/0000-00" value="${escapeHtml(formatCnpj(company.cnpj || "") === "CNPJ não informado" ? "" : formatCnpj(company.cnpj))}" /><small>Aceita o formato numérico e o novo formato alfanumérico.</small></label>
        <label>E-mail institucional<input name="email" type="email" maxlength="254" value="${escapeHtml(company.email || "")}" /></label>
        <label>Telefone institucional<input name="phone" inputmode="tel" maxlength="20" value="${escapeHtml(company.phone || "")}" /></label>
      </div>
      <div class="form-section"><span>Responsável na empresa</span></div>
      <div class="form-grid two-columns">
        <label>Nome<input name="contactName" minlength="2" maxlength="160" value="${escapeHtml(company.contact_name || "")}" /></label>
        <label>Cargo<input name="contactRole" maxlength="120" value="${escapeHtml(company.contact_role || "")}" /></label>
        <label>E-mail<input name="contactEmail" type="email" maxlength="254" value="${escapeHtml(company.contact_email || "")}" /></label>
        <label>Telefone<input name="contactPhone" inputmode="tel" maxlength="20" value="${escapeHtml(company.contact_phone || "")}" /></label>
      </div>
      <div class="form-section"><span>Endereço</span></div>
      <div class="form-grid address-grid">
        <label>CEP<input name="postalCode" inputmode="numeric" maxlength="9" value="${escapeHtml(company.postal_code || "")}" /></label>
        <label class="street-field">Logradouro<input name="street" maxlength="200" value="${escapeHtml(company.street || "")}" /></label>
        <label>Número<input name="streetNumber" maxlength="30" value="${escapeHtml(company.street_number || "")}" /></label>
        <label>Complemento<input name="addressComplement" maxlength="120" value="${escapeHtml(company.address_complement || "")}" /></label>
        <label>Bairro<input name="district" maxlength="120" value="${escapeHtml(company.district || "")}" /></label>
        <label>Cidade<input name="city" maxlength="120" value="${escapeHtml(company.city || "")}" /></label>
        <label>UF<input name="state" maxlength="2" placeholder="SP" value="${escapeHtml(company.state || "")}" /></label>
      </div>
      <button class="btn btn-primary" type="submit">${recordId ? "Salvar alterações" : "Cadastrar empresa"}</button>
    </form>`;
  }

  if (type === "person") {
    let person = state.people.find((item) => item.id === recordId);
    if (!person) {
      const result = await callAdmin({ action: "list_users" }, true);
      state.people = result.users || [];
      person = state.people.find((item) => item.id === recordId);
    }
    if (!person) throw new Error("A pessoa selecionada não foi encontrada.");

    const { data: companies, error } = await supabase.from("companies").select("id,name,is_active").order("is_active", { ascending: false }).order("name");
    if (error) throw error;
    const isSelf = person.id === state.profile.id;
    const companyHidden = person.role === "cafcm_admin";
    body = `<form id="person-form" class="dialog-form">
      <input type="hidden" name="userId" value="${person.id}" />
      <div class="form-grid two-columns">
        <label>Nome completo<input name="fullName" required minlength="2" maxlength="160" autofocus value="${escapeHtml(person.fullName || "")}" /></label>
        <label>E-mail<input name="email" type="email" maxlength="254" required value="${escapeHtml(person.email || "")}" /></label>
      </div>
      ${isSelf ? `<input type="hidden" name="role" value="${person.role}" /><label>Tipo de acesso<select disabled><option>${roleLabels[person.role]}</option></select><small>Para sua segurança, você não pode alterar o tipo do próprio acesso.</small></label>` : `<label>Tipo de acesso<select name="role" required><option value="apprentice" ${person.role === "apprentice" ? "selected" : ""}>Jovem aprendiz</option><option value="company" ${person.role === "company" ? "selected" : ""}>Representante de empresa</option><option value="cafcm_admin" ${person.role === "cafcm_admin" ? "selected" : ""}>Equipe CAFCM</option></select></label>`}
      <label class="company-field ${person.role === "company" ? "required-field" : ""}" ${companyHidden ? "hidden" : ""}>Empresa vinculada<select name="companyId" ${person.role === "company" ? "required" : ""} ${companyHidden ? "disabled" : ""}><option value="">Sem empresa vinculada</option>${(companies || []).map((company) => `<option value="${company.id}" ${person.companyId === company.id ? "selected" : ""}>${escapeHtml(company.name)}${company.is_active ? "" : " · inativa"}</option>`).join("")}</select><small>Obrigatória para representantes e opcional para jovens.</small></label>
      <div class="form-section"><span>Credenciais</span></div>
      <label>Alterar senha<select name="passwordMode"><option value="keep">Manter a senha atual</option><option value="random">Gerar nova senha temporária</option><option value="manual">Definir uma nova senha</option></select></label>
      <label class="manual-password-field" hidden>Nova senha<input name="password" type="password" minlength="10" maxlength="128" autocomplete="new-password" /><small>Use de 10 a 128 caracteres. A senha nunca aparece no histórico de auditoria.</small></label>
      <p class="form-note">Alterações de perfil e empresa passam a valer integralmente no próximo acesso da pessoa.${person.emailConfirmedAt ? "" : " Se alterar o e-mail, reenvie o convite depois de salvar."}</p>
      <button class="btn btn-primary" type="submit">Salvar alterações</button>
    </form>`;
  }

  if (type === "person-history") {
    const person = state.people.find((item) => item.id === recordId);
    if (!person) throw new Error("A pessoa selecionada não foi encontrada.");
    const history = await callAdmin({ action: "person_history", userId: recordId }, true);
    body = `<div class="person-history">
      <section class="history-person-head"><span class="avatar">${escapeHtml(initials(person.fullName))}</span><div><h3>${escapeHtml(person.fullName)}</h3><p>${escapeHtml(person.email)}</p></div><span class="role-pill">${roleLabels[person.role]}</span></section>
      <section class="history-metrics"><div><strong>${history.enrollments.length}</strong><small>Cursos</small></div><div><strong>${history.completedLessons.length}</strong><small>Aulas concluídas</small></div><div><strong>${history.activityAttempts.length}</strong><small>Atividades enviadas</small></div><div><strong>${history.audit.length}</strong><small>Ações registradas</small></div></section>
      <div class="history-columns">
        <section><div class="form-section"><span>Aprendizagem concluída</span></div>${history.completedLessons.length ? `<div class="history-list">${history.completedLessons.map((item) => `<article>${icon("check")}<div><strong>${escapeHtml(item.lessons?.title || "Aula concluída")}</strong><small>${escapeHtml(item.courses?.title || "Curso")} · ${formatDate(item.completed_at, true)}</small></div></article>`).join("")}</div>` : `<p class="muted-note">Nenhuma aula concluída até agora.</p>`}</section>
        <section><div class="form-section"><span>Atividades</span></div>${history.activityAttempts.length ? `<div class="history-list">${history.activityAttempts.map((item) => `<article>${icon("mail")}<div><strong>${escapeHtml(item.activities?.title || "Atividade")}</strong><small>${escapeHtml(item.activities?.courses?.title || "Curso")} · ${formatDate(item.submitted_at, true)}</small></div>${statusBadge(item.status)}</article>`).join("")}</div>` : `<p class="muted-note">Nenhuma atividade enviada até agora.</p>`}</section>
      </div>
      <section><div class="form-section"><span>Auditoria recente</span></div>${history.audit.length ? `<div class="mini-audit-list">${history.audit.slice(0, 20).map((item) => `<article><div><strong>${escapeHtml(auditActionLabels[item.action] || item.action)}</strong><small>${formatDate(item.occurred_at, true)}</small></div></article>`).join("")}</div>` : `<p class="muted-note">Nenhuma ação registrada para esta pessoa.</p>`}</section>
      <button class="btn btn-secondary btn-block" data-view-person-audit="${person.id}">Abrir auditoria completa</button>
    </div>`;
  }

  if (type === "course") {
    let course = {};
    if (recordId) {
      const { data, error } = await supabase.from("courses").select("*").eq("id", recordId).single();
      if (error) throw error;
      course = data;
    }
    body = `<form id="course-form" class="dialog-form">
      <input type="hidden" name="courseId" value="${escapeHtml(course.id || "")}" />
      <label>Título do curso<input name="title" required minlength="2" maxlength="180" autofocus value="${escapeHtml(course.title || "")}" /></label>
      <div class="form-grid two-columns">
        <label>Categoria<input name="category" maxlength="120" placeholder="Ex.: Preparação para o trabalho" value="${escapeHtml(course.category || "")}" /></label>
        <label>Carga horária<input name="workloadHours" type="number" min="0" max="9999.99" step="0.25" placeholder="Ex.: 20" value="${escapeHtml(course.workload_hours || "")}" /></label>
      </div>
      <label>Descrição<textarea name="description" rows="4" maxlength="4000" placeholder="Resumo da formação">${escapeHtml(course.description || "")}</textarea></label>
      <label>Objetivos de aprendizagem<textarea name="objectives" rows="6" maxlength="8000" placeholder="O que o jovem deverá compreender ou realizar ao concluir o curso">${escapeHtml(course.objectives || "")}</textarea></label>
      <button class="btn btn-primary" type="submit">${recordId ? "Salvar alterações" : "Criar curso"}</button>
    </form>`;
  }

  if (type === "invite") {
    const { data: companies } = await supabase.from("companies").select("id,name").eq("is_active", true).order("name");
    body = `<form id="invite-form" class="dialog-form">
      <div class="form-grid two-columns">
        <label>Nome completo<input name="fullName" required minlength="2" maxlength="160" autofocus /></label>
        <label>E-mail<input name="email" type="email" maxlength="254" required /></label>
      </div>
      <label>Tipo de acesso<select name="role" required><option value="apprentice">Jovem aprendiz</option><option value="company">Representante de empresa</option><option value="cafcm_admin">Equipe CAFCM</option></select></label>
      <label class="company-field">Empresa vinculada<select name="companyId"><option value="">Sem empresa vinculada</option>${(companies || []).map((company) => `<option value="${company.id}">${escapeHtml(company.name)}</option>`).join("")}</select><small>Opcional para o jovem e obrigatório para representantes de empresa.</small></label>
      <label>Senha inicial<select name="passwordMode"><option value="random">Gerar senha segura automaticamente</option><option value="manual">Definir uma senha agora</option></select></label>
      <label class="manual-password-field" hidden>Senha escolhida<input name="password" type="password" minlength="10" maxlength="128" autocomplete="new-password" /><small>Use pelo menos 10 caracteres.</small></label>
      <p class="form-note">O convite será enviado ao e-mail informado. A senha inicial aparecerá uma única vez após a criação do acesso.</p>
      <button class="btn btn-primary" type="submit">Criar acesso e enviar convite</button>
    </form>`;
  }

  if (type === "people-import") {
    body = `<form id="people-import-form" class="dialog-form">
      <div class="import-explainer">${icon("upload")}<div><strong>Importe pessoas sem apagar o histórico existente</strong><p>Contas já cadastradas são atualizadas pelo e-mail. Novas pessoas recebem convite e senha temporária. Um backup JSON também restaura matrículas, conclusões e atividades quando os cursos ainda existem.</p></div></div>
      <label>Arquivo CSV ou backup JSON<input name="peopleFile" type="file" accept=".csv,.json,text/csv,application/json" required /><small>Até 100 pessoas por importação. Use o modelo CSV disponível na página.</small></label>
      <label class="confirmation-field"><input name="confirmImport" type="checkbox" value="yes" required /><span>Confirmo o envio de convites por e-mail para pessoas novas do arquivo.</span></label>
      <div class="form-note">Perfis existentes mantêm suas matrículas e conclusões. Senhas não são exportadas em backups.</div>
      <button class="btn btn-primary" type="submit">Validar e importar pessoas</button>
    </form>`;
  }

  if (type === "lesson") {
    let lesson = {};
    if (recordId) {
      const { data, error } = await supabase.from("lessons").select("*").eq("id", recordId).single();
      if (error) throw error;
      lesson = data;
    }
    body = `<form id="lesson-form" class="dialog-form">
      <input type="hidden" name="lessonId" value="${escapeHtml(lesson.id || "")}" />
      <label>Título da aula<input name="title" required minlength="2" maxlength="180" autofocus value="${escapeHtml(lesson.title || "")}" /></label>
      <label>Resumo da aula<textarea name="summary" rows="4" maxlength="2000" placeholder="Explique em poucas linhas o que será estudado">${escapeHtml(lesson.summary || "")}</textarea></label>
      <label>Duração estimada em minutos<input name="estimatedMinutes" type="number" min="1" max="1440" step="1" value="${escapeHtml(lesson.estimated_minutes || "")}" /></label>
      <p class="form-note">Depois de salvar a aula, abra “Estruturar aula” para adicionar texto, slides, vídeo, considerações e a atividade final.</p>
      <button class="btn btn-primary" type="submit">${recordId ? "Salvar alterações" : "Adicionar aula"}</button>
    </form>`;
  }

  if (type === "block") {
    if (!state.selectedLessonId) throw new Error("Selecione uma aula antes de adicionar conteúdo.");
    let block = {};
    if (recordId) {
      const { data, error } = await supabase.from("lesson_blocks").select("*").eq("id", recordId).eq("lesson_id", state.selectedLessonId).single();
      if (error) throw error;
      block = data;
    }
    body = `<form id="block-form" class="dialog-form wide-form">
      <input type="hidden" name="blockId" value="${escapeHtml(block.id || "")}" />
      <div class="form-grid two-columns">
        <label>Tipo da linha<select name="blockType" required><option value="text" ${block.block_type === "text" ? "selected" : ""}>Texto com imagem opcional</option><option value="slides" ${block.block_type === "slides" ? "selected" : ""}>Apresentação em slides</option><option value="video" ${block.block_type === "video" ? "selected" : ""}>Vídeo</option><option value="considerations" ${block.block_type === "considerations" ? "selected" : ""}>Considerações finais</option></select></label>
        <label>Título da etapa<input name="title" maxlength="180" required value="${escapeHtml(block.title || "")}" placeholder="Ex.: Comunicação no ambiente de trabalho" /></label>
      </div>
      <label>Conteúdo<textarea name="content" rows="12" maxlength="60000" placeholder="Para slides: escreva o título na primeira linha e o conteúdo abaixo. Separe cada slide com uma linha contendo ---">${escapeHtml(block.content || "")}</textarea><small>Em “Slides”, separe os slides com uma linha contendo três traços: ---. O primeiro texto de cada parte vira o título.</small></label>
      <label>URL de imagem ou vídeo<input name="mediaUrl" type="url" maxlength="2048" placeholder="https://..." value="${escapeHtml(block.media_url || "")}" /><small>Opcional para texto e slides; necessária para vídeo. Aceita YouTube, Vimeo ou arquivo de vídeo direto.</small></label>
      <button class="btn btn-primary" type="submit">${recordId ? "Salvar linha de aprendizagem" : "Adicionar linha à aula"}</button>
    </form>`;
  }

  if (type === "activity") {
    const { data: lessons } = await supabase.from("lessons").select("id,title").eq("course_id", state.selectedCourseId).order("position");
    let activity = {};
    if (recordId) {
      const { data, error } = await supabase.from("activities").select("*").eq("id", recordId).single();
      if (error) throw error;
      activity = data;
    }
    body = `<form id="activity-form" class="dialog-form">
      <input type="hidden" name="activityId" value="${escapeHtml(activity.id || "")}" />
      <label>Título da atividade<input name="title" required minlength="2" maxlength="180" autofocus value="${escapeHtml(activity.title || "")}" /></label>
      <label>Instruções<textarea name="instructions" rows="7" maxlength="12000">${escapeHtml(activity.instructions || "")}</textarea></label>
      <div class="form-grid two-columns">
        <label>Aula relacionada<select name="lessonId"><option value="">Sem aula específica</option>${(lessons || []).map((lesson) => `<option value="${lesson.id}" ${activity.lesson_id === lesson.id || (!recordId && state.selectedLessonId === lesson.id) ? "selected" : ""}>${escapeHtml(lesson.title)}</option>`).join("")}</select></label>
        <label>Prazo<input name="dueAt" type="datetime-local" value="${formatDateTimeInput(activity.due_at)}" /></label>
      </div>
      <button class="btn btn-primary" type="submit">${recordId ? "Salvar alterações" : "Adicionar atividade"}</button>
    </form>`;
  }

  if (type === "enrollment") {
    const [{ data: apprentices }, { data: courses }] = await Promise.all([
      supabase.from("profiles").select("id,full_name").eq("role", "apprentice").eq("is_active", true).order("full_name"),
      supabase.from("courses").select("id,title,status").neq("status", "archived").order("title"),
    ]);
    body = `<form id="enrollment-form" class="dialog-form"><label>Jovem<select name="apprenticeId" required><option value="">Selecione</option>${(apprentices || []).map((item) => `<option value="${item.id}">${escapeHtml(item.full_name)}</option>`).join("")}</select></label><label>Curso<select name="courseId" required><option value="">Selecione</option>${(courses || []).map((item) => `<option value="${item.id}">${escapeHtml(item.title)} · ${item.status === "published" ? "Publicado" : "Rascunho"}</option>`).join("")}</select></label><button class="btn btn-primary" type="submit">Criar matrícula</button></form>`;
  }

  if (type === "response") {
    const [{ data: activity }, { data: response }] = await Promise.all([
      supabase.from("activities").select("id,title,instructions,due_at").eq("id", state.selectedActivityId).single(),
      supabase.from("activity_responses").select("response_text").eq("activity_id", state.selectedActivityId).eq("apprentice_id", state.profile.id).maybeSingle(),
    ]);
    body = `<form id="response-form" class="dialog-form"><p class="dialog-instructions">${escapeHtml(activity?.instructions || "Responda à atividade proposta.")}</p><label>Sua resposta<textarea name="responseText" rows="9" maxlength="20000" required autofocus>${escapeHtml(response?.response_text || "")}</textarea><small>A empresa verá apenas que a atividade foi enviada.</small></label><button class="btn btn-primary" type="submit">Enviar atividade</button></form>`;
  }

  const titles = {
    "my-profile": "Meu perfil e senha",
    company: recordId ? "Alterar empresa" : "Cadastrar empresa",
    person: "Alterar dados da pessoa",
    "person-history": "Histórico da pessoa",
    "people-import": "Importar pessoas",
    course: recordId ? "Alterar curso" : "Criar curso",
    invite: "Criar pessoa e enviar convite",
    lesson: recordId ? "Alterar aula" : "Adicionar aula",
    block: recordId ? "Alterar linha de aprendizagem" : "Nova linha de aprendizagem",
    activity: recordId ? "Alterar atividade" : "Adicionar atividade",
    enrollment: "Nova matrícula",
    response: "Responder atividade",
  };
  const wideDialog = ["company", "block", "person-history", "people-import"].includes(type);
  root.innerHTML = `<div class="dialog-backdrop"><section class="dialog ${wideDialog ? "dialog-wide" : ""}" role="dialog" aria-modal="true"><div class="dialog-head"><div><span class="eyebrow">Portal CAFCM</span><h2>${titles[type]}</h2></div><button class="dialog-close" data-close-dialog aria-label="Fechar">${icon("close")}</button></div>${body}</section></div>`;
}

function renderInviteCredentials(email, password, mode = "invite") {
  const root = document.querySelector("#overlay-root");
  if (!root) return;
  root.innerHTML = `<div class="dialog-backdrop"><section class="dialog invite-success" role="dialog" aria-modal="true" aria-labelledby="invite-success-title">
    <div class="dialog-head"><div><span class="eyebrow">${mode === "invite" ? "Acesso criado" : "Credencial alterada"}</span><h2 id="invite-success-title">${mode === "invite" ? "Convite enviado por e-mail" : "Nova senha definida"}</h2></div><button class="dialog-close" data-close-dialog aria-label="Fechar">${icon("close")}</button></div>
    <div class="success-symbol">${icon("mail")}</div>
    <p>${mode === "invite" ? `O acesso de <strong>${escapeHtml(email)}</strong> foi criado.` : `A senha de <strong>${escapeHtml(email)}</strong> foi atualizada.`} Guarde a senha abaixo: ela não será mostrada novamente.</p>
    <div class="credential-box"><div><small>Senha inicial</small><code>${escapeHtml(password)}</code></div><button class="btn btn-secondary btn-small" data-copy-password="${escapeHtml(password)}">${icon("copy")} Copiar senha</button></div>
    <div class="dialog-instructions">${mode === "invite" ? "A pessoa também recebeu um convite para confirmar o e-mail e poderá definir uma nova senha pelo link." : "Envie esta senha de forma segura. A pessoa também pode usar a recuperação por e-mail para trocá-la."}</div>
    <button class="btn btn-primary btn-block" data-close-dialog>Concluir</button>
  </section></div>`;
}

function renderImportResults(result) {
  const root = document.querySelector("#overlay-root");
  if (!root) return;
  const rows = result.results || [];
  const success = rows.filter((item) => item.ok);
  const failed = rows.filter((item) => !item.ok);
  const credentials = success.filter((item) => item.temporaryPassword);
  state.importResults = credentials;
  root.innerHTML = `<div class="dialog-backdrop"><section class="dialog dialog-wide" role="dialog" aria-modal="true" aria-labelledby="import-result-title">
    <div class="dialog-head"><div><span class="eyebrow">Importação concluída</span><h2 id="import-result-title">${success.length} pessoas processadas</h2></div><button class="dialog-close" data-close-dialog aria-label="Fechar">${icon("close")}</button></div>
    <section class="history-metrics"><div><strong>${success.filter((item) => item.type === "invited").length}</strong><small>Novos convites</small></div><div><strong>${success.filter((item) => item.type === "updated").length}</strong><small>Perfis atualizados</small></div><div><strong>${failed.length}</strong><small>Falhas</small></div><div><strong>${result.historyRestored || 0}</strong><small>Registros restaurados</small></div></section>
    ${credentials.length ? `<div class="notice">Foram geradas ${credentials.length} senhas temporárias. Baixe o arquivo agora; elas não serão exibidas novamente.</div><button class="btn btn-secondary" data-download-import-passwords>${icon("download")} Baixar senhas temporárias</button>` : ""}
    <div class="import-result-list">${rows.map((item) => `<article class="${item.ok ? "import-ok" : "import-failed"}"><span>${item.ok ? icon("check") : "!"}</span><div><strong>${escapeHtml(item.email || "Registro sem e-mail")}</strong><small>${item.ok ? item.type === "invited" ? "Convite enviado" : "Perfil atualizado" : escapeHtml(item.message || "Não foi possível importar")}</small></div></article>`).join("")}</div>
    ${result.historyFailed ? `<p class="form-error">${result.historyFailed} registros de histórico não puderam ser restaurados, normalmente porque o curso, a aula ou a atividade não existe mais.</p>` : ""}
    <button class="btn btn-primary btn-block" data-close-dialog>Concluir</button>
  </section></div>`;
}

function downloadTextFile(filename, content, type = "application/json;charset=utf-8") {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function csvCell(value) {
  const text = String(value ?? "");
  return /[;"\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function parseCsv(text) {
  const firstLine = String(text || "").split(/\r?\n/, 1)[0] || "";
  const delimiter = (firstLine.match(/;/g) || []).length >= (firstLine.match(/,/g) || []).length ? ";" : ",";
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;
  const source = String(text || "").replace(/^\uFEFF/, "");
  for (let index = 0; index < source.length; index += 1) {
    const character = source[index];
    if (character === '"') {
      if (quoted && source[index + 1] === '"') {
        cell += '"';
        index += 1;
      } else quoted = !quoted;
    } else if (character === delimiter && !quoted) {
      row.push(cell.trim());
      cell = "";
    } else if ((character === "\n" || character === "\r") && !quoted) {
      if (character === "\r" && source[index + 1] === "\n") index += 1;
      row.push(cell.trim());
      if (row.some(Boolean)) rows.push(row);
      row = [];
      cell = "";
    } else cell += character;
  }
  row.push(cell.trim());
  if (row.some(Boolean)) rows.push(row);
  if (rows.length < 2) return [];
  const headers = rows.shift().map((header) => header.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "_"));
  return rows.map((values) => Object.fromEntries(headers.map((header, index) => [header, values[index] || ""])));
}

function normalizeImportedRole(value) {
  const role = String(value || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
  if (["cafcm_admin", "cafcm", "equipe cafcm", "administrador"].includes(role)) return "cafcm_admin";
  if (["company", "empresa", "representante", "representante de empresa"].includes(role)) return "company";
  if (["apprentice", "aprendiz", "jovem", "jovem aprendiz"].includes(role)) return "apprentice";
  return role;
}

async function fetchAllRows(table, columns, orderColumn = null) {
  const rows = [];
  for (let page = 0; page < 50; page += 1) {
    let query = supabase.from(table).select(columns).range(page * 1000, page * 1000 + 999);
    if (orderColumn) query = query.order(orderColumn);
    const { data, error } = await query;
    if (error) throw error;
    rows.push(...(data || []));
    if (!data || data.length < 1000) break;
  }
  return rows;
}

async function exportPeopleBackup() {
  const [enrollments, progress, attempts, responses, audit, companies, courses, lessons, activities] = await Promise.all([
    fetchAllRows("enrollments", "course_id,apprentice_id,assigned_at"),
    fetchAllRows("lesson_progress", "lesson_id,apprentice_id,completed_at"),
    fetchAllRows("activity_attempts", "activity_id,apprentice_id,status,submitted_at,reviewed_at"),
    fetchAllRows("activity_responses", "activity_id,apprentice_id,response_text,updated_at"),
    fetchAllRows("audit_logs", "actor_id,subject_user_id,action,entity_type,entity_id,details,occurred_at", "occurred_at"),
    fetchAllRows("companies", "id,name,cnpj"),
    fetchAllRows("courses", "id,title,status"),
    fetchAllRows("lessons", "id,course_id,title,position"),
    fetchAllRows("activities", "id,course_id,lesson_id,title,position"),
  ]);
  const people = state.people.length ? state.people : (await callAdmin({ action: "list_users" }, true)).users || [];
  const personMap = new Map(people.map((person) => [person.id, person]));
  const identity = (userId) => ({ email: personMap.get(userId)?.email || "", sourceId: userId });
  const backup = {
    format: "portal-cafcm-people-backup",
    version: 1,
    exportedAt: new Date().toISOString(),
    people: people.map((person) => ({
      sourceId: person.id,
      fullName: person.fullName,
      email: person.email,
      role: person.role,
      companyId: person.companyId,
      isActive: person.isActive,
      createdAt: person.createdAt,
      emailConfirmedAt: person.emailConfirmedAt,
      lastSignInAt: person.lastSignInAt,
    })),
    history: {
      enrollments: (enrollments || []).map((item) => ({ ...identity(item.apprentice_id), courseId: item.course_id, assignedAt: item.assigned_at })),
      lessonProgress: (progress || []).map((item) => ({ ...identity(item.apprentice_id), lessonId: item.lesson_id, completedAt: item.completed_at })),
      activityAttempts: (attempts || []).map((item) => ({ ...identity(item.apprentice_id), activityId: item.activity_id, status: item.status, submittedAt: item.submitted_at, reviewedAt: item.reviewed_at })),
      activityResponses: (responses || []).map((item) => ({ ...identity(item.apprentice_id), activityId: item.activity_id, responseText: item.response_text, updatedAt: item.updated_at })),
    },
    audit: audit || [],
    catalog: { companies: companies || [], courses: courses || [], lessons: lessons || [], activities: activities || [] },
  };
  downloadTextFile(`portal-cafcm-pessoas-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(backup, null, 2));
}

function closeOverlay() {
  const root = document.querySelector("#overlay-root");
  if (root) root.innerHTML = "";
}

async function navigate(view) {
  state.view = view;
  if (!["course-editor", "lesson-editor", "student-course"].includes(view)) state.selectedCourseId = null;
  if (!["lesson-editor", "student-course"].includes(view)) state.selectedLessonId = null;
  if (view !== "audit") state.auditPersonId = null;
  await renderPortal();
}

app.addEventListener("click", async (event) => {
  const target = event.target.closest("button, [data-nav]");
  if (!target) return;

  if (target.dataset.authMode) return renderLogin(target.dataset.authMode);
  if (target.hasAttribute("data-open-menu")) return document.querySelector(".portal-shell")?.classList.add("menu-open");
  if (target.hasAttribute("data-close-menu")) return document.querySelector(".portal-shell")?.classList.remove("menu-open");
  if (target.dataset.nav) return navigate(target.dataset.nav);
  if (target.hasAttribute("data-reload")) return renderPortal();
  if (target.hasAttribute("data-logout")) {
    await callAdmin({ action: "log_event", event: "session.ended" }, true).catch(() => {});
    await supabase.auth.signOut();
    state.sessionLogged = false;
    history.replaceState({}, "", location.pathname);
    return renderLogin();
  }
  if (target.hasAttribute("data-open-wizard")) {
    state.wizardOpen = true;
    state.wizardStep = 0;
    return renderWizard();
  }
  if (target.hasAttribute("data-close-wizard")) {
    state.wizardOpen = false;
    return closeOverlay();
  }
  if (target.hasAttribute("data-wizard-next")) {
    state.wizardStep += 1;
    return renderWizard();
  }
  if (target.hasAttribute("data-wizard-back")) {
    state.wizardStep = Math.max(0, state.wizardStep - 1);
    return renderWizard();
  }
  if (target.hasAttribute("data-wizard-finish")) {
    const { error } = await supabase.from("profiles").update({ onboarding_completed: true }).eq("id", state.profile.id);
    if (error) return showToast(error.message, "error");
    state.profile.onboarding_completed = true;
    state.wizardOpen = false;
    closeOverlay();
    return showToast("Guia concluído. Você pode revê-lo a qualquer momento.");
  }
  if (target.dataset.dialog) return openDialog(target.dataset.dialog);
  if (target.dataset.editCompany) return openDialog("company", target.dataset.editCompany);
  if (target.dataset.editPerson) return openDialog("person", target.dataset.editPerson);
  if (target.dataset.personHistory) return openDialog("person-history", target.dataset.personHistory);
  if (target.dataset.editCourse) return openDialog("course", target.dataset.editCourse);
  if (target.dataset.editLesson) return openDialog("lesson", target.dataset.editLesson);
  if (target.dataset.editBlock) return openDialog("block", target.dataset.editBlock);
  if (target.dataset.editActivity) return openDialog("activity", target.dataset.editActivity);
  if (target.hasAttribute("data-return-course-editor")) {
    state.selectedLessonId = null;
    return navigate("course-editor");
  }
  if (target.dataset.openLessonEditor) {
    state.selectedLessonId = target.dataset.openLessonEditor;
    return navigate("lesson-editor");
  }
  if (target.dataset.viewPersonAudit) {
    state.auditPersonId = target.dataset.viewPersonAudit;
    closeOverlay();
    state.view = "audit";
    return renderPortal();
  }
  if (target.hasAttribute("data-clear-audit-filter")) {
    state.auditPersonId = null;
    return renderView();
  }
  if (target.hasAttribute("data-download-people-template")) {
    return downloadTextFile("modelo-importacao-pessoas-cafcm.csv", "nome;email;perfil;empresa;senha_opcional\n", "text/csv;charset=utf-8");
  }
  if (target.hasAttribute("data-export-people")) {
    target.disabled = true;
    try {
      await exportPeopleBackup();
      showToast("Backup de pessoas e histórico salvo.");
    } catch (error) {
      showToast(friendlyError(error), "error");
    } finally {
      if (target.isConnected) target.disabled = false;
    }
    return;
  }
  if (target.hasAttribute("data-download-import-passwords")) {
    const rows = ["email;senha_temporaria", ...state.importResults.map((item) => `${csvCell(item.email)};${csvCell(item.temporaryPassword)}`)];
    downloadTextFile(`senhas-temporarias-cafcm-${new Date().toISOString().slice(0, 10)}.csv`, `${rows.join("\n")}\n`, "text/csv;charset=utf-8");
    return;
  }
  if (target.dataset.copyPassword) {
    try {
      await navigator.clipboard.writeText(target.dataset.copyPassword);
      return showToast("Senha copiada.");
    } catch {
      return showToast("Não foi possível copiar. Selecione a senha manualmente.", "error");
    }
  }
  if (target.dataset.resendAccess) {
    const pending = target.dataset.accessPending === "true";
    const question = pending
      ? "Reenviar o e-mail de confirmação para esta pessoa?"
      : "Enviar um e-mail para esta pessoa definir uma nova senha?";
    if (!window.confirm(question)) return;
    target.disabled = true;
    try {
      const result = await callAdmin({ action: "resend_access", userId: target.dataset.resendAccess }, true);
      showToast(result.mode === "confirmation" ? "Convite reenviado." : "E-mail de recuperação enviado.");
    } catch (error) {
      showToast(friendlyError(error), "error");
    } finally {
      if (target.isConnected) target.disabled = false;
    }
    return;
  }
  if (target.dataset.setPersonActive) {
    const activate = target.dataset.personActive === "true";
    const name = target.dataset.personName || "esta pessoa";
    const question = activate
      ? `Restaurar o acesso de ${name}?`
      : `Excluir o acesso de ${name}? A pessoa será bloqueada imediatamente no próximo carregamento, mas todo o histórico será arquivado e poderá ser restaurado.`;
    if (!window.confirm(question)) return;
    target.disabled = true;
    try {
      await callAdmin({ action: "set_user_status", userId: target.dataset.setPersonActive, active: activate }, true);
      showToast(activate ? "Acesso restaurado." : "Acesso excluído e histórico preservado.");
      return renderView();
    } catch (error) {
      showToast(friendlyError(error), "error");
    } finally {
      if (target.isConnected) target.disabled = false;
    }
    return;
  }
  if (target.dataset.toggleCompany) {
    const activate = target.dataset.companyActive !== "true";
    const { error } = await supabase.from("companies").update({
      is_active: activate,
      inactivated_at: activate ? null : new Date().toISOString(),
    }).eq("id", target.dataset.toggleCompany);
    if (error) return showToast(error.message, "error");
    showToast(activate ? "Empresa reativada." : "Empresa marcada como inativa.");
    return renderView();
  }
  if (target.dataset.deleteCompany) {
    const { count, error: countError } = await supabase.from("profiles").select("*", { count: "exact", head: true }).eq("company_id", target.dataset.deleteCompany);
    if (countError) return showToast(countError.message, "error");
    if (count) return showToast("Esta empresa possui pessoas vinculadas. Inative-a ou remova os vínculos antes de excluir.", "error");
    if (!window.confirm(`Excluir a empresa “${target.dataset.companyName}”? Esta ação não pode ser desfeita.`)) return;
    const { error } = await supabase.from("companies").delete().eq("id", target.dataset.deleteCompany);
    if (error) return showToast(error.code === "23503" ? "A empresa ainda possui vínculos e não pode ser excluída." : error.message, "error");
    showToast("Empresa excluída.");
    return renderView();
  }
  if (target.dataset.archiveCourse) {
    const archived = target.dataset.courseStatus === "archived";
    const { error } = await supabase.from("courses").update({
      status: archived ? "draft" : "archived",
      published_at: null,
    }).eq("id", target.dataset.archiveCourse);
    if (error) return showToast(error.message, "error");
    showToast(archived ? "Curso reaberto como rascunho." : "Curso arquivado.");
    return renderView();
  }
  if (target.dataset.deleteCourse) {
    const { count, error: countError } = await supabase.from("enrollments").select("*", { count: "exact", head: true }).eq("course_id", target.dataset.deleteCourse);
    if (countError) return showToast(countError.message, "error");
    if (count) return showToast("Este curso possui matrículas. Arquive-o para preservar o histórico.", "error");
    if (!window.confirm(`Excluir o curso “${target.dataset.courseTitle}” e todo o seu conteúdo?`)) return;
    const { error } = await supabase.from("courses").delete().eq("id", target.dataset.deleteCourse);
    if (error) return showToast(error.message, "error");
    showToast("Curso excluído.");
    return navigate("courses");
  }
  if (target.dataset.deleteLesson) {
    const { count, error: countError } = await supabase.from("lesson_progress").select("lesson_id", { count: "exact", head: true }).eq("lesson_id", target.dataset.deleteLesson);
    if (countError) return showToast(friendlyError(countError), "error");
    if (count) return showToast("Esta aula possui conclusões registradas. Mantenha-a para preservar o histórico dos jovens.", "error");
    if (!window.confirm(`Excluir a aula “${target.dataset.itemTitle}” e suas linhas de aprendizagem?`)) return;
    const { error } = await supabase.from("lessons").delete().eq("id", target.dataset.deleteLesson);
    if (error) return showToast(error.message, "error");
    showToast("Aula excluída.");
    return renderView();
  }
  if (target.dataset.deleteBlock) {
    const { count, error: countError } = await supabase.from("lesson_progress").select("lesson_id", { count: "exact", head: true }).eq("lesson_id", state.selectedLessonId);
    if (countError) return showToast(friendlyError(countError), "error");
    if (count) return showToast("Há jovens que já concluíram esta aula. Altere a linha em vez de excluí-la para preservar o histórico pedagógico.", "error");
    if (!window.confirm(`Excluir a linha “${target.dataset.itemTitle}”?`)) return;
    const { error } = await supabase.from("lesson_blocks").delete().eq("id", target.dataset.deleteBlock);
    if (error) return showToast(friendlyError(error), "error");
    showToast("Linha de aprendizagem excluída.");
    return renderView();
  }
  if (target.dataset.moveBlock) {
    const { data: blocks, error } = await supabase.from("lesson_blocks").select("id,position").eq("lesson_id", state.selectedLessonId).order("position");
    if (error) return showToast(friendlyError(error), "error");
    const index = (blocks || []).findIndex((block) => block.id === target.dataset.moveBlock);
    const destination = index + (target.dataset.moveDirection === "up" ? -1 : 1);
    if (index < 0 || destination < 0 || destination >= blocks.length) return;
    const current = blocks[index];
    const other = blocks[destination];
    const temporaryPosition = 1000000 + current.position;
    const first = await supabase.from("lesson_blocks").update({ position: temporaryPosition }).eq("id", current.id);
    if (first.error) return showToast(friendlyError(first.error), "error");
    const second = await supabase.from("lesson_blocks").update({ position: current.position }).eq("id", other.id);
    if (second.error) {
      await supabase.from("lesson_blocks").update({ position: current.position }).eq("id", current.id);
      return showToast(friendlyError(second.error), "error");
    }
    const third = await supabase.from("lesson_blocks").update({ position: other.position }).eq("id", current.id);
    if (third.error) return showToast(friendlyError(third.error), "error");
    return renderView();
  }
  if (target.dataset.deleteActivity) {
    const { count, error: countError } = await supabase.from("activity_attempts").select("activity_id", { count: "exact", head: true }).eq("activity_id", target.dataset.deleteActivity);
    if (countError) return showToast(friendlyError(countError), "error");
    if (count) return showToast("Esta atividade possui envios registrados. Mantenha-a para preservar o histórico dos jovens.", "error");
    if (!window.confirm(`Excluir a atividade “${target.dataset.itemTitle}”?`)) return;
    const { error } = await supabase.from("activities").delete().eq("id", target.dataset.deleteActivity);
    if (error) return showToast(error.message, "error");
    showToast("Atividade excluída.");
    return renderView();
  }
  if (target.hasAttribute("data-close-dialog")) return closeOverlay();
  if (target.dataset.openCourse) {
    state.selectedCourseId = target.dataset.openCourse;
    state.selectedLessonId = null;
    state.lessonStepIndex = 0;
    if (state.profile.role === "apprentice") callAdmin({ action: "log_event", event: "course.opened", entityId: state.selectedCourseId }, true).catch(() => {});
    return navigate(state.profile.role === "cafcm_admin" ? "course-editor" : "student-course");
  }
  if (target.dataset.openLesson) {
    state.selectedLessonId = target.dataset.openLesson;
    state.lessonStepIndex = 0;
    state.blockSlideIndex = 0;
    callAdmin({ action: "log_event", event: "lesson.opened", entityId: state.selectedLessonId }, true).catch(() => {});
    return renderView();
  }
  if (target.hasAttribute("data-return-student-course")) {
    state.selectedLessonId = null;
    state.lessonStepIndex = 0;
    state.blockSlideIndex = 0;
    return renderView();
  }
  if (target.dataset.lessonStep) {
    state.lessonStepIndex = Math.max(0, state.lessonStepIndex + (target.dataset.lessonStep === "next" ? 1 : -1));
    state.blockSlideIndex = 0;
    return renderView();
  }
  if (target.dataset.blockSlide) {
    state.blockSlideIndex = Math.max(0, state.blockSlideIndex + (target.dataset.blockSlide === "next" ? 1 : -1));
    return renderView();
  }
  if (target.dataset.completeLesson) {
    const { data: existing } = await supabase.from("lesson_progress").select("lesson_id").eq("lesson_id", target.dataset.completeLesson).eq("apprentice_id", state.profile.id).maybeSingle();
    if (!existing) {
      const { error } = await supabase.from("lesson_progress").upsert({ lesson_id: target.dataset.completeLesson, apprentice_id: state.profile.id });
      if (error) return showToast(friendlyError(error), "error");
      showToast("Aula concluída e progresso salvo.");
    }
    state.selectedLessonId = null;
    state.lessonStepIndex = 0;
    return renderView();
  }
  if (target.dataset.answerActivity) {
    state.selectedActivityId = target.dataset.answerActivity;
    return openDialog("response");
  }
  if (target.dataset.toggleLesson) {
    const lessonId = target.dataset.toggleLesson;
    const complete = target.dataset.complete === "true";
    const query = complete
      ? supabase.from("lesson_progress").delete().eq("lesson_id", lessonId).eq("apprentice_id", state.profile.id)
      : supabase.from("lesson_progress").upsert({ lesson_id: lessonId, apprentice_id: state.profile.id });
    const { error } = await query;
    if (error) return showToast(error.message, "error");
    showToast(complete ? "Aula marcada como não concluída." : "Aula concluída.");
    return renderView();
  }
  if (target.dataset.toggleCourseStatus) {
    const next = target.dataset.currentStatus === "published" ? "draft" : "published";
    if (next === "published") {
      const [{ data: courseLessons, error: lessonError }, { data: course, error: courseError }] = await Promise.all([
        supabase.from("lessons").select("id").eq("course_id", target.dataset.toggleCourseStatus),
        supabase.from("courses").select("description,objectives,workload_hours").eq("id", target.dataset.toggleCourseStatus).single(),
      ]);
      if (courseError || lessonError) return showToast(friendlyError(courseError || lessonError), "error");
      if (!courseLessons?.length) return showToast("Adicione ao menos uma aula antes de publicar.", "error");
      const { data: blocks, error: blockError } = await supabase.from("lesson_blocks").select("lesson_id").in("lesson_id", courseLessons.map((lesson) => lesson.id));
      if (blockError) return showToast(friendlyError(blockError), "error");
      const structured = new Set((blocks || []).map((block) => block.lesson_id));
      if (courseLessons.some((lesson) => !structured.has(lesson.id))) return showToast("Estruture todas as aulas com ao menos uma linha de aprendizagem antes de publicar.", "error");
      if (!course.description?.trim() || !course.objectives?.trim() || Number(course.workload_hours) <= 0) {
        return showToast("Preencha descrição, objetivos e carga horária antes de publicar.", "error");
      }
    }
    const { error } = await supabase.from("courses").update({
      status: next,
      published_at: next === "published" ? new Date().toISOString() : null,
    }).eq("id", target.dataset.toggleCourseStatus);
    if (error) return showToast(error.message, "error");
    showToast(next === "published" ? "Curso publicado." : "Curso voltou para rascunho.");
    return renderView();
  }
  if (target.dataset.removeEnrollment) {
    const confirmed = window.confirm("Remover esta matrícula? O progresso relacionado permanecerá protegido, mas o jovem perderá o acesso ao curso.");
    if (!confirmed) return;
    const { error } = await supabase.from("enrollments").delete().eq("course_id", target.dataset.removeEnrollment).eq("apprentice_id", target.dataset.apprentice);
    if (error) return showToast(error.message, "error");
    showToast("Matrícula removida.");
    return renderView();
  }
});

app.addEventListener("change", (event) => {
  if (event.target.name === "role") {
    const companyField = document.querySelector(".company-field");
    if (!companyField) return;
    const role = event.target.value;
    const required = role === "company";
    const hidden = role === "cafcm_admin";
    companyField.hidden = hidden;
    companyField.classList.toggle("required-field", required);
    const select = companyField.querySelector("select");
    if (select) {
      select.required = required;
      select.disabled = hidden;
      if (hidden) select.value = "";
    }
    return;
  }

  if (event.target.name === "passwordMode") {
    const passwordField = document.querySelector(".manual-password-field");
    const input = passwordField?.querySelector("input");
    const manual = event.target.value === "manual";
    if (passwordField) passwordField.hidden = !manual;
    if (input) {
      input.disabled = !manual;
      input.required = manual;
      if (!manual) input.value = "";
    }
  }
});

app.addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.target;
  form.querySelector(".form-error")?.remove();
  const values = Object.fromEntries(new FormData(form));
  setBusy(form, true);

  try {
    if (form.id === "login-form") {
      const { error } = await supabase.auth.signInWithPassword({ email: String(values.email).trim(), password: String(values.password) });
      if (error) throw new Error("E-mail ou senha inválidos.");
      return await loadPortal();
    }

    if (form.id === "recover-form") {
      const { error } = await supabase.auth.resetPasswordForEmail(String(values.email).trim(), { redirectTo: SITE_ORIGIN });
      if (error) throw error;
      form.innerHTML = `<div class="form-success">${icon("mail")}<h2>Verifique seu e-mail</h2><p>Enviamos as instruções de recuperação, caso o endereço esteja cadastrado.</p></div>`;
      return;
    }

    if (form.id === "link-repair-form") {
      let confirmationUrl;
      try {
        confirmationUrl = new URL(String(values.confirmationLink || "").trim());
      } catch {
        throw new Error("Cole o endereço completo exibido no navegador, começando por http://localhost:3000/.");
      }

      const acceptedHosts = new Set(["localhost", "127.0.0.1", new URL(SITE_ORIGIN).hostname]);
      if (!["http:", "https:"].includes(confirmationUrl.protocol) || !acceptedHosts.has(confirmationUrl.hostname)) {
        throw new Error("Este endereço não corresponde a um link de acesso do Portal CAFCM.");
      }

      const hash = new URLSearchParams(confirmationUrl.hash.slice(1));
      const accessToken = hash.get("access_token") || confirmationUrl.searchParams.get("access_token");
      const refreshToken = hash.get("refresh_token") || confirmationUrl.searchParams.get("refresh_token");
      form.reset();
      if (!accessToken || !refreshToken) {
        throw new Error("O link está incompleto ou já não é válido. Solicite um novo convite ou uma recuperação de senha.");
      }

      const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });
      if (sessionError || !sessionData.session) {
        throw new Error("O link expirou ou já foi utilizado. Solicite um novo envio à CAFCM.");
      }

      const { error: userError } = await supabase.auth.getUser();
      if (userError) {
        await supabase.auth.signOut({ scope: "local" });
        throw new Error("Não foi possível validar esse acesso. Solicite um novo envio à CAFCM.");
      }

      state.session = sessionData.session;
      state.repairedAuthLink = true;
      history.replaceState({}, "", location.pathname);
      return renderPasswordSetup();
    }

    if (form.id === "bootstrap-form") {
      await callAdmin({ action: "bootstrap", fullName: values.fullName, email: values.email, password: values.password, code: values.code });
      const { error } = await supabase.auth.signInWithPassword({ email: String(values.email).trim(), password: String(values.password) });
      if (error) throw error;
      history.replaceState({}, "", location.pathname);
      return await loadPortal();
    }

    if (form.id === "password-form") {
      if (values.password !== values.confirmation) throw new Error("As senhas não coincidem.");
      const { error } = await supabase.auth.updateUser({ password: String(values.password) });
      if (error) throw error;
      history.replaceState({}, "", location.pathname);
      if (state.repairedAuthLink) {
        await supabase.auth.signOut({ scope: "global" });
        state.session = null;
        state.repairedAuthLink = false;
        await renderLogin();
        showToast("Senha criada. Entre novamente com seu e-mail e a nova senha.");
        return;
      }
      return await loadPortal();
    }

    if (form.id === "my-profile-form") {
      const fullName = String(values.fullName || "").trim();
      const password = String(values.password || "");
      const confirmation = String(values.confirmation || "");
      if (password !== confirmation) throw new Error("As novas senhas não coincidem.");
      if (password && password.length < 10) throw new Error("A nova senha deve ter pelo menos 10 caracteres.");
      const authAttributes = { data: { ...(state.session?.user?.user_metadata || {}), full_name: fullName } };
      if (password) authAttributes.password = password;
      const { data: authData, error: authError } = await supabase.auth.updateUser(authAttributes);
      if (authError) throw authError;
      const { error: profileError } = await supabase.from("profiles").update({ full_name: fullName }).eq("id", state.profile.id);
      if (profileError) throw profileError;
      state.profile.full_name = fullName;
      if (authData?.user) state.session.user = authData.user;
      if (password) await callAdmin({ action: "log_event", event: "profile.password_changed" }, true).catch(() => {});
      closeOverlay();
      await renderPortal();
      showToast(password ? "Perfil e senha atualizados." : "Perfil atualizado.");
      return;
    }

    if (form.id === "company-form") {
      const cnpj = normalizeCnpj(values.cnpj);
      const postalCode = digitsOnly(values.postalCode);
      const stateCode = String(values.state || "").trim().toUpperCase();
      if (cnpj && !isValidCnpj(cnpj)) throw new Error("Informe um CNPJ válido.");
      if (postalCode && postalCode.length !== 8) throw new Error("Informe um CEP com 8 números.");
      if (stateCode && stateCode.length !== 2) throw new Error("Informe a UF com duas letras.");
      const payload = {
        name: String(values.name).trim(),
        legal_name: valueOrNull(values.legalName),
        cnpj: cnpj || null,
        email: valueOrNull(values.email)?.toLowerCase() || null,
        phone: valueOrNull(values.phone),
        contact_name: valueOrNull(values.contactName),
        contact_role: valueOrNull(values.contactRole),
        contact_email: valueOrNull(values.contactEmail)?.toLowerCase() || null,
        contact_phone: valueOrNull(values.contactPhone),
        postal_code: postalCode || null,
        street: valueOrNull(values.street),
        street_number: valueOrNull(values.streetNumber),
        address_complement: valueOrNull(values.addressComplement),
        district: valueOrNull(values.district),
        city: valueOrNull(values.city),
        state: stateCode || null,
      };
      const query = values.companyId
        ? supabase.from("companies").update(payload).eq("id", values.companyId)
        : supabase.from("companies").insert(payload);
      const { error } = await query;
      if (error) throw error;
      closeOverlay();
      showToast(values.companyId ? "Dados da empresa atualizados." : "Empresa cadastrada.");
      return renderView();
    }

    if (form.id === "person-form") {
      const result = await callAdmin({
        action: "update_user",
        userId: values.userId,
        fullName: values.fullName,
        email: values.email,
        role: values.role,
        companyId: values.role === "cafcm_admin" ? null : values.companyId || null,
        passwordMode: values.passwordMode || "keep",
        password: values.passwordMode === "manual" ? String(values.password || "") : null,
      }, true);
      await renderView();
      if (result.temporaryPassword) {
        renderInviteCredentials(String(values.email).trim().toLowerCase(), result.temporaryPassword, "reset");
        return;
      }
      closeOverlay();
      const message = result.needsInviteResend
        ? "Dados salvos. Agora reenvie o convite para o novo e-mail."
        : result.permissionsChanged
          ? "Dados salvos. O novo perfil valerá no próximo acesso."
          : "Dados da pessoa atualizados.";
      showToast(message);
      return;
    }

    if (form.id === "people-import-form") {
      const file = values.peopleFile;
      if (!(file instanceof File) || !file.size) throw new Error("Selecione um arquivo CSV ou JSON.");
      if (file.size > 4 * 1024 * 1024) throw new Error("O arquivo deve ter no máximo 4 MB.");
      const text = await file.text();
      let people = [];
      let importHistory = {};
      if (file.name.toLowerCase().endsWith(".json") || file.type.includes("json")) {
        let backup;
        try {
          backup = JSON.parse(text);
        } catch {
          throw new Error("O arquivo JSON não é válido.");
        }
        if (backup?.format !== "portal-cafcm-people-backup" || !Array.isArray(backup.people)) throw new Error("Este JSON não é um backup de pessoas do Portal CAFCM.");
        people = backup.people;
        importHistory = backup.history || {};
      } else {
        const rows = parseCsv(text);
        if (!rows.length) throw new Error("O CSV está vazio ou não possui linhas abaixo do cabeçalho.");
        const { data: companies, error } = await supabase.from("companies").select("id,name");
        if (error) throw error;
        const companyMap = new Map();
        for (const company of companies || []) {
          companyMap.set(company.id.toLowerCase(), company.id);
          companyMap.set(company.name.toLowerCase().trim(), company.id);
        }
        people = rows.map((row) => {
          const companyReference = String(row.empresa_id || row.empresa || row.company_id || "").trim();
          return {
            fullName: row.nome || row.nome_completo || row.full_name || row.fullname,
            email: row.email,
            role: normalizeImportedRole(row.perfil || row.tipo_de_acesso || row.role),
            companyId: companyReference ? companyMap.get(companyReference.toLowerCase()) || companyReference : null,
            password: row.senha_opcional || row.senha || row.password || "",
          };
        });
      }
      if (people.length > 100) throw new Error("Divida o arquivo: cada importação aceita até 100 pessoas.");
      const result = await callAdmin({ action: "import_people", people, history: importHistory }, true);
      await renderView();
      renderImportResults(result);
      return;
    }

    if (form.id === "course-form") {
      const payload = {
        title: String(values.title).trim(),
        category: String(values.category || "").trim(),
        description: String(values.description || "").trim(),
        objectives: String(values.objectives || "").trim(),
        workload_hours: Number(values.workloadHours || 0),
      };
      if (values.courseId) {
        const { error } = await supabase.from("courses").update(payload).eq("id", values.courseId);
        if (error) throw error;
        closeOverlay();
        showToast("Dados do curso atualizados.");
        return renderView();
      }
      const { data, error } = await supabase.from("courses").insert({ ...payload, created_by: state.profile.id }).select("id").single();
      if (error) throw error;
      closeOverlay();
      showToast("Curso criado como rascunho.");
      state.selectedCourseId = data.id;
      return navigate("course-editor");
    }

    if (form.id === "invite-form") {
      if (values.role === "company" && !values.companyId) throw new Error("Selecione a empresa do representante.");
      const result = await callAdmin({
        action: "invite",
        fullName: values.fullName,
        email: values.email,
        role: values.role,
        companyId: values.role === "cafcm_admin" ? null : values.companyId || null,
        password: values.passwordMode === "manual" ? String(values.password || "") : null,
      }, true);
      if (!result.temporaryPassword) throw new Error("O acesso foi criado, mas a senha inicial não foi retornada. Use a recuperação de senha.");
      await renderView();
      renderInviteCredentials(String(values.email).trim().toLowerCase(), result.temporaryPassword);
      return;
    }

    if (form.id === "lesson-form") {
      const estimatedMinutes = values.estimatedMinutes ? Number(values.estimatedMinutes) : null;
      if (values.lessonId) {
        const { error } = await supabase.from("lessons").update({
          title: String(values.title).trim(),
          summary: String(values.summary || "").trim(),
          estimated_minutes: estimatedMinutes,
        }).eq("id", values.lessonId);
        if (error) throw error;
        closeOverlay();
        showToast("Aula atualizada.");
        return renderView();
      }
      const { data: items } = await supabase.from("lessons").select("position").eq("course_id", state.selectedCourseId).order("position", { ascending: false }).limit(1);
      const position = (items?.[0]?.position || 0) + 1;
      const { data: lesson, error } = await supabase.from("lessons").insert({
        course_id: state.selectedCourseId,
        title: String(values.title).trim(),
        content: "",
        summary: String(values.summary || "").trim(),
        estimated_minutes: estimatedMinutes,
        position,
      }).select("id").single();
      if (error) throw error;
      closeOverlay();
      showToast("Aula adicionada.");
      state.selectedLessonId = lesson.id;
      return navigate("lesson-editor");
    }

    if (form.id === "block-form") {
      const blockType = String(values.blockType || "");
      const title = String(values.title || "").trim();
      const blockContent = String(values.content || "").trim();
      const mediaUrl = String(values.mediaUrl || "").trim() || null;
      if (!blockTypeLabels[blockType]) throw new Error("Selecione um tipo de linha válido.");
      if (["text", "considerations"].includes(blockType) && !blockContent) throw new Error("Informe o conteúdo desta linha de aprendizagem.");
      if (blockType === "slides" && !parseSlides(blockContent).length) throw new Error("Adicione ao menos um slide.");
      if (blockType === "video" && !safeHttpUrl(mediaUrl)) throw new Error("Informe uma URL válida para o vídeo.");
      if (mediaUrl && !safeHttpUrl(mediaUrl)) throw new Error("A URL de mídia informada não é válida.");
      const payload = {
        lesson_id: state.selectedLessonId,
        block_type: blockType,
        title,
        content: blockContent,
        media_url: mediaUrl,
      };
      if (values.blockId) {
        const { error } = await supabase.from("lesson_blocks").update(payload).eq("id", values.blockId).eq("lesson_id", state.selectedLessonId);
        if (error) throw error;
        closeOverlay();
        showToast("Linha de aprendizagem atualizada.");
        return renderView();
      }
      const { data: items } = await supabase.from("lesson_blocks").select("position").eq("lesson_id", state.selectedLessonId).order("position", { ascending: false }).limit(1);
      const position = (items?.[0]?.position || 0) + 1;
      const { error } = await supabase.from("lesson_blocks").insert({ ...payload, position });
      if (error) throw error;
      closeOverlay();
      showToast("Linha adicionada à aula.");
      return renderView();
    }

    if (form.id === "activity-form") {
      const dueAt = values.dueAt ? new Date(String(values.dueAt)).toISOString() : null;
      const payload = {
        course_id: state.selectedCourseId,
        lesson_id: values.lessonId || null,
        title: String(values.title).trim(),
        instructions: String(values.instructions || "").trim(),
        due_at: dueAt,
      };
      if (values.activityId) {
        const { error } = await supabase.from("activities").update(payload).eq("id", values.activityId);
        if (error) throw error;
        closeOverlay();
        showToast("Atividade atualizada.");
        return renderView();
      }
      const { data: items } = await supabase.from("activities").select("position").eq("course_id", state.selectedCourseId).order("position", { ascending: false }).limit(1);
      const position = (items?.[0]?.position || 0) + 1;
      const { error } = await supabase.from("activities").insert({ ...payload, position });
      if (error) throw error;
      closeOverlay();
      showToast("Atividade adicionada.");
      return renderView();
    }

    if (form.id === "enrollment-form") {
      const { error } = await supabase.from("enrollments").insert({
        course_id: values.courseId,
        apprentice_id: values.apprenticeId,
      });
      if (error?.code === "23505") throw new Error("Este jovem já está matriculado nesse curso.");
      if (error) throw error;
      closeOverlay();
      showToast("Matrícula criada.");
      return renderView();
    }

    if (form.id === "response-form") {
      const payload = { activity_id: state.selectedActivityId, apprentice_id: state.profile.id, status: "submitted" };
      const { error: attemptError } = await supabase.from("activity_attempts").upsert(payload);
      if (attemptError) throw attemptError;
      const { error: responseError } = await supabase.from("activity_responses").upsert({
        activity_id: state.selectedActivityId,
        apprentice_id: state.profile.id,
        response_text: String(values.responseText).trim(),
      });
      if (responseError) throw responseError;
      closeOverlay();
      showToast("Atividade enviada para a CAFCM.");
      return renderView();
    }
  } catch (error) {
    const message = friendlyError(error);
    showFormError(form, message);
    showToast(message, "error");
  } finally {
    setBusy(form, false);
  }
});

async function init() {
  renderBoot();
  const hashType = new URLSearchParams(location.hash.slice(1)).get("type");
  const queryType = new URLSearchParams(location.search).get("type");

  supabase.auth.onAuthStateChange((event, session) => {
    state.session = session;
    if (event === "PASSWORD_RECOVERY") {
      window.setTimeout(renderPasswordSetup, 0);
    }
  });

  const { data } = await supabase.auth.getSession();
  state.session = data.session;
  state.repairedAuthLink = false;

  if (state.session && ["invite", "recovery", "signup"].includes(hashType || queryType)) {
    return renderPasswordSetup();
  }
  if (state.session) return loadPortal();
  return renderLogin();
}

init();
