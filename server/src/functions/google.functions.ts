import { OAuth2Client } from 'google-auth-library';

export const googleClient = new OAuth2Client();

export const getGoogleAuthURL = ({ userType }: { userType: string }) => {
  const state = Buffer.from(JSON.stringify({ userType })).toString('base64');
  const url = googleClient.generateAuthUrl({
    access_type: 'offline',
    scope: [
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile',
    ],
    state,
    prompt: 'consent',
  });

  return url;
};
