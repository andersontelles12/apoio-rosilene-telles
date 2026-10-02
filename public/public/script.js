let usuario = null;

// Mostrar/esconder telas
function mostrar(nome){
  document.querySelectorAll('.tela').forEach(t=>t.classList.remove('ativa'));
  document.getElementById(nome).classList.add('ativa');
}

// Calcular idade automaticamente
function calcularIdade(nascimento) {
  const nasc = new Date(nascimento);
  const hoje = new Date();
  let idade = hoje.getFullYear() - nasc.getFullYear();
  const m = hoje.getMonth() - nasc.getMonth();
  if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) idade--;
  return idade;
}
function atualizarIdade() {
  const nasc = document.getElementById('c-nascimento').value;
  if (nasc) {
    document.getElementById('mostrar-idade').textContent = 'Idade: ' + calcularIdade(nasc) + ' anos';
  }
}

// Cadastro
async function gravarCadastro(e){
  e.preventDefault();
  const r = await fetch('/cadastro', {
    method:'POST', headers:{'Content-Type':'application/json'},
    body:JSON.stringify({
      nome: document.getElementById('c-nome').value,
      nascimento: document.getElementById('c-nascimento').value,
      cidade: document.getElementById('c-cidade').value,
      email: document.getElementById('c-email').value,
      senha: document.getElementById('c-senha').value
    })
  });
  const d = await r.json();
  document.getElementById('msg-c').textContent = d.erro || d.mensagem;
  document.getElementById('msg-c').className = r.ok ? 'sucesso' : 'erro';
  if (d.sucesso) setTimeout(()=>mostrar('login'), 2000);
}

// Login
async function entrar(e){
  e.preventDefault();
  const r = await fetch('/login', {
    method:'POST', headers:{'Content-Type':'application/json'},
    body:JSON.stringify({
      email: document.getElementById('l-email').value,
      senha: document.getElementById('l-senha').value
    })
  });
  const d = await r.json();
  if (d.sucesso) {
    usuario = d.nome;
    document.getElementById('nome').textContent = d.nome;
    mostrar('paciente');
  } else {
    document.getElementById('msg-l').textContent = d.erro;
    document.getElementById('msg-l').className = 'erro';
  }
}

// Recuperar Senha
async function enviarRecuperacao(e){
  e.preventDefault();
  const email = document.getElementById('rec-email').value;
  
  // Aviso: em produção configurar no Supabase
  document.getElementById('msg-rec').innerHTML = 
    `<span class="sucesso">✅ Se este e-mail estiver cadastrado, você receberá um link de redefinição em breve!</span>`;
  
  // Instrução: configurar no Supabase → Authentication → Settings → Redirect URL
  // Adicionar: https://apoio-rosilene-telles.onrender.com/
  
  setTimeout(()=>mostrar('login'), 3000);
}

// Sair
function sair(){
  usuario = null;
  mostrar('inicial');
}

// Agendamento
async function gravarAgendamento(e){
  e.preventDefault();
  const r = await fetch('/agendar', {
    method:'POST', headers:{'Content-Type':'application/json'},
    body:JSON.stringify({
      email: document.getElementById('l-email').value || prompt('Digite seu e-mail:'),
      data: document.getElementById('ag-data').value,
      horario: document.getElementById('ag-hora').value,
      observacao: document.getElementById('ag-msg').value
    })
  });
  const d = await r.json();
  document.getElementById('msg-ag').textContent = d.erro || d.mensagem;
  document.getElementById('msg-ag').className = r.ok ? 'sucesso' : 'erro';
  if (d.sucesso) setTimeout(()=>mostrar('paciente'), 2500);
}
