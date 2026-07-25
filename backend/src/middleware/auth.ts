import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  user?: {
    id: number;
    username: string;
    role: string;
  };
}

export function generateToken(id: number, username: string, role: string): string {
  const secret = process.env.JWT_SECRET || 'fallback_secret';
  return jwt.sign({ id, username, role }, secret, { expiresIn: '24h' });
}

export function verifyToken(token: string): any {
  const secret = process.env.JWT_SECRET || 'fallback_secret';
  return jwt.verify(token, secret);
}

export function authenticateToken(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token == null) return res.sendStatus(401);

  try {
    const user = verifyToken(token);
    req.user = user;
    next();
  } catch (err) {
    return res.sendStatus(403);
  }
}
