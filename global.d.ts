import { IStorage } from './server/types';

declare global {
  var appStorage: IStorage;
  
  namespace NodeJS {
    interface Global {
      appStorage: IStorage;
    }
  }
}