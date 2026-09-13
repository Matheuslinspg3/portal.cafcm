import fs from 'fs';
let content = fs.readFileSync('src/app.js', 'utf8');

const conversionCheckSearch = `
    if (type === "candidate-conversion") {
      const { data: application, error } = await supabase.from("vacancy_applications").select("id,candidate_id,vacancy_id,status").eq("id", recordId).single();`;
const conversionCheckReplace = `
    if (type === "candidate-conversion") {
      const { data: application, error } = await supabase.from("vacancy_applications").select("id,candidate_id,vacancy_id,status").eq("id", recordId).single();`;

content = content.replace(conversionCheckSearch, conversionCheckReplace);
fs.writeFileSync('src/app.js', content);
