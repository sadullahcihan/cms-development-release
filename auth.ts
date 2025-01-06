import { randomBytes } from 'crypto';
import { createAuth } from '@keystone-6/auth';
import { statelessSessions } from '@keystone-6/core/session';

// Create auth configuration
const { withAuth } = createAuth({
  listKey: 'User',
  identityField: 'email',
  secretField: 'password',
  
  // Include essential fields in session data
  sessionData: `
    id
    name
    email
    role
  `,
  
  initFirstItem: {
    // Fields required for first user
    fields: ['name', 'email', 'password', 'role'],
    itemData: {
      role: 'admin'  // First user is admin
    },
  },
});

// Session configuration
const sessionMaxAge = 60 * 60 * 24 * 30; // 30 days

// Use provided secret or generate a secure one
const sessionSecret = 
  process.env.SESSION_SECRET || 
  randomBytes(32).toString('hex');

if (!process.env.SESSION_SECRET) {
  console.warn(
    'No SESSION_SECRET environmental variable set. Using auto-generated key. Note: This will cause all sessions to be invalidated when the server restarts.'
  );
}

const session = statelessSessions({
  maxAge: sessionMaxAge,
  secret: sessionSecret,
  // Secure session configuration
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
});

export { withAuth, session };