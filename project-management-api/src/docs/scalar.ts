import { Application, Request, Response } from 'express';
import { openApiSpec } from './openapi';

/**
 * Setup Scalar API Reference UI
 *
 * Serves the interactive API documentation at /docs
 * Uses Scalar's CDN-based approach (no additional npm install required)
 */
export function setupApiDocs(app: Application): void {
  // Serve OpenAPI JSON spec
  app.get('/api/docs/openapi.json', (_req: Request, res: Response) => {
    res.json(openApiSpec);
  });

  // Serve Scalar API Reference UI
  app.get('/docs', (_req: Request, res: Response) => {
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Aegis PMT — API Documentation</title>
  <meta name="description" content="Enterprise Project Management API Documentation" />
  <style>
    body { margin: 0; padding: 0; }
  </style>
</head>
<body>
  <script
    id="api-reference"
    data-url="/api/docs/openapi.json"
    data-configuration="${encodeURIComponent(JSON.stringify({
      theme: 'kepler',
      layout: 'modern',
      darkMode: true,
      hiddenClients: [],
      metaData: {
        title: 'Aegis PMT API',
        description: 'Enterprise Project Management Platform',
      },
      authentication: {
        preferredSecurityScheme: 'BearerAuth',
      },
    }))}"
  ></script>
  <script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"></script>
</body>
</html>
    `.trim();

    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  });
}
