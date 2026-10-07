# Coletor de certidões de aprendizagem CAFCM

Ferramenta local para consultar CNPJs completos no formulário oficial do MTE, guardar o PDF e associar o resultado aos contatos da base. É independente do portal publicado: não altera Supabase, campanhas, permissões ou infraestrutura de produção e não envia e-mails.

## Uso no Windows

O pacote Windows contém `CAFCM-Certidoes.exe` e seus arquivos de suporte. Mantenha a pasta completa e abra o executável. Requer Google Chrome instalado. O pacote compilado não requer instalação de Python.

1. Importe a base CSV ou a fila JSON. A opção de seleção positiva usa apenas a indicação antiga `Faltam N aprendizes` com N maior que zero. Listas sem essa coluna são aceitas, mediante validação do CNPJ.
2. Use **Testar 5 CNPJs** para conferir o comportamento do portal. **Executar fila** processa todos os pendentes sequencialmente.
3. Se o portal exigir verificação humana, a execução para. Complete a verificação no Chrome aberto e use **Retomar**. Não há repetição automática de tentativas bloqueadas.
4. **Pausar** preserva o progresso. Ao reabrir, consultas interrompidas voltam à fila. PDFs obtidos permanecem salvos.
5. **Exportar resultados e PDFs** gera um ZIP com relatórios, contatos com resultado inferior e os documentos. Um duplo clique na empresa abre seu PDF.

O programa também aceita `--input CAMINHO --workspace PASTA --run-all` para carregar uma base e começar automaticamente. A sessão usa um perfil dedicado do Chrome; feche o aplicativo para liberar esse perfil antes de abrir outra instância.

## Automação e verificações

O envio usa o formulário real que produz o `POST /aprendiz`, com `form-id=emitir`, `cnpjForm` e os campos Turnstile preenchidos pelo próprio site. A ferramenta observa somente se o campo de verificação está preenchido e envia o formulário normalmente. Não copia tokens, não exporta cookies, não usa solucionadores de CAPTCHA, não altera fingerprint e não remove verificações.

Pode avançar sem intervenção quando o portal conclui suas verificações automaticamente. Isso não garante operação 100% sem intervenção: o MTE, AWS WAF ou Cloudflare podem exigir verificação ou bloquear/limitar consultas. Nesses casos o aplicativo pausa, preserva a fila e aguarda ação no navegador. Não tenta outro endpoint nem registra HTML de desafios ou valores de sessão nos relatórios.

O acesso oficial foi bloqueado por verificação durante a consulta desta conversa. O desenvolvimento e CI verificam o fluxo local e simulado; emissões reais consecutivas ainda precisam ser validadas no portal. Nenhuma certidão real foi obtida pelo aplicativo nesta etapa.

## Conferência dos documentos

- A primeira versão aceita CNPJs numéricos completos com 14 dígitos e valida os dígitos verificadores. Não reduz ao CNPJ raiz; CNPJs alfanuméricos ficam fora deste escopo.
- Não cria certidões. Guarda os bytes recebidos do domínio oficial, com SHA-256 e nome por CNPJ, hora e hash.
- A leitura exige título de certidão de aprendizes, identificação exclusiva do CNPJ, situação sem ambiguidade, código de autenticidade e data de referência nos últimos sete dias. Variações não reconhecidas ficam para revisão, com o PDF preservado.
- A data de referência é diferente da data de emissão. A certidão representa os dados disponíveis naquela data; não é uma nova conclusão de fiscalização.
- O código é registrado; sua autenticidade não é consultada separadamente. A origem da coleta é o portal oficial.
- A exportação de déficit inclui somente documentos conferidos, presentes em disco, com situação inferior e referência dentro da janela de sete dias. A indicação antiga da base serve somente para seleção/ordenação.
- E-mails são separados por formato. Existência da caixa, entregabilidade e vínculo com a empresa não são verificados. Nenhum envio é realizado.

Relatórios: `resultados_cnpjs.csv`, `contatos_deficit_confirmado.csv`, `contatos_revisao_email.csv` e `resumo.json`. O ZIP inclui a pasta `certidoes/`; exclui perfil do navegador, cookies e banco de trabalho. **Atualizar antigas** recoloca na fila documentos conferidos com referência há mais de sete dias. **Repetir falhas** exige uma nova ação de início do usuário.

## Desenvolvimento e testes

Python 3.12 ou mais recente e Google Chrome para o uso real:

```sh
python -m pip install -r requirements-dev.txt
python -m pytest
python launch.py --self-test
python launch.py
```

Os testes unitários e de integração simulada não acessam o portal. O workflow Windows compila com PyInstaller, inicia o driver incluído e verifica o executável com `--self-test`, também sem consultar o MTE. A base do usuário, PDFs, banco, perfis e resultados nunca entram no GitHub.

## Referências do comportamento

- Serviço oficial e contato: https://www.gov.br/pt-br/servicos/certidao-de-regularidade-na-contratacao-de-aprendizes?id=22282&origem=servico
- Turnstile: tokens de uso único, válidos por 300 segundos: https://developers.cloudflare.com/turnstile/get-started/server-side-validation/
- Verificação automática ou interação conforme modo/risco: https://developers.cloudflare.com/turnstile/concepts/widget/
- Cookie AWS WAF associado à sessão do cliente: https://docs.aws.amazon.com/waf/latest/developerguide/waf-tokens.html
