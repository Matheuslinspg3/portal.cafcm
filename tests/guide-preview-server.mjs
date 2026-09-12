// Local visual verification only. This server is never part of dist or the production build.
// All reads use in-memory fixtures; writes and outbound requests are rejected.
import { createServer } from 'node:http';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

const root = fileURLToPath(new URL('../', import.meta.url));
const appSource = await readFile(new URL('../src/app.js', import.meta.url), 'utf8');
const fixture = `
  export function createClient() {
    const fixtures = {
      profiles: [{id:'person', full_name:'Jovem de verificação', role:'apprentice', is_active:true, company_id:'company'}],
      companies: [{id:'company', name:'Empresa de verificação', is_active:true}],
      courses: [{id:'course', title:'Curso de verificação', status:'draft', workload_hours:10, category:'Formação'}],
      lessons: [{id:'lesson', course_id:'course', title:'Aula de verificação', position:0}],
      pipelines: [{id:'pipeline',name:'Esteira de verificação',description:'Fluxo local',color:'#0968e8'}],
      pipeline_stages: [{id:'stage',pipeline_id:'pipeline',name:'Em andamento',color:'#0968e8'}],
    };
    return {
      from(table) {
        let single = false;
        const data = fixtures[table] || [];
        const result = () => ({data:single ? data[0] || {} : data,error:null,count:data.length});
        const chain = new Proxy({}, {get(_, name) {
          if (name === 'then') return (resolve,reject) => Promise.resolve(result()).then(resolve,reject);
          if (name === 'single' || name === 'maybeSingle') return () => {single=true;return chain;};
          if (['insert','upsert','update','delete'].includes(name)) return () => {throw Error('Gravação bloqueada na verificação visual');};
          return () => chain;
        }});
        return chain;
      },
      rpc:async()=>({data:{metrics:[],bottlenecks:[],stages:[],targets:[],productivity:{}},error:null}),
      auth:{},
    };
  }
`;
const startup = `
  const fixtureParams = new URLSearchParams(location.search);
  state.profile = {id:'review',full_name:'Verificação local',role:fixtureParams.get('role') || 'cafcm_admin',department:fixtureParams.get('department') || 'management'};
  state.view = fixtureParams.get('view') || 'finance';
  state.financeTab = fixtureParams.get('tab') || 'payable';
  state.selectedCourseId = 'course';
  state.selectedLessonId = state.view === 'lesson-editor' ? 'lesson' : null;
  callAdmin = async () => ({users:[], companies:[], audit:[]});
  renderPortal();
`;
const compiled = await build({
  stdin: { contents: 'const fetch = async () => { throw Error("Requisição externa bloqueada"); };\n' + appSource.replace(/init\(\);\s*$/, startup), resolveDir: root + 'src', sourcefile: 'guide-verification.js' },
  bundle: true, write: false, format: 'iife', target: 'es2022',
  plugins: [{name:'local-fixtures',setup(builder){
    builder.onResolve({filter:/^@supabase\/supabase-js$/},()=>({path:'fixtures',namespace:'local-fixtures'}));
    builder.onLoad({filter:/.*/,namespace:'local-fixtures'},()=>({contents:fixture,loader:'js'}));
  }}],
});
const css = await readFile(new URL('../dist/styles.css', import.meta.url));
const html = '<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><link rel="stylesheet" href="./styles.css"><title>Verificação local do guia</title></head><body><div id="app"></div><script src="./app.js"></script></body></html>';
if (process.argv[2] === '--export') {
  const output = resolve(process.argv[3]);
  await mkdir(output, {recursive:true});
  await writeFile(resolve(output,'index.html'),html);
  await writeFile(resolve(output,'app.js'),compiled.outputFiles[0].contents);
  await writeFile(resolve(output,'styles.css'),css);
  await writeFile(resolve(output,'mobile.html'), '<!doctype html><html lang="pt-BR"><meta charset="utf-8"><title>Verificação em tela pequena</title><iframe title="Portal em tela pequena" src="./index.html" style="width:390px;height:760px;border:1px solid #bbb"></iframe></html>');
  console.log('Prévia isolada exportada.');
} else createServer((req,res)=>{
  res.setHeader('Cache-Control','no-store');
  if(req.url === '/app.js'){res.setHeader('Content-Type','text/javascript');res.end(compiled.outputFiles[0].contents);}
  else if(req.url === '/styles.css'){res.setHeader('Content-Type','text/css');res.end(css);}
  else {res.setHeader('Content-Type','text/html');res.end(html);}
}).listen(4173,'127.0.0.1',()=>console.log('Verificação local do guia na porta 4173'));
