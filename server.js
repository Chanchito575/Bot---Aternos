const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const STATUS_FILE = path.join(__dirname, 'status.json');

app.use(express.json());
app.use(express.static('public'));

// Inicializar estado si no existe
if (!fs.existsSync(STATUS_FILE)) {
  fs.writeFileSync(STATUS_FILE, JSON.stringify({ mantenimiento: false, erroresConexion: 0 }));
}

app.get('/api/status', (req, res) => {
  const data = JSON.parse(fs.readFileSync(STATUS_FILE));
  res.json(data);
});

app.post('/api/mantenimiento', (req, res) => {
  const { estado } = req.body;
  const data = JSON.parse(fs.readFileSync(STATUS_FILE));
  data.mantenimiento = estado;
  fs.writeFileSync(STATUS_FILE, JSON.stringify(data, null, 2));
  console.log(`[Panel Web] Modo Mantenimiento cambiado a: ${estado}`);
  res.json({ success: true, mantenimiento: estado });
});

app.listen(PORT, () => {
  console.log(`[Servidor Web] Panel corriendo en el puerto ${PORT}`);
});
