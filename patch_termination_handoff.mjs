import fs from 'fs';
let content = fs.readFileSync('src/app.js', 'utf8');

const termSearch = `        if (newItems.length) {
          const { data: lastItems, error: lastError } = await supabase.from("termination_checklist_items").select("position").eq("termination_id", id).order("position", { ascending: false }).limit(1);
          if (lastError) throw lastError;
          const startPosition = lastItems?.[0]?.position || 0;
          const { error: insertError } = await supabase.from("termination_checklist_items").insert(newItems.map((title, i) => ({ termination_id: id, title, is_required: false, is_completed: false, position: startPosition + 1000 * (i + 1), created_by: state.profile.id })));
          if (insertError) throw insertError;
        }
      }
      closeOverlay();
      showToast(id ? "Desligamento atualizado." : "Processo de desligamento aberto com sucesso.");
      return renderView();`;

const termReplace = `        if (newItems.length) {
          const { data: lastItems, error: lastError } = await supabase.from("termination_checklist_items").select("position").eq("termination_id", id).order("position", { ascending: false }).limit(1);
          if (lastError) throw lastError;
          const startPosition = lastItems?.[0]?.position || 0;
          const { error: insertError } = await supabase.from("termination_checklist_items").insert(newItems.map((title, i) => ({ termination_id: id, title, is_required: false, is_completed: false, position: startPosition + 1000 * (i + 1), created_by: state.profile.id })));
          if (insertError) throw insertError;
        }
      }

      if (payload.status === "completed") {
         await supabase.from("profiles").update({ is_active: false }).eq("id", values.apprenticeId);
         await supabase.from("apprentice_records").update({ status: "inactive" }).eq("profile_id", values.apprenticeId);
      }

      closeOverlay();
      showToast(id ? "Desligamento atualizado." : "Processo de desligamento aberto com sucesso.");
      return renderView();`;

content = content.replace(termSearch, termReplace);
fs.writeFileSync('src/app.js', content);
