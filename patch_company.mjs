import fs from 'fs';
let content = fs.readFileSync('src/app.js', 'utf8');

// I accidentally matched the company form above, need to revert it.
const wrongReplace = `      if (payload.status === "completed") {
         await supabase.from("profiles").update({ is_active: false }).eq("id", values.apprenticeId);
         await supabase.from("apprentice_records").update({ status: "inactive" }).eq("profile_id", values.apprenticeId);
      }
      closeOverlay();
      showToast(values.companyId ? "Dados da empresa atualizados." : "Empresa cadastrada.");
      return renderView();`;

const correctReplace = `      closeOverlay();
      showToast(values.companyId ? "Dados da empresa atualizados." : "Empresa cadastrada.");
      return renderView();`;

content = content.replace(wrongReplace, correctReplace);
fs.writeFileSync('src/app.js', content);
