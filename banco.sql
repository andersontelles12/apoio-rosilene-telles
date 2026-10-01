CREATE DATABASE IF NOT EXISTS apoio_psicologico;
USE apoio_psicologico;

CREATE TABLE IF NOT EXISTS usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    senha VARCHAR(255) NOT NULL,
    telefone VARCHAR(20),
    data_cadastro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS profissionais (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    especialidade VARCHAR(100) NOT NULL,
    descricao TEXT,
    ativo BOOLEAN DEFAULT TRUE
);

INSERT IGNORE INTO profissionais (nome, especialidade, descricao)
VALUES ('Rosilene Telles', 'Psicóloga Clínica — CRP ativo',
'Atendimento humanizado, terapia individual, acompanhamento emocional e suporte psicológico. Espaço seguro e acolhedor.');

CREATE TABLE IF NOT EXISTS agendamentos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    data_agendamento DATE NOT NULL,
    horario VARCHAR(20) NOT NULL,
    observacao TEXT,
    status ENUM('pendente','confirmado','cancelado') DEFAULT 'pendente',
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);
