import { account } from './config';
import { ID } from 'appwrite';

export const registerUser = async (email, password, name) => {
  try {
    const user = await account.create(ID.unique(), email, password, name);
    // Auto-login after registration
    await account.createEmailPasswordSession(email, password);
    return user;
  } catch (error) {
    throw new Error(error.message);
  }
};

export const loginUser = async (email, password) => {
  try {
    const session = await account.createEmailPasswordSession(email, password);
    return session;
  } catch (error) {
    throw new Error(error.message);
  }
};

export const logoutUser = async () => {
  try {
    await account.deleteSession('current');
  } catch (error) {
    throw new Error(error.message);
  }
};

export const getCurrentUser = async () => {
  try {
    const user = await account.get();
    return user;
  } catch (error) {
    return null;
  }
};

export const loginAsGuest = async () => {
  try {
    const session = await account.createAnonymousSession();
    return session;
  } catch (error) {
    throw new Error(error.message);
  }
};