import fs from 'fs';
let content = fs.readFileSync('src/app.js', 'utf8');

const admissionHandoffSearch = `            const { error } = await supabase.from("admission_checklist_items").update({ is_completed: complete }).eq("id", check.id);
            if (error) throw error;
          }
        }`;
const admissionHandoffReplace = `            const { error } = await supabase.from("admission_checklist_items").update({ is_completed: complete }).eq("id", check.id);
            if (error) throw error;
          }
        }

        // DP Admission Completion logic (Handoff)
        if (payload.status === "completed") {
          // ensure profile is active
          await supabase.from("profiles").update({ is_active: true }).eq("id", values.apprenticeId);
          await supabase.from("apprentice_records").update({ status: "active" }).eq("profile_id", values.apprenticeId);
          // Handoff is naturally tracked via "completed" status in DB which finance can query.
        }`;

content = content.replace(admissionHandoffSearch, admissionHandoffReplace);

// Let's add similar logic for termination.

const terminationHandoffSearch = `      const { error } = await query;
      if (error) throw error;`;
const terminationHandoffReplace = `      const { error } = await query;
      if (error) throw error;

      // Handoff to finance logic for termination
      if (payload.status === "completed") {
         await supabase.from("profiles").update({ is_active: false }).eq("id", values.apprenticeId);
         await supabase.from("apprentice_records").update({ status: "inactive" }).eq("profile_id", values.apprenticeId);
      }`;

content = content.replace(terminationHandoffSearch, terminationHandoffReplace);

fs.writeFileSync('src/app.js', content);
