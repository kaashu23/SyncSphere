import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import axios from 'axios';
import toast from 'react-hot-toast';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5001';

export default function JoinGroup() {
  const { inviteCode } = useParams();
  const navigate = useNavigate();
  const { user, isLoaded } = useUser();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isLoaded) return;
    if (!user) {
      navigate('/');
      return;
    }

    const joinGroup = async () => {
      try {
        const config = { headers: { 'clerk-id': user.id } };
        await axios.post(`${API}/api/chats/join/${inviteCode}`, {}, config);
        toast.success('Successfully joined the group!');
        navigate('/chat');
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to join group.');
        toast.error(err.response?.data?.message || 'Failed to join group.');
      } finally {
        setLoading(false);
      }
    };

    joinGroup();
  }, [isLoaded, user, inviteCode, navigate]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="bg-surface border border-outline-variant/30 rounded-2xl shadow-xl p-8 max-w-[400px] w-full text-center">
        {loading ? (
          <>
            <span className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin inline-block mb-4" />
            <h2 className="text-xl font-bold text-on-surface">Joining group...</h2>
          </>
        ) : error ? (
          <>
            <div className="w-16 h-16 bg-error-container rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-error text-[32px]">error</span>
            </div>
            <h2 className="text-xl font-bold text-on-surface mb-2">Oops!</h2>
            <p className="text-on-surface-variant mb-6">{error}</p>
            <button onClick={() => navigate('/chat')} className="bg-primary hover:bg-primary-container text-on-primary font-medium px-6 py-2.5 rounded-lg transition-colors w-full">
              Go to Chats
            </button>
          </>
        ) : null}
      </div>
    </div>
  );
}
