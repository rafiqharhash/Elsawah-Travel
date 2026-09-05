import Pusher from 'pusher';
import { env } from './config/env';

let pusherInstance: Pusher | null = null;

export const getPusher = () => {
  if (!pusherInstance) {
    pusherInstance = new Pusher({
      appId: process.env.PUSHER_APP_ID || '',
      key: process.env.PUSHER_KEY || '',
      secret: process.env.PUSHER_SECRET || '',
      cluster: process.env.PUSHER_CLUSTER || '',
      useTLS: true,
    });
  }
  return pusherInstance;
};
