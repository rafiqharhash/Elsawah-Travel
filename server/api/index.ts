import { buildApp } from '../src/app';
import { connectDB } from '../src/config/db';

let isDbConnected = false;

const app = buildApp();

export default async function handler(req: any, res: any) {
  if (!isDbConnected) {
    await connectDB();
    isDbConnected = true;
  }
  
  return app(req, res);
}
