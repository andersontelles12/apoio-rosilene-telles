require('dotenv').config();
const express = require('express');
const bcrypt = require('bcryptjs');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const servidor = http.createServer(app);
const io = socketIo(servidor, { cors: { origin: "*" } });
const PORTA = process.env.PORT || 3000;

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY
);

app.use(express.json());
app.use(express.static('public'));

// Calcular idade
function calcularIdade(nascimento) {
  const nasc = new Date(nascimento);
  const hoje = new Date();
  let idade = hoje.getFullYear() - nasc.getFullYear();
  const m = hoje.getMonth() - nasc.getMonth();
  if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) idade--;
  return idade;
}

// Dados da profissional
app.get('/profissional', async (req, res) => {
  const { data } = await supabase.from('profissionais').select('*').eq('ativo', true).limit(1).single();
  res.json(data || { nome: 'Rosilene Telles', especialidade: 'Psicóloga Clínica', crp: 'CRP: 06/217811' });
});

// Cadastro
app.post('/cadastro', async (req, res) => {
  const { nome, nascimento, cidade, email, senha } = req.body;
  if (!nome || !nascimento || !email || !senha)
    return res.status(400).json({erro: 'Preencha todos os campos obrigatórios'});

  const idade = calcularIdade(nascimento);
  const senhaHash = await bcrypt.hash(senha, 12);

  const { data, error } = await supabase.from('pacientes').insert({
    nome_completo: nome, data_nascimento: nascimento, idade, cidade, email, senha_hash: senhaHash
  }).select();

  if (error) return res.status(409).json({erro: 'E-mail já cadastrado'});
  res.json({sucesso: true, mensagem: 'Conta criada! Bem-vindo(a) 💙'});
});

// Login
app.post('/login', async (req, res) => {
  const { email, senha } = req.body;
  const { data } = await supabase.from('pacientes').select('id, nome_completo, senha_hash').eq('email', email).maybeSingle();
  
  if (!data) return res.status(401).json({erro: 'E-mail ou senha incorretos'});
  const ok = await bcrypt.compare(senha, data.senha_hash);
  if (!ok) return res.status(401).json({erro: 'E-mail ou senha incorretos'});
  
  res.json({sucesso: true, nome: data.nome_completo, id: data.id});
});

// Agendamento
app.post('/agendar', async (req, res) => {
  const { email, data, horario, observacao } = req.body;
  const { data: usuario } = await supabase.from('pacientes').select('id').eq('email', email).maybeSingle();
  if (!usuario) return res.status(404).json({erro: 'Faça login primeiro'});

  const { error } = await supabase.from('agendamentos').insert({
    paciente_id: usuario.id, data_agendamento: data, horario, observacao
  });
  if (error) return res.status(400).json({erro: 'Erro ao agendar'});
  res.json({sucesso: true, mensagem: 'Agendado com sucesso! 💙'});
});

// Videochamada WebRTC
const sala = 'sala-rt-psicologia';
io.on('connection', (socket) => {
  socket.join(sala);
  socket.on('oferta', d => socket.to(sala).emit('oferta', d));
  socket.on('resposta', d => socket.to(sala).emit('resposta', d));
  socket.on('candidato', d => socket.to(sala).emit('candidato', d));
});

servidor.listen(PORTA, () => console.log('🚀 R\\T Psicologia rodando na porta ' + PORTA));
