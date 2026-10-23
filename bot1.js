const bedrock = require('bedrock-protocol');
const fs = require('fs');

const HOST = process.env.SERVER_IP || 'TU_IP.aternos.me';
const PORT = parseInt(process.env.SERVER_PORT) || 19132;
const BOT_NAME = process.env.BOT1_NAME || 'Bot_AFK_1';
const TARGET_BOT = process.env.BOT2_NAME || 'Bot_AFK_2';

// Configuración de límites de la celda de Bedrock
const AREA = { minX: -10, maxX: 10, minY: -61, maxY: -53, minZ: -10, maxZ: 10 };

function getRandomCoord(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function incrementarErrorConexion() {
  if (fs.existsSync('status.json')) {
    const data = JSON.parse(fs.readFileSync('status.json'));
    data.erroresConexion = (data.erroresConexion || 0) + 1;
    fs.writeFileSync('status.json', JSON.stringify(data, null, 2));
  }
}

function resetErroresConexion() {
  if (fs.existsSync('status.json')) {
    const data = JSON.parse(fs.readFileSync('status.json'));
    data.erroresConexion = 0;
    fs.writeFileSync('status.json', JSON.stringify(data, null, 2));
  }
}

function connectBot() {
  console.log(`[${BOT_NAME}] Conectando...`);

  const client = bedrock.createClient({
    host: HOST,
    port: PORT,
    username: BOT_NAME,
    offline: true
  });

  client.on('spawn', () => {
    console.log(`[${BOT_NAME}] ¡En línea!`);
    resetErroresConexion();

    setTimeout(() => {
      const startX = getRandomCoord(AREA.minX, AREA.maxX);
      const startZ = getRandomCoord(AREA.minZ, AREA.maxZ);
      client.queue('command_request', {
        command: `/tp ${BOT_NAME} ${startX} -55 ${startZ}`,
        origin: { type: 'player', uuid: client.uuid || '', request_id: '' },
        internal: false
      });
    }, 3000);

    startLoop(client);
  });

  client.on('kick', () => reconnect());
  client.on('error', () => reconnect());
}

function startLoop(client) {
  // Movimiento aleatorio en la zona cada 20s
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

  // Mensaje de estado por /msg
  setInterval(() => {
    const msgs = ["¡Trabajando 24/7!", "Manteniendo el server vivo", "Turno de guardia"];
    const msg = msgs[Math.floor(Math.random() * msgs.length)];
    client.queue('command_request', {
      command: `/msg ${TARGET_BOT} ${msg}`,
      origin: { type: 'player', uuid: client.uuid || '', request_id: '' },
      internal: false
    });
  }, 22000);

  // Clic aleatorio (izq/der) cada 25s
  setInterval(() => {
    const action = Math.random() > 0.5 ? 1 : 2;
    client.queue('animate', { action_id: action, runtime_entity_id: client.entityId });
  }, 25000);

  // Rotación de cámara cada 15s
  setInterval(() => {
    client.queue('player_auth_input', {
      pitch: Math.floor(Math.random() * 40) - 20,
      yaw: Math.floor(Math.random() * 360),
      position: { x: 0, y: -55, z: 0 },
      move_vector: { x: 0, z: 0 }, head_yaw: 0, input_data: 0,
      input_mode: 'touch', play_mode: 'normal'
    });
  }, 15000);
}

function reconnect() {
  incrementarErrorConexion();
  console.log(`[${BOT_NAME}] Error/Desconexión. Reintentando en 15s...`);
  setTimeout(connectBot, 15000);
}

connectBot();
