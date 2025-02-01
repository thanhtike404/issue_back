import express, { type Router, type Response, type Request } from 'express';

import swaggerUI from 'swagger-ui-express';
import { generateOpenAPIDocument } from './openAPIDocumentGenerator';
export const openAPIRouter: Router = express.Router();
const openAPIDocument = generateOpenAPIDocument();

openAPIRouter.get('/swagger.json', (_req: Request, res: Response) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(openAPIDocument);
});

openAPIRouter.use('/', swaggerUI.serve, swaggerUI.setup(openAPIDocument));
