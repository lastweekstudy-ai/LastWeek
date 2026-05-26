import { account } from './config';
import { ID } from 'appwrite';

export const registerUser = async (email, password, name, profileData = {}) => {
  try {
    const user = await account.create(ID.unique(), email, password, name);
    console.log('[auth] User created:', user);
    
    // Auto-login after registration
    await account.createEmailPasswordSession(email, password);

    // Store profile preferences (dateOfBirth, consent timestamps)
    // These are saved via account.updatePrefs which stores arbitrary JSON on the user
    if (profileData && Object.keys(profileData).length > 0) {
      await account.updatePrefs({
        dateOfBirth: profileData.dateOfBirth || null,
        agreedTermsAt: profileData.agreedTermsAt || null,
        agreedPrivacyAt: profileData.agreedPrivacyAt || null,
        agreedDataCollectionAt: profileData.agreedDataCollectionAt || null,
        signupCompletedAt: new Date().toISOString(),
      });
    }

    // Get the full user object after login to ensure we have all properties
    const fullUser = await account.get();
    console.log('[auth] Full user after login:', fullUser);
    
    return fullUser;
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

export const getUserPrefs = async () => {
  try {
    const prefs = await account.getPrefs();
    return prefs;
  } catch (error) {
    return {};
  }
};

export const updateUserPrefs = async (prefs) => {
  try {
    return await account.updatePrefs(prefs);
  } catch (error) {
    throw new Error(error.message);
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
