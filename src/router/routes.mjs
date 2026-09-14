export const routeMap = {
  "/": { view: "overview", title: "Visão geral" },
  "/visao-geral": { view: "overview", title: "Visão geral" },
  "/indicadores": { view: "indicators", title: "Indicadores e relatórios" },

  // Operações
  "/esteiras": { view: "pipelines", title: "Central de Esteiras" },
  "/tarefas": { view: "tasks", title: "Tarefas e Pendências" },
  "/notificacoes": { view: "notifications", title: "Notificações" },
  "/automacoes": { view: "automations", title: "Automações", tab: "overview" },
  "/automacoes/historico": { view: "automations", title: "Automações - Histórico", tab: "history" },

  // Recursos Humanos
  "/vagas": { view: "vacancies", title: "Vagas e candidatos", tab: "overview" },
  "/vagas/candidatos": { view: "vacancies", title: "Vagas - Candidatos", tab: "candidates" },
  "/vagas/processos-seletivos": { view: "vacancies", title: "Vagas - Processos Seletivos", tab: "processes" },
  "/parcerias": { view: "partnerships", title: "Parcerias e jovens" },

  // Empresas
  "/empresas": { view: "companies", title: "Empresas parceiras" },

  // Jovens
  "/jovens": { view: "apprentices", title: "Jovens / Aprendizes" },
  "/admissoes": { view: "admissions", title: "Admissões" },
  "/contratos": { view: "contracts", title: "Contratos" },
  "/ferias-afastamentos": { view: "leaves", title: "Férias e afastamentos" },
  "/rescisoes": { view: "terminations", title: "Desligamentos" },

  // Pedagógico
  "/cursos": { view: "courses", title: "Cursos" },
  "/matriculas": { view: "enrollments", title: "Matrículas" },

  // Departamento Pessoal, Financeiro e Gestão
  "/dp": { view: "personnel", title: "Departamento Pessoal" },
  // Recursos Humanos / Departamento Pessoal friendly aliases reuse existing views.
  "/rh": { view: "overview", title: "Recursos Humanos" },
  "/folha": { view: "personnel", title: "Folha e Ponto" },
  "/esocial": { view: "accounting", title: "eSocial / Obrigações" },

  "/financeiro": { view: "finance", title: "Financeiro", tab: "receivable" },
  "/faturamento": { view: "finance", title: "Faturamento", tab: "receivable" },
  "/despesas": { view: "finance", title: "Despesas", tab: "payable" },
  "/boletos": { view: "finance", title: "Boletos", tab: "billets" },

  "/documentos": { view: "documents", title: "Documentos", tab: "files" },
  "/documentos/modelos": { view: "documents", title: "Modelos de Documentos", tab: "templates" },

  "/contabilidade": { view: "accounting", title: "eSocial / Obrigações" },
  "/procedimentos": { view: "procedures", title: "Procedimentos" },
  "/pessoas": { view: "people", title: "Pessoas e Convites" },
  "/auditoria": { view: "audit", title: "Auditoria" },

  // Jovem Aprendiz Profile
  "/aluno": { view: "student-home", title: "Início" },
  "/aluno/cursos": { view: "student-courses", title: "Meus cursos" },
  "/aluno/atividades": { view: "student-activities", title: "Atividades" },
};

// Map views back to canonical URLs (for navigation logic if needed)
export const viewToUrl = {
  "overview": "/",
  "indicators": "/indicadores",
  "pipelines": "/esteiras",
  "tasks": "/tarefas",
  "notifications": "/notificacoes",
  "automations": "/automacoes",
  "vacancies": "/vagas",
  "partnerships": "/parcerias",
  "companies": "/empresas",
  "apprentices": "/jovens",
  "admissions": "/admissoes",
  "contracts": "/contratos",
  "leaves": "/ferias-afastamentos",
  "terminations": "/rescisoes",
  "courses": "/cursos",
  "enrollments": "/matriculas",
  "personnel": "/dp",
  "finance": "/financeiro",
  "documents": "/documentos",
  "accounting": "/contabilidade",
  "procedures": "/procedimentos",
  "people": "/pessoas",
  "audit": "/auditoria",
  "student-home": "/aluno",
  "student-courses": "/aluno/cursos",
  "student-activities": "/aluno/atividades"
};
