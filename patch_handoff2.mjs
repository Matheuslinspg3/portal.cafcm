import fs from 'fs';
let content = fs.readFileSync('src/app.js', 'utf8');

const termHandoffSearch = `      }
      if (payload.status === "completed") {
         await supabase.from("profiles").update({ is_active: false }).eq("id", values.apprenticeId);
      }
      await supabase.from("apprentice_records").upsert({ profile_id: values.apprenticeId, status: payload.status === "completed" ? "inactive" : "termination" });`;

const termHandoffReplace = `      }
      if (payload.status === "completed") {
         await supabase.from("profiles").update({ is_active: false }).eq("id", values.apprenticeId);

         // DP to Finance Handoff Check (Termination)
         // Creates a notification / task for finance
         await supabase.from("tasks").insert({
           title: "Rescisão Concluída (Handoff)",
           description: "A rescisão do jovem foi concluída pelo DP. Verifique faturamentos e despesas residuais (Handoff DP -> Financeiro).",
           category: "finance",
           company_id: values.companyId,
           apprentice_id: values.apprenticeId,
           created_by: state.profile.id
         });
      }
      await supabase.from("apprentice_records").upsert({ profile_id: values.apprenticeId, status: payload.status === "completed" ? "inactive" : "termination" });`;

content = content.replace(termHandoffSearch, termHandoffReplace);

const payrollHandoffSearch = `      const payload = { company_id: values.companyId, month: values.month, status: values.status || "open", notes: String(values.notes || "").trim() };
      const { error } = id ? await supabase.from("payroll_competences").update(payload).eq("id", id) : await supabase.from("payroll_competences").insert({ ...payload, created_by: state.profile.id });
      if (error) throw error;
      closeOverlay(); showToast("Competência salva."); return renderView();`;

const payrollHandoffReplace = `      const payload = { company_id: values.companyId, month: values.month, status: values.status || "open", notes: String(values.notes || "").trim() };
      const { error } = id ? await supabase.from("payroll_competences").update(payload).eq("id", id) : await supabase.from("payroll_competences").insert({ ...payload, created_by: state.profile.id });
      if (error) throw error;

      if (payload.status === "ready_for_finance" || payload.status === "completed") {
         await supabase.from("tasks").insert({
           title: "Folha Pronta para Financeiro (Handoff)",
           description: \`A competência \${payload.month} foi enviada pelo DP. Providencie pagamentos e baixas (Handoff DP -> Financeiro).\`,
           category: "finance",
           company_id: values.companyId,
           created_by: state.profile.id
         });
      }

      closeOverlay(); showToast("Competência salva."); return renderView();`;

content = content.replace(payrollHandoffSearch, payrollHandoffReplace);

const admissionHandoffSearch = `        // DP Admission Completion logic (Handoff)
        if (payload.status === "completed") {
          // ensure profile is active
          await supabase.from("profiles").update({ is_active: true }).eq("id", values.apprenticeId);
          await supabase.from("apprentice_records").update({ status: "active" }).eq("profile_id", values.apprenticeId);
          // Handoff is naturally tracked via "completed" status in DB which finance can query.
        }`;

const admissionHandoffReplace = `        // DP Admission Completion logic (Handoff)
        if (payload.status === "completed") {
          // ensure profile is active
          await supabase.from("profiles").update({ is_active: true }).eq("id", values.apprenticeId);
          await supabase.from("apprentice_records").update({ status: "active" }).eq("profile_id", values.apprenticeId);

          await supabase.from("tasks").insert({
             title: "Admissão Concluída (Handoff)",
             description: "A admissão do jovem foi concluída pelo DP. Configure recorrências e contratos aplicáveis (Handoff DP -> Financeiro).",
             category: "finance",
             company_id: values.companyId,
             apprentice_id: values.apprenticeId,
             created_by: state.profile.id
          });
        }`;

content = content.replace(admissionHandoffSearch, admissionHandoffReplace);


fs.writeFileSync('src/app.js', content);
