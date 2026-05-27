declare global {
  namespace Express {
    interface Request {
      user?: { id: number; email: string; appId: number; app_name?: string };
      challengeSession?: { sid: number; uid: number; appId: number };
    }
  }
}

export {};
