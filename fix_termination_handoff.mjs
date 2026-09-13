import fs from 'fs';
let content = fs.readFileSync('src/app.js', 'utf8');

// Replace the end of termination form logic to properly set inactive AND inactive on profiles
const termSearch = `      }
      await supabase.from("apprentice_records").upsert({ profile_id: values.apprenticeId, status: payload.status === "completed" ? "inactive" : "termination" });
      closeOverlay(); showToast("Desligamento salvo."); return renderView();
    }`;

const termReplace = `      }
      if (payload.status === "completed") {
         await supabase.from("profiles").update({ is_active: false }).eq("id", values.apprenticeId);
      }
      await supabase.from("apprentice_records").upsert({ profile_id: values.apprenticeId, status: payload.status === "completed" ? "inactive" : "termination" });
      closeOverlay(); showToast("Desligamento salvo."); return renderView();
    }`;

content = content.replace(termSearch, termReplace);

fs.writeFileSync('src/app.js', content);
