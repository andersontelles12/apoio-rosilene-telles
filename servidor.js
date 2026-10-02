require('dotenv').config();
const express = require('express');
const mysql = require('mysql2');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const servidor = http.createServer(app);
const io = socketIo(servidor, { cors: { origin: "*" } });

const PORTA = process.env.PORT || 3000;
const CHAVE_JWT = process.env.CHAVE_JWT || 'chave_segura_rosilene_2026';

// Conexão com Banco
const db = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USUARIO || 'root',
  password: process.env.DB_SENHA || '',
  database: process.env.DB_NOME || 'apoio_psicologico',
  waitForConnections: true,
  connectionLimit: 5
});

db.getConnection((erro) => {
  if (erro) console.error('❌ Banco:', erro.message);
  else console.log('✅ Banco conectado');
});

app.use(express.json());
app.use(express.static('public'));

// Página inicial
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Dados da profissional
app.get('/profissional', async (req, res) => {
  const { data, error } = await supabase
    .from('profissionais')
    .select('*')
    .eq('ativo', true)
    .limit(1)
    .single();
  
  if (error || !data) return res.status(404).json({erro: 'Profissional não encontrada'});
  res.json(data);
});

// Cadastro
app.post('/cadastro', async (req, res) => {
  const { nome, email, senha, telefone } = req.body;
  if (!nome || !email || !senha) return res.status(400).json({erro: 'Preencha tudo'});
  try {
    const senhaCript = await bcrypt.hash(senha, 12);
    db.query('INSERT INTO usuarios (nome, email, senha, telefone) VALUES (?, ?, ?, ?)',
      [nome, email, senhaCript, telefone], (erro) => {
        if (erro) return res.status(409).json({erro: 'E-mail já existe'});
        res.json({sucesso: true, mensagem: 'Conta criada! 💙'});
      });
  } catch { res.status(500).json({erro: 'Erro'}) }
});

// Login
app.post('/login', (req, res) => {
  const { email, senha } = req.body;
  db.query('SELECT * FROM usuarios WHERE email = ?', [email], async (erro, resul) => {
    if (erro || !resul?.length) return res.status(401).json({erro: 'Dados incorretos'});
    const usuario = resul[0];
    const ok = await bcrypt.compare(senha, usuario.senha);
    if (!ok) return res.status(401).json({erro: 'Dados incorretos'});
    const token = jwt.sign({ id: usuario.id, nome: usuario.nome }, CHAVE_JWT, { expiresIn: '8h' });
    res.json({ sucesso: true, token, nome: usuario.nome });
  });
});

// Agendamento
app.post('/agendar', (req, res) => {
  const { email, data, horario, mensagem } = req.body;
  db.query('SELECT id FROM usuarios WHERE email = ?', [email], (erro, resul) => {
    if (erro || !resul?.length) return res.status(404).json({erro: 'Faça login primeiro'});
    db.query('INSERT INTO agendamentos (usuario_id, data_agendamento, horario, observacao) VALUES (?, ?, ?, ?)',
      [resul[0].id, data, horario, mensagem], (erro) => {
        if (erro) return res.status(400).json({erro: 'Erro ao agendar'});
        res.json({sucesso: true, mensagem: 'Agendado! 💙'});
      });
  });
});

// Videochamada WebRTC
const sala = 'sala-rosilene';
io.on('connection', (socket) => {
  console.log('📞 Conectado:', socket.id);
  socket.join(sala);
  socket.on('oferta', d => socket.to(sala).emit('oferta', d));
  socket.on('resposta', d => socket.to(sala).emit('resposta', d));
  socket.on('candidato', d => socket.to(sala).emit('candidato', d));
});

servidor.listen(PORTA, () => console.log(`🚀 Rodando na porta ${PORTA}`));
