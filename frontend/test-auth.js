// Test script to authenticate with seeded user credentials using auto-login
// Run this in browser console to login with john.doe@agency.com

const testAuth = async () => {
  try {
    console.log('Testing direct auto-login with seeded user...');
    
    // Try to get user by email first using a different endpoint
    console.log('Checking if users exist...');
    
    try {
      const listResponse = await fetch('http://localhost:8001/users/list-members', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      const listData = await listResponse.json();
      console.log('List members response:', listData);
      
      if (listData.status && listData.data && listData.data.length > 0) {
        const user = listData.data.find(u => u.email === 'john.doe@agency.com');
        if (user) {
          console.log('Found user:', user);
          
          // Make auto-login request with user ID
          const userId = user._id.buffer ? Buffer.from(user._id.buffer.data).toString('hex') : user._id.toString();
          const response = await fetch('http://localhost:8001/auth/auto-login', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              user_id: userId
            })
          });
          
          const data = await response.json();
          console.log('Auto-login response:', data);
          
          if (data.status && data.data && data.data.access_token) {
            // Set tokens in localStorage (if available)
            if (typeof localStorage !== 'undefined') {
              localStorage.setItem('rz_access_token', data.data.access_token);
              localStorage.setItem('rz_refresh_token', data.data.refresh_token);
            } else {
              console.log('localStorage not available in Node.js environment');
              console.log('Access token:', data.data.access_token.substring(0, 50) + '...');
              console.log('Refresh token:', data.data.refresh_token.substring(0, 50) + '...');
            }
          
            // Set auth state in Zustand store (if available)
            if (typeof window !== 'undefined' && window.useAuthStore) {
              const { login } = window.useAuthStore.getState();
              login(data.data.user, data.data.access_token, data.data.refresh_token);
            } else {
              console.log('Zustand store not available in Node.js environment');
            }
            
            console.log('✅ Authentication successful!');
            console.log('User:', data.data.user);
            return data.data;
          } else {
            console.error('❌ Auto-login failed:', data.message);
            throw new Error(data.message || 'Auto-login failed');
          }
        } else {
          console.error('❌ User not found with email: john.doe@agency.com');
          throw new Error('User not found');
        }
      } else {
        console.error('❌ No users found in database');
        throw new Error('No users found');
      }
    } catch (listError) {
      console.error('❌ Error fetching user list:', listError);
      throw listError;
    }
  } catch (error) {
    console.error('❌ Authentication failed:', error);
    throw error;
  }
};

// Alternative: Manual token setting if you have tokens
const setManualTokens = () => {
  const accessToken = 'your_access_token_here';
  const refreshToken = 'your_refresh_token_here';
  
  localStorage.setItem('rz_access_token', accessToken);
  localStorage.setItem('rz_refresh_token', refreshToken);
  
  console.log('✅ Tokens set manually');
};

// Execute the login
testAuth();