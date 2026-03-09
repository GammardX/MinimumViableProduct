const http = require('http');

const PORT = Number(process.env.MOCK_LLM_PORT || 18080);

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => { data += chunk; });
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
}

function streamOpenAIStyle(res, text) {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive'
  });
  const chunkSize = 24;
  for (let i = 0; i < text.length; i += chunkSize) {
    const frame = { choices: [{ delta: { content: text.slice(i, i + chunkSize) } }] };
    res.write(`data: ${JSON.stringify(frame)}\n\n`);
  }
  res.write('data: [DONE]\n\n');
  res.end();
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'GET' && req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok' }));
    return;
  }

  if (req.method === 'POST' && req.url === '/v1/chat/completions') {
    const raw = await readBody(req);
    let body;
    try {
      body = JSON.parse(raw);
    } catch {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'invalid json' }));
      return;
    }

    const merged = (body?.messages || []).map((m) => m?.content || '').join('\n');

    if (merged.includes('[[FORCE_ERROR]]')) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'forced error' }));
      return;
    }

    if (merged.includes('[[FORCE_DELAY]]') || /scrivi un testo di circa/i.test(merged)) {
      await new Promise((r) => setTimeout(r, 2500));
    }

    const payload = JSON.stringify({
      outcome: { status: 'success', code: 'OK', violation_category: null },
      data: { rewritten_text: 'Risultato LLM di test', detected_language: 'it' }
    });

    streamOpenAIStyle(res, payload);
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'not found' }));
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`Mock LLM provider listening on http://127.0.0.1:${PORT}`);
});
