// Solo sviluppo: non usa mai --remote e non modifica database già popolati.
import {webcrypto} from 'node:crypto';import {spawnSync} from 'node:child_process';import {hashPassword} from '../src/auth.js';
globalThis.crypto??=webcrypto;
const password=process.env.GYMTIME_LOCAL_PASSWORD,username=process.env.GYMTIME_LOCAL_USERNAME||'adminlocale';
if(!password||password.length<8||!/^[a-zA-Z0-9._-]{3,30}$/.test(username)){console.error('Imposta una password locale di almeno 8 caratteri e uno username valido.');process.exit(1);}
const q=s=>"'"+s.replace(/'/g,"''")+"'",hash=await hashPassword(password);
const sql=`INSERT INTO utenti(nome,username,password_hash,ruolo,cambio_password) SELECT 'Admin locale',${q(username)},${q(hash)},'admin',0 WHERE NOT EXISTS(SELECT 1 FROM utenti); SELECT username,ruolo FROM utenti WHERE username=${q(username)};`;
const env={...process.env};delete env.GYMTIME_LOCAL_PASSWORD;
const r=spawnSync(process.platform==='win32'?'npx.cmd':'npx',['--no-install','wrangler','d1','execute','gymtime','--local','--config','wrangler.toml','--command',sql],{stdio:'inherit',env});
process.exitCode=r.status??1;
