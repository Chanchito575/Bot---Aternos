const bedrock = require('bedrock-protocol');
const http = require('http');

// Configuración directa de IP y puerto
const HOST = '1.26.50.5';
const PORT = 45026;
const TARGET_BOT = 'Chino 2334';
const BOT_ID = 'bot2';

const AREA = { minX: -10, maxX: 10, minY: -61, maxY: -53, minZ: -10, maxZ: 10 };

function getRandomCoord(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Función para reportar estado real al servidor web
function notifyStatus(statusName) {
  const data = JSON.stringify({ botId: BOT_ID, status: statusName });
  const req = http.request({
    hostname: 'localhost',
    port: process.env.PORT || 10000,
    path: '/api/update-bot',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': data.length
    }
  });
  req.on('error', () => {}); // Silenciar errores si el servidor web está iniciando
  req.write(data);
  req.end();
}

function connectBot() {
  console.log('[Bot_AFK_2] Iniciando conexión con Microsoft Auth...');

  const client = bedrock.createClient({
    host: HOST,
    port: PORT,
    profilesFolder: './controls',
    onMsaCode: (data) => {
      console.log('==================================================');
      console.log('[BOT 2 - AUTORIZACIÓN MICROSOFT]');
      console.log(`Entra a: ${data.verification_uri}`);
      console.log(`Escribe el código: ${data.user_code}`);
      console.log('==================================================');
    }
  });

  client.on('spawn', () => {
    console.log('[Bot_AFK_2] ¡En línea y autenticado!');
    notifyStatus('online');

    setTimeout(() => {
      const startX = getRandomCoord(AREA.minX, AREA.maxX);
      const startZ = getRandomCoord(AREA.minZ, AREA.maxZ);
      client.queue('command_request', {
        command: `/tp @s ${startX} -55 ${startZ}`,
        origin: { type: 'player', uuid: client.uuid || '', request_id: '' },
        internal: false
      });
    }, 3000);

    startLoop(client);
  });

  client.on('kick', (reason) => {
    console.log('[Bot_AFK_2] Expulsado:', reason);
    notifyStatus('offline');
    reconnect();
  });
  
  client.on('error', (err) => {
    console.log('[Bot_AFK_2] Error de red (atrapado para evitar reinicio):', err.message);
    notifyStatus('offline');
    reconnect();
  });
}

function startLoop(client) {
  // Bucle de movimiento
  setInterval(() => {
    const targetX = getRandomCoord(AREA.minX, AREA.maxX);
    const targetZ = getRandomCoord(AREA.minZ, AREA.maxZ);
    client.queue('player_auth_input', {
      pitch: 0, yaw: Math.floor(Math.random() * 360),
      position: { x: targetX, y: -55, z: targetZ },
      move_vector: { x: 0.5, z: 0.5 }, head_yaw: 0, input_data: 0,
      input_mode: 'touch', play_mode: 'normal'
    });
  }, 20000);

  // Bucle de chat y reporte de vida al panel web (Con comillas para proteger el espacio del nombre)
  setInterval(() => {
    notifyStatus('online');
    client.queue('command_request', {
      command: `/msg "${TARGET_BOT}" ¡Sistema estable 24/7!`,
      origin: { type: 'player', uuid: client.uuid || '', request_id: '' },
      internal: false
    });
  }, 24000);

  // Bucle de animación
  setInterval(() => {
    const action = Math.random() > 0.5 ? 1 : 2;
    client.queue('animate', { action_id: action, runtime_entity_id: client.entityId });
  }, 25000);
}

function reconnect() {
  console.log('[Bot_AFK_2] Desconectado. Reintentando en 15s...');
  setTimeout(connectBot, 15000);
}

connectBot();
