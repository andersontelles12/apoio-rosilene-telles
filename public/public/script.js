let usuario = null;
const socket = io();
const RTC = {iceServers:[{urls:'stun:stun.l.google.com:19302'}]};
let conexao, fluxo;

fetch('/profissional').then(r=>r.json()).then(d=>{
  document.getElementById('dados').innerHTML = `<strong>${d.nome}</strong><br><em>${d.especialidade}</em><br><p>${d.descricao}</p>`;
});

function mostrar(nome){
  document.querySelectorAll('.tela').forEach(t=>t.classList.remove('ativa'));
  document.getElementById(nome).classList.add('ativa');
}

async function gravarCadastro(e){
  e.preventDefault();
  const r = await fetch('/cadastro',{
    method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({
      nome:document.getElementById('c-nome').value,
      email:document.getElementById('c-email').value,
      telefone:document.getElementById('c-tel').value,
      senha:document.getElementById('c-senha').value
    })
  });
  const d = await r.json();
  document.getElementById('msg-c').textContent = d.erro||d.mensagem;
  document.getElementById('msg-c').className = r.ok?'sucesso':'erro';
  if(d.sucesso) setTimeout(()=>mostrar('login'),1800);
}

async function entrar(e){
  e.preventDefault();
  const r = await fetch('/login',{
    method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({
      email:document.getElementById('l-email').value,
      senha:document.getElementById('l-senha').value
    })
  });
  const d = await r.json();
  if(d.sucesso){usuario=d.nome;document.getElementById('nome').textContent=d.nome;mostrar('paciente');}
  else{document.getElementById('msg-l').textContent=d.erro;document.getElementById('msg-l').className='erro';}
}

function sair(){usuario=null;if(fluxo)encerrar();mostrar('inicial')}

async function gravarAgendamento(e){
  e.preventDefault();
  const r = await fetch('/agendar',{
    method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({
      email:document.getElementById('l-email').value,
      data:document.getElementById('ag-data').value,
      horario:document.getElementById('ag-hora').value,
      mensagem:document.getElementById('ag-msg').value
    })
  });
  const d = await r.json();
  document.getElementById('msg-ag').textContent = d.erro||d.mensagem;
  document.getElementById('msg-ag').className = r.ok?'sucesso':'erro';
  if(d.sucesso) setTimeout(()=>mostrar('paciente'),2000);
}

async function iniciarChamada(){
  mostrar('video');
  try{
    fluxo = await navigator.mediaDevices.getUserMedia({video:true,audio:true});
    document.getElementById('eu').srcObject = fluxo;
    conexao = new RTCPeerConnection(RTC);
    fluxo.getTracks().forEach(t=>conexao.addTrack(t,fluxo));
    conexao.ontrack = e=>{document.getElementById('ela').srcObject=e.streams[0];document.getElementById('status').textContent='✅ Conectada!';};
    conexao.onicecandidate = e=>{if(e.candidate)socket.emit('candidato',e.candidate)};
    socket.on('oferta',async o=>{await conexao.setRemoteDescription(new RTCSessionDescription(o));const r=await conexao.createAnswer();await conexao.setLocalDescription(r);socket.emit('resposta',r);});
    socket.on('resposta',async r=>await conexao.setRemoteDescription(new RTCSessionDescription(r)));
    socket.on('candidato',async c=>{if(c)await conexao.addIceCandidate(new RTCIceCandidate(c))});
    const oferta = await conexao.createOffer();await conexao.setLocalDescription(oferta);socket.emit('oferta',oferta);
    document.getElementById('status').textContent='🔔 Chamando...';
  }catch{document.getElementById('status').textContent='❌ Permita câmera/microfone';}
}

function encerrar(){if(fluxo)fluxo.getTracks().forEach(t=>t.stop());if(conexao)conexao.close();mostrar('paciente');}
