const puppeteer = require('puppeteer-core');
const Groq = require('groq-sdk');
const fs = require('fs');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY || 'TU_GROQ_API_KEY' });
const ATERNOS_COOKIE = process.env.ATERNOS_SESSION_COOKIE || '';

async function evaluarYEncenderServer() {
  if (!fs.existsSync('status.json')) return;

  const status = JSON.parse(fs.readFileSync('status.json'));

  // 1. Verificar si Mantenimiento está activo desde la Web
  if (status.mantenimiento) {
    console.log('[Guardián IA] Modo mantenimiento ACTIVADO. No se tomará ninguna acción.');
    return;
  }

  // 2. Verificar si se han acumulado 10 o más errores de conexión
  if (status.erroresConexion >= 10) {
    console.log(`[Guardián IA] ${status.erroresConexion} errores detectados. Consultando a Groq...`);

    // Razonamiento de IA con Groq (Llama 3.3)
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "Eres el guardián de un servidor de Minecraft Aternos. Si el servidor cae, debes responder con la acción 'START'."
        },
        {
          role: "user",
          content: `Los bots han registrado ${status.erroresConexion} fallos de conexión seguidos. ¿Qué acción debemos ejecutar?`
        }
      ],
      model: "llama-3.3-70b-versatile",
    });

    const decision = chatCompletion.choices[0]?.message?.content || "";
    console.log(`[Guardián IA Decisión]: ${decision}`);

    if (decision.includes("START")) {
      await encenderConCookies();
      // Reiniciar contador de errores tras intentar encender
      status.erroresConexion = 0;
      fs.writeFileSync('status.json', JSON.stringify(status, null, 2));
    }
  }
}

async function encenderConCookies() {
  console.log('[Guardián Puppeteer] Iniciando navegador con Cookie de Sesión...');
  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();

    // Inyectar cookie de sesión de Aternos
    await page.setCookie({
      name: 'ATERNOS_SESSION',
      value: ATERNOS_COOKIE,
      domain: '.aternos.org'
    });

    await page.goto('https://aternos.org/server/', { waitUntil: 'networkidle2' });

    // Buscar y presionar el botón de encender
    const btnStart = await page.$('#start');
    if (btnStart) {
      await btnStart.click();
      console.log('[Guardián Puppeteer] ¡Botón de ENCENDER presionado con éxito!');
    } else {
      console.log('[Guardián Puppeteer] No se encontró el botón o el servidor ya está encendido.');
    }

    await browser.close();
  } catch (err) {
    console.error('[Guardián Error]:', err);
  }
}

// Comprobar la salud del servidor cada 30 segundos
setInterval(evaluarYEncenderServer, 30000);
