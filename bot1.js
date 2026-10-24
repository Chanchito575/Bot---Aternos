const bedrock = require('bedrock-protocol');
const fs = require('fs');

const HOST = process.env.SERVER_IP || 'Zenit-Beta.aternos.me';
const PORT = parseInt(process.env.SERVER_PORT) || 19132;
const TARGET_BOT = process.env.BOT2_NAME || 'elpapu3196';

const AREA = { minX: -10, maxX: 10, minY: -61, maxY: -53, minZ: -10, maxZ: 10 };

function getRandomCoord(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function incrementarErrorConexion() {
  if (fs.existsSync('status.json')) {
    try {
      const data = JSON.parse(fs.readFileSync('status.json'));
      data.erroresConexion = (data.erroresConexion || 0) + 1;
      fs.writeFileSync('status.json', JSON.stringify(data, null, 2));
    } catch (e) {
      console.log('[Bot_AFK_1] Error leyendo status.json:', e.message);
    }
  }
}

function resetErroresConexion() {
  if (fs.existsSync('status.json')) {
    try {
      const data = JSON.parse(fs.readFileSync('status.json'));
      data.erroresConexion = 0;
      fs.writeFileSync('status.json', JSON.stringify(data, null, 2));
    } catch (e) {
      console.log('[Bot_AFK_1] Error reiniciando status.json:', e.message);
    }
  }
}

function connectBot() {
  console.log('[Bot_AFK_1] Iniciando conexión con Microsoft Auth...');

  const client = bedrock.createClient({
    host: HOST,
    port: PORT,
    profilesFolder: './controls',
    onMsaCode: (data) => {
      console.log('==================================================');
      console.log('[BOT 1 - AUTORIZACIÓN MICROSOFT]');
      console.log(`Entra a: ${data.verification_uri}`);
      console.log(`Escribe el código: ${data.user_code}`);
      console.log('==================================================');
    }
  });

  client.on('spawn', () => {
    console.log('[Bot_AFK_1] ¡En línea y autenticado!');
    resetErroresConexion();

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
    console.log('[Bot_AFK_1] Expulsado:', reason);
    reconnect();
  });
  
  // Atrapamos los errores de red para evitar que Render crashee
  client.on('error', (err) => {
    console.log('[Bot_AFK_1] Error de red (atrapado para evitar reinicio):', err.message);
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

  // Bucle de chat (Usa comillas dobles "${TARGET_BOT}" por si el objetivo tiene espacios)
  setInterval(() => {
    const msgs = ["¡Trabajando 24/7!", "Manteniendo el server vivo", "Turno de guardia"];
    const msg = msgs[Math.floor(Math.random() * msgs.length)];
    client.queue('command_request', {
      command: `/msg "${TARGET_BOT}" ${msg}`,
      origin: { type: 'player', uuid: client.uuid || '', request_id: '' },
      internal: false
    });
  }, 22000);

  // Bucle de animación
  setInterval(() => {
    const action = Math.random() > 0.5 ? 1 : 2;
    client.queue('animate', { action_id: action, runtime_entity_id: client.entityId });
  }, 25000);
}

function reconnect() {
  incrementarErrorConexion();
  console.log('[Bot_AFK_1] Desconectado. Reintentando en 15s...');
  setTimeout(connectBot, 15000);
}

connectBot();
