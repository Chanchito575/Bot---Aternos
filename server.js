const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 10000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Archivo donde los bots reportarán su estado actual
const STATUS_FILE = path.join(__dirname, 'bot_status.json');

// Inicializar el estado si no existe
if (!fs.existsSync(STATUS_FILE)) {
  const initialState = {
    bot1: { name: 'Chino 2334', status: 'offline', lastUpdate: null },
    bot2: { name: 'elpapu3196', status: 'offline', lastUpdate: null },
    serverIp: '1.26.50.5:45026'
  };
  fs.writeFileSync(STATUS_FILE, JSON.stringify(initialState, null, 2));
}

// Endpoint para que la página web consulte el estado real
app.get('/api/status', (req, res) => {
  try {
    const data = JSON.parse(fs.readFileSync(STATUS_FILE, 'utf8'));
    
    // Si un bot no actualiza su estado en más de 45 segundos, marcarlo como offline
    const now = Date.now();
    ['bot1', 'bot2'].forEach(botKey => {
      if (data[botKey].lastUpdate && (now - data[botKey].lastUpdate > 45000)) {
        data[botKey].status = 'offline';
      }
    });

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Error al leer el estado' });
  }
});

// Endpoint para que los bots actualicen su estado
app.post('/api/update-bot', (req, res) => {
  const { botId, status, name } = req.body;
  if (!botId) return res.status(400).send('Falta botId');

  try {
    let data = {};
    if (fs.existsSync(STATUS_FILE)) {
      data = JSON.parse(fs.readFileSync(STATUS_FILE, 'utf8'));
    }
    
    data[botId] = {
      name: name || (data[botId] ? data[botId].name : botId),
      status: status,
      lastUpdate: Date.now()
    };

    fs.writeFileSync(STATUS_FILE, JSON.stringify(data, null, 2));
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`[Servidor Web] Panel corriendo en el puerto ${PORT}`);
});
