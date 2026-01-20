// File: lib/appwrite.ts - (Likely no changes needed from your previous setup)
import { Client, Account, Databases, Storage, Avatars, Functions, ID, Query, AppwriteException } from 'appwrite';

const client = new Client();

if (process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT && process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID) {
    client
        .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
        .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID);
} else {
    console.error("Appwrite environment variables NEXT_PUBLIC_APPWRITE_ENDPOINT and NEXT_PUBLIC_APPWRITE_PROJECT_ID are not set!");
}

export const account = new Account(client);
export const databases = new Databases(client);
export const functions = new Functions(client);
export const storage = new Storage(client);
export const avatars = new Avatars(client);

export { ID, Query, AppwriteException }; // Export AppwriteException for type checking errors
export default client;