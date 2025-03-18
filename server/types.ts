import { Store } from "express-session";

export interface IStorage {
  sessionStore: Store;
  getUser(id: number): Promise<any>;
  getUserByUsername(username: string): Promise<any>;
  createUser(data: any): Promise<any>;
  updateUser(id: number, updates: any): Promise<any>;
  getAllUsers(): Promise<any[]>;
  getUserByEmail(email: string): Promise<any>;
  getUserByResetToken(token: string): Promise<any>;
}
