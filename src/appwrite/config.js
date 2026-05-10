import { Client, Account, Databases, Storage, Functions } from 'appwrite';

const client = new Client();

try {
  client
    .setEndpoint(import.meta.env.VITE_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1')
    .setProject(import.meta.env.VITE_APPWRITE_PROJECT_ID);
} catch (error) {
  console.error('Appwrite configuration error:', error);
}

export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);
export const functions = new Functions(client);
export { client };