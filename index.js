import puppeteer from 'puppeteer';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
dotenv.config();

const BOT_TOKEN = process.env.BOT_TOKEN;
const CHAT_ID = process.env.CHAT_ID;

async function sendTelegram(text) {
  try {
    const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: CHAT_ID, text, parse_mode: 'Markdown' })
    });
    const data = await res.json();
    return data;
  } catch (err) {
    console.error('Erro ao enviar mensagem:', err.message);
  }
}

async function fetchLiveResults() {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  await page.goto('https://casinoscores.com/es/bac-bo/', { waitUntil: 'networkidle2' });

  const results = await page.evaluate(() => {
    const items = Array.from(document.querySelectorAll('.last-result-item'));
    return items.map(el => el.innerText.trim().toUpperCase());
  });

  await browser.close();
  return results.slice(0, 20).reverse();
}

(async () => {
  const history = await fetchLiveResults();
  console.log('📊 Resultados captados:', history);

  if (history.length >= 5) {
    await sendTelegram(`📊 Histórico captado:\n${history.join(', ')}`);
  } else {
    await sendTelegram(`⚠️ Histórico vazio ou inválido. Verifique conexão ou site.`);
  }
})();
