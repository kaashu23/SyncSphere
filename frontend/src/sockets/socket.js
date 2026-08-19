import io from 'socket.io-client';

const ENDPOINT = import.meta.env.VITE_API_URL || 'http://localhost:5001';
const socket = io(ENDPOINT, {
  autoConnect: false, // We'll connect it manually when the user is available
});

export default socket;
