import { join } from 'path';

const PORT = 3001;

const server = Bun.serve({
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url);
    let filePath = url.pathname;
    
    if (filePath === '/' || filePath === '') {
      filePath = '/index.html';
    }
    
    // Serve files static from the current folder
    const fileFullPath = join(import.meta.dir, filePath);
    const file = Bun.file(fileFullPath);
    
    if (await file.exists()) {
      // Determine Content-Type based on extension
      let contentType = 'text/plain';
      if (filePath.endsWith('.html')) contentType = 'text/html';
      else if (filePath.endsWith('.css')) contentType = 'text/css';
      else if (filePath.endsWith('.js')) contentType = 'application/javascript';
      else if (filePath.endsWith('.png')) contentType = 'image/png';
      else if (filePath.endsWith('.jpg') || filePath.endsWith('.jpeg')) contentType = 'image/jpeg';
      else if (filePath.endsWith('.svg')) contentType = 'image/svg+xml';
      else if (filePath.endsWith('.json')) contentType = 'application/json';
      
      return new Response(file, {
        headers: {
          'Content-Type': contentType,
          'Access-Control-Allow-Origin': '*', // Enable CORS for testing if needed
        }
      });
    }
    
    return new Response('404 Not Found', { status: 404 });
  },
});

console.log(`Test server successfully started!`);
console.log(`Local URL: http://localhost:${server.port}`);
