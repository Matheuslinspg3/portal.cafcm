import { isVisible } from './tour.mjs';

const fieldHelp = {
  title: 'Use um título curto que identifique o registro. Evite nomes genéricos que dificultem encontrar o item depois.',
  description: 'Descreva o contexto, o que deve ser feito e as informações necessárias para a equipe compreender o registro.',
  notes: 'Registre observações relevantes. Não inclua senhas, chaves privadas ou dados pessoais desnecessários.',
  companyId: 'Escolha a empresa já cadastrada que corresponde a este registro. Confira o nome para evitar vínculos incorretos.',
  apprenticeId: 'Selecione o jovem correto no cadastro central. Se ele não aparece, confira acesso e situação com a equipe responsável.',
  contractId: 'Vincule o contrato correspondente ao jovem, empresa e período deste registro.',
  courseId: 'Escolha o curso que deve ser vinculado. Confira o título antes de confirmar a matrícula ou atividade.',
  lessonId: 'Escolha a aula correspondente dentro do curso. O vínculo define onde a atividade será apresentada.',
  responsibleId: 'Escolha a pessoa da equipe que deve acompanhar o registro.',
  assignedTo: 'Defina quem deve realizar a tarefa. Uma atribuição ou transferência pode gerar notificação interna quando salva.',
  processId: 'Vincule um processo existente para reunir o acompanhamento e evitar controles separados.',
  pipelineItemId: 'Escolha o processo relacionado ao trabalho realizado. O vínculo é opcional quando indicado.',
  taskId: 'Selecione a tarefa relacionada ao registro, se houver.',
  status: 'Escolha a situação que corresponde ao andamento real. Alterar a situação grava uma mudança; não executa por si só as providências externas descritas.',
  priority: 'Defina a prioridade conforme a urgência real e o impacto da pendência. O prazo deve ser informado separadamente.',
  category: 'Classifique o registro para facilitar a busca e organização da rotina.',
  competence: 'Informe o mês e ano de referência. Competência não é a mesma coisa que vencimento ou data de pagamento.',
  dueDate: 'Informe a data de vencimento. Ela organiza o calendário e o acompanhamento de atrasos.',
  dueAt: 'Informe a data e, quando solicitado, o horário limite para a providência.',
  plannedPaymentDate: 'Data em que a equipe pretende pagar. Este campo não agenda transferência nem débito bancário.',
  reminderDays: 'Informe antecedências em dias separadas por vírgula, como 7, 3, 1. São aceitos de 0 a 60 dias, até cinco valores distintos. Os avisos são internos; não são uma autorização de pagamento.',
  amount: 'Informe o valor real em reais, com os centavos. O cadastro não realiza uma transação bancária.',
  paidAmount: 'Informe o valor efetivamente pago ou recebido após conferir a transação real, não apenas o valor previsto.',
  paidAt: 'Registre quando o pagamento ou recebimento foi confirmado. Isso não envia dinheiro ao banco.',
  paymentDate: 'Informe a data real do pagamento após conferência do comprovante.',
  paymentMethod: 'Identifique o meio utilizado. Bradesco nesta etapa é registro manual, não envio automático ao banco.',
  barcode: 'Copie o código do documento real e confira todos os dígitos. Guardar o código não paga a conta.',
  supplierName: 'Informe quem receberá o pagamento: fornecedor ou prestador que consta no documento.',
  supplierDocument: 'Informe o CPF ou CNPJ do fornecedor quando necessário e confira com o documento da despesa.',
  documentId: 'Escolha o documento já armazenado que comprova ou detalha este registro.',
  receiptDocumentId: 'Vincule o comprovante do pagamento real. Um boleto ou uma cobrança não é comprovante de quitação.',
  invoiceNumber: 'Registre a identificação da nota fiscal já emitida. Este campo não emite uma nota fiscal.',
  paymentSlipNumber: 'Registre a referência do boleto já emitido. O portal não emite boleto bancário por preencher este campo.',
  externalReference: 'Use protocolo ou referência que permita localizar o registro no documento ou sistema externo.',
  startDate: 'Informe a data inicial do período conforme o documento ou programação confirmada.',
  endDate: 'Informe a data final e confira se é compatível com o início do período.',
  actualReturnDate: 'Preencha quando houver confirmação do retorno efetivo, não apenas uma previsão.',
  targetStartDate: 'Informe a previsão de início da admissão. Atualize se a programação confirmada mudar.',
  effectiveDate: 'Informe a data efetiva do desligamento conforme a orientação da equipe responsável.',
  expiresOn: 'Informe a validade real do documento quando existir. Não invente uma validade para preencher um campo opcional.',
  checklistItems: 'Escreva um item por linha. Divida o trabalho em providências que possam ser conferidas individualmente.',
  newChecklistItems: 'Inclua um item por linha. Os novos itens são acrescentados ao checklist existente.',
  newTerminationChecklistItems: 'Inclua as providências adicionais, uma por linha, preservando o checklist já preenchido.',
  entryMode: 'Cronômetro começa a contar ao salvar; lançamento manual registra minutos já realizados. O guia não inicia contagem.',
  manualMinutes: 'No lançamento manual, informe a duração real em minutos, não horas. Evite duplicar tempo já registrado por cronômetro.',
  metricKey: 'Escolha o indicador ao qual esta meta se aplica. A meta deve usar a mesma unidade do indicador.',
  targetValue: 'Informe a referência numérica definida pela Direção. O sistema não sugere ou cria metas fictícias.',
  comparison: 'Defina se o objetivo é atingir um mínimo ou respeitar um máximo. Confira antes de salvar.',
  email: 'Informe um endereço correto e revise a digitação. Em convites, ele será usado para conceder acesso e enviar comunicações.',
  recipientEmail: 'Confira o destinatário com atenção antes de salvar ou enviar qualquer mensagem.',
  role: 'Escolha o tipo de acesso correto. Jovens, empresas e equipe possuem permissões diferentes.',
  department: 'Departamento define as áreas e informações acessíveis. Contas internas e suas permissões são administradas pela Direção.',
  password: 'Use uma senha forte e exclusiva. Não compartilhe a senha pelo chat ou em observações. O guia não lê nem mostra o conteúdo digitado.',
  confirmation: 'Repita a senha exatamente como digitada no campo anterior. O guia não confirma nem altera a senha por você.',
  file: 'Selecione o arquivo correto e confira os tipos e limites informados no formulário antes de enviar.',
  requirementId: 'Se o arquivo atende uma pendência já cadastrada, escolha essa pendência para conectar os registros.',
  objectives: 'Descreva o que o jovem deverá aprender ao terminar o curso.',
  workloadHours: 'Informe a carga horária planejada do curso, em horas.',
  position: 'Defina a ordem em que este item deve aparecer na sequência de aprendizagem.',
  blockType: 'Escolha o formato da linha. Os campos disponíveis mudam de acordo com texto, slides, vídeo ou considerações.',
  videoUrl: 'Informe o endereço do vídeo no formato aceito pelo portal e confirme que os jovens terão acesso ao conteúdo.',
};

const formNotes = {
  'invite-form': 'Confirmar este formulário cria um acesso ou envia convite real. Confira pessoa, e-mail, perfil e empresa. Não use dados fictícios.',
  'people-import-form': 'A importação pode criar ou atualizar pessoas e enviar convites. Revise arquivo e opções antes de processar.',
  'admission-form': 'Ao criar, o portal gera o checklist padrão e registros de acompanhamento. Revise jovem e empresa antes de confirmar.',
  'termination-form': 'Este formulário registra um desligamento e suas providências. Ele não efetua pagamento nem substitui os procedimentos externos.',
  'payable-form': 'O cadastro controla uma despesa. Ele não executa pagamento nem agendamento bancário, mesmo quando o meio informado é Bradesco.',
  'financial-charge-form': 'O cadastro controla uma cobrança. Ele não emite nota fiscal ou boleto bancário automaticamente.',
  'candidate-conversion-form': 'Esta confirmação pode criar ou vincular um jovem e iniciar a admissão. Revise o resultado aprovado e os dados da pessoa.',
  'email-draft-form': 'Confira destinatário, assunto, texto e anexo. Rascunho e envio são etapas distintas; o guia não envia mensagens.',
  'banking-integration-form': 'Use somente informações operacionais confirmadas pelo banco. Nunca informe chave privada, senha ou segredo de API nestes campos.',
  'response-form': 'Leia as instruções da atividade e escreva sua própria resposta. O guia não responde nem envia a atividade.',
  'my-profile-form': 'Você pode atualizar os campos liberados da sua conta. Não compartilhe a senha; dados bloqueados exigem ajuda da equipe autorizada.',
};

function labelOf(field) {
  const label = field.labels?.[0] || field.closest('label');
  if (!label) return field.getAttribute('aria-label') || field.name || 'Campo';
  const copy = label.cloneNode(true);
  copy.querySelectorAll('input, select, textarea, small, datalist, svg').forEach(item => item.remove());
  return copy.textContent.replace(/\s+/g, ' ').trim() || field.name || 'Campo';
}

export function describeField(field) {
  const label = field.labels?.[0] || field.closest('label');
  const help = [...(label?.querySelectorAll('small') || [])].map(item => item.textContent.trim()).filter(Boolean).join(' ');
  const lines = [fieldHelp[field.name] || (field.tagName === 'SELECT' ? 'Escolha uma opção compatível com este cadastro.' : field.type === 'checkbox' ? 'Marque somente quando a condição descrita for verdadeira.' : `Preencha ${labelOf(field).toLocaleLowerCase('pt-BR')} com a informação correta.`)];
  if (field.disabled || field.readOnly) lines.push('Este campo está disponível somente para consulta nesta situação.');
  else lines.push(field.required ? 'Campo obrigatório.' : 'Campo opcional, salvo indicação específica do formulário.');
  if (help) lines.push(help);
  if (field.minLength > 0) lines.push(`Mínimo de ${field.minLength} caracteres.`);
  if (field.maxLength > 0) lines.push(`Máximo de ${field.maxLength} caracteres.`);
  if (field.type === 'number') {
    if (field.min !== '') lines.push(`Valor mínimo: ${field.min}.`);
    if (field.max !== '') lines.push(`Valor máximo: ${field.max}.`);
  }
  if (field.type === 'file' && field.accept) lines.push(`Formatos aceitos: ${field.accept}.`);
  // Deliberately never read field.value, password contents or chosen file names.
  return lines.join(' ');
}

export function buildFormGuide(dialog, title) {
  const form = dialog.matches('form') ? dialog : dialog.querySelector('form');
  if (!form) return null;
  const steps = [{ title: 'Antes de preencher', text: formNotes[form.id] || 'Confira os dados e vínculos antes de salvar. Percorrer este guia não preenche, altera nem envia o formulário.', element: dialog.querySelector('.dialog-head') || form }];
  const fields = [...form.querySelectorAll('input:not([type="hidden"]), select, textarea')].filter(isVisible);
  for (const field of fields) {
    if (field.closest('.checklist-editor')) continue;
    steps.push({ title: labelOf(field), text: describeField(field), element: field.labels?.[0] || field });
  }
  const checklist = form.querySelector('.checklist-editor');
  if (checklist && isVisible(checklist)) steps.push({ title: 'Checklist', text: 'Confira as providências e marque somente as realizadas. O guia não marca nem desmarca os itens.', element: checklist });
  steps.push({ title: 'Conferir antes de salvar', text: 'Revise os campos obrigatórios, datas e vínculos. Concluir guia apenas fecha a ajuda; para gravar ou enviar, use você mesmo o botão do formulário depois da revisão.', element: form.querySelector('button[type="submit"]') });
  return { key: `form:${form.id}`, title: `Formulário · ${title}`, scope: dialog, steps };
}
