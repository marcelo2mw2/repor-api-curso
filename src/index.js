const express = require('express');
const cors = require('cors');
const pool = require('./database');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Função de validação de email
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', timestamp: new Date() });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// GET - Buscar todos os registros
app.get('/api/chaves', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM codigosliberacao ORDER BY idcodigo');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      message: error.message,
      code: error.code
    });
  }
});

// GET - Buscar por idcodigo
app.get('/api/chaves/:idcodigo', async (req, res) => {
  try {
    const { idcodigo } = req.params;
    const { rows } = await pool.query('SELECT * FROM codigosliberacao WHERE idcodigo = $1', [idcodigo]);
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Registro não encontrado' });
    }
    
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      message: error.message,
      code: error.code
    });
  }
});

// GET - Buscar por codigo
app.get('/api/chaves/codigo/:codigo', async (req, res) => {
  try {
    const { codigo } = req.params;
    const { rows } = await pool.query('SELECT * FROM codigosliberacao WHERE codigo = $1', [codigo]);
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Registro não encontrado' });
    }
    
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      message: error.message,
      code: error.code
    });
  }
});

// GET - Buscar por email
app.get('/api/chaves/email/:email', async (req, res) => {
  try {
    const { email } = req.params;
    const { rows } = await pool.query('SELECT * FROM codigosliberacao WHERE email = $1', [email]);
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Registro não encontrado' });
    }
    
    res.json(rows);
  } catch (error) {
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      message: error.message,
      code: error.code
    });
  }
});

// POST - Criar um novo registro
app.post('/api/chaves', async (req, res) => {
  try {
    const { idcodigo, codigo, emuso, nome, email, chave1, chave2, chave3, valorhash } = req.body;
    
    // Validações
    if (!idcodigo || !codigo || !emuso || !nome || !email || !chave1 || !chave2 || !chave3 || !valorhash) {
      return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ error: 'Email inválido' });
    }

    if (emuso !== 'S' && emuso !== 'N') {
      return res.status(400).json({ error: "'emuso' deve ser 'S' ou 'N'" });
    }

    // Verificar código duplicado
    const existingCode = await pool.query('SELECT * FROM codigosliberacao WHERE codigo = $1', [codigo]);
    if (existingCode.rows.length > 0) {
      return res.status(409).json({ error: 'Código já existe' });
    }

    const { rows } = await pool.query(
      `INSERT INTO codigosliberacao 
       (idcodigo, codigo, emuso, nome, email, chave1, chave2, chave3, valorhash) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
       RETURNING *`,
      [idcodigo, codigo, emuso, nome, email, chave1, chave2, chave3, valorhash]
    );

    res.status(201).json(rows[0]);
  } catch (error) {
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      message: error.message,
      code: error.code
    });
  }
});

// PUT - Atualizar um registro
app.put('/api/chaves/:idcodigo', async (req, res) => {
  try {
    const { idcodigo } = req.params;
    const { emuso, nome, email, chave1, chave2, chave3, valorhash } = req.body;
    
    // Validações
    if (!isValidEmail(email)) {
      return res.status(400).json({ error: 'Email inválido' });
    }

    if (emuso !== 'S' && emuso !== 'N') {
      return res.status(400).json({ error: "'emuso' deve ser 'S' ou 'N'" });
    }
    
    const { rows } = await pool.query(
      `UPDATE codigosliberacao 
       SET emuso = $1, 
           nome = $2, 
           email = $3, 
           chave1 = $4, 
           chave2 = $5, 
           chave3 = $6, 
           valorhash = $7 
       WHERE idcodigo = $8 
       RETURNING *`,
      [emuso, nome, email, chave1, chave2, chave3, valorhash, idcodigo]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Registro não encontrado' });
    }
    
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      message: error.message,
      code: error.code
    });
  }
});

// DELETE - Remover um registro
app.delete('/api/chaves/:idcodigo', async (req, res) => {
  try {
    const { idcodigo } = req.params;
    const { rows } = await pool.query('DELETE FROM codigosliberacao WHERE idcodigo = $1 RETURNING *', [idcodigo]);
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Registro não encontrado' });
    }
    
    res.json({ message: 'Registro removido com sucesso' });
  } catch (error) {
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      message: error.message,
      code: error.code
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});