import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://cyovnmnxzrfptyfrivdr.supabase.co";
const SUPABASE_KEY = "sb_publishable_otxl6dKO3VJ4G3qsNkfyoA_cP_EY6Lg";
const SITE_ORIGIN = window.location.origin;
const ADMIN_FUNCTION = `${SUPABASE_URL}/functions/v1/portal-admin`;
const AUTOMATION_FUNCTION = `${SUPABASE_URL}/functions/v1/portal-automation`;

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
  people: [],
  importResults: [],
  selectedPipelineId: null,
  pipelineSearch: "",
  pipelinePriority: "",
  pipelineResponsible: "",
  pipelineCompany: "",
  pipelineSort: "recent",
  taskFilter: "mine",
  notificationUnreadCount: 0,
  notificationFilter: "open",
  draggedPipelineItemId: null,
  vacancyTab: "overview",
  vacancySearch: "",
  vacancyStatus: "",
  vacancyCompany: "",
  financeSearch: "",
  financeStatus: "",
  financeCompany: "",
  documentTab: "files",
  documentSearch: "",
  documentCategory: "",
  automationTab: "overview",
  indicatorStart: "",
  indicatorEnd: "",
  indicatorGroup: "all",
};

const roleLabels = {
  cafcm_admin: "Equipe CAFCM",
  apprentice: "Jovem aprendiz",
  company: "Representante da empresa",
};

const departmentLabels = {
  management: "Direção e Administração",
  vacancies: "Gestão de Vagas",
  coordination: "Coordenação",
  personnel: "Departamento Pessoal",
  hr: "Recursos Humanos",
  finance: "Financeiro",
};

const departmentPermissions = {
  management: ["*"],
  vacancies: ["directory.read", "operations.read", "operations.manage", "companies.read", "companies.manage", "vacancies.read", "vacancies.manage", "reports.read", "reports.export"],
  coordination: ["directory.read", "apprentice.history.read", "operations.read", "operations.manage", "companies.read", "academic.read", "academic.manage", "reports.read", "reports.export"],
  personnel: ["directory.read", "apprentice.history.read", "operations.read", "operations.manage", "companies.read", "personnel.read", "personnel.manage", "contracts.read", "contracts.manage", "documents.read", "documents.manage", "finance.read", "finance.manage", "reports.read", "reports.export"],
  hr: ["directory.read", "apprentice.history.read", "operations.read", "operations.manage", "companies.read", "companies.manage", "vacancies.read", "vacancies.manage", "people.read", "people.manage", "audit.read", "reports.read", "reports.export"],
  finance: ["directory.read", "operations.read", "operations.manage", "companies.read", "contracts.read", "documents.read", "documents.manage", "finance.read", "finance.manage", "reports.read", "reports.export"],
};

const candidateStatusLabels = {
  new: "Novo",
  screening: "Em triagem",
  interview: "Em entrevistas",
  approved: "Aprovado",
  rejected: "Não aprovado",
  hired: "Convertido em jovem",
  archived: "Arquivado",
};

const vacancyStatusLabels = {
  draft: "Rascunho",
  open: "Aberta",
  paused: "Pausada",
  filled: "Preenchida",
  cancelled: "Cancelada",
};

const applicationStatusLabels = {
  received: "Candidato recebido",
  screening: "Triagem",
  cafcm_interview: "Entrevista CAFCM",
  referred_company: "Encaminhado à empresa",
  company_interview: "Entrevista na empresa",
  waiting_return: "Aguardando retorno",
  approved: "Aprovado",
  talent_pool: "Banco de talentos",
  rejected: "Não aprovado",
  withdrawn: "Desistente",
  hired: "Admissão iniciada",
};

const admissionStatusLabels = {
  approved: "Aprovado",
  documents_pending: "Documentos pendentes",
  documents_complete: "Documentos completos",
  medical_exam: "Exame admissional",
  contract_preparation: "Contrato em elaboração",
  signatures_pending: "Aguardando assinaturas",
  accounting: "Contabilidade / eSocial",
  enrollment: "Matrícula / curso",
  completed: "Admissão concluída",
  cancelled: "Cancelada",
};

const terminationStatusLabels = {
  request: "Solicitação",
  analysis: "Análise",
  medical_exam: "Exame demissional",
  documentation: "Documentação",
  accounting: "Contabilidade",
  termination: "Rescisão",
  finance: "Financeiro",
  documents_delivered: "Documentos entregues",
  completed: "Concluído",
  cancelled: "Cancelado",
};

const leaveTypeLabels = {
  vacation: "Férias",
  medical_leave: "Afastamento médico",
  other_leave: "Outro afastamento",
};

const leaveStatusLabels = {
  planned: "Planejado",
  approved: "Aprovado",
  in_progress: "Em andamento",
  completed: "Concluído",
  cancelled: "Cancelado",
};

const accountingStatusLabels = {
  pending: "Pendente",
  preparing: "Em preparação",
  sent: "Enviado",
  waiting_response: "Aguardando retorno",
  received: "Recebido",
  verified: "Conferido",
  completed: "Concluído",
};

const financialStatusLabels = {
  to_invoice: "A faturar",
  invoice_issued: "NF emitida",
  payment_slip_issued: "Boleto emitido",
  sent: "Enviado",
  to_due: "A vencer",
  overdue: "Vencido",
  collection: "Em cobrança",
  paid: "Pago",
  cancelled: "Cancelado",
};

const documentCategoryLabels = {
  admission: "Admissão",
  contract: "Contrato",
  documents: "Documentação geral",
  vacation: "Férias",
  leave: "Afastamento",
  termination: "Desligamento",
  accounting: "Contabilidade",
  finance: "Financeiro",
  payroll: "Folha de pagamento",
  registration_change: "Alteração cadastral",
  invoice: "Nota fiscal",
  payment_slip: "Boleto",
  receipt: "Comprovante",
  other: "Outro",
};

const documentRequirementStatusLabels = {
  pending: "Pendente",
  received: "Recebido",
  verified: "Conferido",
  waived: "Dispensado",
};

const viewPermissions = {
  overview: "operations.read",
  pipelines: "operations.read",
  tasks: "operations.read",
  notifications: "operations.read",
  automations: "operations.read",
  vacancies: "vacancies.read",
  partnerships: "vacancies.read",
  companies: "companies.read",
  apprentices: "directory.read",
  admissions: "personnel.read",
  contracts: "contracts.read",
  leaves: "personnel.read",
  terminations: "personnel.read",
  personnel: "personnel.read",
  finance: "finance.read",
  courses: "academic.read",
  "course-editor": "academic.read",
  "lesson-editor": "academic.read",
  enrollments: "academic.read",
  documents: "documents.read",
  accounting: "finance.read",
  procedures: "operations.read",
  people: "people.read",
  audit: "audit.read",
  indicators: "reports.read",
};

function profileDepartment(profile = state.profile) {
  return profile?.role === "cafcm_admin" ? profile.department || "management" : null;
}

function hasPermission(permission, profile = state.profile) {
  if (profile?.role !== "cafcm_admin") return false;
  const permissions = departmentPermissions[profileDepartment(profile)] || [];
  return permissions.includes("*") || permissions.includes(permission);
}

function profileAccessLabel(profile = state.profile) {
  if (profile?.role !== "cafcm_admin") return roleLabels[profile?.role] || "Acesso";
  return departmentLabels[profileDepartment(profile)] || roleLabels.cafcm_admin;
}

function departmentOptions(selected = "management") {
  return Object.entries(departmentLabels)
    .map(([value, label]) => `<option value="${value}" ${value === selected ? "selected" : ""}>${label}</option>`)
    .join("");
}

function canManagePerson(person) {
  if (!hasPermission("people.manage")) return false;
  return person?.role !== "cafcm_admin" || profileDepartment() === "management";
}

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
  "candidates.insert": "Candidato cadastrado",
  "candidates.update": "Candidato atualizado",
  "candidates.delete": "Candidato excluído",
  "job_vacancies.insert": "Vaga criada",
  "job_vacancies.update": "Vaga atualizada",
  "job_vacancies.delete": "Vaga excluída",
  "vacancy_applications.insert": "Seleção iniciada",
  "vacancy_applications.update": "Etapa da seleção atualizada",
  "vacancy_applications.delete": "Seleção excluída",
  "partnership_agreements.insert": "Parceria cadastrada",
  "partnership_agreements.update": "Parceria atualizada",
  "partnership_agreements.delete": "Parceria excluída",
  "candidate_documents.insert": "Documento de candidato enviado",
  "candidate.converted": "Candidato convertido em jovem",
  "financial_charges.insert": "Cobrança criada",
  "financial_charges.update": "Cobrança atualizada",
  "financial_charges.delete": "Cobrança excluída",
  "document_requirements.insert": "Pendência documental criada",
  "document_requirements.update": "Pendência documental atualizada",
  "document_requirements.delete": "Pendência documental excluída",
  "termination_checklist_items.insert": "Item de desligamento criado",
  "termination_checklist_items.update": "Checklist de desligamento atualizado",
  "termination_checklist_items.delete": "Item de desligamento excluído",
  "document_records.update": "Documento atualizado",
  "leave_records.insert": "Férias ou afastamento registrado",
  "leave_records.update": "Férias ou afastamento atualizado",
  "termination_cases.insert": "Desligamento aberto",
  "termination_cases.update": "Desligamento atualizado",
  "accounting_dispatches.insert": "Envio à contabilidade criado",
  "accounting_dispatches.update": "Envio à contabilidade atualizado",
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
  "pipelines.insert": "Esteira criada",
  "pipelines.update": "Esteira alterada",
  "pipeline_stages.insert": "Etapa criada",
  "pipeline_stages.update": "Etapa alterada",
  "pipeline_items.insert": "Processo criado",
  "pipeline_items.update": "Processo alterado ou movimentado",
  "pipeline_items.delete": "Processo excluído",
  "tasks.insert": "Tarefa criada",
  "tasks.update": "Tarefa alterada",
  "tasks.delete": "Tarefa excluída",
  "task_checklist_items.insert": "Item de checklist criado",
  "task_checklist_items.update": "Checklist de tarefa atualizado",
  "task_checklist_items.delete": "Item de checklist excluído",
};

const navigation = {
  cafcm_admin: [
    { label: "Painel", items: [["overview", "Visão geral", "grid"], ["indicators", "Indicadores e relatórios", "history"]] },
    { label: "Operações", items: [
      ["pipelines", "Central de Esteiras", "kanban"],
      ["tasks", "Tarefas e Pendências", "tasks"],
      ["notifications", "Notificações", "bell"],
      ["automations", "Automações", "clock"],
    ] },
    { label: "Gestão de vagas", items: [
      ["vacancies", "Vagas e candidatos", "kanban"],
      ["partnerships", "Parcerias e jovens", "building"],
    ] },
    { label: "Empresas", items: [["companies", "Empresas parceiras", "building"]] },
    { label: "Jovens", items: [
      ["apprentices", "Jovens / Aprendizes", "users"],
      ["admissions", "Admissões", "tasks"],
      ["contracts", "Contratos", "calendar"],
      ["leaves", "Férias e afastamentos", "history"],
      ["terminations", "Desligamentos", "alert"],
    ] },
    { label: "Acadêmico", items: [
      ["courses", "Cursos", "book"],
      ["enrollments", "Matrículas", "link"],
    ] },
    { label: "Administrativo", items: [
      ["personnel", "Departamento Pessoal", "users"],
      ["finance", "Financeiro", "calendar"],
      ["documents", "Documentos", "upload"],
      ["accounting", "Contabilidade", "mail"],
      ["procedures", "Procedimentos", "tasks"],
      ["people", "Pessoas e Convites", "users"],
      ["audit", "Auditoria", "history"],
    ] },
  ],
  apprentice: [
    { label: "Jovem aprendiz", items: [
      ["student-home", "Início", "home"],
      ["student-courses", "Meus cursos", "book"],
      ["student-activities", "Atividades", "check"],
    ] },
  ],
  company: [
    { label: "Representante da empresa", items: [
      ["company-home", "Visão geral", "grid"],
      ["company-apprentices", "Aprendizes", "users"],
    ] },
  ],
};

function canAccessView(view, profile = state.profile) {
  if (!profile) return false;
  if (profile.role === "apprentice") return ["student-home", "student-courses", "student-activities", "student-course"].includes(view);
  if (profile.role === "company") return ["company-home", "company-apprentices"].includes(view);
  const permission = viewPermissions[view];
  return Boolean(permission && hasPermission(permission, profile));
}

function navigationForProfile(profile = state.profile) {
  return (navigation[profile?.role] || [])
    .map((group) => ({ ...group, items: (group.items || []).filter(([view]) => canAccessView(view, profile)) }))
    .filter((group) => group.items.length);
}

function navigationItems(profile = state.profile) {
  return navigationForProfile(profile).flatMap((group) => group.items || []);
}

const wizardContent = {
  cafcm_admin: [
    ["Acompanhe o que exige ação", "A Visão geral reúne tarefas vencidas, processos atrasados e os principais números da operação."],
    ["Conduza os processos", "Na Central de Esteiras, selecione a área, crie o processo e mova o cartão conforme o trabalho avança. Cada movimentação fica registrada."],
    ["Organize as pendências", "Crie tarefas com responsável, prioridade, prazo e checklist. Use os filtros para localizar o que está atrasado, previsto para hoje ou concluído."],
    ["Mantenha os cadastros únicos", "Empresas e jovens são vinculados aos processos e às tarefas existentes, sem criar cadastros duplicados."],
    ["Consulte o histórico", "Notificações informam novas atribuições, enquanto a Auditoria preserva as alterações realizadas pela equipe."],
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

const departmentWizardContent = {
  management: wizardContent.cafcm_admin,
  vacancies: [
    ["Comece pelas vagas", "Em Vagas e candidatos, acompanhe as oportunidades abertas, os candidatos vinculados e a etapa atual de cada seleção."],
    ["Mantenha as empresas atualizadas", "Use Empresas parceiras para conferir os dados da organização antes de abrir uma vaga ou registrar uma parceria."],
    ["Registre cada avanço", "Inclua o candidato na vaga correspondente e atualize o processo sempre que houver triagem, entrevista, aprovação ou encerramento."],
    ["Organize sua rotina", "Use Tarefas e Pendências para registrar responsáveis, prazos e providências que ainda precisam ser concluídas."],
  ],
  coordination: [
    ["Acompanhe os jovens", "Consulte Jovens / Aprendizes para localizar os participantes acompanhados pela CAFCM e conferir seus vínculos."],
    ["Organize a formação", "Em Cursos, estruture aulas, linhas de aprendizagem e atividades antes de publicar o conteúdo."],
    ["Gerencie as matrículas", "Em Matrículas, vincule cada jovem ao curso correto para liberar o acesso às aulas."],
    ["Observe o andamento", "Use as conclusões e atividades registradas para orientar o jovem e alinhar o acompanhamento com a empresa."],
  ],
  personnel: [
    ["Comece pelos cadastros", "Confirme a empresa e o jovem antes de iniciar uma admissão ou registrar um contrato."],
    ["Conduza a admissão", "Abra a admissão, cumpra o checklist e mantenha documentos e prazos no mesmo registro."],
    ["Acompanhe os contratos", "Registre vigência, função e situação do contrato para visualizar vencimentos e providências futuras."],
    ["Registre ocorrências", "Use Férias e afastamentos ou Desligamentos para preservar datas, observações e o histórico do jovem."],
    ["Encaminhe à contabilidade", "Em Contabilidade, registre o que foi enviado, o prazo, o retorno recebido e a conferência final."],
  ],
  hr: [
    ["Organize empresas e candidatos", "Confira as empresas parceiras e use Vagas e candidatos para acompanhar recrutamento, triagem e seleção."],
    ["Cuide dos acessos externos", "Em Pessoas e convites, crie e atualize acessos de jovens e representantes de empresas."],
    ["Proteja os acessos da equipe", "Contas e departamentos da equipe CAFCM somente podem ser alterados pela Direção e Administração."],
    ["Consulte o histórico", "Use a Auditoria para conferir convites, alterações de cadastro e ações relevantes realizadas no portal."],
  ],
  finance: [
    ["Comece pelo Financeiro", "Registre cada cobrança por empresa, competência e vencimento; depois atualize NF, boleto, envio e pagamento."],
    ["Controle os encaminhamentos", "Em Contabilidade, registre assuntos, prazos, envios, retornos e conferências sem depender de controles paralelos."],
    ["Organize os documentos", "Use Documentos para guardar notas fiscais, boletos e comprovantes no cadastro correspondente."],
    ["Acompanhe os procedimentos", "Em Procedimentos, confira processos, responsáveis, tarefas e prazos das rotinas administrativas."],
  ],
};

function wizardSteps(profile = state.profile) {
  return profile?.role === "cafcm_admin"
    ? departmentWizardContent[profileDepartment(profile)] || wizardContent.cafcm_admin
    : wizardContent[profile?.role] || [];
}

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
  kanban: '<rect x="3" y="4" width="5" height="16" rx="1.5"/><rect x="10" y="4" width="5" height="10" rx="1.5"/><rect x="17" y="4" width="4" height="13" rx="1.5"/>',
  tasks: '<path d="m4 7 2 2 4-4M4 15l2 2 4-4M13 7h7M13 15h7"/>',
  bell: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/>',
  alert: '<path d="M12 3 2.8 19h18.4z"/><path d="M12 9v4M12 17h.01"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
  flag: '<path d="M5 21V4M5 5h11l-2 4 2 4H5"/>',
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
  const date = new Date(/^\d{4}-\d{2}-\d{2}$/.test(String(value)) ? `${value}T12:00:00` : value);
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

function formatMoney(value) {
  if (value === null || value === undefined || value === "") return "Não informado";
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value));
}

function formatMonth(value) {
  if (!value) return "Competência não informada";
  const date = new Date(`${String(value).slice(0, 7)}-15T12:00:00`);
  if (Number.isNaN(date.getTime())) return "Competência não informada";
  const label = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" }).format(date);
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function formatFileSize(value) {
  const bytes = Number(value || 0);
  if (!bytes) return "Tamanho não informado";
  if (bytes < 1024 * 1024) return `${new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 }).format(bytes / 1024)} KB`;
  return `${new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 }).format(bytes / (1024 * 1024))} MB`;
}

function selectOptions(labels, selected = "") {
  return Object.entries(labels).map(([value, label]) => `<option value="${value}" ${value === selected ? "selected" : ""}>${label}</option>`).join("");
}

function workflowProgress(labels, currentStatus) {
  const entries = Object.entries(labels).filter(([value]) => !["cancelled", "rejected", "withdrawn", "talent_pool", "hired"].includes(value));
  const foundIndex = entries.findIndex(([value]) => value === currentStatus);
  const currentIndex = currentStatus === "hired" ? entries.findIndex(([value]) => value === "approved") : foundIndex;
  return `<div class="workflow-steps">${entries.map(([value, label], index) => `<span class="workflow-step ${index < currentIndex ? "is-complete" : index === currentIndex ? "is-current" : ""}"><i>${index < currentIndex ? "✓" : index + 1}</i><small>${escapeHtml(label)}</small></span>`).join("")}</div>`;
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

function defaultView(profile = state.profile) {
  if (typeof profile === "string") return profile === "cafcm_admin" ? "overview" : profile === "company" ? "company-home" : "student-home";
  return navigationItems(profile)[0]?.[0] || (profile?.role === "company" ? "company-home" : "student-home");
}

function viewTitle(view) {
  const titles = {
    overview: ["Visão geral", "Situação real do portal"],
    pipelines: ["Central de Esteiras", "Processos da operação CAFCM"],
    tasks: ["Tarefas e Pendências", "Responsáveis, prazos e checklists"],
    notifications: ["Notificações", "Atualizações direcionadas ao seu acesso"],
    automations: ["Automações", "Alertas, documentos e comunicações"],
    companies: ["Empresas", "Parceiros vinculados aos aprendizes"],
    apprentices: ["Jovens / Aprendizes", "Cadastro central dos jovens"],
    admissions: ["Admissões", "Documentos, contratos e início do jovem"],
    contracts: ["Contratos", "Vigência, vencimentos e vínculos"],
    leaves: ["Férias e afastamentos", "Controle de datas e providências"],
    terminations: ["Desligamentos", "Processos, documentos e histórico"],
    personnel: ["Departamento Pessoal", "Ciclo administrativo dos jovens"],
    finance: ["Financeiro", "Cobranças, boletos e recebimentos"],
    documents: ["Documentos", "Arquivo digital privado da CAFCM"],
    accounting: ["Contabilidade", "Envios, retornos e conferência"],
    procedures: ["Procedimentos", "Processos, responsáveis e prazos"],
    people: ["Pessoas e convites", "Acessos criados pela CAFCM"],
    courses: ["Cursos", "Formações, aulas e atividades"],
    "course-editor": ["Editor do curso", "Conteúdo pedagógico"],
    "lesson-editor": ["Estrutura da aula", "Linhas de aprendizagem"],
    enrollments: ["Matrículas", "Vínculos entre jovens e cursos"],
    audit: ["Auditoria", "Histórico das ações no portal"],
    indicators: ["Indicadores e relatórios", "Dados reais para apoiar a gestão"],
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

async function callAutomation(payload) {
  const { data } = await supabase.auth.getSession();
  if (!data.session?.access_token) throw new Error("Sua sessão expirou. Entre novamente.");
  const response = await fetch(AUTOMATION_FUNCTION, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${data.session.access_token}`,
    },
    body: JSON.stringify(payload),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(body.error || "Não foi possível concluir a operação.");
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
  const resendMode = mode === "resend";
  const bootstrapMode = mode === "bootstrap";
  const heading = bootstrapMode
    ? "Configure o primeiro acesso."
    : recoverMode
      ? "Recupere sua senha."
      : resendMode
        ? "Reenvie a confirmação."
        : "Entre no Portal CAFCM.";
  const intro = bootstrapMode
    ? "Use a chave inicial fornecida nesta implantação. Depois disso, novos acessos serão criados somente por convite."
    : recoverMode
      ? "Informe o e-mail cadastrado para receber o link de recuperação."
      : resendMode
        ? "Use esta opção quando o convite já foi aceito, mas o primeiro acesso ainda não concluiu."
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
              <button type="button" class="text-link" data-auth-mode="resend">Reenviar confirmação</button>
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

          ${resendMode ? `
            <form id="resend-form" class="stack-form">
              <label>E-mail<input name="email" type="email" autocomplete="email" required placeholder="voce@exemplo.com" /></label>
              <button class="btn btn-primary btn-block" type="submit">Reenviar confirmação</button>
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
  app.innerHTML = `
    <main class="auth-shell compact-auth">
      <section class="auth-panel">
        ${brand()}
        <div class="auth-main">
          <p class="eyebrow">Primeiro acesso</p>
          <h1>Crie sua senha.</h1>
          <p class="auth-intro">Defina uma senha pessoal para concluir o convite ou a recuperação da conta.</p>
          <form id="password-form" class="stack-form">
            <label>Nova senha<input name="password" type="password" autocomplete="new-password" minlength="10" required /><small>Mínimo de 10 caracteres.</small></label>
            <label>Confirme a senha<input name="confirmation" type="password" autocomplete="new-password" minlength="10" required /></label>
            <button class="btn btn-primary btn-block" type="submit">Salvar senha e entrar</button>
          </form>
        </div>
        <p class="auth-foot">Nunca compartilhe sua senha com terceiros.</p>
      </section>
      <aside class="auth-context password-context"><div class="context-content">${icon("shield")}<h2>Seu acesso foi confirmado.</h2><p>Depois de criar a senha, o guia rápido mostrará como usar o portal conforme o seu perfil.</p></div></aside>
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
    .select("id,full_name,role,company_id,department,onboarding_completed,is_active")
    .eq("id", state.session.user.id)
    .single();

  if (error || !profile?.role) return renderNoAccess();
  if (!profile.is_active) {
    await supabase.auth.signOut();
    await renderLogin();
    return showToast("Este acesso foi arquivado pela CAFCM.", "error");
  }

  state.profile = profile;
  state.view = state.view && canAccessView(state.view, profile)
    ? state.view
    : defaultView(profile);
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
  const nav = navigationForProfile(profile);
  const [title, subtitle] = viewTitle(state.view);
  const activeBase = ["course-editor", "lesson-editor"].includes(state.view) ? "courses" : state.view === "student-course" ? "student-courses" : state.view;
  if (profile.role === "cafcm_admin") {
    const { count } = await supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("recipient_id", profile.id)
      .eq("status", "open")
      .eq("is_read", false);
    state.notificationUnreadCount = count || 0;
  } else {
    state.notificationUnreadCount = 0;
  }

  app.innerHTML = `
    <div class="portal-shell">
      <button class="sidebar-scrim" data-close-menu aria-label="Fechar menu"></button>
      <aside class="sidebar">
        <div class="sidebar-head">${brand(true)}<button class="icon-btn sidebar-close" data-close-menu aria-label="Fechar menu">${icon("close")}</button></div>
        <nav aria-label="Navegação principal">
          ${nav.map((group) => `<section class="nav-group"><span class="nav-label">${escapeHtml(group.label)}</span>${group.items.map(([id, label, iconName]) => `<button class="nav-item ${activeBase === id ? "active" : ""}" data-nav="${id}">${icon(iconName)}<span>${label}</span></button>`).join("")}</section>`).join("")}
        </nav>
        <button class="guide-card" data-open-wizard>${icon("help")}<span><strong>Guia rápido</strong><small>Rever como usar</small></span></button>
        <div class="sidebar-user"><span class="avatar">${escapeHtml(initials(profile.full_name))}</span><span><strong>${escapeHtml(profile.full_name || roleLabels[profile.role])}</strong><small>${escapeHtml(profileAccessLabel(profile))}</small></span></div>
      </aside>
      <section class="portal-main">
        <header class="topbar">
          <button class="icon-btn menu-button" data-open-menu aria-label="Abrir menu">${icon("menu")}</button>
          <div><strong>${title}</strong><small>${subtitle}</small></div>
          ${profile.role === "cafcm_admin" ? `<button class="icon-btn notification-button ${state.notificationUnreadCount ? "has-unread" : ""}" data-nav="notifications" aria-label="Notificações${state.notificationUnreadCount ? `: ${state.notificationUnreadCount} não lidas` : ""}">${icon("bell")}${state.notificationUnreadCount ? `<b>${state.notificationUnreadCount > 99 ? "99+" : state.notificationUnreadCount}</b>` : ""}</button>` : ""}
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
    if (!canAccessView(state.view, state.profile)) state.view = defaultView(state.profile);
    const renderers = {
      overview: renderAdminOverview,
      pipelines: renderPipelines,
      tasks: renderTasks,
      notifications: renderNotifications,
      automations: renderAutomations,
      companies: renderCompanies,
      apprentices: renderApprentices,
      admissions: renderAdmissions,
      contracts: renderContracts,
      leaves: renderLeaves,
      terminations: renderTerminations,
      personnel: renderPersonnel,
      finance: renderFinance,
      documents: renderDocuments,
      accounting: renderAccounting,
      procedures: renderProcedures,
      vacancies: renderVacancies,
      partnerships: renderPartnerships,
      people: renderPeople,
      courses: renderCourses,
      "course-editor": renderCourseEditor,
      "lesson-editor": renderLessonEditor,
      enrollments: renderEnrollments,
      audit: renderAudit,
      indicators: renderIndicators,
      "student-home": renderStudentHome,
      "student-courses": renderStudentCourses,
      "student-activities": renderStudentActivities,
      "student-course": renderStudentCourse,
      "company-home": renderCompanyHome,
      "company-apprentices": renderCompanyApprentices,
    };
    await (renderers[state.view] || renderers[defaultView(state.profile)])(content);
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
  const labels = {
    draft: "Rascunho",
    published: "Publicado",
    archived: "Arquivado",
    submitted: "Enviada",
    reviewed: "Revisada",
    pending: "Pendente",
    in_progress: "Em andamento",
    waiting: "Aguardando terceiro",
    completed: "Concluída",
    cancelled: "Cancelada",
  };
  return `<span class="status status-${status}">${labels[status] || status}</span>`;
}

const priorityLabels = { low: "Baixa", normal: "Normal", high: "Alta", urgent: "Urgente" };
const priorityOrder = { urgent: 4, high: 3, normal: 2, low: 1 };

function priorityBadge(priority = "normal") {
  return `<span class="priority priority-${priority}">${priorityLabels[priority] || priority}</span>`;
}

function isOverdue(value) {
  if (!value) return false;
  const date = new Date(value);
  return !Number.isNaN(date.getTime()) && date.getTime() < Date.now();
}

function localDayKey(value = new Date()) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function dueMarkup(value, closed = false) {
  if (!value) return `<span class="due-label no-due">${icon("calendar")} Sem prazo</span>`;
  const overdue = !closed && isOverdue(value);
  return `<span class="due-label ${overdue ? "overdue" : ""}">${icon(overdue ? "alert" : "calendar")} ${overdue ? "Atrasado · " : ""}${formatDate(value, true)}</span>`;
}

async function countRows(table, filter) {
  let query = supabase.from(table).select("*", { count: "exact", head: true });
  if (filter) query = filter(query);
  const { count, error } = await query;
  if (error) throw error;
  return count || 0;
}

async function renderAdminOverview(content) {
  const [companies, apprentices, courses, admissions, contracts, taskResult, processResult, alertResult] = await Promise.all([
    countRows("companies", (query) => query.eq("is_active", true)),
    countRows("profiles", (query) => query.eq("role", "apprentice").eq("is_active", true)),
    countRows("courses"),
    countRows("admission_cases", (query) => query.not("status", "in", "(completed,cancelled)")),
    countRows("contracts", (query) => query.in("status", ["scheduled", "active", "closing"])),
    supabase.from("tasks").select("id,title,status,priority,due_at").not("status", "in", "(completed,cancelled)").order("due_at", { ascending: true, nullsFirst: false }).limit(250),
    supabase.from("pipeline_items").select("id,title,pipeline_id,priority,due_at,closed_at").eq("is_archived", false).order("due_at", { ascending: true, nullsFirst: false }).limit(250),
    supabase.from("operational_alerts").select("id,category,severity,title,message,due_on,metadata").eq("status", "active").order("severity").order("due_on", { ascending: true, nullsFirst: false }).limit(100),
  ]);
  if (taskResult.error || processResult.error || alertResult.error) throw taskResult.error || processResult.error || alertResult.error;
  const openTasks = taskResult.data || [];
  const openProcesses = (processResult.data || []).filter((item) => !item.closed_at);
  const liveAttention = [
    ...openTasks.filter((task) => isOverdue(task.due_at)).map((task) => ({ ...task, kind: "task" })),
    ...openProcesses.filter((item) => isOverdue(item.due_at)).map((item) => ({ ...item, kind: "process" })),
  ].sort((first, second) => new Date(first.due_at) - new Date(second.due_at));
  const alertView = {
    contract: "contracts", admission: "admissions", document: "documents", task: "tasks", accounting: "accounting", termination: "terminations", leave: "leaves", vacancy: "vacancies", recruitment: "vacancies", finance: "finance", academic: "courses",
  };
  const persistedAlerts = (alertResult.data || [])
    .map((item) => ({ ...item, kind: "alert", target: alertView[item.category] || "overview" }))
    .filter((item) => canAccessView(item.target));
  const attention = [...persistedAlerts, ...liveAttention.filter((item) => !persistedAlerts.some((alert) => alert.category === item.kind))];
  const urgentCount = persistedAlerts.filter((item) => item.severity === "urgent").length;
  const metrics = [
    ["Empresas ativas", companies, "building", canAccessView("companies")],
    ["Jovens ativos", apprentices, "users", canAccessView("apprentices")],
    ["Admissões em andamento", admissions, "tasks", canAccessView("admissions")],
    ["Contratos acompanhados", contracts, "calendar", canAccessView("contracts")],
    ["Processos abertos", openProcesses.length, "kanban", canAccessView("pipelines")],
    ["Tarefas pendentes", openTasks.length, "tasks", canAccessView("tasks")],
  ].filter((item) => item[3]);
  const quickActions = [
    [`${persistedAlerts.filter((item) => item.category === "document").length} documentos pendentes`, persistedAlerts.some((item) => item.category === "document"), "admissions"],
    [`${persistedAlerts.filter((item) => item.category === "contract").length} contratos em alerta`, persistedAlerts.some((item) => item.category === "contract"), "contracts"],
    [`${persistedAlerts.filter((item) => item.category === "accounting").length} retornos da contabilidade`, persistedAlerts.some((item) => item.category === "accounting"), "accounting"],
    ["Abrir a Central de Esteiras", openProcesses.length > 0, "pipelines"],
    ["Conferir tarefas e prazos", openTasks.length > 0, "tasks"],
  ].filter((item) => canAccessView(item[2]));

  content.innerHTML = `
    ${pageHead("Visão geral", "Veja o que exige providência no trabalho do seu departamento.", hasPermission("operations.manage") ? `<button class="btn btn-primary" data-dialog="task">${icon("plus")} Nova tarefa</button>` : "")}
    <section class="metric-grid">
      ${metrics.map(([label, value, iconName]) => metric(label, value, iconName)).join("")}
    </section>
    <section class="dashboard-grid">
      <article class="card attention-card">
        <div class="card-head"><div><span class="eyebrow">Precisa da sua atenção</span><h2>${attention.length ? `${attention.length} ${attention.length === 1 ? "pendência identificada" : "pendências identificadas"}` : "Nenhuma pendência crítica"}</h2></div>${attention.length ? `<span class="attention-count">${urgentCount || attention.length}</span>` : ""}</div>
        ${attention.length ? `<div class="attention-list">${attention.slice(0, 8).map((item) => {
          const isAlert = item.kind === "alert";
          const iconName = isAlert ? (item.category === "contract" ? "calendar" : item.category === "accounting" ? "mail" : item.category === "document" ? "upload" : item.category === "task" ? "tasks" : "alert") : item.kind === "task" ? "tasks" : "kanban";
          const destination = isAlert ? item.target : item.kind === "task" ? "tasks" : "pipelines";
          const detail = isAlert ? item.message : `${item.kind === "task" ? "Tarefa" : "Processo"} · prazo em ${formatDate(item.due_at, true)}`;
          return `<button data-nav="${destination}"><span class="attention-icon">${icon(iconName)}</span><span><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(detail)}</small></span>${isAlert ? `<span class="status status-${item.severity === "urgent" ? "cancelled" : "draft"}">${item.severity === "urgent" ? "Urgente" : "Atenção"}</span>` : priorityBadge(item.priority)}</button>`;
        }).join("")}</div>` : `<div class="attention-clear">${icon("check")}<div><strong>Rotina em dia</strong><p>Não há tarefas, processos ou alertas disponíveis para o seu departamento.</p></div></div>`}
      </article>
      <article class="card quick-actions-card">
        <div class="card-head"><div><span class="eyebrow">Rotina de hoje</span><h2>Próximas ações</h2></div></div>
        ${quickActions.map(([label, done, destination]) => checklistItem(label, done, destination)).join("")}
      </article>
    </section>
  `;
}

function checklistItem(label, done, destination) {
  return `<button class="checklist-item" data-nav="${destination}"><span class="check-circle ${done ? "done" : ""}">${done ? icon("check") : ""}</span><span>${label}</span>${icon("chevron")}</button>`;
}

async function loadOperationalReferences() {
  const [{ data: companies, error: companiesError }, { data: profiles, error: profilesError }] = await Promise.all([
    supabase.from("companies").select("id,name,is_active").order("is_active", { ascending: false }).order("name"),
    supabase.from("profiles").select("id,full_name,role,company_id,is_active").order("full_name"),
  ]);
  if (companiesError || profilesError) throw companiesError || profilesError;
  return {
    companies: companies || [],
    profiles: profiles || [],
    apprentices: (profiles || []).filter((profile) => profile.role === "apprentice" && profile.is_active),
    administrators: (profiles || []).filter((profile) => profile.role === "cafcm_admin" && profile.is_active),
  };
}

function filterPipelineItems(items) {
  const search = state.pipelineSearch.trim().toLocaleLowerCase("pt-BR");
  return items.filter((item) => {
    const haystack = [item.title, item.description, item.companyName, item.apprenticeName, item.responsibleName].filter(Boolean).join(" ").toLocaleLowerCase("pt-BR");
    return (!search || haystack.includes(search))
      && (!state.pipelinePriority || item.priority === state.pipelinePriority)
      && (!state.pipelineResponsible || item.responsible_id === state.pipelineResponsible)
      && (!state.pipelineCompany || item.company_id === state.pipelineCompany);
  }).sort((first, second) => {
    if (state.pipelineSort === "oldest") return new Date(first.created_at) - new Date(second.created_at);
    if (state.pipelineSort === "due") {
      const firstDue = first.due_at ? new Date(first.due_at).getTime() : Number.MAX_SAFE_INTEGER;
      const secondDue = second.due_at ? new Date(second.due_at).getTime() : Number.MAX_SAFE_INTEGER;
      return firstDue - secondDue;
    }
    if (state.pipelineSort === "priority") return (priorityOrder[second.priority] || 0) - (priorityOrder[first.priority] || 0);
    return new Date(second.last_moved_at) - new Date(first.last_moved_at);
  });
}

async function renderPipelines(content) {
  const [{ data: pipelines, error }, references] = await Promise.all([
    supabase.from("pipelines").select("*").eq("is_active", true).order("position"),
    loadOperationalReferences(),
  ]);
  if (error) throw error;
  if (!pipelines?.length) {
    content.innerHTML = `${pageHead("Central de Esteiras", "Acompanhe os processos da operação CAFCM.")}<section class="card">${emptyState("Nenhuma esteira ativa", "Ative ao menos uma esteira para organizar os processos.")}</section>`;
    return;
  }

  if (!state.selectedPipelineId || !pipelines.some((pipeline) => pipeline.id === state.selectedPipelineId)) {
    state.selectedPipelineId = pipelines[0].id;
  }
  const selectedPipeline = pipelines.find((pipeline) => pipeline.id === state.selectedPipelineId);
  const [{ data: stages, error: stagesError }, { data: items, error: itemsError }] = await Promise.all([
    supabase.from("pipeline_stages").select("*").eq("pipeline_id", state.selectedPipelineId).eq("is_active", true).order("position"),
    supabase.from("pipeline_items").select("*").eq("pipeline_id", state.selectedPipelineId).eq("is_archived", false).order("position"),
  ]);
  if (stagesError || itemsError) throw stagesError || itemsError;

  const companyMap = new Map(references.companies.map((item) => [item.id, item.name]));
  const profileMap = new Map(references.profiles.map((item) => [item.id, item.full_name]));
  const enrichedItems = (items || []).map((item) => ({
    ...item,
    companyName: companyMap.get(item.company_id) || "",
    apprenticeName: profileMap.get(item.apprentice_id) || "",
    responsibleName: profileMap.get(item.responsible_id) || "",
  }));
  const visibleItems = filterPipelineItems(enrichedItems);
  const overdueCount = visibleItems.filter((item) => !item.closed_at && isOverdue(item.due_at)).length;
  const unassignedCount = visibleItems.filter((item) => !item.responsible_id && !item.closed_at).length;
  const hasFilters = Boolean(state.pipelineSearch || state.pipelinePriority || state.pipelineResponsible || state.pipelineCompany || state.pipelineSort !== "recent");

  content.innerHTML = `
    ${pageHead("Central de Esteiras", "Mova cada processo conforme o trabalho avança. A mudança de etapa é registrada automaticamente.", `<button class="btn btn-primary" data-dialog="pipeline-item">${icon("plus")} Novo processo</button>`)}
    <section class="pipeline-toolbar card">
      <label class="pipeline-selector"><span>Esteira</span><select data-pipeline-select>${pipelines.map((pipeline) => `<option value="${pipeline.id}" ${pipeline.id === state.selectedPipelineId ? "selected" : ""}>${escapeHtml(pipeline.name)}</option>`).join("")}</select></label>
      <div class="pipeline-context"><span class="pipeline-color" style="background:${selectedPipeline.color}"></span><div><strong>${escapeHtml(selectedPipeline.name)}</strong><small>${escapeHtml(selectedPipeline.description)}</small></div></div>
      <div class="pipeline-counters"><span><strong>${visibleItems.length}</strong> exibidos</span><span class="${overdueCount ? "counter-danger" : ""}"><strong>${overdueCount}</strong> atrasados</span><span><strong>${unassignedCount}</strong> sem responsável</span></div>
    </section>
    <section class="filter-bar card">
      <label class="search-field">${icon("search")}<input type="search" data-pipeline-search value="${escapeHtml(state.pipelineSearch)}" placeholder="Buscar processo, empresa ou jovem" aria-label="Buscar processos" /></label>
      <select data-pipeline-filter="priority" aria-label="Filtrar por prioridade"><option value="">Todas as prioridades</option>${Object.entries(priorityLabels).map(([value, label]) => `<option value="${value}" ${state.pipelinePriority === value ? "selected" : ""}>${label}</option>`).join("")}</select>
      <select data-pipeline-filter="responsible" aria-label="Filtrar por responsável"><option value="">Todos os responsáveis</option>${references.administrators.map((person) => `<option value="${person.id}" ${state.pipelineResponsible === person.id ? "selected" : ""}>${escapeHtml(person.full_name)}</option>`).join("")}</select>
      <select data-pipeline-filter="company" aria-label="Filtrar por empresa"><option value="">Todas as empresas</option>${references.companies.map((company) => `<option value="${company.id}" ${state.pipelineCompany === company.id ? "selected" : ""}>${escapeHtml(company.name)}</option>`).join("")}</select>
      <select data-pipeline-filter="sort" aria-label="Ordenar processos"><option value="recent" ${state.pipelineSort === "recent" ? "selected" : ""}>Movimentação recente</option><option value="oldest" ${state.pipelineSort === "oldest" ? "selected" : ""}>Mais antigos</option><option value="due" ${state.pipelineSort === "due" ? "selected" : ""}>Prazo mais próximo</option><option value="priority" ${state.pipelineSort === "priority" ? "selected" : ""}>Maior prioridade</option></select>
      ${hasFilters ? `<button class="btn btn-small btn-quiet" data-clear-pipeline-filters>Limpar filtros</button>` : ""}
    </section>
    <section class="kanban-shell" aria-label="Quadro da esteira ${escapeHtml(selectedPipeline.name)}">
      <div class="kanban-board">
        ${(stages || []).map((stage) => {
          const stageItems = visibleItems.filter((item) => item.stage_id === stage.id);
          return `<section class="kanban-column" data-drop-stage="${stage.id}">
            <header class="kanban-column-head"><span class="stage-dot" style="background:${stage.color}"></span><strong>${escapeHtml(stage.name)}</strong><b>${stageItems.length}</b></header>
            <div class="kanban-column-body">
              ${stageItems.length ? stageItems.map((item) => {
                const overdue = !stage.is_terminal && isOverdue(item.due_at);
                return `<article class="kanban-card ${overdue ? "is-overdue" : ""}" draggable="true" data-pipeline-item="${item.id}">
                  <header><span class="process-kind">${escapeHtml(selectedPipeline.name)}</span><button class="icon-btn" data-edit-pipeline-item="${item.id}" aria-label="Alterar processo">${icon("edit")}</button></header>
                  <h3>${escapeHtml(item.title)}</h3>
                  ${item.description ? `<p>${escapeHtml(compactText(item.description, 130))}</p>` : ""}
                  <div class="process-badges">${priorityBadge(item.priority)}${item.companyName ? `<span>${icon("building")} ${escapeHtml(item.companyName)}</span>` : ""}${item.apprenticeName ? `<span>${icon("users")} ${escapeHtml(item.apprenticeName)}</span>` : ""}</div>
                  <div class="process-due">${dueMarkup(item.due_at, stage.is_terminal)}</div>
                  <footer><span class="process-owner">${item.responsibleName ? `<i>${escapeHtml(initials(item.responsibleName))}</i>${escapeHtml(item.responsibleName)}` : "Sem responsável"}</span><small>Movido em ${formatDate(item.last_moved_at, true)}</small></footer>
                  <label class="mobile-stage-move"><span>Mover para</span><select data-move-process="${item.id}">${(stages || []).map((option) => `<option value="${option.id}" ${option.id === stage.id ? "selected" : ""}>${escapeHtml(option.name)}</option>`).join("")}</select></label>
                </article>`;
              }).join("") : `<div class="kanban-empty">Solte um processo nesta etapa</div>`}
            </div>
          </section>`;
        }).join("")}
      </div>
    </section>
  `;
}

function taskMatchesFilter(task) {
  const open = !["completed", "cancelled"].includes(task.status);
  const dueDay = localDayKey(task.due_at);
  const today = localDayKey();
  if (state.taskFilter === "today") return open && dueDay === today;
  if (state.taskFilter === "overdue") return open && isOverdue(task.due_at);
  if (state.taskFilter === "upcoming") return open && Boolean(task.due_at) && dueDay > today;
  if (state.taskFilter === "completed") return task.status === "completed";
  return open && task.assigned_to === state.profile.id;
}

async function renderTasks(content) {
  const [taskResult, checklistResult, pipelineResult, references] = await Promise.all([
    supabase.from("tasks").select("*").order("created_at", { ascending: false }).limit(500),
    supabase.from("task_checklist_items").select("*").order("position").limit(1000),
    supabase.from("pipeline_items").select("id,title").eq("is_archived", false).order("title"),
    loadOperationalReferences(),
  ]);
  if (taskResult.error || checklistResult.error || pipelineResult.error) throw taskResult.error || checklistResult.error || pipelineResult.error;
  const tasks = taskResult.data || [];
  const companyMap = new Map(references.companies.map((item) => [item.id, item.name]));
  const profileMap = new Map(references.profiles.map((item) => [item.id, item.full_name]));
  const processMap = new Map((pipelineResult.data || []).map((item) => [item.id, item.title]));
  const checklistByTask = new Map();
  for (const item of checklistResult.data || []) {
    if (!checklistByTask.has(item.task_id)) checklistByTask.set(item.task_id, []);
    checklistByTask.get(item.task_id).push(item);
  }
  const counts = {
    mine: tasks.filter((task) => !["completed", "cancelled"].includes(task.status) && task.assigned_to === state.profile.id).length,
    today: tasks.filter((task) => !["completed", "cancelled"].includes(task.status) && localDayKey(task.due_at) === localDayKey()).length,
    overdue: tasks.filter((task) => !["completed", "cancelled"].includes(task.status) && isOverdue(task.due_at)).length,
    upcoming: tasks.filter((task) => !["completed", "cancelled"].includes(task.status) && task.due_at && localDayKey(task.due_at) > localDayKey()).length,
    completed: tasks.filter((task) => task.status === "completed").length,
  };
  const visibleTasks = tasks.filter(taskMatchesFilter).sort((first, second) => {
    const overdueDifference = Number(isOverdue(second.due_at) && !["completed", "cancelled"].includes(second.status)) - Number(isOverdue(first.due_at) && !["completed", "cancelled"].includes(first.status));
    if (overdueDifference) return overdueDifference;
    return (priorityOrder[second.priority] || 0) - (priorityOrder[first.priority] || 0) || new Date(first.due_at || "9999-12-31") - new Date(second.due_at || "9999-12-31");
  });
  const filters = [
    ["mine", "Minhas tarefas"],
    ["today", "Hoje"],
    ["overdue", "Atrasadas"],
    ["upcoming", "Próximas"],
    ["completed", "Concluídas"],
  ];

  content.innerHTML = `
    ${pageHead("Tarefas e Pendências", "Distribua responsabilidades, acompanhe prazos e registre a conclusão de cada etapa.", `<button class="btn btn-primary" data-dialog="task">${icon("plus")} Nova tarefa</button>`)}
    <div class="task-filter-tabs" role="tablist">${filters.map(([id, label]) => `<button class="${state.taskFilter === id ? "active" : ""}" data-task-filter="${id}" role="tab" aria-selected="${state.taskFilter === id}"><span>${label}</span><b>${counts[id]}</b></button>`).join("")}</div>
    <section class="task-list">
      ${visibleTasks.length ? visibleTasks.map((task) => {
        const checklist = checklistByTask.get(task.id) || [];
        const completedChecklist = checklist.filter((item) => item.is_completed).length;
        const closed = ["completed", "cancelled"].includes(task.status);
        return `<article class="task-card ${!closed && isOverdue(task.due_at) ? "is-overdue" : ""}">
          <div class="task-status-column">${statusBadge(task.status)}${priorityBadge(task.priority)}</div>
          <div class="task-main">
            <div class="task-title-row"><div><span class="task-category">${escapeHtml(task.category || "Sem categoria")}</span><h2>${escapeHtml(task.title)}</h2></div><button class="icon-btn" data-edit-task="${task.id}" aria-label="Alterar tarefa">${icon("edit")}</button></div>
            ${task.description ? `<p>${escapeHtml(task.description)}</p>` : ""}
            <div class="task-relations">${task.company_id ? `<span>${icon("building")} ${escapeHtml(companyMap.get(task.company_id) || "Empresa vinculada")}</span>` : ""}${task.apprentice_id ? `<span>${icon("users")} ${escapeHtml(profileMap.get(task.apprentice_id) || "Jovem vinculado")}</span>` : ""}${task.pipeline_item_id ? `<span>${icon("kanban")} ${escapeHtml(processMap.get(task.pipeline_item_id) || "Processo vinculado")}</span>` : ""}</div>
            ${checklist.length ? `<div class="task-checklist"><div class="task-checklist-head"><strong>Checklist</strong><small>${completedChecklist}/${checklist.length} concluídos</small></div>${checklist.map((item) => `<button class="task-check-item ${item.is_completed ? "complete" : ""}" data-toggle-checklist="${item.id}" data-checklist-complete="${item.is_completed}"><span>${item.is_completed ? icon("check") : ""}</span><em>${escapeHtml(item.title)}</em></button>`).join("")}</div>` : ""}
          </div>
          <aside class="task-side"><div><small>Responsável</small><strong>${escapeHtml(profileMap.get(task.assigned_to) || "Sem responsável")}</strong></div>${dueMarkup(task.due_at, closed)}<button class="btn btn-small ${task.status === "completed" ? "btn-secondary" : "btn-primary"}" data-task-status="${task.id}" data-next-status="${task.status === "completed" ? "pending" : "completed"}">${task.status === "completed" ? "Reabrir" : "Concluir"}</button></aside>
        </article>`;
      }).join("") : `<section class="card">${emptyState("Nenhuma tarefa nesta visão", state.taskFilter === "mine" ? "As tarefas atribuídas a você aparecerão aqui." : "Não há tarefas que correspondam a este filtro.", `<button class="btn btn-primary" data-dialog="task">Criar tarefa</button>`)}</section>`}
    </section>
  `;
}

async function renderNotifications(content) {
  const { data, error } = await supabase.from("notifications").select("*").eq("recipient_id", state.profile.id).order("created_at", { ascending: false }).limit(200);
  if (error) throw error;
  const notifications = data || [];
  const unread = notifications.filter((item) => !item.is_read && (item.status || "open") === "open").length;
  const open = notifications.filter((item) => (item.status || "open") === "open");
  const resolved = notifications.filter((item) => item.status === "resolved");
  const visible = state.notificationFilter === "unread"
    ? notifications.filter((item) => !item.is_read && (item.status || "open") === "open")
    : state.notificationFilter === "resolved"
      ? resolved
      : state.notificationFilter === "all"
        ? notifications
        : open;
  state.notificationUnreadCount = unread;
  content.innerHTML = `
    ${pageHead("Notificações", "Consulte tarefas, prazos e alertas direcionados ao seu trabalho.", unread ? `<button class="btn btn-secondary" data-read-all-notifications>${icon("check")} Marcar todas como lidas</button>` : "")}
    <section class="notification-summary">${metric("Não lidas", unread, "bell")}${metric("Em aberto", open.length, "tasks")}${metric("Resolvidas", resolved.length, "check")}</section>
    <nav class="operations-tabs" aria-label="Filtros de notificações">${[["open", "Em aberto", open.length], ["unread", "Não lidas", unread], ["resolved", "Resolvidas", resolved.length], ["all", "Todas", notifications.length]].map(([value, label, count]) => `<button class="${state.notificationFilter === value ? "active" : ""}" data-notification-filter="${value}">${label}<span>${count}</span></button>`).join("")}</nav>
    <section class="card notification-list">
      ${visible.length ? visible.map((item) => {
        const destination = item.target_view || (item.entity_type === "task" ? "tasks" : item.entity_type === "pipeline_item" ? "pipelines" : "notifications");
        const canOpen = destination !== "notifications" && canAccessView(destination);
        return `<article class="notification-row ${item.is_read ? "" : "unread"}">
        <span class="notification-symbol notification-${item.kind}">${icon(item.kind === "urgent" || item.kind === "attention" ? "alert" : item.kind === "task" ? "tasks" : "bell")}</span>
        <div><div class="notification-title"><strong>${escapeHtml(item.title)}</strong>${item.is_read ? "" : `<span>Nova</span>`}${item.status === "resolved" ? `<span class="notification-resolved">Resolvida</span>` : ""}</div><p>${escapeHtml(item.message)}</p><small>${item.due_at ? `Prazo ${formatDate(item.due_at, true)} · ` : ""}${formatDate(item.created_at, true)}</small></div>
        <div class="notification-actions">${canOpen ? `<button class="btn btn-small btn-secondary" data-open-notification="${item.id}" data-notification-target="${destination}">Abrir</button>` : ""}${!item.is_read ? `<button class="text-link" data-read-notification="${item.id}">Marcar como lida</button>` : ""}${(item.status || "open") === "open" ? `<button class="text-link" data-dismiss-notification="${item.id}">Dispensar</button>` : ""}</div>
      </article>`;
      }).join("") : emptyState("Nenhuma notificação nesta visão", "Os avisos aparecem aqui quando uma tarefa ou prazo exige sua atenção.")}
    </section>
  `;
}

async function renderAutomations(content) {
  const canEmail = hasPermission("finance.read");
  const canDocuments = hasPermission("documents.read");
  const canBanking = hasPermission("finance.read");
  const [runsResult, alertsResult, emailsResult, generationsResult, bankingResult] = await Promise.all([
    supabase.from("automation_runs").select("*").order("started_at", { ascending: false }).limit(30),
    supabase.from("operational_alerts").select("*").order("last_seen_at", { ascending: false }).limit(150),
    canEmail ? supabase.from("email_deliveries").select("*").order("created_at", { ascending: false }).limit(100) : Promise.resolve({ data: [], error: null }),
    canDocuments ? supabase.from("document_generations").select("*").order("created_at", { ascending: false }).limit(100) : Promise.resolve({ data: [], error: null }),
    canBanking ? supabase.from("banking_integrations").select("*").order("created_at", { ascending: false }).limit(10) : Promise.resolve({ data: [], error: null }),
  ]);
  const failed = [runsResult, alertsResult, emailsResult, generationsResult, bankingResult].find((result) => result.error);
  if (failed) throw failed.error;
  const runs = runsResult.data || [];
  const alerts = alertsResult.data || [];
  const emails = emailsResult.data || [];
  const generations = generationsResult.data || [];
  const banking = bankingResult.data || [];
  const activeAlerts = alerts.filter((item) => item.status === "active");
  const latestRun = runs[0];
  const tabs = [
    ["overview", "Visão geral", activeAlerts.length],
    ...(canEmail ? [["emails", "E-mails", emails.length]] : []),
    ...(canDocuments ? [["documents", "Documentos", generations.length]] : []),
    ...(canBanking ? [["banking", "Bradesco", banking.length]] : []),
    ["history", "Histórico", runs.length],
  ];
  if (!tabs.some(([value]) => value === state.automationTab)) state.automationTab = "overview";
  const actions = state.automationTab === "emails" && hasPermission("finance.manage")
    ? `<button class="btn btn-primary" data-dialog="email-draft">${icon("mail")} Preparar e-mail</button>`
    : state.automationTab === "documents" && hasPermission("documents.manage")
      ? `<button class="btn btn-primary" data-dialog="document-generation">${icon("plus")} Gerar documento</button>`
      : state.automationTab === "banking" && hasPermission("finance.manage")
        ? `<button class="btn btn-primary" data-dialog="banking-integration">${icon("plus")} Configurar Bradesco</button>`
        : state.automationTab === "overview" && hasPermission("operations.manage")
          ? `<button class="btn btn-primary" data-run-automations>${icon("arrow")} Atualizar agora</button>`
          : "";

  let body = "";
  if (state.automationTab === "overview") {
    body = `<section class="metric-grid">${metric("Alertas ativos", activeAlerts.length, "alert")}${metric("Urgentes", activeAlerts.filter((item) => item.severity === "urgent").length, "clock")}${metric("Tarefas geradas", latestRun?.tasks_open ?? 0, "tasks")}${metric("Última atualização", latestRun ? formatDate(latestRun.finished_at || latestRun.started_at, true) : "Ainda não executada", "history")}</section>
      <section class="card"><div class="card-head"><div><span class="eyebrow">Controle operacional</span><h2>O que o Portal automatiza</h2></div></div><div class="automation-principles"><div>${icon("check")}<span><strong>Faz automaticamente</strong><small>Identifica prazos, evita avisos duplicados, cria lembretes e encerra pendências derivadas quando a origem é resolvida.</small></span></div><div>${icon("shield")}<span><strong>Permanece com a equipe</strong><small>Aprovações, decisões financeiras, contratações, desligamentos, envio externo e revisão final de documentos.</small></span></div></div></section>
      <section class="card"><div class="card-head"><div><span class="eyebrow">Alertas atuais</span><h2>Providências identificadas</h2></div></div><div class="people-list">${activeAlerts.length ? activeAlerts.map((item) => operationalRow(item.title, `${item.message}${item.due_on ? ` · referência ${formatDate(item.due_on)}` : ""}`, item.severity === "urgent" ? "Urgente" : item.severity === "attention" ? "Atenção" : "Informativo", `<button class="btn btn-small btn-secondary" data-nav="${({ contract: "contracts", admission: "admissions", document: "documents", task: "tasks", accounting: "accounting", termination: "terminations", leave: "leaves", vacancy: "vacancies", recruitment: "vacancies", finance: "finance", academic: "courses" })[item.category] || "overview"}">Abrir área</button>`)).join("") : emptyState("Nenhum alerta ativo", "A rotina automática não encontrou pendências dentro dos critérios configurados.")}</div></section>`;
  }
  if (state.automationTab === "emails") {
    const labels = { draft: "Rascunho", approved: "Aprovado", queued: "Na fila", sending: "Enviando", sent: "Enviado", failed: "Falhou", cancelled: "Cancelado" };
    body = `<section class="card phase-note">${icon("shield")}<div><strong>Envio sob confirmação humana</strong><p>O Portal prepara e registra o e-mail. Uma pessoa autorizada confere destinatário, assunto, conteúdo e anexo antes de enviar.</p></div></section><section class="card"><div class="people-list">${emails.length ? emails.map((item) => operationalRow(item.subject, `${item.recipient_email} · ${formatDate(item.created_at, true)}${item.error_message ? ` · ${item.error_message}` : ""}`, labels[item.status] || item.status, `<div class="person-actions">${["draft", "failed", "approved"].includes(item.status) && hasPermission("finance.manage") ? `<button class="btn btn-small btn-secondary" data-edit-email-draft="${item.id}">${icon("edit")} Conferir</button><button class="btn btn-small btn-primary" data-send-email="${item.id}">Enviar</button>` : ""}</div>`)).join("") : emptyState("Nenhum e-mail preparado", "Crie um rascunho a partir de um modelo e confira antes do envio.", hasPermission("finance.manage") ? `<button class="btn btn-primary" data-dialog="email-draft">Preparar e-mail</button>` : "")}</div></section>`;
  }
  if (state.automationTab === "documents") {
    const labels = { draft: "Aguardando revisão", approved: "Aprovado", rejected: "Rejeitado" };
    body = `<section class="card phase-note">${icon("upload")}<div><strong>PDF com protocolo e versão</strong><p>Documentos gerados entram como rascunho. O arquivo só deve ser usado externamente depois da conferência e aprovação da equipe.</p></div></section><section class="card"><div class="people-list">${generations.length ? generations.map((item) => operationalRow(item.title, `Versão ${item.version} · ${formatDate(item.created_at, true)}${item.notes ? ` · ${item.notes}` : ""}`, labels[item.status] || item.status, `<div class="person-actions">${item.document_id ? `<button class="btn btn-small btn-secondary" data-download-document="${item.document_id}">${icon("download")} Baixar</button>` : ""}${item.status === "draft" && hasPermission("documents.manage") ? `<button class="btn btn-small btn-primary" data-review-generation="${item.id}" data-review-status="approved">Aprovar</button><button class="btn btn-small btn-quiet" data-review-generation="${item.id}" data-review-status="rejected">Rejeitar</button>` : ""}</div>`)).join("") : emptyState("Nenhum documento gerado", "Use um modelo para criar um PDF vinculado ao cadastro real.", hasPermission("documents.manage") ? `<button class="btn btn-primary" data-dialog="document-generation">Gerar documento</button>` : "")}</div></section>`;
  }
  if (state.automationTab === "banking") {
    const labels = { awaiting_documents: "Aguardando documentação", configuring: "Em configuração", homologation: "Em homologação", active: "Ativa", inactive: "Inativa" };
    body = `<section class="card banking-readiness"><div class="card-head"><div><span class="eyebrow">Integração bancária</span><h2>Preparação para o Bradesco</h2></div><span class="status status-draft">Sem conexão automática</span></div><p>O cadastro abaixo organiza as informações necessárias. A emissão de boletos, CNAB e conciliação só será ativada após receber o leiaute oficial, convênio, carteira, credenciais e homologação do banco.</p><div class="readiness-checklist"><span>${icon("check")} Convênio e carteira</span><span>${icon("check")} Leiaute CNAB oficial</span><span>${icon("check")} Credenciais ou canal de troca</span><span>${icon("check")} Homologação com o banco</span></div></section><section class="card"><div class="people-list">${banking.length ? banking.map((item) => operationalRow(`${item.provider} · ${item.integration_mode.toUpperCase()}`, `Banco ${item.bank_code}${item.agreement_number ? ` · convênio ${item.agreement_number}` : " · convênio não informado"}${item.layout_version ? ` · leiaute ${item.layout_version}` : ""}`, labels[item.status] || item.status, hasPermission("finance.manage") ? `<button class="btn btn-small btn-secondary" data-edit-banking-integration="${item.id}">${icon("edit")} Alterar</button>` : "")).join("") : emptyState("Integração ainda não configurada", "Cadastre somente os dados confirmados pelo gerente do Bradesco; nenhum boleto será emitido nesta etapa.", hasPermission("finance.manage") ? `<button class="btn btn-primary" data-dialog="banking-integration">Iniciar configuração</button>` : "")}</div></section>`;
  }
  if (state.automationTab === "history") {
    const labels = { completed: "Concluída", failed: "Falhou", running: "Em execução" };
    body = `<section class="card"><div class="people-list">${runs.length ? runs.map((item) => operationalRow(item.run_source === "manual" ? "Atualização solicitada pela equipe" : item.run_source === "schedule" ? "Atualização agendada" : "Atualização do sistema", `${formatDate(item.started_at, true)} · ${item.alerts_active} alertas · ${item.notifications_open} notificações · ${item.tasks_open} tarefas${item.error_message ? ` · ${item.error_message}` : ""}`, labels[item.status] || item.status)).join("") : emptyState("Nenhuma execução registrada", "O histórico será formado nas próximas atualizações.")}</div></section>`;
  }
  content.innerHTML = `${pageHead("Automações", "Reduza controles repetitivos sem retirar da equipe as decisões importantes.", actions)}<nav class="operations-tabs" aria-label="Áreas de automação">${tabs.map(([value, label, count]) => `<button class="${state.automationTab === value ? "active" : ""}" data-automation-tab="${value}">${label}<span>${count}</span></button>`).join("")}</nav>${body}`;
}

function indicatorValue(metric) {
  const value = Number(metric?.value || 0);
  if (metric?.format === "currency") return formatMoney(value);
  if (metric?.format === "percent") return `${new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 }).format(value)}%`;
  if (metric?.format === "hours") return `${new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 }).format(value)} h`;
  return new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 }).format(value);
}

function indicatorGroups(metrics) {
  return [...new Set((metrics || []).map((item) => item.group).filter(Boolean))];
}

function indicatorGroupLabel(group) {
  return ({ operations: "Operações", companies: "Empresas", apprentices: "Jovens", vacancies: "Vagas", personnel: "Departamento Pessoal", contracts: "Contratos", academic: "Acadêmico", finance: "Financeiro" })[group] || group;
}

function indicatorTargetStatus(metric, target) {
  if (!target) return "";
  const value = Number(metric.value || 0);
  const goal = Number(target.target_value || 0);
  const reached = target.comparison === "maximum" ? value <= goal : value >= goal;
  return `<small class="indicator-goal ${reached ? "reached" : "pending"}">${reached ? "Meta dentro do esperado" : "Meta a acompanhar"} · ${target.comparison === "maximum" ? "até" : "mínimo"} ${indicatorValue({ value: goal, format: metric.format })}</small>`;
}

function csvForIndicators(report) {
  const rows = [["grupo", "indicador", "valor", "formato", "período_início", "período_fim"]];
  for (const metric of report.metrics || []) rows.push([indicatorGroupLabel(metric.group), metric.label, metric.value, metric.format, report.period?.start || "", report.period?.end || ""]);
  return `\uFEFF${rows.map((row) => row.map(csvCell).join(";")).join("\n")}\n`;
}

async function renderIndicators(content) {
  const today = new Date().toISOString().slice(0, 10);
  if (!state.indicatorEnd) state.indicatorEnd = today;
  if (!state.indicatorStart) {
    const start = new Date();
    start.setDate(start.getDate() - 29);
    state.indicatorStart = start.toISOString().slice(0, 10);
  }
  const [{ data: report, error }, { data: logs, error: logsError }, { data: tasks, error: tasksError }, { data: processes, error: processesError }] = await Promise.all([
    supabase.rpc("get_portal_indicators", { period_start_value: state.indicatorStart, period_end_value: state.indicatorEnd }),
    supabase.from("work_activity_logs").select("*").order("started_at", { ascending: false }).limit(20),
    supabase.from("tasks").select("id,title").not("status", "in", "(completed,cancelled)").order("due_at", { ascending: true, nullsFirst: false }).limit(100),
    supabase.from("pipeline_items").select("id,title").eq("is_archived", false).is("closed_at", null).order("last_moved_at", { ascending: false }).limit(100),
  ]);
  if (error || logsError || tasksError || processesError) throw error || logsError || tasksError || processesError;
  const metrics = (report?.metrics || []).filter((item) => state.indicatorGroup === "all" || item.group === state.indicatorGroup);
  const targetMap = new Map((report?.targets || []).map((target) => [target.metric_key, target]));
  const groups = indicatorGroups(report?.metrics);
  const bottlenecks = report?.bottlenecks || [];
  const stages = (report?.stages || []).filter((stage) => Number(stage.count) > 0 || Number(stage.average_days) > 0);
  const productivity = report?.productivity || {};
  const canManageTargets = profileDepartment() === "management";
  const activeLog = (logs || []).find((log) => log.status === "running");
  const canExport = hasPermission("reports.export");
  content.innerHTML = `
    ${pageHead("Indicadores e relatórios", report?.visibility === "institution" ? "Visão institucional com dados reais. Metas são definidas apenas pela Direção." : "Visão do seu departamento e do seu próprio registro de trabalho.", canExport ? `<button class="btn btn-secondary" data-export-indicators>${icon("download")} Exportar CSV</button>` : "")}
    <section class="card indicator-filter-card"><form id="indicator-filter-form" class="indicator-filter"><label>Início<input type="date" name="start" value="${state.indicatorStart}" max="${today}" required /></label><label>Fim<input type="date" name="end" value="${state.indicatorEnd}" max="${today}" required /></label><label>Área<select name="group"><option value="all">Todas as áreas permitidas</option>${groups.map((group) => `<option value="${group}" ${state.indicatorGroup === group ? "selected" : ""}>${indicatorGroupLabel(group)}</option>`).join("")}</select></label><button class="btn btn-primary" type="submit">Atualizar relatório</button></form></section>
    <section class="metric-grid indicator-metrics">${metrics.map((item) => `<button class="metric indicator-metric" data-nav="${item.destination}" ${canAccessView(item.destination) ? "" : "disabled"}><span class="metric-icon">${icon(item.group === "finance" ? "calendar" : item.group === "academic" ? "book" : item.group === "operations" ? "kanban" : "grid")}</span><span><small>${escapeHtml(item.label)}</small><strong>${indicatorValue(item)}</strong>${indicatorTargetStatus(item, targetMap.get(item.key))}</span></button>`).join("") || emptyState("Sem indicadores nesta área", "O seu departamento não possui indicadores liberados para este recorte.")}</section>
    <section class="indicator-layout">
      <article class="card"><div class="card-head"><div><span class="eyebrow">Precisa da sua atenção</span><h2>${bottlenecks.length ? "Gargalos e pendências" : "Nenhum gargalo identificado"}</h2></div></div>${bottlenecks.length ? `<div class="indicator-list">${bottlenecks.map((item) => `<button data-nav="${item.destination}"><span class="indicator-severity ${escapeHtml(item.severity)}">${item.severity === "urgent" ? icon("alert") : icon("clock")}</span><span><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(item.message)}${item.due_on ? ` · referência ${formatDate(item.due_on)}` : ""}</small></span></button>`).join("")}</div>` : `<p class="muted-note">Os alertas ativos aparecerão aqui quando houver algo que exija providência.</p>`}</article>
      <article class="card"><div class="card-head"><div><span class="eyebrow">Carga operacional</span><h2>${report?.visibility === "institution" ? "Visão institucional" : "Meu registro"}</h2></div></div><div class="work-summary"><span><strong>${productivity.recorded_minutes || 0}</strong><small>minutos no período</small></span><span><strong>${productivity.completed_entries || 0}</strong><small>registros concluídos</small></span><span><strong>${productivity.open_entries || 0}</strong><small>em andamento</small></span></div><p class="muted-note">O registro serve para organizar a carga e melhorar processos. Não há pontuação, ranking ou vigilância individual.</p></article>
    </section>
    <section class="card"><div class="card-head"><div><span class="eyebrow">Tempo nas etapas</span><h2>Distribuição das esteiras</h2></div></div>${stages.length ? `<div class="stage-report-list">${stages.map((stage) => `<div><span><strong>${escapeHtml(stage.pipeline)}</strong><small>${escapeHtml(stage.stage)}</small></span><b>${stage.count} processo(s)</b><em>${new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 }).format(Number(stage.average_days || 0))} dias em média</em></div>`).join("")}</div>` : `<p class="muted-note">Quando houver processos em andamento, o tempo médio de cada etapa será mostrado aqui.</p>`}</section>
    <section class="indicator-layout">
      <article class="card"><div class="card-head"><div><span class="eyebrow">Registro de trabalho</span><h2>Tempo vinculado a tarefas e processos</h2></div></div>${activeLog ? `<div class="active-work-log"><strong>${escapeHtml(activeLog.title)}</strong><small>Em andamento desde ${formatDate(activeLog.active_started_at, true)}</small><div><button class="btn btn-small btn-secondary" data-work-log-action="pause" data-work-log-id="${activeLog.id}">Pausar</button><button class="btn btn-small btn-primary" data-work-log-action="complete" data-work-log-id="${activeLog.id}">Concluir</button></div></div>` : ""}<form id="work-log-form" class="stack-form"><div class="form-grid two-columns"><label>Atividade<input name="title" required minlength="2" maxlength="180" placeholder="Ex.: Conferência de documentos" /></label><label>Tipo de lançamento<select name="entryMode"><option value="timer">Iniciar cronômetro</option><option value="manual">Lançar tempo manual</option></select></label><label>Vincular tarefa<select name="taskId"><option value="">Sem tarefa vinculada</option>${(tasks || []).map((task) => `<option value="${task.id}">${escapeHtml(task.title)}</option>`).join("")}</select></label><label>Vincular processo<select name="pipelineItemId"><option value="">Sem processo vinculado</option>${(processes || []).map((item) => `<option value="${item.id}">${escapeHtml(item.title)}</option>`).join("")}</select></label><label>Categoria<input name="category" maxlength="80" value="${escapeHtml(profileAccessLabel())}" /></label><label>Minutos <input name="manualMinutes" type="number" min="1" max="10080" placeholder="Obrigatório no lançamento manual" /></label></div><label>Observações<textarea name="notes" rows="2" maxlength="4000"></textarea></label><button class="btn btn-primary" type="submit">Salvar registro</button></form>${(logs || []).length ? `<div class="recent-work-logs">${(logs || []).map((log) => `<div><span><strong>${escapeHtml(log.title)}</strong><small>${escapeHtml(log.category)} · ${log.entry_mode === "manual" ? `${log.manual_minutes} min` : log.status === "running" ? "em andamento" : `${Math.round(Number(log.accumulated_seconds || 0) / 60)} min`}</small></span><em>${log.status === "completed" ? "Concluído" : log.status === "paused" ? "Pausado" : "Em andamento"}</em></div>`).join("")}</div>` : ""}</article>
      <article class="card"><div class="card-head"><div><span class="eyebrow">Metas institucionais</span><h2>Referências da Direção</h2></div></div>${(report?.targets || []).length ? `<div class="target-list">${report.targets.map((target) => `<div><span><strong>${escapeHtml(target.label)}</strong><small>${target.department === "all" ? "Institucional" : departmentLabels[target.department] || target.department} · ${target.period}</small></span><b>${target.comparison === "maximum" ? "Até" : "Mínimo"} ${new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 }).format(Number(target.target_value))}</b>${canManageTargets ? `<button class="text-link" data-delete-indicator-target="${target.id}">Excluir</button>` : ""}</div>`).join("")}</div>` : `<p class="muted-note">Ainda não há metas cadastradas. Elas são opcionais e nunca são preenchidas automaticamente.</p>`}${canManageTargets ? `<form id="indicator-target-form" class="stack-form target-form"><div class="form-section"><span>Nova meta</span></div><div class="form-grid two-columns"><label>Indicador<select name="metricKey" required>${(report?.metrics || []).map((item) => `<option value="${item.key}">${escapeHtml(item.label)}</option>`).join("")}</select></label><label>Nome da meta<input name="label" required minlength="2" maxlength="160" placeholder="Ex.: Reduzir tarefas vencidas" /></label><label>Área<select name="department"><option value="all">Institucional</option>${Object.entries(departmentLabels).map(([key, label]) => `<option value="${key}">${label}</option>`).join("")}</select></label><label>Periodicidade<select name="period"><option value="monthly">Mensal</option><option value="current">Atual</option><option value="quarterly">Trimestral</option><option value="annual">Anual</option></select></label><label>Comparação<select name="comparison"><option value="minimum">No mínimo</option><option value="maximum">No máximo</option></select></label><label>Valor<input name="targetValue" type="number" min="0" step="0.01" required /></label></div><button class="btn btn-secondary" type="submit">Salvar meta</button></form>` : `<p class="form-note">Somente a Direção e Administração pode criar ou alterar metas.</p>`}</article>
    </section>`;
}

async function renderApprentices(content) {
  const [peopleResult, references, enrollmentResult, progressResult, attemptResult] = await Promise.all([
    callAdmin({ action: "list_users", scope: "apprentices" }, true),
    loadOperationalReferences(),
    supabase.from("enrollments").select("apprentice_id,course_id"),
    supabase.from("lesson_progress").select("apprentice_id,lesson_id"),
    supabase.from("activity_attempts").select("apprentice_id,activity_id,status"),
  ]);
  if (enrollmentResult.error || progressResult.error || attemptResult.error) throw enrollmentResult.error || progressResult.error || attemptResult.error;
  state.people = peopleResult.users || [];
  const apprentices = state.people.filter((person) => person.role === "apprentice");
  const companyMap = new Map(references.companies.map((item) => [item.id, item.name]));
  const countBy = (rows, key) => rows.reduce((map, item) => map.set(item[key], (map.get(item[key]) || 0) + 1), new Map());
  const enrollmentCount = countBy(enrollmentResult.data || [], "apprentice_id");
  const progressCount = countBy(progressResult.data || [], "apprentice_id");
  const attemptCount = countBy(attemptResult.data || [], "apprentice_id");
  const activeCount = apprentices.filter((person) => person.isActive).length;
  const canCreateApprentice = hasPermission("people.manage");
  const canReadHistory = hasPermission("apprentice.history.read") || hasPermission("people.read");

  content.innerHTML = `
    ${pageHead("Jovens / Aprendizes", "Use o cadastro central do jovem em cursos, empresas, processos e tarefas, sem duplicar informações.", canCreateApprentice ? `<button class="btn btn-primary" data-dialog="invite">${icon("plus")} Cadastrar jovem</button>` : "")}
    <section class="people-summary"><span><strong>${apprentices.length}</strong> jovens cadastrados</span><span><strong>${activeCount}</strong> ativos</span><span><strong>${apprentices.length - activeCount}</strong> arquivados</span></section>
    <section class="card">
      ${apprentices.length ? `<div class="people-list">${apprentices.map((person) => `<article class="person-row apprentice-row">
        <span class="avatar">${escapeHtml(initials(person.fullName))}</span>
        <div class="person-main"><strong>${escapeHtml(person.fullName || "Nome não informado")}</strong><small>${escapeHtml(person.email || "E-mail não disponível")}</small><small>${escapeHtml(person.companyId ? companyMap.get(person.companyId) || "Empresa vinculada" : "Sem empresa vinculada")}</small></div>
        <div class="person-access"><span class="status ${person.isActive ? "status-published" : "status-archived"}">${person.isActive ? "Ativo" : "Arquivado"}</span></div>
        <div class="apprentice-metrics"><span><strong>${enrollmentCount.get(person.id) || 0}</strong> cursos</span><span><strong>${progressCount.get(person.id) || 0}</strong> aulas concluídas</span><span><strong>${attemptCount.get(person.id) || 0}</strong> atividades</span></div>
        <div class="person-actions">${canReadHistory ? `<button class="btn btn-small btn-secondary" data-person-history="${person.id}">${icon("history")} Histórico</button>` : ""}${canManagePerson(person) && person.accessExists && person.isActive ? `<button class="btn btn-small btn-secondary" data-edit-person="${person.id}">${icon("edit")} Alterar</button>` : ""}</div>
      </article>`).join("")}</div>` : emptyState("Nenhum jovem cadastrado", canCreateApprentice ? "Cadastre o primeiro jovem para vinculá-lo à empresa, aos cursos e aos processos." : "Nenhum jovem está disponível para consulta.", canCreateApprentice ? `<button class="btn btn-primary" data-dialog="invite">Cadastrar jovem</button>` : "")}
    </section>
  `;
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

  const canManageCompanies = hasPermission("companies.manage");
  content.innerHTML = `
    ${pageHead("Empresas parceiras", "Mantenha identificação, contatos e situação de cada organização acompanhada pela CAFCM.",
      canManageCompanies ? `<button class="btn btn-primary" data-dialog="company">${icon("plus")} Nova empresa</button>` : "")}
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
          ${canManageCompanies ? `<footer class="company-actions">
            <button class="btn btn-small btn-secondary" data-edit-company="${company.id}">${icon("edit")} Alterar</button>
            <button class="btn btn-small btn-quiet" data-toggle-company="${company.id}" data-company-active="${company.is_active}">${company.is_active ? "Inativar" : "Reativar"}</button>
            <button class="icon-btn danger-button" data-delete-company="${company.id}" data-company-name="${escapeHtml(company.name)}" aria-label="Excluir ${escapeHtml(company.name)}">${icon("trash")}</button>
          </footer>` : ""}
        </article>`;
      }).join("")}
    </section>` : `<section class="card">${emptyState("Nenhuma empresa cadastrada", canManageCompanies ? "Cadastre a primeira empresa para depois vincular seus representantes e aprendizes." : "Nenhuma empresa está disponível para consulta.", canManageCompanies ? `<button class="btn btn-primary" data-dialog="company">Cadastrar empresa</button>` : "")}</section>`}
  `;
}

function operationalRow(title, detail, status, actions = "") {
  return `<article class="person-row"><span class="avatar">${icon("tasks")}</span><div class="person-main"><strong>${escapeHtml(title)}</strong><small>${escapeHtml(detail || "Sem informações adicionais")}</small></div><div class="person-access">${status ? `<span class="status status-draft">${escapeHtml(status)}</span>` : ""}</div><div class="person-actions">${actions}</div></article>`;
}

async function renderVacancies(content) {
  const [candidates, vacancies, applications, documents, references] = await Promise.all([
    supabase.from("candidates").select("*").order("created_at", { ascending: false }),
    supabase.from("job_vacancies").select("*").order("created_at", { ascending: false }),
    supabase.from("vacancy_applications").select("*").order("updated_at", { ascending: false }),
    supabase.from("candidate_documents").select("id,candidate_id"),
    loadOperationalReferences(),
  ]);
  if (candidates.error || vacancies.error || applications.error || documents.error) throw candidates.error || vacancies.error || applications.error || documents.error;
  const canManageVacancies = hasPermission("vacancies.manage");
  const companyMap = new Map(references.companies.map((item) => [item.id, item.name]));
  const candidateMap = new Map((candidates.data || []).map((item) => [item.id, item]));
  const vacancyMap = new Map((vacancies.data || []).map((item) => [item.id, item]));
  const active = (vacancies.data || []).filter((item) => item.status === "open");
  const activeApplications = (applications.data || []).filter((item) => !["rejected", "withdrawn", "hired"].includes(item.status));
  const filledMap = new Map();
  const selectionMap = new Map();
  const documentMap = new Map();
  for (const item of applications.data || []) {
    if (item.status === "hired") filledMap.set(item.vacancy_id, (filledMap.get(item.vacancy_id) || 0) + 1);
    selectionMap.set(item.candidate_id, (selectionMap.get(item.candidate_id) || 0) + 1);
  }
  for (const item of documents.data || []) documentMap.set(item.candidate_id, (documentMap.get(item.candidate_id) || 0) + 1);

  const search = state.vacancySearch.trim().toLocaleLowerCase("pt-BR");
  const matchesSearch = (...parts) => !search || parts.filter(Boolean).join(" ").toLocaleLowerCase("pt-BR").includes(search);
  const filteredVacancies = (vacancies.data || []).filter((item) => matchesSearch(item.title, companyMap.get(item.company_id), item.location, item.requirements)
    && (!state.vacancyStatus || item.status === state.vacancyStatus)
    && (!state.vacancyCompany || item.company_id === state.vacancyCompany));
  const filteredCandidates = (candidates.data || []).filter((item) => matchesSearch(item.full_name, item.email, item.phone, item.cpf, item.city)
    && (!state.vacancyStatus || item.status === state.vacancyStatus)
    && (!state.vacancyCompany || (applications.data || []).some((application) => application.candidate_id === item.id && vacancyMap.get(application.vacancy_id)?.company_id === state.vacancyCompany)));
  const filteredApplications = (applications.data || []).filter((item) => {
    const candidate = candidateMap.get(item.candidate_id);
    const vacancy = vacancyMap.get(item.vacancy_id);
    return matchesSearch(candidate?.full_name, candidate?.email, vacancy?.title, companyMap.get(vacancy?.company_id))
      && (!state.vacancyStatus || item.status === state.vacancyStatus)
      && (!state.vacancyCompany || vacancy?.company_id === state.vacancyCompany);
  });

  const statusLabels = state.vacancyTab === "candidates" ? candidateStatusLabels : state.vacancyTab === "applications" ? applicationStatusLabels : vacancyStatusLabels;
  const tabs = [
    ["overview", "Resumo", "grid", ""],
    ["vacancies", "Vagas", "kanban", (vacancies.data || []).length],
    ["candidates", "Candidatos", "users", (candidates.data || []).length],
    ["applications", "Seleções", "tasks", (applications.data || []).length],
  ];
  const actions = canManageVacancies ? `<button class="btn btn-secondary" data-dialog="candidate">${icon("plus")} Candidato</button><button class="btn btn-secondary" data-dialog="application">${icon("link")} Iniciar seleção</button><button class="btn btn-primary" data-dialog="vacancy">${icon("plus")} Abrir vaga</button>` : "";

  const vacancyRows = filteredVacancies.map((item) => {
    const filled = filledMap.get(item.id) || 0;
    const remaining = Math.max(item.quantity - filled, 0);
    const detail = `${companyMap.get(item.company_id) || "Empresa"} · ${filled}/${item.quantity} preenchida(s) · ${remaining} disponível(is)${item.due_date ? ` · prazo ${formatDate(item.due_date)}` : ""}`;
    return operationalRow(item.title, detail, vacancyStatusLabels[item.status] || item.status, canManageVacancies ? `<button class="btn btn-small btn-secondary" data-edit-vacancy="${item.id}">${icon("edit")} Alterar</button>` : "");
  }).join("");
  const candidateRows = filteredCandidates.map((item) => operationalRow(
    item.full_name,
    `${item.email || "Sem e-mail"}${item.phone ? ` · ${formatPhone(item.phone)}` : ""}${item.city ? ` · ${item.city}` : ""} · ${selectionMap.get(item.id) || 0} seleção(ões) · ${documentMap.get(item.id) || 0} arquivo(s)`,
    candidateStatusLabels[item.status] || item.status,
    canManageVacancies ? `<button class="btn btn-small btn-secondary" data-edit-candidate="${item.id}">${icon("edit")} Abrir</button><button class="btn btn-small btn-quiet" data-archive-candidate="${item.id}" data-candidate-archived="${item.status === "archived"}">${item.status === "archived" ? "Reativar" : "Arquivar"}</button>` : "",
  )).join("");
  const applicationRows = filteredApplications.map((item) => {
    const candidate = candidateMap.get(item.candidate_id);
    const vacancy = vacancyMap.get(item.vacancy_id);
    const canConvert = item.status === "approved";
    const rowActions = canManageVacancies ? `<button class="btn btn-small btn-secondary" data-edit-application="${item.id}">${icon("edit")} Atualizar</button>${canConvert ? `<button class="btn btn-small btn-primary" data-convert-candidate="${item.id}">${icon("arrow")} Iniciar admissão</button>` : ""}` : "";
    return operationalRow(candidate?.full_name || "Candidato", `${vacancy?.title || "Vaga"} · ${companyMap.get(vacancy?.company_id) || "Empresa"}${item.company_interview_at ? ` · entrevista ${formatDate(item.company_interview_at, true)}` : ""}`, applicationStatusLabels[item.status] || item.status, rowActions);
  }).join("");

  let panel = "";
  if (state.vacancyTab === "overview") {
    panel = `<div class="operations-split"><section class="card"><div class="card-head"><div><span class="eyebrow">Vagas abertas</span><h2>Demanda atual</h2></div><button class="text-link" data-vacancy-tab="vacancies">Ver todas</button></div>${active.length ? `<div class="people-list">${active.slice(0, 6).map((item) => { const filled = filledMap.get(item.id) || 0; return operationalRow(item.title, `${companyMap.get(item.company_id) || "Empresa"} · ${Math.max(item.quantity - filled, 0)} vaga(s) disponível(is)`, "Aberta", canManageVacancies ? `<button class="btn btn-small btn-secondary" data-edit-vacancy="${item.id}">Abrir</button>` : ""); }).join("")}</div>` : emptyState("Nenhuma vaga aberta", "Cadastre a demanda recebida de uma empresa parceira.")}</section><section class="card"><div class="card-head"><div><span class="eyebrow">Recrutamento</span><h2>Seleções em andamento</h2></div><button class="text-link" data-vacancy-tab="applications">Ver todas</button></div>${activeApplications.length ? `<div class="people-list">${activeApplications.slice(0, 6).map((item) => { const candidate = candidateMap.get(item.candidate_id); const vacancy = vacancyMap.get(item.vacancy_id); return operationalRow(candidate?.full_name || "Candidato", `${vacancy?.title || "Vaga"} · ${companyMap.get(vacancy?.company_id) || "Empresa"}`, applicationStatusLabels[item.status] || item.status, canManageVacancies ? `<button class="btn btn-small btn-secondary" data-edit-application="${item.id}">Atualizar</button>` : ""); }).join("")}</div>` : emptyState("Nenhuma seleção em andamento", "Inclua um candidato em uma vaga para iniciar o acompanhamento.")}</section></div>`;
  } else {
    const rows = state.vacancyTab === "vacancies" ? vacancyRows : state.vacancyTab === "candidates" ? candidateRows : applicationRows;
    const empty = state.vacancyTab === "vacancies" ? ["Nenhuma vaga encontrada", "Altere os filtros ou abra uma nova vaga."] : state.vacancyTab === "candidates" ? ["Nenhum candidato encontrado", "Altere os filtros ou cadastre um candidato."] : ["Nenhuma seleção encontrada", "Altere os filtros ou inicie um processo seletivo."];
    panel = `<section class="card"><div class="operations-toolbar"><label class="search-field">${icon("search")}<input data-vacancy-search value="${escapeHtml(state.vacancySearch)}" placeholder="Buscar por nome, e-mail, vaga ou empresa" aria-label="Buscar" /></label><select data-vacancy-filter="status" aria-label="Filtrar por situação"><option value="">Todas as situações</option>${selectOptions(statusLabels, state.vacancyStatus)}</select><select data-vacancy-filter="company" aria-label="Filtrar por empresa"><option value="">Todas as empresas</option>${references.companies.map((company) => `<option value="${company.id}" ${state.vacancyCompany === company.id ? "selected" : ""}>${escapeHtml(company.name)}</option>`).join("")}</select>${state.vacancySearch || state.vacancyStatus || state.vacancyCompany ? `<button class="btn btn-quiet" data-clear-vacancy-filters>Limpar</button>` : ""}</div>${rows ? `<div class="people-list">${rows}</div>` : emptyState(empty[0], empty[1])}</section>`;
  }

  content.innerHTML = `${pageHead("Gestão de vagas", "Da abertura da vaga à admissão do jovem, com histórico e etapas sincronizadas.", actions)}
    <section class="metric-grid">${metric("Empresas ativas", references.companies.filter((item) => item.is_active).length, "building")}${metric("Posições disponíveis", active.reduce((total, item) => total + Math.max(item.quantity - (filledMap.get(item.id) || 0), 0), 0), "kanban")}${metric("Candidatos", (candidates.data || []).filter((item) => item.status !== "archived").length, "users")}${metric("Em seleção", activeApplications.length, "tasks")}</section>
    <nav class="operations-tabs" aria-label="Áreas da gestão de vagas">${tabs.map(([value, label, iconName, count]) => `<button class="${state.vacancyTab === value ? "active" : ""}" data-vacancy-tab="${value}">${icon(iconName)} ${label}${count !== "" ? `<span>${count}</span>` : ""}</button>`).join("")}</nav>
    ${panel}`;
}

async function renderPartnerships(content) {
  const [agreements, references] = await Promise.all([
    supabase.from("partnership_agreements").select("*").order("created_at", { ascending: false }),
    loadOperationalReferences(),
  ]);
  if (agreements.error) throw agreements.error;
  const companyMap = new Map(references.companies.map((item) => [item.id, item.name]));
  const activeYoung = new Map();
  for (const apprentice of references.apprentices) {
    if (apprentice.company_id) activeYoung.set(apprentice.company_id, (activeYoung.get(apprentice.company_id) || 0) + 1);
  }
  const statusLabels = { draft: "Rascunho", active: "Ativa", expiring: "Próxima do fim", ended: "Encerrada", cancelled: "Cancelada" };
  content.innerHTML = `${pageHead("Parcerias e jovens", "Acompanhe os convênios com as empresas e os jovens vinculados a cada parceira.", `<button class="btn btn-primary" data-dialog="partnership">${icon("plus")} Nova parceria</button>`)}
    <section class="metric-grid three">${metric("Parcerias ativas", (agreements.data || []).filter((item) => item.status === "active").length, "building")}${metric("Jovens vinculados", references.apprentices.filter((item) => item.company_id).length, "users")}${metric("Parcerias a vencer", (agreements.data || []).filter((item) => item.status === "expiring").length, "alert")}</section>
    <section class="card"><div class="people-list">${(agreements.data || []).length ? agreements.data.map((item) => operationalRow(companyMap.get(item.company_id) || "Empresa", `${item.title} · ${activeYoung.get(item.company_id) || 0} jovem(ns) ativo(s) · ${item.start_date ? formatDate(item.start_date) : "início não informado"}${item.end_date ? ` até ${formatDate(item.end_date)}` : ""}`, statusLabels[item.status] || item.status, `<button class="btn btn-small btn-secondary" data-edit-partnership="${item.id}">${icon("edit")} Alterar</button>`)).join("") : emptyState("Nenhuma parceria cadastrada", "Registre o convênio firmado com uma empresa parceira.", `<button class="btn btn-primary" data-dialog="partnership">Registrar parceria</button>`)}</div></section>`;
}

async function renderAdmissions(content) {
  const [{ data: admissions, error }, references, { data: checklist }] = await Promise.all([
    supabase.from("admission_cases").select("*").order("created_at", { ascending: false }),
    loadOperationalReferences(),
    supabase.from("admission_checklist_items").select("admission_id,is_required,is_completed"),
  ]);
  if (error) throw error;
  const apprenticeMap = new Map(references.profiles.map((item) => [item.id, item.full_name]));
  const companyMap = new Map(references.companies.map((item) => [item.id, item.name]));
  const checklistMap = new Map();
  for (const item of checklist || []) {
    const current = checklistMap.get(item.admission_id) || { required: 0, complete: 0 };
    current.required += item.is_required ? 1 : 0;
    current.complete += item.is_required && item.is_completed ? 1 : 0;
    checklistMap.set(item.admission_id, current);
  }
  const openAdmissions = (admissions || []).filter((item) => !["completed", "cancelled"].includes(item.status));
  const pendingDocuments = (admissions || []).filter((item) => ["approved", "documents_pending"].includes(item.status));
  content.innerHTML = `${pageHead("Admissões", "Acompanhe cada aprovado até a entrada do jovem, com checklist e esteira sincronizados.", `<button class="btn btn-primary" data-dialog="admission">${icon("plus")} Nova admissão</button>`)}
    <section class="metric-grid three">${metric("Em andamento", openAdmissions.length, "tasks")}${metric("Com documentos pendentes", pendingDocuments.length, "upload")}${metric("Concluídas", (admissions || []).filter((item) => item.status === "completed").length, "check")}</section>
    <section class="card"><div class="people-list workflow-list">${(admissions || []).length ? admissions.map((item) => {
      const count = checklistMap.get(item.id) || { required: 0, complete: 0 };
      const detail = `${companyMap.get(item.company_id) || "Empresa não informada"} · início previsto ${item.target_start_date ? formatDate(item.target_start_date) : "não definido"} · checklist ${count.complete}/${count.required}`;
      return `<article class="workflow-record"><div class="workflow-record-head"><div><h3>${escapeHtml(apprenticeMap.get(item.apprentice_id) || "Jovem não identificado")}</h3><p>${escapeHtml(detail)}</p></div><div class="person-actions"><span class="status status-draft">${escapeHtml(admissionStatusLabels[item.status] || item.status)}</span><button class="btn btn-small btn-secondary" data-edit-admission="${item.id}">${icon("edit")} Abrir</button></div></div>${workflowProgress(admissionStatusLabels, item.status)}</article>`;
    }).join("") : emptyState("Nenhuma admissão aberta", "Crie a primeira admissão para gerar o checklist operacional e acompanhar cada etapa.", `<button class="btn btn-primary" data-dialog="admission">Nova admissão</button>`)}</div></section>`;
}

async function renderContracts(content) {
  const [{ data: contracts, error }, references] = await Promise.all([
    supabase.from("contracts").select("*").order("end_date"), loadOperationalReferences(),
  ]);
  if (error) throw error;
  const apprenticeMap = new Map(references.profiles.map((item) => [item.id, item.full_name]));
  const companyMap = new Map(references.companies.map((item) => [item.id, item.name]));
  const canManageContracts = hasPermission("contracts.manage");
  const activeContracts = (contracts || []).filter((item) => item.status === "active");
  const daysRemaining = (item) => item.end_date ? Math.ceil((new Date(`${item.end_date}T23:59:59`).getTime() - Date.now()) / 86400000) : null;
  const due90 = activeContracts.filter((item) => daysRemaining(item) >= 0 && daysRemaining(item) <= 90);
  const due30 = activeContracts.filter((item) => daysRemaining(item) >= 0 && daysRemaining(item) <= 30);
  const contractLabels = { scheduled: "A iniciar", active: "Ativo", closing: "Encerramento", ended: "Encerrado", cancelled: "Cancelado" };
  content.innerHTML = `${pageHead("Contratos", "Acompanhe vigência e receba alertas nos marcos de 90, 60, 30, 15 e 7 dias.", canManageContracts ? `<button class="btn btn-primary" data-dialog="contract">${icon("plus")} Novo contrato</button>` : "")}
    <section class="metric-grid">${metric("Ativos", activeContracts.length, "calendar")}${metric("Vencem em até 90 dias", due90.length, "history")}${metric("Vencem em até 30 dias", due30.length, "alert")}${metric("Encerrados", (contracts || []).filter((item) => item.status === "ended").length, "check")}</section>
    <section class="card"><div class="people-list">${(contracts || []).length ? contracts.map((item) => {
      const remaining = daysRemaining(item);
      const detail = `${companyMap.get(item.company_id) || "Empresa não informada"} · ${formatDate(item.start_date)} a ${formatDate(item.end_date)}${item.position_title ? ` · ${item.position_title}` : ""}`;
      const status = item.status === "active" && remaining !== null && remaining >= 0 && remaining <= 90 ? `Vence em ${remaining} dia(s)` : contractLabels[item.status] || item.status;
      return operationalRow(apprenticeMap.get(item.apprentice_id) || "Jovem não identificado", detail, status, canManageContracts ? `<button class="btn btn-small btn-secondary" data-edit-contract="${item.id}">${icon("edit")} Alterar</button>` : "");
    }).join("") : emptyState("Nenhum contrato cadastrado", canManageContracts ? "Registre o contrato para o Portal avisar sobre a vigência e concentrar os documentos." : "Nenhum contrato está disponível para consulta.", canManageContracts ? `<button class="btn btn-primary" data-dialog="contract">Cadastrar contrato</button>` : "")}</div></section>`;
}

async function renderLeaves(content) {
  const [{ data: records, error }, references] = await Promise.all([
    supabase.from("leave_records").select("*").order("start_date", { ascending: false }), loadOperationalReferences(),
  ]);
  if (error) throw error;
  const apprenticeMap = new Map(references.profiles.map((item) => [item.id, item.full_name]));
  const companyMap = new Map(references.companies.map((item) => [item.id, item.name]));
  const canManage = hasPermission("personnel.manage");
  const active = (records || []).filter((item) => item.status === "in_progress");
  content.innerHTML = `${pageHead("Férias e afastamentos", "Controle período, empresa, situação e retorno ao trabalho.", canManage ? `<button class="btn btn-primary" data-dialog="leave">${icon("plus")} Novo registro</button>` : "")}
    <section class="metric-grid">${metric("Em andamento", active.length, "clock")}${metric("Férias planejadas", (records || []).filter((item) => item.leave_type === "vacation" && ["planned", "approved"].includes(item.status)).length, "calendar")}${metric("Afastamentos médicos", (records || []).filter((item) => item.leave_type === "medical_leave" && !["completed", "cancelled"].includes(item.status)).length, "alert")}${metric("Concluídos", (records || []).filter((item) => item.status === "completed").length, "check")}</section>
    <section class="card"><div class="people-list">${(records || []).length ? records.map((item) => {
      const details = `${leaveTypeLabels[item.leave_type] || item.leave_type} · ${formatDate(item.start_date)} a ${formatDate(item.end_date)}${item.company_id ? ` · ${companyMap.get(item.company_id) || "Empresa"}` : ""}${item.actual_return_date ? ` · retorno ${formatDate(item.actual_return_date)}` : ""}`;
      return operationalRow(apprenticeMap.get(item.apprentice_id) || "Jovem não identificado", details, leaveStatusLabels[item.status] || item.status, canManage ? `<button class="btn btn-small btn-secondary" data-edit-leave="${item.id}">${icon("edit")} Alterar</button>` : "");
    }).join("") : emptyState("Nenhum período registrado", "Cadastre férias ou afastamentos para centralizar datas e observações.", canManage ? `<button class="btn btn-primary" data-dialog="leave">Novo registro</button>` : "")}</div></section>`;
}

async function renderTerminations(content) {
  const [{ data: cases, error }, references, checklistResult] = await Promise.all([
    supabase.from("termination_cases").select("*").order("created_at", { ascending: false }), loadOperationalReferences(),
    supabase.from("termination_checklist_items").select("termination_id,is_required,is_completed"),
  ]);
  if (error || checklistResult.error) throw error || checklistResult.error;
  const apprenticeMap = new Map(references.profiles.map((item) => [item.id, item.full_name]));
  const companyMap = new Map(references.companies.map((item) => [item.id, item.name]));
  const canManage = hasPermission("personnel.manage");
  const checklistMap = new Map();
  for (const item of checklistResult.data || []) {
    const current = checklistMap.get(item.termination_id) || { complete: 0, required: 0 };
    if (item.is_required) current.required += 1;
    if (item.is_required && item.is_completed) current.complete += 1;
    checklistMap.set(item.termination_id, current);
  }
  const openCases = (cases || []).filter((item) => !["completed", "cancelled"].includes(item.status));
  content.innerHTML = `${pageHead("Desligamentos", "Acompanhe exame, contabilidade, rescisão, entrega e arquivamento no mesmo processo.", canManage ? `<button class="btn btn-primary" data-dialog="termination">${icon("plus")} Abrir desligamento</button>` : "")}
    <section class="metric-grid three">${metric("Em andamento", openCases.length, "tasks")}${metric("Aguardando contabilidade", (cases || []).filter((item) => item.status === "accounting").length, "mail")}${metric("Concluídos", (cases || []).filter((item) => item.status === "completed").length, "check")}</section>
    <section class="card"><div class="people-list workflow-list">${(cases || []).length ? cases.map((item) => {
      const count = checklistMap.get(item.id) || { complete: 0, required: 0 };
      const details = `${companyMap.get(item.company_id) || "Empresa não informada"} · ${item.reason || "Motivo não informado"}${item.effective_date ? ` · previsto para ${formatDate(item.effective_date)}` : ""} · checklist ${count.complete}/${count.required}`;
      return `<article class="workflow-record"><div class="workflow-record-head"><div><h3>${escapeHtml(apprenticeMap.get(item.apprentice_id) || "Jovem não identificado")}</h3><p>${escapeHtml(details)}</p></div><div class="person-actions"><span class="status status-draft">${escapeHtml(terminationStatusLabels[item.status] || item.status)}</span>${canManage ? `<button class="btn btn-small btn-secondary" data-edit-termination="${item.id}">${icon("edit")} Abrir</button>` : ""}</div></div>${workflowProgress(terminationStatusLabels, item.status)}</article>`;
    }).join("") : emptyState("Nenhum desligamento aberto", "Abra o processo antes de iniciar as providências para manter tudo auditável.", canManage ? `<button class="btn btn-primary" data-dialog="termination">Abrir desligamento</button>` : "")}</div></section>`;
}

async function renderPersonnel(content) {
  const [admissionsResult, contractsResult, leavesResult, terminationsResult, requirementsResult, accountingResult] = await Promise.all([
    supabase.from("admission_cases").select("id,status,target_start_date"),
    supabase.from("contracts").select("id,status,end_date"),
    supabase.from("leave_records").select("id,status,leave_type,start_date,end_date"),
    supabase.from("termination_cases").select("id,status,effective_date"),
    supabase.from("document_requirements").select("id,status,due_date"),
    supabase.from("accounting_dispatches").select("id,status,due_at"),
  ]);
  const failed = [admissionsResult, contractsResult, leavesResult, terminationsResult, requirementsResult, accountingResult].find((result) => result.error);
  if (failed) throw failed.error;
  const admissions = admissionsResult.data || [];
  const contracts = contractsResult.data || [];
  const leaves = leavesResult.data || [];
  const terminations = terminationsResult.data || [];
  const requirements = requirementsResult.data || [];
  const accounting = accountingResult.data || [];
  const openAdmissions = admissions.filter((item) => !["completed", "cancelled"].includes(item.status));
  const activeContracts = contracts.filter((item) => ["scheduled", "active", "closing"].includes(item.status));
  const activeLeaves = leaves.filter((item) => !["completed", "cancelled"].includes(item.status));
  const openTerminations = terminations.filter((item) => !["completed", "cancelled"].includes(item.status));
  const pendingDocuments = requirements.filter((item) => item.status === "pending");
  const pendingAccounting = accounting.filter((item) => !["verified", "completed"].includes(item.status));
  const dueContracts = activeContracts.filter((item) => item.end_date && new Date(`${item.end_date}T23:59:59`) >= new Date() && new Date(`${item.end_date}T23:59:59`).getTime() - Date.now() <= 90 * 86400000);
  const attention = [
    pendingDocuments.length ? ["Documentos pendentes", `${pendingDocuments.length} documento(s) aguardando recebimento ou conferência`, "documents"] : null,
    pendingAccounting.length ? ["Retornos da contabilidade", `${pendingAccounting.length} envio(s) ainda não concluído(s)`, "accounting"] : null,
    dueContracts.length ? ["Contratos próximos do fim", `${dueContracts.length} contrato(s) vencem em até 90 dias`, "contracts"] : null,
    openTerminations.length ? ["Desligamentos em andamento", `${openTerminations.length} processo(s) ainda aberto(s)`, "terminations"] : null,
  ].filter(Boolean);
  const modules = [
    ["Admissões", `${openAdmissions.length} em andamento`, "admissions", "tasks"],
    ["Contratos", `${activeContracts.length} vínculos ativos ou programados`, "contracts", "calendar"],
    ["Férias e afastamentos", `${activeLeaves.length} registros em aberto`, "leaves", "history"],
    ["Desligamentos", `${openTerminations.length} processos em andamento`, "terminations", "alert"],
    ["Contabilidade", `${pendingAccounting.length} envios pendentes`, "accounting", "mail"],
    ["Documentos", `${pendingDocuments.length} pendências documentais`, "documents", "upload"],
  ].filter(([, , view]) => canAccessView(view));
  content.innerHTML = `${pageHead("Departamento Pessoal", "Visão única do ciclo administrativo do jovem, da admissão ao encerramento do vínculo.")}
    <section class="metric-grid">${metric("Admissões abertas", openAdmissions.length, "tasks")}${metric("Contratos vigentes", activeContracts.length, "calendar")}${metric("Férias e afastamentos", activeLeaves.length, "history")}${metric("Documentos pendentes", pendingDocuments.length, "upload")}</section>
    <section class="administrative-hub-grid">${modules.map(([title, detail, view, iconName]) => `<button class="administrative-module-card" data-nav="${view}"><span>${icon(iconName)}</span><div><strong>${title}</strong><small>${detail}</small></div>${icon("chevron")}</button>`).join("")}</section>
    <section class="card"><div class="card-head"><div><span class="eyebrow">Exige atenção</span><h2>Pendências administrativas</h2></div><button class="text-link" data-nav="procedures">Ver procedimentos</button></div>${attention.length ? `<div class="people-list">${attention.map(([title, detail, view]) => operationalRow(title, detail, "Pendente", `<button class="btn btn-small btn-secondary" data-nav="${view}">Abrir</button>`)).join("")}</div>` : emptyState("Rotina administrativa em dia", "Não há pendências registradas neste momento.")}</section>`;
}

async function renderFinance(content) {
  const [chargesResult, references] = await Promise.all([
    supabase.from("financial_charges").select("*").order("competence", { ascending: false }).order("due_date", { ascending: true, nullsFirst: false }),
    loadOperationalReferences(),
  ]);
  if (chargesResult.error) throw chargesResult.error;
  const charges = chargesResult.data || [];
  const canManage = hasPermission("finance.manage");
  const companyMap = new Map(references.companies.map((item) => [item.id, item.name]));
  const search = state.financeSearch.trim().toLocaleLowerCase("pt-BR");
  const filtered = charges.filter((item) => {
    const companyName = companyMap.get(item.company_id) || "";
    const haystack = [item.description, item.invoice_number, item.payment_slip_number, companyName].filter(Boolean).join(" ").toLocaleLowerCase("pt-BR");
    return (!search || haystack.includes(search)) && (!state.financeStatus || item.status === state.financeStatus) && (!state.financeCompany || item.company_id === state.financeCompany);
  });
  const open = charges.filter((item) => !["paid", "cancelled"].includes(item.status));
  const overdue = charges.filter((item) => item.status === "overdue" || (!["paid", "cancelled", "overdue"].includes(item.status) && item.due_date && new Date(`${item.due_date}T23:59:59`) < new Date()));
  const received = charges.filter((item) => item.status === "paid");
  const hasFilters = Boolean(state.financeSearch || state.financeStatus || state.financeCompany);
  content.innerHTML = `${pageHead("Financeiro", "Controle manual de cobranças, notas fiscais, boletos, vencimentos e recebimentos por empresa.", canManage ? `<button class="btn btn-primary" data-dialog="financial-charge">${icon("plus")} Nova cobrança</button>` : "")}
    <section class="metric-grid">${metric("A receber", formatMoney(open.reduce((total, item) => total + Number(item.amount || 0), 0)), "calendar")}${metric("Vencido", formatMoney(overdue.reduce((total, item) => total + Number(item.amount || 0), 0)), "alert")}${metric("Recebido", formatMoney(received.reduce((total, item) => total + Number(item.paid_amount ?? item.amount ?? 0), 0)), "check")}${metric("Cobranças", charges.length, "history")}</section>
    <section class="filter-bar card"><label class="search-field">${icon("search")}<input type="search" data-finance-search value="${escapeHtml(state.financeSearch)}" placeholder="Buscar empresa, cobrança, NF ou boleto" aria-label="Buscar cobranças" /></label><select data-finance-filter="status" aria-label="Filtrar por situação"><option value="">Todas as situações</option>${selectOptions(financialStatusLabels, state.financeStatus)}</select><select data-finance-filter="company" aria-label="Filtrar por empresa"><option value="">Todas as empresas</option>${references.companies.map((company) => `<option value="${company.id}" ${state.financeCompany === company.id ? "selected" : ""}>${escapeHtml(company.name)}</option>`).join("")}</select>${hasFilters ? `<button class="btn btn-small btn-quiet" data-clear-finance-filters>Limpar filtros</button>` : ""}</section>
    <section class="card"><div class="people-list finance-list">${filtered.length ? filtered.map((item) => {
      const isLate = !["paid", "cancelled", "overdue"].includes(item.status) && item.due_date && new Date(`${item.due_date}T23:59:59`) < new Date();
      const detail = `${formatMonth(item.competence)} · vence ${item.due_date ? formatDate(item.due_date) : "sem data"}${item.invoice_number ? ` · NF ${item.invoice_number}` : ""}${item.payment_slip_number ? ` · boleto ${item.payment_slip_number}` : ""}`;
      const status = isLate ? "Vencido — atualizar" : financialStatusLabels[item.status] || item.status;
      return `<article class="person-row finance-row"><span class="avatar">${icon(isLate ? "alert" : item.status === "paid" ? "check" : "calendar")}</span><div class="person-main"><strong>${escapeHtml(companyMap.get(item.company_id) || "Empresa")}</strong><small>${escapeHtml(item.description)} · ${escapeHtml(detail)}</small></div><div class="finance-amount"><small>Valor</small><strong>${formatMoney(item.amount)}</strong></div><div class="person-access"><span class="status status-draft">${escapeHtml(status)}</span></div><div class="person-actions">${canManage ? `<button class="btn btn-small btn-secondary" data-edit-financial-charge="${item.id}">${icon("edit")} Alterar</button>` : ""}</div></article>`;
    }).join("") : emptyState("Nenhuma cobrança encontrada", hasFilters ? "Altere os filtros para localizar outro registro." : "Cadastre a primeira cobrança para iniciar o controle financeiro.", canManage ? `<button class="btn btn-primary" data-dialog="financial-charge">Nova cobrança</button>` : "")}</div></section>`;
}

async function renderDocuments(content) {
  const [documentsResult, requirementsResult, references] = await Promise.all([
    supabase.from("document_records").select("*").order("created_at", { ascending: false }).limit(500),
    supabase.from("document_requirements").select("*").order("due_date", { ascending: true, nullsFirst: false }).limit(500),
    loadOperationalReferences(),
  ]);
  if (documentsResult.error || requirementsResult.error) throw documentsResult.error || requirementsResult.error;
  const documents = documentsResult.data || [];
  const requirements = requirementsResult.data || [];
  const canManage = hasPermission("documents.manage");
  const apprenticeMap = new Map(references.profiles.map((item) => [item.id, item.full_name]));
  const companyMap = new Map(references.companies.map((item) => [item.id, item.name]));
  const documentMap = new Map(documents.map((item) => [item.id, item]));
  const search = state.documentSearch.trim().toLocaleLowerCase("pt-BR");
  const matches = (item, linkedDocument = null) => {
    const haystack = [item.title, item.notes, apprenticeMap.get(item.apprentice_id), companyMap.get(item.company_id), linkedDocument?.title].filter(Boolean).join(" ").toLocaleLowerCase("pt-BR");
    return (!search || haystack.includes(search)) && (!state.documentCategory || item.category === state.documentCategory);
  };
  const visibleDocuments = documents.filter((item) => state.documentTab === "archived" ? item.is_archived && matches(item) : !item.is_archived && matches(item));
  const visibleRequirements = requirements.filter((item) => matches(item, documentMap.get(item.document_id)));
  const pending = requirements.filter((item) => item.status === "pending");
  const overdue = pending.filter((item) => item.due_date && new Date(`${item.due_date}T23:59:59`) < new Date());
  const expiring = documents.filter((item) => !item.is_archived && item.expires_on && new Date(`${item.expires_on}T23:59:59`) >= new Date() && new Date(`${item.expires_on}T23:59:59`).getTime() - Date.now() <= 30 * 86400000);
  const tabs = [["files", "Arquivos", documents.filter((item) => !item.is_archived).length], ["requirements", "Pendências", pending.length], ["archived", "Arquivados", documents.filter((item) => item.is_archived).length]];
  const rows = state.documentTab === "requirements"
    ? visibleRequirements.map((item) => {
      const subject = apprenticeMap.get(item.apprentice_id) || companyMap.get(item.company_id) || "Processo administrativo";
      const linked = documentMap.get(item.document_id);
      const detail = `${subject} · ${documentCategoryLabels[item.category] || item.category}${item.due_date ? ` · prazo ${formatDate(item.due_date)}` : ""}${linked ? ` · arquivo ${linked.title}` : ""}`;
      return operationalRow(item.title, detail, documentRequirementStatusLabels[item.status] || item.status, canManage ? `<button class="btn btn-small btn-secondary" data-edit-document-requirement="${item.id}">${icon("edit")} Alterar</button>` : "");
    }).join("")
    : visibleDocuments.map((item) => {
      const subject = apprenticeMap.get(item.apprentice_id) || companyMap.get(item.company_id) || "Registro vinculado";
      const detail = `${subject} · ${documentCategoryLabels[item.category] || item.category} · ${formatFileSize(item.file_size)}${item.expires_on ? ` · validade ${formatDate(item.expires_on)}` : ""}`;
      const actions = item.is_archived ? (canManage ? `<button class="btn btn-small btn-secondary" data-archive-document="${item.id}" data-document-archived="true">Restaurar</button>` : "") : `<button class="btn btn-small btn-secondary" data-download-document="${item.id}">${icon("download")} Baixar</button>${canManage ? `<button class="btn btn-small btn-quiet" data-edit-document="${item.id}">${icon("edit")} Alterar</button><button class="btn btn-small btn-quiet" data-archive-document="${item.id}" data-document-archived="false">Arquivar</button>` : ""}`;
      return operationalRow(item.title, detail, item.is_archived ? "Arquivado" : item.is_generated ? "Gerado pelo portal" : "Enviado", actions);
    }).join("");
  const hasFilters = Boolean(state.documentSearch || state.documentCategory);
  const actions = canManage ? `<div class="page-actions"><button class="btn btn-secondary" data-dialog="document-requirement">${icon("tasks")} Nova pendência</button><button class="btn btn-primary" data-dialog="document">${icon("upload")} Enviar documento</button></div>` : "";
  content.innerHTML = `${pageHead("Documentos", "Arquivo privado por jovem, empresa e processo, com controle do que ainda falta receber.", actions)}
    <section class="metric-grid">${metric("Arquivos ativos", documents.filter((item) => !item.is_archived).length, "upload")}${metric("Pendentes", pending.length, "tasks")}${metric("Pendentes vencidos", overdue.length, "alert")}${metric("Validade em até 30 dias", expiring.length, "calendar")}</section>
    <nav class="operations-tabs" aria-label="Áreas de documentos">${tabs.map(([value, label, count]) => `<button class="${state.documentTab === value ? "active" : ""}" data-document-tab="${value}">${label}<span>${count}</span></button>`).join("")}</nav>
    <section class="filter-bar card"><label class="search-field">${icon("search")}<input type="search" data-document-search value="${escapeHtml(state.documentSearch)}" placeholder="Buscar documento, jovem ou empresa" aria-label="Buscar documentos" /></label><select data-document-category aria-label="Filtrar por categoria"><option value="">Todas as categorias</option>${selectOptions(documentCategoryLabels, state.documentCategory)}</select>${hasFilters ? `<button class="btn btn-small btn-quiet" data-clear-document-filters>Limpar filtros</button>` : ""}</section>
    <section class="card"><div class="people-list">${rows || emptyState(state.documentTab === "requirements" ? "Nenhuma pendência encontrada" : state.documentTab === "archived" ? "Nenhum documento arquivado" : "Nenhum documento encontrado", hasFilters ? "Altere os filtros para localizar outro registro." : state.documentTab === "requirements" ? "Registre o que precisa ser recebido e conferido." : "Envie arquivos para formar o histórico digital.")}</div></section>`;
}

async function renderAccounting(content) {
  const [{ data: records, error }, references] = await Promise.all([
    supabase.from("accounting_dispatches").select("*").order("due_at", { ascending: true, nullsFirst: false }), loadOperationalReferences(),
  ]);
  if (error) throw error;
  const apprenticeMap = new Map(references.profiles.map((item) => [item.id, item.full_name]));
  const companyMap = new Map(references.companies.map((item) => [item.id, item.name]));
  const responsibleMap = new Map(references.administrators.map((item) => [item.id, item.full_name]));
  const canManage = hasPermission("finance.manage");
  const open = (records || []).filter((item) => !["verified", "completed"].includes(item.status));
  content.innerHTML = `${pageHead("Contabilidade", "Registre o envio, o retorno e a conferência de cada solicitação contábil.", canManage ? `<button class="btn btn-primary" data-dialog="accounting">${icon("plus")} Novo envio</button>` : "")}
    <section class="metric-grid">${metric("Em preparação", (records || []).filter((item) => ["pending", "preparing"].includes(item.status)).length, "tasks")}${metric("Aguardando retorno", (records || []).filter((item) => ["sent", "waiting_response"].includes(item.status)).length, "clock")}${metric("Recebidos", (records || []).filter((item) => item.status === "received").length, "mail")}${metric("Conferidos", (records || []).filter((item) => ["verified", "completed"].includes(item.status)).length, "check")}</section>
    <section class="card"><div class="people-list">${(records || []).length ? records.map((item) => {
      const relations = [apprenticeMap.get(item.apprentice_id), companyMap.get(item.company_id), item.competence ? formatMonth(item.competence) : null, responsibleMap.get(item.responsible_id) ? `responsável ${responsibleMap.get(item.responsible_id)}` : null, item.due_at ? `prazo ${formatDate(item.due_at, true)}` : null].filter(Boolean).join(" · ") || "Sem vínculo informado";
      return operationalRow(item.title, relations, accountingStatusLabels[item.status] || item.status, canManage ? `<button class="btn btn-small btn-secondary" data-edit-accounting="${item.id}">${icon("edit")} Alterar</button>` : "");
    }).join("") : emptyState("Nenhum envio registrado", "Crie um registro para admissões, férias, folha, alterações cadastrais ou desligamentos.", canManage ? `<button class="btn btn-primary" data-dialog="accounting">Novo envio</button>` : "")}</div></section>`;
}

async function renderProcedures(content) {
  const [pipelinesResult, itemsResult, tasksResult, references] = await Promise.all([
    supabase.from("pipelines").select("id,slug,name,color").eq("is_active", true).order("position"),
    supabase.from("pipeline_items").select("id,title,pipeline_id,responsible_id,due_at,closed_at,is_archived").eq("is_archived", false),
    supabase.from("tasks").select("id,title,status,assigned_to,due_at,pipeline_item_id").not("status", "in", "(completed,cancelled)"),
    loadOperationalReferences(),
  ]);
  if (pipelinesResult.error || itemsResult.error || tasksResult.error) throw pipelinesResult.error || itemsResult.error || tasksResult.error;
  const administrativeSlugs = new Set(["admissions", "contracts", "terminations", "finance", "personnel"]);
  const pipelines = (pipelinesResult.data || []).filter((item) => administrativeSlugs.has(item.slug));
  const pipelineIds = new Set(pipelines.map((item) => item.id));
  const items = (itemsResult.data || []).filter((item) => pipelineIds.has(item.pipeline_id));
  const itemIds = new Set(items.map((item) => item.id));
  const tasks = (tasksResult.data || []).filter((item) => !item.pipeline_item_id || itemIds.has(item.pipeline_item_id));
  const responsibleMap = new Map(references.administrators.map((item) => [item.id, item.full_name]));
  const overdueItems = items.filter((item) => !item.closed_at && isOverdue(item.due_at));
  const overdueTasks = tasks.filter((item) => isOverdue(item.due_at));
  const unassigned = items.filter((item) => !item.closed_at && !item.responsible_id);
  const urgentRows = [
    ...overdueItems.map((item) => ({ title: item.title, detail: `${responsibleMap.get(item.responsible_id) || "Sem responsável"} · prazo ${formatDate(item.due_at, true)}`, type: "Processo atrasado" })),
    ...overdueTasks.map((item) => ({ title: item.title, detail: `${responsibleMap.get(item.assigned_to) || "Sem responsável"} · prazo ${formatDate(item.due_at, true)}`, type: "Tarefa atrasada" })),
  ].slice(0, 12);
  content.innerHTML = `${pageHead("Procedimentos", "Acesse as rotinas administrativas por esteira e confira responsáveis, tarefas e prazos.", `<div class="page-actions"><button class="btn btn-secondary" data-nav="tasks">${icon("tasks")} Ver tarefas</button><button class="btn btn-primary" data-nav="pipelines">${icon("kanban")} Abrir esteiras</button></div>`)}
    <section class="metric-grid">${metric("Processos abertos", items.filter((item) => !item.closed_at).length, "kanban")}${metric("Processos atrasados", overdueItems.length, "alert")}${metric("Tarefas abertas", tasks.length, "tasks")}${metric("Sem responsável", unassigned.length, "users")}</section>
    <section class="administrative-hub-grid">${pipelines.map((pipeline) => { const openCount = items.filter((item) => item.pipeline_id === pipeline.id && !item.closed_at).length; return `<button class="administrative-module-card" data-open-procedure-pipeline="${pipeline.id}"><span style="color:${pipeline.color}">${icon("kanban")}</span><div><strong>${escapeHtml(pipeline.name)}</strong><small>${openCount} processo(s) aberto(s)</small></div>${icon("chevron")}</button>`; }).join("")}</section>
    <section class="card"><div class="card-head"><div><span class="eyebrow">Prioridade</span><h2>Prazos vencidos</h2></div></div>${urgentRows.length ? `<div class="people-list">${urgentRows.map((item) => operationalRow(item.title, item.detail, item.type, "")).join("")}</div>` : emptyState("Nenhum prazo vencido", "Os processos e tarefas administrativos estão dentro do prazo registrado.")}</section>`;
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
        ${profileDepartment() === "management" ? `<button class="btn btn-secondary" data-export-people>${icon("download")} Salvar backup</button>` : ""}
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
            ? departmentLabels[person.department || "management"] || "Equipe CAFCM"
            : person.companyId
              ? companyMap.get(person.companyId) || "Empresa vinculada"
              : "Sem empresa vinculada";
          const canManage = canManagePerson(person);
          return `
          <article class="person-row">
            <span class="avatar">${escapeHtml(initials(person.fullName))}</span>
            <div class="person-main"><strong>${escapeHtml(person.fullName || "Nome não informado")}</strong><small>${escapeHtml(person.email || "E-mail não disponível")}</small><small>${escapeHtml(organization)}</small></div>
            <div class="person-access"><span class="role-pill">${roleLabels[person.role] || "Pendente"}</span><span class="status ${statusClass}">${statusLabel}</span></div>
            <div class="person-dates"><small>Criado em ${formatDate(person.createdAt, true)}</small><small>${person.lastSignInAt ? `Último acesso em ${formatDate(person.lastSignInAt, true)}` : "Ainda não acessou"}</small></div>
            <div class="person-actions">
              <button class="btn btn-small btn-secondary" data-person-history="${person.id}">${icon("history")} Histórico</button>
              ${canManage && person.accessExists && person.isActive ? `<button class="btn btn-small btn-secondary" data-edit-person="${person.id}">${icon("edit")} Perfil e senha</button>` : ""}
              ${canManage && person.accessExists && person.isActive ? `<button class="btn btn-small btn-quiet" data-resend-access="${person.id}" data-access-pending="${pending}">${pending ? "Reenviar convite" : "Enviar recuperação"}</button>` : ""}
              ${canManage && person.id !== state.profile.id && person.accessExists ? `<button class="btn btn-small ${inactive ? "btn-secondary" : "btn-danger-soft"}" data-set-person-active="${person.id}" data-person-active="${inactive ? "true" : "false"}" data-person-name="${escapeHtml(person.fullName)}">${inactive ? "Restaurar acesso" : "Excluir acesso"}</button>` : ""}
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
  const steps = wizardSteps(state.profile);
  const index = Math.min(state.wizardStep, steps.length - 1);
  const [title, text] = steps[index];
  root.innerHTML = `
    <div class="dialog-backdrop">
      <section class="wizard" role="dialog" aria-modal="true" aria-labelledby="wizard-title">
        <button class="dialog-close" data-close-wizard aria-label="Fechar guia">${icon("close")}</button>
        <div class="wizard-visual"><span>${icon(index === 0 ? "home" : index === steps.length - 1 ? "shield" : "arrow")}</span><small>Guia de uso</small><strong>${escapeHtml(profileAccessLabel(state.profile))}</strong></div>
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
      ${state.profile.role === "cafcm_admin" ? `<label>Departamento<input value="${escapeHtml(profileAccessLabel(state.profile))}" disabled /><small>Somente outro acesso da Direção e Administração pode alterar o seu departamento.</small></label>` : ""}
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

  if (["candidate", "vacancy", "application", "partnership", "candidate-conversion"].includes(type)) {
    const references = await loadOperationalReferences();
    if (type === "candidate") {
      let item = {};
      let candidateDocuments = [];
      let events = [];
      let selections = [];
      if (recordId) {
        const [candidateResult, documentResult, eventResult, selectionResult] = await Promise.all([
          supabase.from("candidates").select("*").eq("id", recordId).single(),
          supabase.from("candidate_documents").select("*").eq("candidate_id", recordId).order("created_at", { ascending: false }),
          supabase.from("recruitment_events").select("*").eq("candidate_id", recordId).order("created_at", { ascending: false }).limit(60),
          supabase.from("vacancy_applications").select("id,vacancy_id,status,updated_at").eq("candidate_id", recordId).order("updated_at", { ascending: false }),
        ]);
        if (candidateResult.error || documentResult.error || eventResult.error || selectionResult.error) throw candidateResult.error || documentResult.error || eventResult.error || selectionResult.error;
        item = candidateResult.data;
        candidateDocuments = documentResult.data || [];
        events = eventResult.data || [];
        selections = selectionResult.data || [];
      }
      const { data: vacancies } = recordId ? await supabase.from("job_vacancies").select("id,title,company_id") : { data: [] };
      const vacancyMap = new Map((vacancies || []).map((vacancy) => [vacancy.id, vacancy]));
      const companyMap = new Map(references.companies.map((company) => [company.id, company.name]));
      const eventLabels = { "candidate.created": "Candidato cadastrado", "candidate.updated": "Dados atualizados", "candidate.status_changed": "Situação atualizada", "application.created": "Seleção iniciada", "application.updated": "Seleção atualizada", "application.status_changed": "Etapa da seleção atualizada" };
      body = `<form id="candidate-form" class="dialog-form wide-form"><input type="hidden" name="candidateId" value="${escapeHtml(item.id || "")}" />
        <div class="form-section"><span>Dados do candidato</span></div><div class="form-grid two-columns">
          <label>Nome completo<input name="fullName" required minlength="2" maxlength="160" autofocus value="${escapeHtml(item.full_name || "")}" /></label>
          <label>CPF<input name="cpf" maxlength="18" inputmode="numeric" value="${escapeHtml(item.cpf || "")}" /></label>
          <label>E-mail<input name="email" type="email" maxlength="254" value="${escapeHtml(item.email || "")}" /></label>
          <label>Telefone<input name="phone" maxlength="20" inputmode="tel" value="${escapeHtml(item.phone || "")}" /></label>
          <label>Data de nascimento<input name="birthDate" type="date" value="${escapeHtml(item.birth_date || "")}" /></label>
          <label>Escolaridade<input name="educationLevel" maxlength="120" value="${escapeHtml(item.education_level || "")}" placeholder="Ex.: Ensino médio cursando" /></label>
          <label>Cidade<input name="city" maxlength="120" value="${escapeHtml(item.city || "")}" /></label>
          <label>Bairro<input name="neighborhood" maxlength="120" value="${escapeHtml(item.neighborhood || "")}" /></label>
          <label>Origem do candidato<input name="source" maxlength="120" value="${escapeHtml(item.source || "")}" placeholder="Ex.: Indicação, site, escola" /></label>
          <label>Situação<select name="status">${selectOptions(Object.fromEntries(Object.entries(candidateStatusLabels).filter(([value]) => value !== "hired")), item.status || "new")}${item.status === "hired" ? `<option value="hired" selected>Convertido em jovem</option>` : ""}</select></label>
        </div><label>Observações internas<textarea name="notes" rows="4" maxlength="12000">${escapeHtml(item.notes || "")}</textarea></label>
        <div class="form-section"><span>Currículo e documentos</span></div>
        <div class="form-grid two-columns"><label>Adicionar arquivo<input name="file" type="file" accept="application/pdf,image/jpeg,image/png,application/vnd.openxmlformats-officedocument.wordprocessingml.document" /></label><label>Tipo do arquivo<select name="documentCategory"><option value="resume">Currículo</option><option value="identification">Identificação</option><option value="school">Escolaridade</option><option value="certificate">Certificado</option><option value="other">Outro</option></select></label></div>
        <label>Título do arquivo<input name="documentTitle" maxlength="180" placeholder="Opcional: usa o nome do arquivo" /></label>
        ${recordId ? `<div class="compact-record-list">${candidateDocuments.length ? candidateDocuments.map((document) => `<div><span>${icon("upload")}<strong>${escapeHtml(document.title)}</strong><small>${escapeHtml(document.category)} · ${formatDate(document.created_at, true)}</small></span><button type="button" class="btn btn-small btn-secondary" data-download-candidate-document="${document.id}">Baixar</button></div>`).join("") : `<p class="form-note">Nenhum arquivo enviado para este candidato.</p>`}</div>` : `<p class="form-note">Você poderá adicionar outros arquivos ao abrir o candidato novamente.</p>`}
        ${recordId ? `<div class="form-section"><span>Seleções e histórico</span></div><div class="candidate-history-grid"><div><h3>Vagas</h3>${selections.length ? selections.map((selection) => { const vacancy = vacancyMap.get(selection.vacancy_id); return `<p><strong>${escapeHtml(vacancy?.title || "Vaga")}</strong><small>${escapeHtml(companyMap.get(vacancy?.company_id) || "Empresa")} · ${escapeHtml(applicationStatusLabels[selection.status] || selection.status)}</small></p>`; }).join("") : `<p class="form-note">Ainda não participa de nenhuma seleção.</p>`}</div><div><h3>Histórico</h3>${events.length ? events.map((event) => `<p><strong>${escapeHtml(eventLabels[event.event_type] || event.event_type)}</strong><small>${event.from_status && event.to_status ? `${escapeHtml(applicationStatusLabels[event.from_status] || candidateStatusLabels[event.from_status] || event.from_status)} → ${escapeHtml(applicationStatusLabels[event.to_status] || candidateStatusLabels[event.to_status] || event.to_status)} · ` : ""}${formatDate(event.created_at, true)}</small>${event.notes ? `<em>${escapeHtml(event.notes)}</em>` : ""}</p>`).join("") : `<p class="form-note">O histórico será formado conforme o processo avançar.</p>`}</div></div>` : ""}
        <button class="btn btn-primary" type="submit">${recordId ? "Salvar candidato" : "Cadastrar candidato"}</button></form>`;
    }
    if (type === "vacancy") {
      let item = {};
      if (recordId) {
        const { data, error } = await supabase.from("job_vacancies").select("*").eq("id", recordId).single();
        if (error) throw error;
        item = data;
      }
      body = `<form id="vacancy-form" class="dialog-form wide-form"><input type="hidden" name="vacancyId" value="${escapeHtml(item.id || "")}" /><div class="form-grid two-columns"><label>Empresa<select name="companyId" required><option value="">Selecione</option>${references.companies.filter((company) => company.is_active || company.id === item.company_id).map((company) => `<option value="${company.id}" ${company.id === item.company_id ? "selected" : ""}>${escapeHtml(company.name)}${company.is_active ? "" : " · inativa"}</option>`).join("")}</select></label><label>Nome da vaga<input name="title" required maxlength="180" value="${escapeHtml(item.title || "")}" placeholder="Ex.: Jovem aprendiz administrativo" /></label><label>Quantidade<input name="quantity" type="number" min="1" max="999" value="${escapeHtml(item.quantity || 1)}" required /></label><label>Prazo<input name="dueDate" type="date" value="${escapeHtml(item.due_date || "")}" /></label><label>Jornada<input name="workload" maxlength="120" value="${escapeHtml(item.workload || "")}" placeholder="Ex.: 6 horas diárias" /></label><label>Modelo de trabalho<input name="workModel" maxlength="80" value="${escapeHtml(item.work_model || "")}" placeholder="Ex.: Presencial" /></label><label>Local<input name="location" maxlength="180" value="${escapeHtml(item.location || "")}" placeholder="Cidade ou unidade" /></label><label>Salário mensal<input name="monthlySalary" type="number" min="0" step="0.01" value="${escapeHtml(item.monthly_salary || "")}" /></label><label>Situação<select name="status">${selectOptions(vacancyStatusLabels, item.status || "open")}</select></label></div><label>Requisitos<textarea name="requirements" rows="4" maxlength="12000">${escapeHtml(item.requirements || "")}</textarea></label><label>Observações internas<textarea name="notes" rows="4" maxlength="12000">${escapeHtml(item.notes || "")}</textarea></label><button class="btn btn-primary" type="submit">${recordId ? "Salvar vaga" : "Abrir vaga"}</button></form>`;
    }
    if (type === "application") {
      let item = {};
      if (recordId) {
        const { data, error } = await supabase.from("vacancy_applications").select("*").eq("id", recordId).single();
        if (error) throw error;
        item = data;
      }
      const [candidates, vacancies] = await Promise.all([
        supabase.from("candidates").select("id,full_name,status").not("status", "in", "(hired,archived)").order("full_name"),
        supabase.from("job_vacancies").select("id,title,company_id,status").in("status", ["open", "paused"]),
      ]);
      if (candidates.error || vacancies.error) throw candidates.error || vacancies.error;
      const companyMap = new Map(references.companies.map((company) => [company.id, company.name]));
      const candidateOptions = (candidates.data || []).concat(item.candidate_id && !(candidates.data || []).some((candidate) => candidate.id === item.candidate_id) ? [{ id: item.candidate_id, full_name: "Candidato atual" }] : []);
      const vacancyOptions = (vacancies.data || []).concat(item.vacancy_id && !(vacancies.data || []).some((vacancy) => vacancy.id === item.vacancy_id) ? [{ id: item.vacancy_id, title: "Vaga atual", company_id: null }] : []);
      body = `<form id="application-form" class="dialog-form wide-form"><input type="hidden" name="applicationId" value="${escapeHtml(item.id || "")}" />${recordId ? `<input type="hidden" name="candidateId" value="${item.candidate_id}" /><input type="hidden" name="vacancyId" value="${item.vacancy_id}" />` : ""}<div class="form-grid two-columns"><label>Candidato<select name="candidateIdSelect" ${recordId ? "disabled" : "required"}><option value="">Selecione</option>${candidateOptions.map((candidate) => `<option value="${candidate.id}" ${candidate.id === item.candidate_id ? "selected" : ""}>${escapeHtml(candidate.full_name)}</option>`).join("")}</select></label><label>Vaga<select name="vacancyIdSelect" ${recordId ? "disabled" : "required"}><option value="">Selecione</option>${vacancyOptions.map((vacancy) => `<option value="${vacancy.id}" ${vacancy.id === item.vacancy_id ? "selected" : ""}>${escapeHtml(vacancy.title)} · ${escapeHtml(companyMap.get(vacancy.company_id) || "")}</option>`).join("")}</select></label><label>Etapa<select name="status">${selectOptions(Object.fromEntries(Object.entries(applicationStatusLabels).filter(([value]) => value !== "hired")), item.status || "received")}${item.status === "hired" ? `<option value="hired" selected>Admissão iniciada</option>` : ""}</select></label><label>Entrevista na empresa<input name="companyInterviewAt" type="datetime-local" value="${formatDateTimeInput(item.company_interview_at)}" /></label></div>${recordId ? workflowProgress(applicationStatusLabels, item.status) : ""}<label>Observações da CAFCM<textarea name="notes" rows="4" maxlength="12000">${escapeHtml(item.notes || "")}</textarea></label><label>Retorno da empresa<textarea name="companyFeedback" rows="4" maxlength="12000">${escapeHtml(item.company_feedback || "")}</textarea></label><button class="btn btn-primary" type="submit">${recordId ? "Salvar seleção" : "Iniciar seleção"}</button></form>`;
    }
    if (type === "candidate-conversion") {
      const { data: application, error } = await supabase.from("vacancy_applications").select("id,candidate_id,vacancy_id,status").eq("id", recordId).single();
      if (error) throw error;
      const [{ data: candidate }, { data: vacancy }] = await Promise.all([
        supabase.from("candidates").select("full_name,email").eq("id", application.candidate_id).single(),
        supabase.from("job_vacancies").select("title,company_id").eq("id", application.vacancy_id).single(),
      ]);
      const company = references.companies.find((item) => item.id === vacancy.company_id);
      body = `<form id="candidate-conversion-form" class="dialog-form"><input type="hidden" name="applicationId" value="${application.id}" /><div class="conversion-summary"><span>${icon("users")}</span><div><strong>${escapeHtml(candidate.full_name)}</strong><small>${escapeHtml(candidate.email || "E-mail não cadastrado")}</small><small>${escapeHtml(vacancy.title)} · ${escapeHtml(company?.name || "Empresa")}</small></div></div><label>Data prevista para início<input name="targetStartDate" type="date" /></label><div class="dialog-instructions">Ao confirmar, o Portal cria ou atualiza o acesso de jovem aprendiz, envia o convite por e-mail quando necessário, transfere os dados do candidato e abre uma admissão com checklist. Nenhum dado precisa ser digitado novamente.</div><button class="btn btn-primary" type="submit">Confirmar e abrir admissão</button></form>`;
    }
    if (type === "partnership") {
      let item = {};
      if (recordId) {
        const { data, error } = await supabase.from("partnership_agreements").select("*").eq("id", recordId).single();
        if (error) throw error;
        item = data;
      }
      const statusLabels = { draft: "Rascunho", active: "Ativa", expiring: "Próxima do fim", ended: "Encerrada", cancelled: "Cancelada" };
      body = `<form id="partnership-form" class="dialog-form"><input type="hidden" name="partnershipId" value="${escapeHtml(item.id || "")}" /><label>Empresa<select name="companyId" required><option value="">Selecione</option>${references.companies.map((company) => `<option value="${company.id}" ${company.id === item.company_id ? "selected" : ""}>${escapeHtml(company.name)}</option>`).join("")}</select></label><label>Título<input name="title" required maxlength="180" value="${escapeHtml(item.title || "Contrato de parceria")}" /></label><div class="form-grid two-columns"><label>Início<input name="startDate" type="date" value="${escapeHtml(item.start_date || "")}" /></label><label>Término<input name="endDate" type="date" value="${escapeHtml(item.end_date || "")}" /></label><label>Situação<select name="status">${selectOptions(statusLabels, item.status || "active")}</select></label></div><label>Observações<textarea name="notes" rows="4" maxlength="12000">${escapeHtml(item.notes || "")}</textarea></label><button class="btn btn-primary">${recordId ? "Salvar parceria" : "Registrar parceria"}</button></form>`;
    }
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
    const departmentHidden = person.role !== "cafcm_admin";
    const staffRoleOption = profileDepartment() === "management" ? `<option value="cafcm_admin" ${person.role === "cafcm_admin" ? "selected" : ""}>Equipe CAFCM</option>` : "";
    body = `<form id="person-form" class="dialog-form">
      <input type="hidden" name="userId" value="${person.id}" />
      <div class="form-grid two-columns">
        <label>Nome completo<input name="fullName" required minlength="2" maxlength="160" autofocus value="${escapeHtml(person.fullName || "")}" /></label>
        <label>E-mail<input name="email" type="email" maxlength="254" required value="${escapeHtml(person.email || "")}" /></label>
      </div>
      ${isSelf ? `<input type="hidden" name="role" value="${person.role}" /><label>Tipo de acesso<select disabled><option>${roleLabels[person.role]}</option></select><small>Para sua segurança, você não pode alterar o tipo do próprio acesso.</small></label>` : `<label>Tipo de acesso<select name="role" required><option value="apprentice" ${person.role === "apprentice" ? "selected" : ""}>Jovem aprendiz</option><option value="company" ${person.role === "company" ? "selected" : ""}>Representante de empresa</option>${staffRoleOption}</select></label>`}
      <label class="company-field ${person.role === "company" ? "required-field" : ""}" ${companyHidden ? "hidden" : ""}>Empresa vinculada<select name="companyId" ${person.role === "company" ? "required" : ""} ${companyHidden ? "disabled" : ""}><option value="">Sem empresa vinculada</option>${(companies || []).map((company) => `<option value="${company.id}" ${person.companyId === company.id ? "selected" : ""}>${escapeHtml(company.name)}${company.is_active ? "" : " · inativa"}</option>`).join("")}</select><small>Obrigatória para representantes e opcional para jovens.</small></label>
      <label class="department-field" ${departmentHidden ? "hidden" : ""}>Departamento<select name="department" ${departmentHidden || isSelf ? "disabled" : "required"}>${departmentOptions(person.department || "management")}</select>${isSelf ? `<input type="hidden" name="department" value="${person.department || "management"}" />` : ""}<small>Define os menus e as informações que a pessoa poderá consultar ou alterar.</small></label>
      <div class="form-section"><span>Credenciais</span></div>
      <label>Alterar senha<select name="passwordMode"><option value="keep">Manter a senha atual</option><option value="random">Gerar nova senha temporária</option><option value="manual">Definir uma nova senha</option></select></label>
      <label class="manual-password-field" hidden>Nova senha<input name="password" type="password" minlength="10" maxlength="128" autocomplete="new-password" /><small>Use de 10 a 128 caracteres. A senha nunca aparece no histórico de auditoria.</small></label>
      <p class="form-note">Alterações de perfil e empresa passam a valer integralmente no próximo acesso da pessoa.${person.emailConfirmedAt ? "" : " Se alterar o e-mail, reenvie o convite depois de salvar."}</p>
      <button class="btn btn-primary" type="submit">Salvar alterações</button>
    </form>`;
  }

  if (type === "person-history") {
    let person = state.people.find((item) => item.id === recordId);
    if (!person) {
      const result = await callAdmin({ action: "list_users" }, true);
      state.people = result.users || [];
      person = state.people.find((item) => item.id === recordId);
    }
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
      ${canAccessView("audit") ? `<button class="btn btn-secondary btn-block" data-view-person-audit="${person.id}">Abrir auditoria completa</button>` : ""}
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
    const staffRoleOption = profileDepartment() === "management" ? `<option value="cafcm_admin">Equipe CAFCM</option>` : "";
    body = `<form id="invite-form" class="dialog-form">
      <div class="form-grid two-columns">
        <label>Nome completo<input name="fullName" required minlength="2" maxlength="160" autofocus /></label>
        <label>E-mail<input name="email" type="email" maxlength="254" required /></label>
      </div>
      <label>Tipo de acesso<select name="role" required><option value="apprentice">Jovem aprendiz</option><option value="company">Representante de empresa</option>${staffRoleOption}</select></label>
      <label class="company-field">Empresa vinculada<select name="companyId"><option value="">Sem empresa vinculada</option>${(companies || []).map((company) => `<option value="${company.id}">${escapeHtml(company.name)}</option>`).join("")}</select><small>Opcional para o jovem e obrigatório para representantes de empresa.</small></label>
      <label class="department-field" hidden>Departamento<select name="department" disabled>${departmentOptions()}</select><small>O departamento define as áreas e os dados disponíveis para a equipe CAFCM.</small></label>
      <p class="form-note">O convite será enviado ao e-mail informado. A pessoa confirma o acesso pelo link e cria a própria senha no primeiro acesso.</p>
      <button class="btn btn-primary" type="submit">Criar acesso e enviar convite</button>
    </form>`;
  }

  if (type === "people-import") {
    const canRestoreHistory = profileDepartment() === "management";
    body = `<form id="people-import-form" class="dialog-form">
      <div class="import-explainer">${icon("upload")}<div><strong>Importe pessoas sem apagar o histórico existente</strong><p>Contas já cadastradas são atualizadas pelo e-mail. Novas pessoas recebem convite para confirmar o acesso e criar a própria senha.${canRestoreHistory ? " Um backup JSON também restaura matrículas, conclusões e atividades quando os cursos ainda existem." : " A restauração completa do histórico é reservada à Direção e Administração."}</p></div></div>
      <label>${canRestoreHistory ? "Arquivo CSV ou backup JSON" : "Arquivo CSV"}<input name="peopleFile" type="file" accept="${canRestoreHistory ? ".csv,.json,text/csv,application/json" : ".csv,text/csv"}" required /><small>Até 100 pessoas por importação. Use o modelo CSV disponível na página.</small></label>
      <label class="confirmation-field"><input name="confirmImport" type="checkbox" value="yes" required /><span>Confirmo o envio de convites por e-mail para pessoas novas do arquivo.</span></label>
      <div class="form-note">Perfis existentes mantêm suas matrículas e conclusões. Senhas não são exportadas em backups.</div>
      <button class="btn btn-primary" type="submit">Validar e importar pessoas</button>
    </form>`;
  }

  if (type === "pipeline-item") {
    if (!state.selectedPipelineId) throw new Error("Selecione uma esteira antes de criar um processo.");
    const [pipelineResult, stagesResult, references] = await Promise.all([
      supabase.from("pipelines").select("id,name").eq("id", state.selectedPipelineId).single(),
      supabase.from("pipeline_stages").select("*").eq("pipeline_id", state.selectedPipelineId).eq("is_active", true).order("position"),
      loadOperationalReferences(),
    ]);
    if (pipelineResult.error || stagesResult.error) throw pipelineResult.error || stagesResult.error;
    let process = {};
    let movements = [];
    if (recordId) {
      const [processResult, movementResult] = await Promise.all([
        supabase.from("pipeline_items").select("*").eq("id", recordId).eq("pipeline_id", state.selectedPipelineId).single(),
        supabase.from("pipeline_item_movements").select("*").eq("pipeline_item_id", recordId).order("moved_at", { ascending: false }).limit(20),
      ]);
      if (processResult.error || movementResult.error) throw processResult.error || movementResult.error;
      process = processResult.data;
      movements = movementResult.data || [];
    }
    const stages = stagesResult.data || [];
    if (!stages.length) throw new Error("Esta esteira não possui etapas ativas.");
    const stageMap = new Map(stages.map((stage) => [stage.id, stage.name]));
    const profileMap = new Map(references.profiles.map((profile) => [profile.id, profile.full_name]));
    body = `<form id="pipeline-item-form" class="dialog-form wide-form">
      <input type="hidden" name="processId" value="${escapeHtml(process.id || "")}" />
      <input type="hidden" name="pipelineId" value="${escapeHtml(state.selectedPipelineId)}" />
      <div class="form-section"><span>${escapeHtml(pipelineResult.data.name)}</span></div>
      <label>Título do processo<input name="title" required minlength="2" maxlength="180" autofocus value="${escapeHtml(process.title || "")}" /></label>
      <label>Descrição<textarea name="description" rows="5" maxlength="12000" placeholder="Registre o contexto e a próxima providência">${escapeHtml(process.description || "")}</textarea></label>
      <div class="form-grid two-columns">
        <label>Etapa<select name="stageId" required>${stages.map((stage) => `<option value="${stage.id}" ${process.stage_id === stage.id ? "selected" : ""}>${escapeHtml(stage.name)}</option>`).join("")}</select></label>
        <label>Prioridade<select name="priority" required>${Object.entries(priorityLabels).map(([value, label]) => `<option value="${value}" ${(process.priority || "normal") === value ? "selected" : ""}>${label}</option>`).join("")}</select></label>
        <label>Responsável CAFCM<select name="responsibleId"><option value="">Sem responsável</option>${references.administrators.map((person) => `<option value="${person.id}" ${process.responsible_id === person.id ? "selected" : ""}>${escapeHtml(person.full_name)}</option>`).join("")}</select></label>
        <label>Prazo<input name="dueAt" type="datetime-local" value="${formatDateTimeInput(process.due_at)}" /></label>
        <label>Empresa<select name="companyId"><option value="">Sem empresa vinculada</option>${references.companies.map((company) => `<option value="${company.id}" ${process.company_id === company.id ? "selected" : ""}>${escapeHtml(company.name)}${company.is_active ? "" : " · inativa"}</option>`).join("")}</select></label>
        <label>Jovem / aprendiz<select name="apprenticeId"><option value="">Sem jovem vinculado</option>${references.apprentices.map((person) => `<option value="${person.id}" ${process.apprentice_id === person.id ? "selected" : ""}>${escapeHtml(person.full_name)}</option>`).join("")}</select></label>
      </div>
      <p class="form-note">Use o mesmo cadastro de empresa e de jovem em toda a operação. Mudanças de etapa ficam registradas na auditoria e no histórico do processo.</p>
      <div class="dialog-form-actions">${recordId ? `<button class="btn btn-danger-soft" type="button" data-archive-pipeline-item="${recordId}" data-process-title="${escapeHtml(process.title)}">Arquivar processo</button>` : ""}<button class="btn btn-primary" type="submit">${recordId ? "Salvar alterações" : "Criar processo"}</button></div>
    </form>
    ${recordId ? `<section class="movement-history"><div class="form-section"><span>Histórico de movimentações</span></div>${movements.length ? movements.map((movement) => `<article><span>${icon("arrow")}</span><div><strong>${escapeHtml(stageMap.get(movement.from_stage_id) || "Etapa anterior")} → ${escapeHtml(stageMap.get(movement.to_stage_id) || "Nova etapa")}</strong><small>${escapeHtml(profileMap.get(movement.moved_by) || "Sistema")} · ${formatDate(movement.moved_at, true)}</small></div></article>`).join("") : `<p class="muted-note">O processo ainda não foi movido entre etapas.</p>`}</section>` : ""}`;
  }

  if (type === "task") {
    const [references, processResult] = await Promise.all([
      loadOperationalReferences(),
      supabase.from("pipeline_items").select("id,title,pipeline_id").eq("is_archived", false).order("title"),
    ]);
    if (processResult.error) throw processResult.error;
    let task = {};
    if (recordId) {
      const { data, error } = await supabase.from("tasks").select("*").eq("id", recordId).single();
      if (error) throw error;
      task = data;
    }
    const statusOptions = [
      ["pending", "Pendente"],
      ["in_progress", "Em andamento"],
      ["waiting", "Aguardando terceiro"],
      ["completed", "Concluída"],
      ["cancelled", "Cancelada"],
    ];
    const categories = ["Admissão", "Desligamento", "Financeiro", "DP", "Recrutamento", "Empresas", "Acadêmico"];
    body = `<form id="task-form" class="dialog-form wide-form">
      <input type="hidden" name="taskId" value="${escapeHtml(task.id || "")}" />
      <label>Título da tarefa<input name="title" required minlength="2" maxlength="180" autofocus value="${escapeHtml(task.title || "")}" /></label>
      <label>Descrição<textarea name="description" rows="5" maxlength="12000" placeholder="Informe o que precisa ser feito e o resultado esperado">${escapeHtml(task.description || "")}</textarea></label>
      <div class="form-grid two-columns">
        <label>Status<select name="status" required>${statusOptions.map(([value, label]) => `<option value="${value}" ${(task.status || "pending") === value ? "selected" : ""}>${label}</option>`).join("")}</select></label>
        <label>Prioridade<select name="priority" required>${Object.entries(priorityLabels).map(([value, label]) => `<option value="${value}" ${(task.priority || "normal") === value ? "selected" : ""}>${label}</option>`).join("")}</select></label>
        <label>Categoria<input name="category" list="task-categories" maxlength="100" value="${escapeHtml(task.category || "")}" placeholder="Selecione ou informe a categoria" /><datalist id="task-categories">${categories.map((category) => `<option value="${category}"></option>`).join("")}</datalist></label>
        <label>Prazo<input name="dueAt" type="datetime-local" value="${formatDateTimeInput(task.due_at)}" /></label>
        <label>Responsável<select name="assignedTo"><option value="">Sem responsável</option>${references.administrators.map((person) => `<option value="${person.id}" ${(task.assigned_to || (!recordId ? state.profile.id : "")) === person.id ? "selected" : ""}>${escapeHtml(person.full_name)}</option>`).join("")}</select></label>
        <label>Empresa<select name="companyId"><option value="">Sem empresa vinculada</option>${references.companies.map((company) => `<option value="${company.id}" ${task.company_id === company.id ? "selected" : ""}>${escapeHtml(company.name)}${company.is_active ? "" : " · inativa"}</option>`).join("")}</select></label>
        <label>Jovem / aprendiz<select name="apprenticeId"><option value="">Sem jovem vinculado</option>${references.apprentices.map((person) => `<option value="${person.id}" ${task.apprentice_id === person.id ? "selected" : ""}>${escapeHtml(person.full_name)}</option>`).join("")}</select></label>
        <label>Processo relacionado<select name="processId"><option value="">Sem processo vinculado</option>${(processResult.data || []).map((process) => `<option value="${process.id}" ${task.pipeline_item_id === process.id ? "selected" : ""}>${escapeHtml(process.title)}</option>`).join("")}</select></label>
      </div>
      <label>${recordId ? "Adicionar itens ao checklist" : "Checklist inicial"}<textarea name="checklistItems" rows="4" maxlength="5000" placeholder="Um item por linha"></textarea><small>${recordId ? "Os novos itens serão acrescentados aos já existentes." : "Opcional. Escreva um item por linha."}</small></label>
      <p class="form-note">A pessoa responsável recebe uma notificação interna quando a tarefa é atribuída ou transferida.</p>
      <button class="btn btn-primary" type="submit">${recordId ? "Salvar tarefa" : "Criar tarefa"}</button>
    </form>`;
  }

  if (["admission", "contract", "leave", "termination", "accounting", "document", "document-edit", "document-requirement", "financial-charge"].includes(type)) {
    const references = await loadOperationalReferences();
    const apprenticeOptions = references.apprentices.map((person) => `<option value="${person.id}">${escapeHtml(person.full_name)}</option>`).join("");
    const companyOptions = references.companies.map((company) => `<option value="${company.id}">${escapeHtml(company.name)}</option>`).join("");
    const selectRecord = async (table) => {
      if (!recordId) return {};
      const { data, error } = await supabase.from(table).select("*").eq("id", recordId).single();
      if (error) throw error;
      return data;
    };
    if (type === "admission") {
      const item = await selectRecord("admission_cases");
      const checklist = recordId ? await supabase.from("admission_checklist_items").select("*").eq("admission_id", recordId).order("position") : { data: [] };
      if (checklist.error) throw checklist.error;
      body = `<form id="admission-form" class="dialog-form wide-form"><input type="hidden" name="id" value="${escapeHtml(item.id || "")}" /><div class="form-grid two-columns"><label>Jovem<select name="apprenticeId" required><option value="">Selecione</option>${references.apprentices.map((person) => `<option value="${person.id}" ${item.apprentice_id === person.id ? "selected" : ""}>${escapeHtml(person.full_name)}</option>`).join("")}</select></label><label>Empresa<select name="companyId" required><option value="">Selecione</option>${references.companies.map((company) => `<option value="${company.id}" ${item.company_id === company.id ? "selected" : ""}>${escapeHtml(company.name)}</option>`).join("")}</select></label><label>Início previsto<input name="targetStartDate" type="date" value="${escapeHtml(item.target_start_date || "")}" /></label><label>Etapa<select name="status">${selectOptions(admissionStatusLabels, item.status || "approved")}</select></label></div>${recordId ? workflowProgress(admissionStatusLabels, item.status) : ""}<label>Observações<textarea name="notes" rows="4" maxlength="12000">${escapeHtml(item.notes || "")}</textarea></label>${recordId ? `<div class="form-section"><span>Checklist da admissão</span></div><div class="checklist-editor">${(checklist.data || []).map((check) => `<label><input type="checkbox" name="check-${check.id}" ${check.is_completed ? "checked" : ""} /> <span>${escapeHtml(check.title)}</span></label>`).join("") || "Nenhum item criado"}</div><label>Adicionar itens ao checklist<textarea name="newChecklistItems" rows="3" maxlength="2000" placeholder="Digite um item por linha"></textarea><small>Os itens são adicionados sem apagar o checklist já preenchido.</small></label>` : `<p class="form-note">Ao abrir a admissão, o Portal cria automaticamente o checklist padrão, uma pendência de acompanhamento e o envio à contabilidade. Depois você pode marcar e personalizar os itens.</p>`}<button class="btn btn-primary" type="submit">${recordId ? "Salvar admissão" : "Abrir admissão"}</button></form>`;
    }
    if (type === "contract") {
      const item = await selectRecord("contracts");
      const contractStatusLabels = { scheduled: "A iniciar", active: "Ativo", closing: "Encerramento", ended: "Encerrado", cancelled: "Cancelado" };
      body = `<form id="contract-form" class="dialog-form wide-form"><input type="hidden" name="id" value="${escapeHtml(item.id || "")}" /><div class="form-grid two-columns"><label>Jovem<select name="apprenticeId" required><option value="">Selecione</option>${references.apprentices.map((person) => `<option value="${person.id}" ${item.apprentice_id === person.id ? "selected" : ""}>${escapeHtml(person.full_name)}</option>`).join("")}</select></label><label>Empresa<select name="companyId" required><option value="">Selecione</option>${references.companies.map((company) => `<option value="${company.id}" ${item.company_id === company.id ? "selected" : ""}>${escapeHtml(company.name)}</option>`).join("")}</select></label><label>Início<input name="startDate" type="date" required value="${escapeHtml(item.start_date || "")}" /></label><label>Término<input name="endDate" type="date" required value="${escapeHtml(item.end_date || "")}" /></label><label>Função<input name="positionTitle" maxlength="160" value="${escapeHtml(item.position_title || "")}" /></label><label>Jornada semanal<input name="weeklyHours" type="number" min="0" max="168" step="0.5" value="${escapeHtml(item.weekly_hours || "")}" /></label><label>Salário<input name="salary" type="number" min="0" step="0.01" value="${escapeHtml(item.salary || "")}" /></label><label>Status<select name="status">${selectOptions(contractStatusLabels, item.status || "scheduled")}</select></label></div><label>Observações<textarea name="notes" rows="4">${escapeHtml(item.notes || "")}</textarea></label><button class="btn btn-primary" type="submit">${recordId ? "Salvar contrato" : "Cadastrar contrato"}</button></form>`;
    }
    if (type === "leave") {
      const item = await selectRecord("leave_records");
      const { data: contracts, error: contractError } = await supabase.from("contracts").select("id,apprentice_id,company_id,position_title,start_date,end_date").order("end_date", { ascending: false });
      if (contractError) throw contractError;
      const companyMap = new Map(references.companies.map((company) => [company.id, company.name]));
      body = `<form id="leave-form" class="dialog-form wide-form"><input type="hidden" name="id" value="${escapeHtml(item.id || "")}" /><div class="form-grid two-columns"><label>Jovem<select name="apprenticeId" required><option value="">Selecione</option>${references.apprentices.map((person) => `<option value="${person.id}" ${item.apprentice_id === person.id ? "selected" : ""}>${escapeHtml(person.full_name)}</option>`).join("")}</select></label><label>Empresa<select name="companyId"><option value="">Sem empresa vinculada</option>${references.companies.map((company) => `<option value="${company.id}" ${item.company_id === company.id ? "selected" : ""}>${escapeHtml(company.name)}</option>`).join("")}</select></label><label>Contrato relacionado<select name="contractId"><option value="">Sem contrato vinculado</option>${(contracts || []).map((contract) => `<option value="${contract.id}" ${item.contract_id === contract.id ? "selected" : ""}>${escapeHtml(references.profiles.find((person) => person.id === contract.apprentice_id)?.full_name || "Jovem")} · ${escapeHtml(companyMap.get(contract.company_id) || "Empresa")} · ${formatDate(contract.start_date)} a ${formatDate(contract.end_date)}</option>`).join("")}</select></label><label>Tipo<select name="leaveType">${selectOptions(leaveTypeLabels, item.leave_type || "vacation")}</select></label><label>Status<select name="status">${selectOptions(leaveStatusLabels, item.status || "planned")}</select></label><label>Início<input name="startDate" type="date" required value="${escapeHtml(item.start_date || "")}" /></label><label>Término previsto<input name="endDate" type="date" required value="${escapeHtml(item.end_date || "")}" /></label><label>Retorno efetivo<input name="actualReturnDate" type="date" value="${escapeHtml(item.actual_return_date || "")}" /></label></div><label>Observações<textarea name="notes" rows="4" maxlength="12000">${escapeHtml(item.notes || "")}</textarea></label><button class="btn btn-primary" type="submit">Salvar registro</button></form>`;
    }
    if (type === "termination") {
      const item = await selectRecord("termination_cases");
      const checklist = recordId ? await supabase.from("termination_checklist_items").select("*").eq("termination_id", recordId).order("position") : { data: [], error: null };
      if (checklist.error) throw checklist.error;
      body = `<form id="termination-form" class="dialog-form wide-form"><input type="hidden" name="id" value="${escapeHtml(item.id || "")}" /><div class="form-grid two-columns"><label>Jovem<select name="apprenticeId" required><option value="">Selecione</option>${references.apprentices.map((person) => `<option value="${person.id}" ${item.apprentice_id === person.id ? "selected" : ""}>${escapeHtml(person.full_name)}</option>`).join("")}</select></label><label>Empresa<select name="companyId" required><option value="">Selecione</option>${references.companies.map((company) => `<option value="${company.id}" ${item.company_id === company.id ? "selected" : ""}>${escapeHtml(company.name)}</option>`).join("")}</select></label><label>Data de desligamento<input name="effectiveDate" type="date" value="${escapeHtml(item.effective_date || "")}" /></label><label>Etapa<select name="status">${selectOptions(terminationStatusLabels, item.status || "request")}</select></label><label>Valor da rescisão<input name="terminationAmount" type="number" min="0" step="0.01" value="${escapeHtml(item.termination_amount || "")}" /></label><label>Data do pagamento<input name="paymentDate" type="date" value="${escapeHtml(item.payment_date || "")}" /></label></div>${recordId ? workflowProgress(terminationStatusLabels, item.status) : ""}<label>Motivo<textarea name="reason" rows="3" maxlength="2000">${escapeHtml(item.reason || "")}</textarea></label><label>Observações<textarea name="notes" rows="4" maxlength="12000">${escapeHtml(item.notes || "")}</textarea></label>${recordId ? `<div class="form-section"><span>Checklist do desligamento</span></div><div class="checklist-editor">${(checklist.data || []).map((check) => `<label><input type="checkbox" name="termination-check-${check.id}" ${check.is_completed ? "checked" : ""} /> <span>${escapeHtml(check.title)}</span></label>`).join("") || "Nenhum item criado"}</div><label>Adicionar itens ao checklist<textarea name="newTerminationChecklistItems" rows="3" maxlength="2000" placeholder="Digite um item por linha"></textarea></label>` : `<p class="form-note">Ao abrir o desligamento, o Portal cria o checklist padrão de exame, contabilidade, rescisão, entrega e arquivamento.</p>`}<button class="btn btn-primary" type="submit">Salvar desligamento</button></form>`;
    }
    if (type === "accounting") {
      const item = await selectRecord("accounting_dispatches");
      const { data: documents, error: documentsError } = await supabase.from("document_records").select("id,title").eq("is_archived", false).order("created_at", { ascending: false }).limit(250);
      if (documentsError) throw documentsError;
      const dispatchTypes = { admission: "Admissão", termination: "Desligamento", vacation: "Férias", leave: "Afastamento", payroll: "Folha", registration_change: "Alteração cadastral", other: "Outro" };
      body = `<form id="accounting-form" class="dialog-form wide-form"><input type="hidden" name="id" value="${escapeHtml(item.id || "")}" /><label>Assunto<input name="title" required maxlength="180" value="${escapeHtml(item.title || "")}" /></label><div class="form-grid two-columns"><label>Tipo<select name="dispatchType">${selectOptions(dispatchTypes, item.dispatch_type || "payroll")}</select></label><label>Etapa<select name="status">${selectOptions(accountingStatusLabels, item.status || "pending")}</select></label><label>Competência<input name="competence" type="month" value="${escapeHtml(item.competence ? String(item.competence).slice(0, 7) : "")}" /></label><label>Prazo<input name="dueAt" type="datetime-local" value="${formatDateTimeInput(item.due_at)}" /></label><label>Jovem<select name="apprenticeId"><option value="">Sem jovem vinculado</option>${references.apprentices.map((person) => `<option value="${person.id}" ${item.apprentice_id === person.id ? "selected" : ""}>${escapeHtml(person.full_name)}</option>`).join("")}</select></label><label>Empresa<select name="companyId"><option value="">Sem empresa vinculada</option>${references.companies.map((company) => `<option value="${company.id}" ${item.company_id === company.id ? "selected" : ""}>${escapeHtml(company.name)}</option>`).join("")}</select></label><label>Responsável<select name="responsibleId"><option value="">Sem responsável</option>${references.administrators.map((person) => `<option value="${person.id}" ${item.responsible_id === person.id ? "selected" : ""}>${escapeHtml(person.full_name)}</option>`).join("")}</select></label><label>Referência externa<input name="externalReference" maxlength="180" value="${escapeHtml(item.external_reference || "")}" placeholder="Protocolo ou identificação" /></label><label>Documento relacionado<select name="documentId"><option value="">Sem documento vinculado</option>${(documents || []).map((document) => `<option value="${document.id}" ${item.document_id === document.id ? "selected" : ""}>${escapeHtml(document.title)}</option>`).join("")}</select></label></div><label>Descrição<textarea name="description" rows="5" maxlength="12000">${escapeHtml(item.description || "")}</textarea></label><button class="btn btn-primary" type="submit">Salvar envio</button></form>`;
    }
    if (type === "document") {
      const { data: requirements, error: requirementError } = await supabase.from("document_requirements").select("id,title,apprentice_id,company_id").eq("status", "pending").order("due_date", { ascending: true, nullsFirst: false });
      if (requirementError) throw requirementError;
      body = `<form id="document-form" class="dialog-form wide-form"><label>Arquivo<input name="file" type="file" accept="application/pdf,image/jpeg,image/png,application/vnd.openxmlformats-officedocument.wordprocessingml.document" required /></label><label>Título<input name="title" required maxlength="180" /></label><div class="form-grid two-columns"><label>Jovem<select name="apprenticeId"><option value="">Sem jovem vinculado</option>${apprenticeOptions}</select></label><label>Empresa<select name="companyId"><option value="">Sem empresa vinculada</option>${companyOptions}</select></label><label>Categoria<select name="category">${selectOptions(documentCategoryLabels, "documents")}</select></label><label>Validade<input name="expiresOn" type="date" /></label><label>Pendência atendida<select name="requirementId"><option value="">Nenhuma</option>${(requirements || []).map((item) => `<option value="${item.id}">${escapeHtml(item.title)}</option>`).join("")}</select></label></div><label>Observações<textarea name="notes" rows="3" maxlength="4000"></textarea></label><p class="form-note">Os documentos ficam em área privada; somente a equipe CAFCM autorizada consegue acessar.</p><button class="btn btn-primary" type="submit">Enviar documento</button></form>`;
    }
    if (type === "document-edit") {
      const item = await selectRecord("document_records");
      body = `<form id="document-edit-form" class="dialog-form"><input type="hidden" name="id" value="${item.id}" /><label>Título<input name="title" required maxlength="180" value="${escapeHtml(item.title)}" /></label><div class="form-grid two-columns"><label>Categoria<select name="category">${selectOptions(documentCategoryLabels, item.category)}</select></label><label>Validade<input name="expiresOn" type="date" value="${escapeHtml(item.expires_on || "")}" /></label></div><label>Observações<textarea name="notes" rows="4" maxlength="4000">${escapeHtml(item.notes || "")}</textarea></label><button class="btn btn-primary" type="submit">Salvar documento</button></form>`;
    }
    if (type === "document-requirement") {
      const item = await selectRecord("document_requirements");
      const { data: documents, error: documentsError } = await supabase.from("document_records").select("id,title,apprentice_id,company_id").eq("is_archived", false).order("created_at", { ascending: false }).limit(250);
      if (documentsError) throw documentsError;
      body = `<form id="document-requirement-form" class="dialog-form wide-form"><input type="hidden" name="id" value="${escapeHtml(item.id || "")}" /><label>Documento necessário<input name="title" required maxlength="180" value="${escapeHtml(item.title || "")}" /></label><div class="form-grid two-columns"><label>Jovem<select name="apprenticeId"><option value="">Sem jovem vinculado</option>${references.apprentices.map((person) => `<option value="${person.id}" ${item.apprentice_id === person.id ? "selected" : ""}>${escapeHtml(person.full_name)}</option>`).join("")}</select></label><label>Empresa<select name="companyId"><option value="">Sem empresa vinculada</option>${references.companies.map((company) => `<option value="${company.id}" ${item.company_id === company.id ? "selected" : ""}>${escapeHtml(company.name)}</option>`).join("")}</select></label><label>Categoria<select name="category">${selectOptions(documentCategoryLabels, item.category || "documents")}</select></label><label>Situação<select name="status">${selectOptions(documentRequirementStatusLabels, item.status || "pending")}</select></label><label>Prazo<input name="dueDate" type="date" value="${escapeHtml(item.due_date || "")}" /></label><label>Responsável<select name="responsibleId"><option value="">Sem responsável</option>${references.administrators.map((person) => `<option value="${person.id}" ${item.responsible_id === person.id ? "selected" : ""}>${escapeHtml(person.full_name)}</option>`).join("")}</select></label><label>Arquivo recebido<select name="documentId"><option value="">Sem arquivo vinculado</option>${(documents || []).map((document) => `<option value="${document.id}" ${item.document_id === document.id ? "selected" : ""}>${escapeHtml(document.title)}</option>`).join("")}</select></label></div><label>Observações<textarea name="notes" rows="4" maxlength="4000">${escapeHtml(item.notes || "")}</textarea></label><button class="btn btn-primary" type="submit">${recordId ? "Salvar pendência" : "Criar pendência"}</button></form>`;
    }
    if (type === "financial-charge") {
      const item = await selectRecord("financial_charges");
      const [{ data: contracts, error: contractsError }, { data: documents, error: documentsError }] = await Promise.all([
        supabase.from("contracts").select("id,company_id,apprentice_id,start_date,end_date,position_title").order("end_date", { ascending: false }),
        supabase.from("document_records").select("id,title,category").eq("is_archived", false).in("category", ["invoice", "payment_slip", "receipt", "finance"]).order("created_at", { ascending: false }).limit(250),
      ]);
      if (contractsError || documentsError) throw contractsError || documentsError;
      const profileMap = new Map(references.profiles.map((person) => [person.id, person.full_name]));
      const companyMap = new Map(references.companies.map((company) => [company.id, company.name]));
      const documentOptions = (selected, category) => `<option value="">Sem arquivo vinculado</option>${(documents || []).filter((document) => document.category === category || document.category === "finance").map((document) => `<option value="${document.id}" ${selected === document.id ? "selected" : ""}>${escapeHtml(document.title)}</option>`).join("")}`;
      body = `<form id="financial-charge-form" class="dialog-form wide-form"><input type="hidden" name="id" value="${escapeHtml(item.id || "")}" /><div class="form-grid two-columns"><label>Empresa<select name="companyId" required><option value="">Selecione</option>${references.companies.map((company) => `<option value="${company.id}" ${item.company_id === company.id ? "selected" : ""}>${escapeHtml(company.name)}</option>`).join("")}</select></label><label>Competência<input name="competence" type="month" required value="${escapeHtml(item.competence ? String(item.competence).slice(0, 7) : "")}" /></label><label>Descrição<input name="description" required maxlength="240" value="${escapeHtml(item.description || "")}" placeholder="Ex.: Mensalidade de aprendizagem" /></label><label>Valor<input name="amount" type="number" min="0" step="0.01" required value="${escapeHtml(item.amount ?? "")}" /></label><label>Vencimento<input name="dueDate" type="date" value="${escapeHtml(item.due_date || "")}" /></label><label>Etapa<select name="status">${selectOptions(financialStatusLabels, item.status || "to_invoice")}</select></label><label>Contrato relacionado<select name="contractId"><option value="">Sem contrato vinculado</option>${(contracts || []).map((contract) => `<option value="${contract.id}" ${item.contract_id === contract.id ? "selected" : ""}>${escapeHtml(companyMap.get(contract.company_id) || "Empresa")} · ${escapeHtml(profileMap.get(contract.apprentice_id) || "Jovem")} · ${formatDate(contract.start_date)} a ${formatDate(contract.end_date)}</option>`).join("")}</select></label><label>Responsável<select name="responsibleId"><option value="">Sem responsável</option>${references.administrators.map((person) => `<option value="${person.id}" ${item.responsible_id === person.id ? "selected" : ""}>${escapeHtml(person.full_name)}</option>`).join("")}</select></label></div><div class="form-section"><span>Nota fiscal e boleto</span></div><div class="form-grid two-columns"><label>Número da NF<input name="invoiceNumber" maxlength="120" value="${escapeHtml(item.invoice_number || "")}" /></label><label>Data de emissão da NF<input name="invoiceIssuedAt" type="datetime-local" value="${formatDateTimeInput(item.invoice_issued_at)}" /></label><label>Número do boleto<input name="paymentSlipNumber" maxlength="160" value="${escapeHtml(item.payment_slip_number || "")}" /></label><label>Data de emissão do boleto<input name="paymentSlipIssuedAt" type="datetime-local" value="${formatDateTimeInput(item.payment_slip_issued_at)}" /></label><label>Linha digitável<input name="paymentSlipLine" maxlength="240" value="${escapeHtml(item.payment_slip_line || "")}" /></label><label>Link do boleto<input name="paymentSlipUrl" type="url" maxlength="2048" value="${escapeHtml(item.payment_slip_url || "")}" /></label><label>Arquivo da NF<select name="invoiceDocumentId">${documentOptions(item.invoice_document_id, "invoice")}</select></label><label>Arquivo do boleto<select name="paymentSlipDocumentId">${documentOptions(item.payment_slip_document_id, "payment_slip")}</select></label></div><div class="form-section"><span>Recebimento</span></div><div class="form-grid two-columns"><label>Data do pagamento<input name="paidAt" type="datetime-local" value="${formatDateTimeInput(item.paid_at)}" /></label><label>Valor recebido<input name="paidAmount" type="number" min="0" step="0.01" value="${escapeHtml(item.paid_amount ?? "")}" /></label><label>Comprovante<select name="receiptDocumentId">${documentOptions(item.receipt_document_id, "receipt")}</select></label></div><label>Observações<textarea name="notes" rows="4" maxlength="12000">${escapeHtml(item.notes || "")}</textarea></label><p class="form-note">Nesta etapa, NF, boleto, envio, vencimento e pagamento são atualizados manualmente pelo Financeiro.</p><button class="btn btn-primary" type="submit">${recordId ? "Salvar cobrança" : "Criar cobrança"}</button></form>`;
    }
  }

  if (type === "email-draft") {
    let delivery = {};
    if (recordId) {
      const { data, error } = await supabase.from("email_deliveries").select("*").eq("id", recordId).single();
      if (error) throw error;
      delivery = data;
    }
    const [{ data: templates, error: templateError }, { data: documents, error: documentError }] = await Promise.all([
      supabase.from("email_templates").select("*").eq("is_active", true).order("name"),
      supabase.from("document_records").select("id,title").eq("is_archived", false).order("created_at", { ascending: false }).limit(150),
    ]);
    if (templateError || documentError) throw templateError || documentError;
    const selected = (templates || []).find((item) => item.id === delivery.template_id) || templates?.[0] || {};
    body = `<form id="email-draft-form" class="dialog-form wide-form"><input type="hidden" name="deliveryId" value="${escapeHtml(delivery.id || "")}" /><label>Modelo<select name="templateId" required data-email-template><option value="">Selecione</option>${(templates || []).map((item) => `<option value="${item.id}" data-subject="${escapeHtml(item.subject)}" data-body="${escapeHtml(item.body)}" ${item.id === selected.id ? "selected" : ""}>${escapeHtml(item.name)}</option>`).join("")}</select></label><div class="form-grid two-columns"><label>Destinatário<input name="recipientEmail" type="email" required maxlength="320" placeholder="financeiro@empresa.com.br" value="${escapeHtml(delivery.recipient_email || "")}" /></label><label>Anexo opcional<select name="attachmentDocumentId"><option value="">Sem anexo</option>${(documents || []).map((item) => `<option value="${item.id}" ${item.id === delivery.attachment_document_id ? "selected" : ""}>${escapeHtml(item.title)}</option>`).join("")}</select></label></div><label>Assunto<input name="subject" required minlength="2" maxlength="240" value="${escapeHtml(delivery.subject || selected.subject || "")}" /></label><label>Conteúdo<textarea name="body" rows="12" required maxlength="100000">${escapeHtml(delivery.body || selected.body || "")}</textarea><small>Substitua os campos entre chaves pelas informações reais antes de salvar.</small></label><p class="form-note">O rascunho não será enviado automaticamente. Depois de salvar, use “Conferir e enviar”.</p><button class="btn btn-primary" type="submit">${recordId ? "Salvar conferência" : "Salvar rascunho"}</button></form>`;
  }

  if (type === "document-generation") {
    const [{ data: templates, error: templateError }, references] = await Promise.all([
      supabase.from("document_templates").select("id,name,category").eq("is_active", true).order("name"),
      loadOperationalReferences(),
    ]);
    if (templateError) throw templateError;
    body = `<form id="document-generation-form" class="dialog-form wide-form"><label>Modelo do documento<select name="templateId" required><option value="">Selecione</option>${(templates || []).map((item) => `<option value="${item.id}">${escapeHtml(item.name)}</option>`).join("")}</select></label><div class="form-grid two-columns"><label>Jovem<select name="apprenticeId"><option value="">Sem jovem vinculado</option>${references.apprentices.map((item) => `<option value="${item.id}">${escapeHtml(item.full_name)}</option>`).join("")}</select></label><label>Empresa<select name="companyId"><option value="">Usar a empresa do jovem</option>${references.companies.map((item) => `<option value="${item.id}">${escapeHtml(item.name)}</option>`).join("")}</select></label><label>Período<input name="periodo" maxlength="300" placeholder="Ex.: 10/02/2026 a 10/02/2027" /></label><label>Prazo<input name="prazo" maxlength="120" placeholder="Ex.: 15/09/2026" /></label><label>Competência<input name="competencia" maxlength="120" placeholder="Ex.: setembro de 2026" /></label><label>Valor informado<input name="valor" maxlength="120" placeholder="Ex.: R$ 1.250,00" /></label></div><label>Documentos solicitados<textarea name="documentos" rows="3" maxlength="2000" placeholder="Liste os documentos quando o modelo exigir"></textarea></label><label>Descrição<textarea name="descricao" rows="3" maxlength="1000"></textarea></label><label>Observações do documento<textarea name="observacoes" rows="4" maxlength="4000"></textarea></label><label>Notas internas da revisão<textarea name="notes" rows="3" maxlength="12000"></textarea></label><p class="form-note">O PDF receberá protocolo, versão e situação “Aguardando revisão”. Dados não preenchidos serão identificados como não informados.</p><button class="btn btn-primary" type="submit">Gerar PDF para revisão</button></form>`;
  }

  if (type === "banking-integration") {
    let item = {};
    if (recordId) {
      const { data, error } = await supabase.from("banking_integrations").select("*").eq("id", recordId).single();
      if (error) throw error;
      item = data;
    }
    const statusLabels = { awaiting_documents: "Aguardando documentação", configuring: "Em configuração", homologation: "Em homologação", active: "Ativa", inactive: "Inativa" };
    body = `<form id="banking-integration-form" class="dialog-form wide-form"><input type="hidden" name="id" value="${escapeHtml(item.id || "")}" /><div class="form-grid two-columns"><label>Banco<input value="Bradesco · 237" disabled /></label><label>Modelo de integração<select name="integrationMode"><option value="cnab240" ${item.integration_mode === "cnab240" ? "selected" : ""}>CNAB 240</option><option value="cnab400" ${item.integration_mode === "cnab400" ? "selected" : ""}>CNAB 400</option><option value="api" ${item.integration_mode === "api" ? "selected" : ""}>API bancária</option></select></label><label>Situação<select name="status">${selectOptions(statusLabels, item.status || "awaiting_documents")}</select></label><label>Número do convênio<input name="agreementNumber" maxlength="80" value="${escapeHtml(item.agreement_number || "")}" /></label><label>Carteira<input name="walletCode" maxlength="40" value="${escapeHtml(item.wallet_code || "")}" /></label><label>Versão do leiaute<input name="layoutVersion" maxlength="40" value="${escapeHtml(item.layout_version || "")}" /></label><label>Agência<input name="agency" maxlength="20" value="${escapeHtml(item.agency || "")}" /></label><label>Referência da conta<input name="accountReference" maxlength="40" value="${escapeHtml(item.account_reference || "")}" /></label></div><label>Informações recebidas do banco<textarea name="notes" rows="7" maxlength="12000">${escapeHtml(item.notes || "")}</textarea></label><p class="form-note">Não informe senha, token, chave privada ou segredo neste formulário. A situação “Ativa” deve ser usada somente após homologação confirmada pelo Bradesco.</p><button class="btn btn-primary" type="submit">${recordId ? "Salvar configuração" : "Criar preparação"}</button></form>`;
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
    "pipeline-item": recordId ? "Alterar processo" : "Novo processo",
    task: recordId ? "Alterar tarefa" : "Nova tarefa",
    admission: recordId ? "Alterar admissão" : "Nova admissão",
    contract: recordId ? "Alterar contrato" : "Novo contrato",
    leave: recordId ? "Alterar período" : "Férias ou afastamento",
    termination: recordId ? "Alterar desligamento" : "Abrir desligamento",
    accounting: recordId ? "Alterar envio" : "Novo envio à contabilidade",
    document: "Enviar documento",
    "document-edit": "Alterar documento",
    "document-requirement": recordId ? "Alterar pendência documental" : "Nova pendência documental",
    "financial-charge": recordId ? "Alterar cobrança" : "Nova cobrança",
    "email-draft": recordId ? "Conferir e-mail" : "Preparar e-mail",
    "document-generation": "Gerar documento",
    "banking-integration": recordId ? "Alterar preparação Bradesco" : "Preparar integração Bradesco",
    candidate: recordId ? "Candidato e histórico" : "Cadastrar candidato",
    vacancy: recordId ? "Alterar vaga" : "Abrir vaga",
    application: recordId ? "Atualizar processo seletivo" : "Iniciar processo seletivo",
    "candidate-conversion": "Iniciar admissão do aprovado",
    partnership: recordId ? "Alterar parceria" : "Registrar parceria",
    course: recordId ? "Alterar curso" : "Criar curso",
    invite: "Criar pessoa e enviar convite",
    lesson: recordId ? "Alterar aula" : "Adicionar aula",
    block: recordId ? "Alterar linha de aprendizagem" : "Nova linha de aprendizagem",
    activity: recordId ? "Alterar atividade" : "Adicionar atividade",
    enrollment: "Nova matrícula",
    response: "Responder atividade",
  };
  const wideDialog = ["company", "candidate", "vacancy", "application", "admission", "leave", "termination", "accounting", "document", "document-requirement", "financial-charge", "email-draft", "document-generation", "banking-integration", "block", "person-history", "people-import", "pipeline-item", "task"].includes(type);
  root.innerHTML = `<div class="dialog-backdrop"><section class="dialog ${wideDialog ? "dialog-wide" : ""}" role="dialog" aria-modal="true"><div class="dialog-head"><div><span class="eyebrow">Portal CAFCM</span><h2>${titles[type]}</h2></div><button class="dialog-close" data-close-dialog aria-label="Fechar">${icon("close")}</button></div>${body}</section></div>`;
}

function renderInviteCredentials(email, password, mode = "invite") {
  const root = document.querySelector("#overlay-root");
  if (!root) return;
  if (mode === "invite") {
    root.innerHTML = `<div class="dialog-backdrop"><section class="dialog invite-success" role="dialog" aria-modal="true" aria-labelledby="invite-success-title">
      <div class="dialog-head"><div><span class="eyebrow">Acesso criado</span><h2 id="invite-success-title">Convite enviado por e-mail</h2></div><button class="dialog-close" data-close-dialog aria-label="Fechar">${icon("close")}</button></div>
      <div class="success-symbol">${icon("mail")}</div>
      <p>O convite de <strong>${escapeHtml(email)}</strong> foi enviado. A pessoa deve abrir o link recebido, confirmar o e-mail e criar a própria senha no primeiro acesso.</p>
      <div class="dialog-instructions">Se o convite expirar ou já tiver sido usado sem concluir o acesso, use a opção “Reenviar confirmação” na tela de entrada.</div>
      <button class="btn btn-primary btn-block" data-close-dialog>Concluir</button>
    </section></div>`;
    return;
  }
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

function normalizeImportedDepartment(value) {
  const department = String(value || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
  const aliases = {
    management: "management", direcao: "management", administracao: "management", "direcao e administracao": "management",
    vacancies: "vacancies", vagas: "vacancies", "gestao de vagas": "vacancies",
    coordination: "coordination", coordenacao: "coordination",
    personnel: "personnel", "departamento pessoal": "personnel", dp: "personnel",
    hr: "hr", rh: "hr", "recursos humanos": "hr",
    finance: "finance", financeiro: "finance",
  };
  return aliases[department] || department || null;
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
      department: person.department || null,
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
  if (!canAccessView(view, state.profile)) {
    showToast("Seu departamento não possui acesso a esta área.", "error");
    return;
  }
  state.view = view;
  if (!["course-editor", "lesson-editor", "student-course"].includes(view)) state.selectedCourseId = null;
  if (!["lesson-editor", "student-course"].includes(view)) state.selectedLessonId = null;
  if (view !== "audit") state.auditPersonId = null;
  await renderPortal();
}

async function movePipelineItem(itemId, stageId) {
  const [{ data: item, error: itemError }, { data: stage, error: stageError }] = await Promise.all([
    supabase.from("pipeline_items").select("id,pipeline_id,stage_id,title").eq("id", itemId).single(),
    supabase.from("pipeline_stages").select("id,pipeline_id,name").eq("id", stageId).single(),
  ]);
  if (itemError || stageError) throw itemError || stageError;
  if (item.pipeline_id !== stage.pipeline_id) throw new Error("A etapa selecionada não pertence à esteira deste processo.");
  if (item.stage_id === stage.id) return false;
  const { data: lastItems, error: positionError } = await supabase
    .from("pipeline_items")
    .select("position")
    .eq("pipeline_id", item.pipeline_id)
    .eq("stage_id", stage.id)
    .eq("is_archived", false)
    .order("position", { ascending: false })
    .limit(1);
  if (positionError) throw positionError;
  const position = (lastItems?.[0]?.position || 0) + 1000;
  const { error } = await supabase.from("pipeline_items").update({ stage_id: stage.id, position }).eq("id", item.id);
  if (error) throw error;
  showToast(`Processo movido para ${stage.name}.`);
  await renderView();
  return true;
}

app.addEventListener("click", async (event) => {
  const target = event.target.closest("button, [data-nav]");
  if (!target) return;

  if (target.dataset.authMode) return renderLogin(target.dataset.authMode);
  if (target.hasAttribute("data-open-menu")) return document.querySelector(".portal-shell")?.classList.add("menu-open");
  if (target.hasAttribute("data-close-menu")) return document.querySelector(".portal-shell")?.classList.remove("menu-open");
  if (target.dataset.vacancyTab) {
    state.vacancyTab = target.dataset.vacancyTab;
    state.vacancyStatus = "";
    return renderView();
  }
  if (target.dataset.documentTab) {
    state.documentTab = target.dataset.documentTab;
    return renderView();
  }
  if (target.dataset.notificationFilter) {
    state.notificationFilter = target.dataset.notificationFilter;
    return renderView();
  }
  if (target.dataset.automationTab) {
    state.automationTab = target.dataset.automationTab;
    return renderView();
  }
  if (target.hasAttribute("data-export-indicators")) {
    try {
      const { data, error } = await supabase.rpc("get_portal_indicators", { period_start_value: state.indicatorStart, period_end_value: state.indicatorEnd });
      if (error) throw error;
      downloadTextFile(`indicadores-cafcm-${state.indicatorStart}-${state.indicatorEnd}.csv`, csvForIndicators(data), "text/csv;charset=utf-8");
      await callAdmin({ action: "log_event", event: "reports.exported", entityId: `${state.indicatorStart}:${state.indicatorEnd}` }, true).catch(() => {});
      return showToast("Relatório exportado em CSV e registrado na auditoria.");
    } catch (error) { return showToast(friendlyError(error), "error"); }
  }
  if (target.dataset.workLogAction) {
    const { data: log, error: logError } = await supabase.from("work_activity_logs").select("*").eq("id", target.dataset.workLogId).single();
    if (logError) return showToast(friendlyError(logError), "error");
    const now = new Date().toISOString();
    const elapsed = log.status === "running" && log.active_started_at ? Math.max(0, Math.floor((Date.now() - new Date(log.active_started_at).getTime()) / 1000)) : 0;
    const complete = target.dataset.workLogAction === "complete";
    const { error } = await supabase.from("work_activity_logs").update({
      status: complete ? "completed" : "paused",
      active_started_at: null,
      ended_at: complete ? now : null,
      accumulated_seconds: Number(log.accumulated_seconds || 0) + elapsed,
    }).eq("id", log.id);
    if (error) return showToast(friendlyError(error), "error");
    showToast(complete ? "Registro concluído." : "Cronômetro pausado.");
    return renderView();
  }
  if (target.dataset.deleteIndicatorTarget) {
    if (!window.confirm("Excluir esta meta? Nenhum dado real será removido.")) return;
    const { error } = await supabase.from("indicator_targets").delete().eq("id", target.dataset.deleteIndicatorTarget);
    if (error) return showToast(friendlyError(error), "error");
    showToast("Meta removida.");
    return renderView();
  }
  if (target.dataset.openProcedurePipeline) {
    state.selectedPipelineId = target.dataset.openProcedurePipeline;
    return navigate("pipelines");
  }
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
  if (target.dataset.taskFilter) {
    state.taskFilter = target.dataset.taskFilter;
    return renderView();
  }
  if (target.hasAttribute("data-clear-pipeline-filters")) {
    state.pipelineSearch = "";
    state.pipelinePriority = "";
    state.pipelineResponsible = "";
    state.pipelineCompany = "";
    state.pipelineSort = "recent";
    return renderView();
  }
  if (target.hasAttribute("data-clear-vacancy-filters")) {
    state.vacancySearch = "";
    state.vacancyStatus = "";
    state.vacancyCompany = "";
    return renderView();
  }
  if (target.hasAttribute("data-clear-finance-filters")) {
    state.financeSearch = "";
    state.financeStatus = "";
    state.financeCompany = "";
    return renderView();
  }
  if (target.hasAttribute("data-clear-document-filters")) {
    state.documentSearch = "";
    state.documentCategory = "";
    return renderView();
  }
  if (target.dataset.editPipelineItem) return openDialog("pipeline-item", target.dataset.editPipelineItem);
  if (target.dataset.editAdmission) return openDialog("admission", target.dataset.editAdmission);
  if (target.dataset.editContract) return openDialog("contract", target.dataset.editContract);
  if (target.dataset.editLeave) return openDialog("leave", target.dataset.editLeave);
  if (target.dataset.editTermination) return openDialog("termination", target.dataset.editTermination);
  if (target.dataset.editAccounting) return openDialog("accounting", target.dataset.editAccounting);
  if (target.dataset.editFinancialCharge) return openDialog("financial-charge", target.dataset.editFinancialCharge);
  if (target.dataset.editDocument) return openDialog("document-edit", target.dataset.editDocument);
  if (target.dataset.editDocumentRequirement) return openDialog("document-requirement", target.dataset.editDocumentRequirement);
  if (target.dataset.editBankingIntegration) return openDialog("banking-integration", target.dataset.editBankingIntegration);
  if (target.dataset.editEmailDraft) return openDialog("email-draft", target.dataset.editEmailDraft);
  if (target.hasAttribute("data-run-automations")) {
    target.disabled = true;
    try {
      const { data, error } = await supabase.rpc("run_portal_automations");
      if (error) throw error;
      if (!data?.ok) throw new Error(data?.error || "A atualização não foi concluída.");
      showToast(`Atualização concluída: ${data.alerts_active} alerta(s) ativo(s).`);
      return renderView();
    } catch (error) {
      showToast(friendlyError(error), "error");
    } finally {
      if (target.isConnected) target.disabled = false;
    }
    return;
  }
  if (target.dataset.sendEmail) {
    if (!window.confirm("Você conferiu o destinatário, o assunto, o conteúdo e o anexo deste e-mail?")) return;
    target.disabled = true;
    try {
      await callAutomation({ action: "send_email", deliveryId: target.dataset.sendEmail });
      showToast("E-mail enviado e registrado.");
      return renderView();
    } catch (error) {
      showToast(friendlyError(error), "error");
    } finally {
      if (target.isConnected) target.disabled = false;
    }
    return;
  }
  if (target.dataset.reviewGeneration) {
    const status = target.dataset.reviewStatus;
    const question = status === "approved" ? "Aprovar este documento após a conferência?" : "Rejeitar esta versão do documento?";
    if (!window.confirm(question)) return;
    const { error } = await supabase.from("document_generations").update({ status, reviewed_by: state.profile.id, reviewed_at: new Date().toISOString() }).eq("id", target.dataset.reviewGeneration).eq("status", "draft");
    if (error) return showToast(friendlyError(error), "error");
    showToast(status === "approved" ? "Documento aprovado." : "Versão rejeitada e preservada no histórico.");
    return renderView();
  }
  if (target.dataset.archiveDocument) {
    const archived = target.dataset.documentArchived === "true";
    if (!archived && !window.confirm("Arquivar este documento? O arquivo e o histórico serão preservados.")) return;
    const { error } = await supabase.from("document_records").update({ is_archived: !archived, archived_at: archived ? null : new Date().toISOString() }).eq("id", target.dataset.archiveDocument);
    if (error) return showToast(friendlyError(error), "error");
    showToast(archived ? "Documento restaurado." : "Documento arquivado com o histórico preservado.");
    return renderView();
  }
  if (target.dataset.downloadDocument) {
    const { data, error } = await supabase.from("document_records").select("storage_path").eq("id", target.dataset.downloadDocument).single();
    if (error) return showToast(friendlyError(error), "error");
    const { data: signed, error: signedError } = await supabase.storage.from("cafcm-documents").createSignedUrl(data.storage_path, 60);
    if (signedError) return showToast(friendlyError(signedError), "error");
    window.open(signed.signedUrl, "_blank", "noopener,noreferrer");
    return;
  }
  if (target.dataset.archivePipelineItem) {
    if (!window.confirm(`Arquivar o processo “${target.dataset.processTitle}”? O histórico de movimentações e auditoria será preservado.`)) return;
    const { error } = await supabase.from("pipeline_items").update({ is_archived: true, archived_at: new Date().toISOString() }).eq("id", target.dataset.archivePipelineItem);
    if (error) return showToast(friendlyError(error), "error");
    closeOverlay();
    showToast("Processo arquivado com o histórico preservado.");
    return renderView();
  }
  if (target.dataset.editTask) return openDialog("task", target.dataset.editTask);
  if (target.dataset.taskStatus) {
    const { error } = await supabase.from("tasks").update({ status: target.dataset.nextStatus }).eq("id", target.dataset.taskStatus);
    if (error) return showToast(friendlyError(error), "error");
    showToast(target.dataset.nextStatus === "completed" ? "Tarefa concluída." : "Tarefa reaberta.");
    return renderView();
  }
  if (target.dataset.toggleChecklist) {
    const complete = target.dataset.checklistComplete !== "true";
    const { error } = await supabase.from("task_checklist_items").update({ is_completed: complete }).eq("id", target.dataset.toggleChecklist);
    if (error) return showToast(friendlyError(error), "error");
    return renderView();
  }
  if (target.dataset.readNotification) {
    const { error } = await supabase.from("notifications").update({ is_read: true, read_at: new Date().toISOString() }).eq("id", target.dataset.readNotification);
    if (error) return showToast(friendlyError(error), "error");
    showToast("Notificação marcada como lida.");
    return renderPortal();
  }
  if (target.dataset.dismissNotification) {
    const now = new Date().toISOString();
    const { error } = await supabase.from("notifications").update({ status: "dismissed", resolved_at: now, is_read: true, read_at: now }).eq("id", target.dataset.dismissNotification);
    if (error) return showToast(friendlyError(error), "error");
    showToast("Notificação dispensada. O alerta de origem continua no histórico.");
    return renderPortal();
  }
  if (target.hasAttribute("data-read-all-notifications")) {
    const { error } = await supabase.from("notifications").update({ is_read: true, read_at: new Date().toISOString() }).eq("recipient_id", state.profile.id).eq("status", "open").eq("is_read", false);
    if (error) return showToast(friendlyError(error), "error");
    showToast("Todas as notificações foram marcadas como lidas.");
    return renderPortal();
  }
  if (target.dataset.openNotification) {
    const { error } = await supabase.from("notifications").update({ is_read: true, read_at: new Date().toISOString() }).eq("id", target.dataset.openNotification);
    if (error) return showToast(friendlyError(error), "error");
    return navigate(target.dataset.notificationTarget || "notifications");
  }
  if (target.dataset.editCompany) return openDialog("company", target.dataset.editCompany);
  if (target.dataset.editCandidate) return openDialog("candidate", target.dataset.editCandidate);
  if (target.dataset.editVacancy) return openDialog("vacancy", target.dataset.editVacancy);
  if (target.dataset.editApplication) return openDialog("application", target.dataset.editApplication);
  if (target.dataset.editPartnership) return openDialog("partnership", target.dataset.editPartnership);
  if (target.dataset.convertCandidate) return openDialog("candidate-conversion", target.dataset.convertCandidate);
  if (target.dataset.downloadCandidateDocument) {
    const { data, error } = await supabase.from("candidate_documents").select("storage_path").eq("id", target.dataset.downloadCandidateDocument).single();
    if (error) return showToast(friendlyError(error), "error");
    const { data: signed, error: signedError } = await supabase.storage.from("cafcm-recruitment").createSignedUrl(data.storage_path, 60);
    if (signedError) return showToast(friendlyError(signedError), "error");
    window.open(signed.signedUrl, "_blank", "noopener,noreferrer");
    return;
  }
  if (target.dataset.archiveCandidate) {
    const archived = target.dataset.candidateArchived === "true";
    const { error } = await supabase.from("candidates").update({ status: archived ? "new" : "archived", archived_at: archived ? null : new Date().toISOString() }).eq("id", target.dataset.archiveCandidate);
    if (error) return showToast(friendlyError(error), "error");
    showToast(archived ? "Candidato reativado." : "Candidato arquivado com o histórico preservado.");
    return renderView();
  }
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
    return downloadTextFile("modelo-importacao-pessoas-cafcm.csv", "nome;email;perfil;empresa;departamento\n", "text/csv;charset=utf-8");
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
  if (event.target.matches("[data-email-template]")) {
    const option = event.target.selectedOptions?.[0];
    const form = event.target.closest("form");
    if (form && option) {
      form.elements.subject.value = option.dataset.subject || "";
      form.elements.body.value = option.dataset.body || "";
    }
    return;
  }

  if (event.target.matches("[data-pipeline-select]")) {
    state.selectedPipelineId = event.target.value;
    state.pipelineSearch = "";
    state.pipelinePriority = "";
    state.pipelineResponsible = "";
    state.pipelineCompany = "";
    state.pipelineSort = "recent";
    return renderView();
  }

  if (event.target.matches("[data-pipeline-filter]")) {
    const stateKeys = {
      priority: "pipelinePriority",
      responsible: "pipelineResponsible",
      company: "pipelineCompany",
      sort: "pipelineSort",
    };
    const stateKey = stateKeys[event.target.dataset.pipelineFilter];
    if (stateKey) state[stateKey] = event.target.value;
    return renderView();
  }

  if (event.target.matches("[data-vacancy-filter]")) {
    const stateKey = event.target.dataset.vacancyFilter === "status" ? "vacancyStatus" : "vacancyCompany";
    state[stateKey] = event.target.value;
    return renderView();
  }

  if (event.target.matches("[data-finance-filter]")) {
    const stateKey = event.target.dataset.financeFilter === "status" ? "financeStatus" : "financeCompany";
    state[stateKey] = event.target.value;
    return renderView();
  }

  if (event.target.matches("[data-document-category]")) {
    state.documentCategory = event.target.value;
    return renderView();
  }

  if (event.target.matches("[data-move-process]")) {
    const select = event.target;
    select.disabled = true;
    return movePipelineItem(select.dataset.moveProcess, select.value).catch((error) => {
      showToast(friendlyError(error), "error");
      return renderView();
    });
  }

  if (event.target.name === "role") {
    const companyField = document.querySelector(".company-field");
    const departmentField = document.querySelector(".department-field");
    const role = event.target.value;
    const required = role === "company";
    const hidden = role === "cafcm_admin";
    if (companyField) {
      companyField.hidden = hidden;
      companyField.classList.toggle("required-field", required);
      const select = companyField.querySelector("select");
      if (select) {
        select.required = required;
        select.disabled = hidden;
        if (hidden) select.value = "";
      }
    }
    if (departmentField) {
      const departmentSelect = departmentField.querySelector("select");
      departmentField.hidden = !hidden;
      if (departmentSelect) {
        departmentSelect.required = hidden;
        departmentSelect.disabled = !hidden;
        if (hidden && !departmentSelect.value) departmentSelect.value = "management";
      }
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

app.addEventListener("input", (event) => {
  if (event.target.matches("[data-pipeline-search]")) {
    state.pipelineSearch = event.target.value;
    window.clearTimeout(app.pipelineSearchTimer);
    app.pipelineSearchTimer = window.setTimeout(() => renderView(), 250);
    return;
  }
  if (event.target.matches("[data-vacancy-search]")) {
    state.vacancySearch = event.target.value;
    window.clearTimeout(app.vacancySearchTimer);
    app.vacancySearchTimer = window.setTimeout(() => renderView(), 250);
    return;
  }
  if (event.target.matches("[data-finance-search]")) {
    state.financeSearch = event.target.value;
    window.clearTimeout(app.financeSearchTimer);
    app.financeSearchTimer = window.setTimeout(() => renderView(), 250);
    return;
  }
  if (event.target.matches("[data-document-search]")) {
    state.documentSearch = event.target.value;
    window.clearTimeout(app.documentSearchTimer);
    app.documentSearchTimer = window.setTimeout(() => renderView(), 250);
  }
});

app.addEventListener("dragstart", (event) => {
  const card = event.target.closest("[data-pipeline-item]");
  if (!card) return;
  state.draggedPipelineItemId = card.dataset.pipelineItem;
  card.classList.add("dragging");
  event.dataTransfer.effectAllowed = "move";
  event.dataTransfer.setData("text/plain", state.draggedPipelineItemId);
});

app.addEventListener("dragend", (event) => {
  event.target.closest("[data-pipeline-item]")?.classList.remove("dragging");
  document.querySelectorAll(".kanban-column.drag-over").forEach((column) => column.classList.remove("drag-over"));
  state.draggedPipelineItemId = null;
});

app.addEventListener("dragover", (event) => {
  const column = event.target.closest("[data-drop-stage]");
  if (!column || !state.draggedPipelineItemId) return;
  event.preventDefault();
  event.dataTransfer.dropEffect = "move";
  document.querySelectorAll(".kanban-column.drag-over").forEach((item) => item !== column && item.classList.remove("drag-over"));
  column.classList.add("drag-over");
});

app.addEventListener("dragleave", (event) => {
  const column = event.target.closest("[data-drop-stage]");
  if (column && !column.contains(event.relatedTarget)) column.classList.remove("drag-over");
});

app.addEventListener("drop", async (event) => {
  const column = event.target.closest("[data-drop-stage]");
  if (!column) return;
  event.preventDefault();
  column.classList.remove("drag-over");
  const itemId = event.dataTransfer.getData("text/plain") || state.draggedPipelineItemId;
  if (!itemId) return;
  try {
    await movePipelineItem(itemId, column.dataset.dropStage);
  } catch (error) {
    showToast(friendlyError(error), "error");
    await renderView();
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
      if (error) {
        const message = String(error.message || "").toLowerCase();
        if (message.includes("email not confirmed") || message.includes("not confirmed")) {
          throw new Error("Este e-mail ainda precisa ser confirmado. Use “Reenviar confirmação” e abra o novo link recebido.");
        }
        throw new Error("E-mail ou senha inválidos.");
      }
      return await loadPortal();
    }

    if (form.id === "resend-form") {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: String(values.email).trim(),
        options: { emailRedirectTo: SITE_ORIGIN },
      });
      if (error) throw error;
      form.innerHTML = `<div class="form-success">${icon("mail")}<h2>Verifique seu e-mail</h2><p>Se o endereço estiver pendente de confirmação, enviamos um novo link para concluir o acesso.</p></div>`;
      return;
    }

    if (form.id === "recover-form") {
      const { error } = await supabase.auth.resetPasswordForEmail(String(values.email).trim(), { redirectTo: SITE_ORIGIN });
      if (error) throw error;
      form.innerHTML = `<div class="form-success">${icon("mail")}<h2>Verifique seu e-mail</h2><p>Enviamos as instruções de recuperação, caso o endereço esteja cadastrado.</p></div>`;
      return;
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

    if (form.id === "indicator-filter-form") {
      if (values.start > values.end) throw new Error("A data inicial não pode ser posterior à data final.");
      state.indicatorStart = String(values.start);
      state.indicatorEnd = String(values.end);
      state.indicatorGroup = String(values.group || "all");
      return renderView();
    }

    if (form.id === "work-log-form") {
      const manual = values.entryMode === "manual";
      const taskId = String(values.taskId || "") || null;
      const pipelineItemId = String(values.pipelineItemId || "") || null;
      const minutes = Number(values.manualMinutes || 0);
      if (manual && (!Number.isInteger(minutes) || minutes < 1 || minutes > 10080)) throw new Error("Informe entre 1 e 10.080 minutos para o lançamento manual.");
      const now = new Date().toISOString();
      const { error } = await supabase.from("work_activity_logs").insert({
        user_id: state.profile.id,
        department: profileDepartment(),
        task_id: taskId,
        pipeline_item_id: pipelineItemId,
        title: String(values.title || "").trim(),
        category: String(values.category || "Operações").trim(),
        entry_mode: manual ? "manual" : "timer",
        status: manual ? "completed" : "running",
        started_at: now,
        active_started_at: manual ? null : now,
        ended_at: manual ? now : null,
        manual_minutes: manual ? minutes : 0,
        accumulated_seconds: manual ? minutes * 60 : 0,
        notes: String(values.notes || "").trim(),
      });
      if (error) throw error;
      showToast(manual ? "Tempo registrado." : "Cronômetro iniciado.");
      return renderView();
    }

    if (form.id === "indicator-target-form") {
      if (profileDepartment() !== "management") throw new Error("Somente a Direção e Administração pode definir metas.");
      const targetValue = Number(values.targetValue);
      if (!Number.isFinite(targetValue) || targetValue < 0) throw new Error("Informe um valor de meta válido.");
      const { error } = await supabase.from("indicator_targets").upsert({
        metric_key: String(values.metricKey),
        label: String(values.label).trim(),
        department: String(values.department || "all"),
        period: String(values.period || "monthly"),
        comparison: String(values.comparison || "minimum"),
        target_value: targetValue,
      }, { onConflict: "metric_key,department,period" });
      if (error) throw error;
      showToast("Meta salva sem alterar os dados do portal.");
      return renderView();
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
        department: values.role === "cafcm_admin" ? values.department || "management" : null,
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
        if (profileDepartment() !== "management") throw new Error("A restauração completa do histórico é reservada à Direção e Administração.");
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
            department: normalizeImportedDepartment(row.departamento || row.department || row.setor),
            companyId: companyReference ? companyMap.get(companyReference.toLowerCase()) || companyReference : null,
          };
        });
      }
      if (people.length > 100) throw new Error("Divida o arquivo: cada importação aceita até 100 pessoas.");
      const result = await callAdmin({ action: "import_people", people, history: importHistory }, true);
      await renderView();
      renderImportResults(result);
      return;
    }

    if (form.id === "candidate-form") {
      const candidateId = String(values.candidateId || "");
      const payload = {
        full_name: String(values.fullName).trim(),
        email: String(values.email || "").trim().toLowerCase() || null,
        phone: String(values.phone || "").trim() || null,
        cpf: digitsOnly(values.cpf) || null,
        birth_date: values.birthDate || null,
        education_level: String(values.educationLevel || "").trim(),
        city: String(values.city || "").trim(),
        neighborhood: String(values.neighborhood || "").trim(),
        source: String(values.source || "").trim(),
        status: values.status || "new",
        archived_at: values.status === "archived" ? new Date().toISOString() : null,
        notes: String(values.notes || "").trim(),
      };
      let savedId = candidateId;
      if (candidateId) {
        const { error } = await supabase.from("candidates").update(payload).eq("id", candidateId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from("candidates").insert({ ...payload, created_by: state.profile.id }).select("id").single();
        if (error) throw error;
        savedId = data.id;
      }
      const file = values.file;
      if (file instanceof File && file.size) {
        if (file.size > 25 * 1024 * 1024) throw new Error("O arquivo deve ter no máximo 25 MB.");
        const cleanName = file.name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/-+/g, "-");
        const path = `${savedId}/${Date.now()}-${cleanName}`;
        const { error: uploadError } = await supabase.storage.from("cafcm-recruitment").upload(path, file, { contentType: file.type, upsert: false });
        if (uploadError) throw uploadError;
        const { error: documentError } = await supabase.from("candidate_documents").insert({
          candidate_id: savedId,
          title: String(values.documentTitle || "").trim() || file.name.slice(0, 180),
          category: values.documentCategory || "resume",
          storage_path: path,
          mime_type: file.type,
          file_size: file.size,
          uploaded_by: state.profile.id,
        });
        if (documentError) { await supabase.storage.from("cafcm-recruitment").remove([path]); throw documentError; }
      }
      closeOverlay(); showToast(candidateId ? "Candidato e histórico atualizados." : "Candidato cadastrado."); return renderView();
    }
    if (form.id === "vacancy-form") {
      const vacancyId = String(values.vacancyId || "");
      const status = values.status || "open";
      const payload = { company_id: values.companyId, title: String(values.title).trim(), quantity: Number(values.quantity || 1), due_date: values.dueDate || null, workload: String(values.workload || "").trim(), work_model: String(values.workModel || "").trim(), location: String(values.location || "").trim(), monthly_salary: valueOrNull(values.monthlySalary), requirements: String(values.requirements || "").trim(), notes: String(values.notes || "").trim(), status, closed_at: ["filled", "cancelled"].includes(status) ? new Date().toISOString() : null };
      const query = vacancyId ? supabase.from("job_vacancies").update(payload).eq("id", vacancyId) : supabase.from("job_vacancies").insert({ ...payload, created_by: state.profile.id });
      const { error } = await query;
      if (error) throw error; closeOverlay(); showToast(vacancyId ? "Vaga atualizada." : "Vaga aberta."); return renderView();
    }
    if (form.id === "application-form") {
      const applicationId = String(values.applicationId || "");
      const candidateId = values.candidateId || values.candidateIdSelect;
      const vacancyId = values.vacancyId || values.vacancyIdSelect;
      const payload = { candidate_id: candidateId, vacancy_id: vacancyId, status: values.status || "received", company_interview_at: values.companyInterviewAt ? new Date(String(values.companyInterviewAt)).toISOString() : null, notes: String(values.notes || "").trim(), company_feedback: String(values.companyFeedback || "").trim() };
      const query = applicationId ? supabase.from("vacancy_applications").update(payload).eq("id", applicationId) : supabase.from("vacancy_applications").insert({ ...payload, created_by: state.profile.id });
      const { error } = await query;
      if (error?.code === "23505") throw new Error("Este candidato já está nesta vaga."); if (error) throw error; closeOverlay(); showToast(applicationId ? "Etapa da seleção atualizada." : "Candidato incluído no processo seletivo."); return renderView();
    }
    if (form.id === "partnership-form") {
      const partnershipId = String(values.partnershipId || "");
      if (values.startDate && values.endDate && new Date(`${values.endDate}T00:00:00`) < new Date(`${values.startDate}T00:00:00`)) throw new Error("A data de término não pode ser anterior ao início.");
      const payload = { company_id: values.companyId, title: String(values.title || "Contrato de parceria").trim(), status: values.status || "active", start_date: values.startDate || null, end_date: values.endDate || null, notes: String(values.notes || "").trim() };
      const query = partnershipId ? supabase.from("partnership_agreements").update(payload).eq("id", partnershipId) : supabase.from("partnership_agreements").insert({ ...payload, created_by: state.profile.id });
      const { error } = await query;
      if (error) throw error; closeOverlay(); showToast(partnershipId ? "Parceria atualizada." : "Parceria registrada."); return renderView();
    }
    if (form.id === "candidate-conversion-form") {
      const result = await callAdmin({ action: "convert_candidate", applicationId: values.applicationId, targetStartDate: values.targetStartDate || null }, true);
      closeOverlay();
      showToast(result.alreadyConverted ? "A admissão deste jovem já estava aberta." : result.invited ? "Jovem criado, convite enviado e admissão aberta." : "Jovem vinculado e admissão aberta.");
      state.view = canAccessView("admissions") ? "admissions" : "vacancies";
      state.vacancyTab = "applications";
      return renderPortal();
    }

    if (form.id === "pipeline-item-form") {
      const processId = String(values.processId || "");
      const pipelineId = String(values.pipelineId || "");
      const stageId = String(values.stageId || "");
      if (!pipelineId || !stageId) throw new Error("Selecione a esteira e a etapa do processo.");
      const dueAt = values.dueAt ? new Date(String(values.dueAt)).toISOString() : null;
      const payload = {
        pipeline_id: pipelineId,
        stage_id: stageId,
        title: String(values.title || "").trim(),
        description: String(values.description || "").trim(),
        company_id: values.companyId || null,
        apprentice_id: values.apprenticeId || null,
        responsible_id: values.responsibleId || null,
        priority: String(values.priority || "normal"),
        due_at: dueAt,
      };
      let shouldReposition = !processId;
      if (processId) {
        const { data: current, error: currentError } = await supabase.from("pipeline_items").select("stage_id").eq("id", processId).single();
        if (currentError) throw currentError;
        shouldReposition = current.stage_id !== stageId;
      }
      if (shouldReposition) {
        const { data: lastItems, error: positionError } = await supabase
          .from("pipeline_items")
          .select("position")
          .eq("pipeline_id", pipelineId)
          .eq("stage_id", stageId)
          .eq("is_archived", false)
          .order("position", { ascending: false })
          .limit(1);
        if (positionError) throw positionError;
        payload.position = (lastItems?.[0]?.position || 0) + 1000;
      }
      const query = processId
        ? supabase.from("pipeline_items").update(payload).eq("id", processId)
        : supabase.from("pipeline_items").insert({ ...payload, created_by: state.profile.id });
      const { error } = await query;
      if (error) throw error;
      closeOverlay();
      showToast(processId ? "Processo atualizado." : "Processo criado na esteira.");
      return renderView();
    }

    if (form.id === "admission-form") {
      const id = String(values.id || "");
      const payload = { apprentice_id: values.apprenticeId, company_id: values.companyId, target_start_date: values.targetStartDate || null, status: values.status || "approved", notes: String(values.notes || "").trim() };
      let admissionId = id;
      if (id) {
        const { error } = await supabase.from("admission_cases").update(payload).eq("id", id);
        if (error) throw error;
        const checks = await supabase.from("admission_checklist_items").select("id,is_completed").eq("admission_id", id);
        if (checks.error) throw checks.error;
        for (const check of checks.data || []) {
          const complete = form.querySelector(`[name="check-${check.id}"]`)?.checked || false;
          if (complete !== check.is_completed) {
            const { error } = await supabase.from("admission_checklist_items").update({ is_completed: complete }).eq("id", check.id);
            if (error) throw error;
          }
        }
        const newItems = String(values.newChecklistItems || "").split(/\r?\n/).map((item) => item.trim()).filter(Boolean).slice(0, 25);
        if (newItems.length) {
          const { data: lastItems, error: lastItemsError } = await supabase.from("admission_checklist_items").select("position").eq("admission_id", id).order("position", { ascending: false }).limit(1);
          if (lastItemsError) throw lastItemsError;
          const startPosition = lastItems?.[0]?.position || 0;
          const { error: insertItemsError } = await supabase.from("admission_checklist_items").insert(newItems.map((title, index) => ({ admission_id: id, title: title.slice(0, 300), position: startPosition + index + 1, is_required: true })));
          if (insertItemsError) throw insertItemsError;
        }
      } else {
        const { data, error } = await supabase.from("admission_cases").insert({ ...payload, created_by: state.profile.id }).select("id").single();
        if (error) throw error;
        admissionId = data.id;
        await supabase.from("apprentice_records").upsert({ profile_id: values.apprenticeId, status: "admission" });
      }
      closeOverlay(); showToast(id ? "Admissão atualizada." : "Admissão aberta com checklist."); return renderView();
    }

    if (form.id === "contract-form") {
      const payload = { apprentice_id: values.apprenticeId, company_id: values.companyId, start_date: values.startDate, end_date: values.endDate, position_title: String(values.positionTitle || "").trim(), weekly_hours: valueOrNull(values.weeklyHours), salary: valueOrNull(values.salary), status: values.status || "scheduled", notes: String(values.notes || "").trim() };
      if (new Date(`${payload.end_date}T00:00:00`) < new Date(`${payload.start_date}T00:00:00`)) throw new Error("A data de término não pode ser anterior ao início.");
      const query = values.id ? supabase.from("contracts").update(payload).eq("id", values.id) : supabase.from("contracts").insert({ ...payload, created_by: state.profile.id });
      const { error } = await query; if (error) throw error;
      await supabase.from("apprentice_records").upsert({ profile_id: values.apprenticeId, status: payload.status === "active" ? "active" : "admission" });
      closeOverlay(); showToast(values.id ? "Contrato atualizado." : "Contrato cadastrado."); return renderView();
    }

    if (form.id === "leave-form") {
      const payload = { apprentice_id: values.apprenticeId, company_id: values.companyId || null, contract_id: values.contractId || null, leave_type: values.leaveType, status: values.status, start_date: values.startDate, end_date: values.endDate, actual_return_date: values.actualReturnDate || null, notes: String(values.notes || "").trim() };
      if (new Date(`${payload.end_date}T00:00:00`) < new Date(`${payload.start_date}T00:00:00`)) throw new Error("A data de término não pode ser anterior ao início.");
      if (payload.actual_return_date && new Date(`${payload.actual_return_date}T00:00:00`) < new Date(`${payload.start_date}T00:00:00`)) throw new Error("A data de retorno não pode ser anterior ao início.");
      if (payload.contract_id) {
        const { data: contract, error: contractError } = await supabase.from("contracts").select("apprentice_id,company_id").eq("id", payload.contract_id).single();
        if (contractError) throw contractError;
        if (contract.apprentice_id !== payload.apprentice_id || (payload.company_id && contract.company_id !== payload.company_id)) throw new Error("O contrato selecionado não pertence ao jovem e à empresa informados.");
        payload.company_id = contract.company_id;
      }
      const { error } = values.id ? await supabase.from("leave_records").update(payload).eq("id", values.id) : await supabase.from("leave_records").insert({ ...payload, created_by: state.profile.id });
      if (error) throw error; closeOverlay(); showToast("Registro salvo."); return renderView();
    }

    if (form.id === "termination-form") {
      const id = String(values.id || "");
      const payload = { apprentice_id: values.apprenticeId, company_id: values.companyId, effective_date: values.effectiveDate || null, status: values.status || "request", reason: String(values.reason || "").trim(), termination_amount: valueOrNull(values.terminationAmount), payment_date: values.paymentDate || null, notes: String(values.notes || "").trim() };
      const query = id ? supabase.from("termination_cases").update(payload).eq("id", id) : supabase.from("termination_cases").insert({ ...payload, created_by: state.profile.id });
      const { error } = await query;
      if (error) throw error;
      if (id) {
        const checks = await supabase.from("termination_checklist_items").select("id,is_completed").eq("termination_id", id);
        if (checks.error) throw checks.error;
        for (const check of checks.data || []) {
          const complete = form.querySelector(`[name="termination-check-${check.id}"]`)?.checked || false;
          if (complete !== check.is_completed) {
            const { error: checkError } = await supabase.from("termination_checklist_items").update({ is_completed: complete }).eq("id", check.id);
            if (checkError) throw checkError;
          }
        }
        const newItems = String(values.newTerminationChecklistItems || "").split(/\r?\n/).map((item) => item.trim()).filter(Boolean).slice(0, 25);
        if (newItems.length) {
          const { data: lastItems, error: lastError } = await supabase.from("termination_checklist_items").select("position").eq("termination_id", id).order("position", { ascending: false }).limit(1);
          if (lastError) throw lastError;
          const startPosition = lastItems?.[0]?.position || 0;
          const { error: insertError } = await supabase.from("termination_checklist_items").insert(newItems.map((title, index) => ({ termination_id: id, title: title.slice(0, 300), position: startPosition + index + 1 })));
          if (insertError) throw insertError;
        }
      }
      await supabase.from("apprentice_records").upsert({ profile_id: values.apprenticeId, status: payload.status === "completed" ? "inactive" : "termination" });
      closeOverlay(); showToast("Desligamento salvo."); return renderView();
    }

    if (form.id === "accounting-form") {
      const payload = { title: String(values.title || "").trim(), dispatch_type: values.dispatchType, status: values.status, competence: values.competence ? `${values.competence}-01` : null, apprentice_id: values.apprenticeId || null, company_id: values.companyId || null, responsible_id: values.responsibleId || null, external_reference: valueOrNull(values.externalReference), document_id: values.documentId || null, due_at: values.dueAt ? new Date(values.dueAt).toISOString() : null, description: String(values.description || "").trim() };
      const { error } = values.id ? await supabase.from("accounting_dispatches").update(payload).eq("id", values.id) : await supabase.from("accounting_dispatches").insert({ ...payload, created_by: state.profile.id });
      if (error) throw error; closeOverlay(); showToast("Envio à contabilidade salvo."); return renderView();
    }

    if (form.id === "financial-charge-form") {
      const paymentSlipUrl = valueOrNull(values.paymentSlipUrl);
      const normalizedPaymentSlipUrl = paymentSlipUrl ? safeHttpUrl(paymentSlipUrl) : null;
      if (paymentSlipUrl && !normalizedPaymentSlipUrl) throw new Error("Informe um link válido para o boleto.");
      const payload = {
        company_id: values.companyId,
        contract_id: values.contractId || null,
        competence: `${values.competence}-01`,
        description: String(values.description || "").trim(),
        amount: Number(values.amount),
        due_date: values.dueDate || null,
        status: values.status || "to_invoice",
        invoice_number: valueOrNull(values.invoiceNumber),
        invoice_issued_at: values.invoiceIssuedAt ? new Date(values.invoiceIssuedAt).toISOString() : null,
        payment_slip_number: valueOrNull(values.paymentSlipNumber),
        payment_slip_line: valueOrNull(values.paymentSlipLine),
        payment_slip_url: normalizedPaymentSlipUrl,
        payment_slip_issued_at: values.paymentSlipIssuedAt ? new Date(values.paymentSlipIssuedAt).toISOString() : null,
        paid_at: values.paidAt ? new Date(values.paidAt).toISOString() : null,
        paid_amount: valueOrNull(values.paidAmount),
        invoice_document_id: values.invoiceDocumentId || null,
        payment_slip_document_id: values.paymentSlipDocumentId || null,
        receipt_document_id: values.receiptDocumentId || null,
        responsible_id: values.responsibleId || null,
        notes: String(values.notes || "").trim(),
      };
      if (!Number.isFinite(payload.amount) || payload.amount < 0) throw new Error("Informe um valor válido para a cobrança.");
      if (payload.contract_id) {
        const { data: contract, error: contractError } = await supabase.from("contracts").select("company_id").eq("id", payload.contract_id).single();
        if (contractError) throw contractError;
        if (contract.company_id !== payload.company_id) throw new Error("O contrato selecionado não pertence à empresa informada.");
      }
      const { error } = values.id ? await supabase.from("financial_charges").update(payload).eq("id", values.id) : await supabase.from("financial_charges").insert({ ...payload, created_by: state.profile.id });
      if (error) throw error;
      closeOverlay(); showToast(values.id ? "Cobrança atualizada." : "Cobrança criada."); return renderView();
    }

    if (form.id === "document-form") {
      const file = values.file;
      if (!(file instanceof File) || !file.size) throw new Error("Selecione um arquivo.");
      if (file.size > 25 * 1024 * 1024) throw new Error("O arquivo deve ter no máximo 25 MB.");
      if (!values.apprenticeId && !values.companyId) throw new Error("Vincule o documento a um jovem ou empresa.");
      const cleanName = file.name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/-+/g, "-");
      const owner = values.apprenticeId || values.companyId;
      const path = `${owner}/${values.category}/${Date.now()}-${cleanName}`;
      const { error: uploadError } = await supabase.storage.from("cafcm-documents").upload(path, file, { contentType: file.type, upsert: false });
      if (uploadError) throw uploadError;
      const { data: documentRecord, error } = await supabase.from("document_records").insert({ title: String(values.title || "").trim(), apprentice_id: values.apprenticeId || null, company_id: values.companyId || null, category: values.category, expires_on: values.expiresOn || null, notes: String(values.notes || "").trim(), storage_path: path, mime_type: file.type, file_size: file.size, uploaded_by: state.profile.id }).select("id").single();
      if (error) { await supabase.storage.from("cafcm-documents").remove([path]); throw error; }
      if (values.requirementId) {
        const { error: requirementError } = await supabase.from("document_requirements").update({ document_id: documentRecord.id, status: "received" }).eq("id", values.requirementId);
        if (requirementError) throw requirementError;
      }
      closeOverlay(); showToast("Documento enviado e arquivado."); return renderView();
    }

    if (form.id === "document-edit-form") {
      const { error } = await supabase.from("document_records").update({ title: String(values.title || "").trim(), category: values.category, expires_on: values.expiresOn || null, notes: String(values.notes || "").trim() }).eq("id", values.id);
      if (error) throw error;
      closeOverlay(); showToast("Documento atualizado."); return renderView();
    }

    if (form.id === "document-requirement-form") {
      if (!values.apprenticeId && !values.companyId) throw new Error("Vincule a pendência a um jovem ou empresa.");
      const payload = { title: String(values.title || "").trim(), apprentice_id: values.apprenticeId || null, company_id: values.companyId || null, category: values.category, status: values.status || "pending", due_date: values.dueDate || null, responsible_id: values.responsibleId || null, document_id: values.documentId || null, notes: String(values.notes || "").trim() };
      const { error } = values.id ? await supabase.from("document_requirements").update(payload).eq("id", values.id) : await supabase.from("document_requirements").insert({ ...payload, created_by: state.profile.id });
      if (error) throw error;
      closeOverlay(); showToast(values.id ? "Pendência documental atualizada." : "Pendência documental criada."); return renderView();
    }

    if (form.id === "email-draft-form") {
      const payload = {
        template_id: values.templateId || null,
        recipient_email: String(values.recipientEmail || "").trim().toLowerCase(),
        subject: String(values.subject || "").trim(),
        body: String(values.body || "").trim(),
        status: "draft",
        attachment_document_id: values.attachmentDocumentId || null,
        created_by: state.profile.id,
      };
      const { error } = values.deliveryId
        ? await supabase.from("email_deliveries").update({ ...payload, error_message: null }).eq("id", values.deliveryId)
        : await supabase.from("email_deliveries").insert(payload);
      if (error) throw error;
      closeOverlay(); showToast(values.deliveryId ? "Conferência salva. O e-mail continua aguardando envio." : "Rascunho salvo. Confira todos os dados antes de enviar."); return renderView();
    }

    if (form.id === "document-generation-form") {
      if (!values.apprenticeId && !values.companyId) throw new Error("Vincule o documento a um jovem ou uma empresa.");
      await callAutomation({
        action: "generate_document",
        templateId: values.templateId,
        apprenticeId: values.apprenticeId || null,
        companyId: values.companyId || null,
        fields: {
          periodo: values.periodo,
          prazo: values.prazo,
          competencia: values.competencia,
          valor: values.valor,
          documentos: values.documentos,
          descricao: values.descricao,
          observacoes: values.observacoes,
        },
        notes: values.notes,
      });
      closeOverlay(); showToast("PDF gerado. Confira o arquivo antes de aprovar."); return renderView();
    }

    if (form.id === "banking-integration-form") {
      if (values.status === "active" && !window.confirm("O Bradesco confirmou a homologação desta integração?")) throw new Error("Mantenha a situação em homologação até a confirmação oficial do banco.");
      const payload = {
        integration_mode: values.integrationMode,
        status: values.status,
        agreement_number: valueOrNull(values.agreementNumber),
        wallet_code: valueOrNull(values.walletCode),
        layout_version: valueOrNull(values.layoutVersion),
        agency: valueOrNull(values.agency),
        account_reference: valueOrNull(values.accountReference),
        notes: String(values.notes || "").trim(),
        homologated_at: values.status === "active" ? new Date().toISOString() : null,
      };
      const { error } = values.id
        ? await supabase.from("banking_integrations").update(payload).eq("id", values.id)
        : await supabase.from("banking_integrations").insert({ ...payload, created_by: state.profile.id });
      if (error) throw error;
      closeOverlay(); showToast("Preparação bancária salva. Nenhuma operação foi enviada ao banco."); return renderView();
    }

    if (form.id === "task-form") {
      const taskId = String(values.taskId || "");
      const dueAt = values.dueAt ? new Date(String(values.dueAt)).toISOString() : null;
      const payload = {
        title: String(values.title || "").trim(),
        description: String(values.description || "").trim(),
        status: String(values.status || "pending"),
        priority: String(values.priority || "normal"),
        category: String(values.category || "").trim(),
        company_id: values.companyId || null,
        apprentice_id: values.apprenticeId || null,
        pipeline_item_id: values.processId || null,
        assigned_to: values.assignedTo || null,
        due_at: dueAt,
      };
      let savedTaskId = taskId;
      if (taskId) {
        const { error } = await supabase.from("tasks").update(payload).eq("id", taskId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from("tasks").insert({ ...payload, created_by: state.profile.id }).select("id").single();
        if (error) throw error;
        savedTaskId = data.id;
      }
      const checklistLines = String(values.checklistItems || "").split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
      if (checklistLines.length > 50) throw new Error("Adicione no máximo 50 itens de checklist por vez.");
      if (checklistLines.length) {
        const { data: lastItems, error: positionError } = await supabase.from("task_checklist_items").select("position").eq("task_id", savedTaskId).order("position", { ascending: false }).limit(1);
        if (positionError) throw positionError;
        const initialPosition = lastItems?.[0]?.position || 0;
        const { error: checklistError } = await supabase.from("task_checklist_items").insert(checklistLines.map((title, index) => ({ task_id: savedTaskId, title, position: initialPosition + index + 1 })));
        if (checklistError) {
          closeOverlay();
          await renderView();
          showToast("A tarefa foi salva, mas o checklist não pôde ser incluído. Abra a tarefa e tente novamente.", "error");
          return;
        }
      }
      closeOverlay();
      showToast(taskId ? "Tarefa atualizada." : "Tarefa criada.");
      return renderView();
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
      await callAdmin({
        action: "invite",
        fullName: values.fullName,
        email: values.email,
        role: values.role,
        department: values.role === "cafcm_admin" ? values.department || "management" : null,
        companyId: values.role === "cafcm_admin" ? null : values.companyId || null,
      }, true);
      await renderView();
      renderInviteCredentials(String(values.email).trim().toLowerCase());
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
  const hashParams = new URLSearchParams(location.hash.slice(1));
  const queryParams = new URLSearchParams(location.search);
  const hashType = hashParams.get("type");
  const queryType = queryParams.get("type");
  const tokenHash = queryParams.get("token_hash") || hashParams.get("token_hash");
  const otpType = queryType || hashType;
  const authError = queryParams.get("error_description") || hashParams.get("error_description");

  supabase.auth.onAuthStateChange((event, session) => {
    state.session = session;
    if (event === "PASSWORD_RECOVERY") {
      window.setTimeout(renderPasswordSetup, 0);
    }
  });

  const { data } = await supabase.auth.getSession();
  state.session = data.session;

  if (authError) {
    history.replaceState({}, "", location.pathname);
    await renderLogin();
    return showToast(decodeURIComponent(authError), "error");
  }

  if (tokenHash && otpType) {
    const { data: verified, error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: otpType });
    if (error) {
      history.replaceState({}, "", location.pathname);
      await renderLogin("resend");
      return showToast("O link não pôde ser confirmado. Reenvie a confirmação e use o novo e-mail recebido.", "error");
    }
    state.session = verified.session;
    history.replaceState({}, "", location.pathname);
    if (state.session && ["invite", "recovery", "signup", "email"].includes(otpType)) return renderPasswordSetup();
  }

  if (state.session && ["invite", "recovery", "signup"].includes(hashType || queryType)) {
    return renderPasswordSetup();
  }
  if (state.session) return loadPortal();
  return renderLogin();
}

init();
