const bedrock = require('bedrock-protocol');
const fs = require('fs');

const HOST = process.env.SERVER_IP || 'TU_IP.aternos.me';
const PORT = parseInt(process.env.SERVER_PORT) || 19132;
const TARGET_BOT = process.env.BOT1_NAME || 'Bot_AFK_1';

const AREA = { minX: -10, maxX: 10, minY: -61, maxY: -53, minZ: -10, maxZ: 10 };

function getRandomCoord(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function connectBot() {
  console.log('[Bot_AFK_2] Iniciando conexión con Microsoft Auth...');

  const client = bedrock.createClient({
    host: HOST,
    port: PORT,
    authTitle: '0000000048248239',
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

  client.on('kick', () => reconnect());
  client.on('error', () => reconnect());
}

function startLoop(client) {
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

  setInterval(() => {
    client.queue('command_request', {
      command: `/msg ${TARGET_BOT} ¡Sistema estable 24/7!`,
      origin: { type: 'player', uuid: client.uuid || '', request_id: '' },
      internal: false
    });
  }, 24000);

  setInterval(() => {
    const action = Math.random() > 0.5 ? 1 : 2;
    client.queue('animate', { action_id: action, runtime_entity_id: client.entityId });
  }, 25000);

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
  setTimeout(connectBot, 15000);
}

connectBot();
