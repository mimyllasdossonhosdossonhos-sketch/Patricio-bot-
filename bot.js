const { default: makeWASocket, useMultiFileAuthState, makeCacheableSignalKeyStore } = require('@whiskeysockets/baileys')
const pino = require('pino'); const fs = require('fs'); const readline = require('readline')
const DB='./grupos.json'; if(!fs.existsSync(DB)) fs.writeFileSync(DB,'{}')
const get=()=>JSON.parse(fs.readFileSync(DB)); const save=(d)=>fs.writeFileSync(DB,JSON.stringify(d,null,2))
const rl=readline.createInterface({input:process.stdin, output:process.stdout}); const q=t=>new Promise(r=>rl.question(t,r))
const diasRest=(exp)=>{ if(!exp) return 0; return Math.ceil((exp-Date.now())/86400000) }

async function start(){
  const { state, saveCreds } = await useMultiFileAuthState('auth')
  const sock = makeWASocket({logger:pino({level:'silent'}), auth:{creds:state.creds, keys:makeCacheableSignalKeyStore(state.keys, pino({level:'silent'}))}, browser:['AZ-CRACK','Chrome','1.0']})
  if(!sock.authState.creds.registered){ const num=await q('Numero 258...: '); const code=await sock.requestPairingCode(num.trim()); console.log(`\n=== CODIGO: ${code} ===\n`)}
  sock.ev.on('creds.update', saveCreds)

  sock.ev.on('messages.upsert', async(m)=>{
    const msg=m.messages[0]; if(!msg.message||msg.key.fromMe) return
    const texto=msg.message.conversation||msg.message.extendedTextMessage?.text||''; const jid=msg.key.remoteJid
    if(!jid.endsWith('@g.us')) return
    let db=get()
    if(!db[jid]) db[jid]={ mpesa:[], mola:[], concorrentes:[], burladores:[], nanos:{}, config:{ antilink:false, antiaudio:false, antifoto:false, antivideo:false, antistatus:false, anticoncorrencia:true, avisos:true, bemvindo:true, despedida:false, compras:true, ranking:true, vip:true, vendas:true, estatisticas:true, automacao:true, ai:false, detector:true, removeburlador:true, alarme:false, nano:true, expira: Date.now()+30*86400000, dias:30, lucro:0, boas:'Bem-vindo @user ao grupo! 🔥', despedidaMsg:'Adeus @user 👋' }, compras:[], avisosList:[], ranking:{} }
    const lower=texto.trim().toLowerCase(); const args=texto.trim(); const saveNow=()=>save(db)
    const exp=db[jid].config.expira; const dRest=diasRest(exp); const expirado=Date.now()>exp

    if(lower.startsWith('.bot')){
      if(expirado) { await sock.sendMessage(jid,{text:`❌ *BOT EXPIRADO*\nID: ${jid}\nExpirou há ${Math.abs(dRest)} dias\nPara renovar: .renovar 30`}); return }
      await sock.sendMessage(jid,{text:`🤖 *AZ-CRACK BOT*\n✅ Ativo - Dias: ${dRest}\nExpira: ${new Date(exp).toLocaleDateString()}\nAI: ${db[jid].config.ai?'ON':'OFF'}\nVendas: ${db[jid].compras.length}`}); return
    }
    if(lower.startsWith('.renovar')||lower.startsWith('.verificar')){
      const idVer=args.split(' ')[1]; const isId=idVer && idVer.includes('@g.us')
      if(lower.startsWith('.verificar') && isId){ const g=db[idVer]; await sock.sendMessage(jid,{text:g?`🔍 ID: ${idVer}\nDias: ${diasRest(g.config.expira)}\nStatus: ${Date.now()>g.config.expira?'EXPIRADO':'ATIVO'}`:'Grupo não encontrado'}); return }
      const qtd=parseInt(args.split(' ')[1])||30; if(qtd>0){ db[jid].config.expira=Date.now()+qtd*86400000; db[jid].config.dias=qtd; saveNow(); await sock.sendMessage(jid,{text:`✅ Renovado +${qtd} dias\nVence: ${new Date(db[jid].config.expira).toLocaleDateString()}`}); return }
    }
    if(expirado){ if(['.compra','.','nano','.clientes'].some(c=>lower.includes(c))){ await sock.sendMessage(jid,{text:`🚫 *BLOQUEADO - ALUGUER EXPIRADO*\nDigite .bot`}); return } }

    if(lower.startsWith('.addconcorrente')){ db[jid].concorrentes.push(args.slice(14).trim()); saveNow(); await sock.sendMessage(jid,{text:'✅ Concorrente adicionado'}); return }
    if(lower.startsWith('.removeconcorrente')){ db[jid].concorrentes.splice(parseInt(args.split(' ')[1])||0,1); saveNow(); await sock.sendMessage(jid,{text:'🗑️ Concorrente removido'}); return }
    if(lower.startsWith('.addmpesa')){ db[jid].mpesa.push(args.slice(9).trim()); saveNow(); await sock.sendMessage(jid,{text:`✅ M-Pesa: ${args.slice(9)}`}); return }
    if(lower.startsWith('.addmola')){ db[jid].mola.push(args.slice(8).trim()); saveNow(); await sock.sendMessage(jid,{text:'✅ E-Mola adicionada'}); return }
    if(lower.startsWith('.delmpesa')){ db[jid].mpesa.splice(parseInt(args.split(' ')[1])||0,1); saveNow(); await sock.sendMessage(jid,{text:'🗑️ M-Pesa removida'}); return }
    if(lower.startsWith('.delmola')){ db[jid].mola.splice(parseInt(args.split(' ')[1])||0,1); saveNow(); await sock.sendMessage(jid,{text:'🗑️ E-Mola removida'}); return }
    if(lower==='.'||lower==='.contas'){ await sock.sendMessage(jid,{text:`💳 *
