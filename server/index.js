import app from './app.js';

const PORT = process.env.PORT || 3001;

const cuoptEndpoint = process.env.CUOPT_ENDPOINT || 'https://cuopt-2-cuopt.137-131-27-21.nip.io';
const llamastackEndpoint = process.env.LLAMASTACK_ENDPOINT || 'http://localhost:8321';
const llamastackDefaultModel = process.env.LLAMASTACK_MODEL ?? '';

app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════════════════════╗
║            cuOPT Frontend Proxy Server                           ║
╠══════════════════════════════════════════════════════════════════╣
║  Server:        http://localhost:${PORT}                           ║
║  cuOPT:         ${cuoptEndpoint}
║  LlamaStack:    ${llamastackEndpoint}
║  Default Model: ${llamastackDefaultModel}
╚══════════════════════════════════════════════════════════════════╝
  `);
});
