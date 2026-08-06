import React, { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:global.stun.twilio.com:3478' }
  ]
};

export default function VideoCallModal({ isOpen, onClose, socket, targetUser, incomingCall, currentUser }) {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);
  
  // 'idle', 'calling', 'ringing', 'connected', 'ended'
  const [callStatus, setCallStatus] = useState(incomingCall ? 'ringing' : 'idle'); 
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);

  // The ID of the person we are talking to
  const remoteUserId = targetUser?._id || incomingCall?.from;

  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;

    const setupMediaAndConnection = async () => {
      try {
        // 1. Get Local Media
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        if (!isMounted) return;
        localStreamRef.current = stream;
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;

        // 2. Setup RTCPeerConnection
        peerConnectionRef.current = new RTCPeerConnection(ICE_SERVERS);

        // Add local tracks
        stream.getTracks().forEach(track => {
          peerConnectionRef.current.addTrack(track, stream);
        });

        // Listen for remote tracks
        peerConnectionRef.current.ontrack = (event) => {
          if (remoteVideoRef.current && event.streams[0]) {
            remoteVideoRef.current.srcObject = event.streams[0];
          }
        };

        // Listen for ICE candidates
        peerConnectionRef.current.onicecandidate = (event) => {
          if (event.candidate && remoteUserId) {
            socket.emit('ice-candidate', {
              to: remoteUserId,
              candidate: event.candidate
            });
          }
        };

        // 3. Connection State Handling
        peerConnectionRef.current.onconnectionstatechange = () => {
          const state = peerConnectionRef.current.connectionState;
          if (state === 'connected') setCallStatus('connected');
          if (state === 'disconnected' || state === 'failed') handleEndCall();
        };

        // 4. Handle Outgoing vs Incoming Call Logic
        if (!incomingCall && targetUser) {
          // Outgoing Call
          setCallStatus('calling');
          const offer = await peerConnectionRef.current.createOffer();
          await peerConnectionRef.current.setLocalDescription(offer);
          
          socket.emit('call-user', {
            userToCall: targetUser._id,
            signalData: offer,
            from: currentUser.id, // clerk ID used as room
            name: currentUser.fullName || currentUser.username,
            isVideo: true
          });
        } else if (incomingCall) {
          // Incoming Call (Waiting for user to click answer)
          // Do not create answer yet until they accept.
        }

      } catch (err) {
        console.error("Error accessing media devices.", err);
        toast.error("Could not access camera/microphone.");
        onClose();
      }
    };

    setupMediaAndConnection();

    // Socket Listeners
    socket.on('call-accepted', async (signal) => {
      if (peerConnectionRef.current) {
        await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(signal));
      }
    });

    socket.on('ice-candidate', async (candidate) => {
      if (peerConnectionRef.current) {
        try {
          await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) {
          console.error('Error adding received ice candidate', e);
        }
      }
    });

    socket.on('call-ended', () => {
      toast('Call ended', { icon: '📞' });
      handleCleanup();
      onClose();
    });

    return () => {
      isMounted = false;
      handleCleanup();
      socket.off('call-accepted');
      socket.off('ice-candidate');
      socket.off('call-ended');
    };
  }, [isOpen]);

  const handleCleanup = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
  };

  const answerCall = async () => {
    if (!incomingCall || !peerConnectionRef.current) return;
    
    setCallStatus('connected');
    
    await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(incomingCall.signal));
    const answer = await peerConnectionRef.current.createAnswer();
    await peerConnectionRef.current.setLocalDescription(answer);

    socket.emit('answer-call', {
      to: incomingCall.from,
      signal: answer
    });
  };

  const handleEndCall = () => {
    if (remoteUserId) {
      socket.emit('end-call', { to: remoteUserId });
    }
    handleCleanup();
    onClose();
  };

  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOff(!videoTrack.enabled);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-5xl h-[80vh] bg-surface rounded-2xl overflow-hidden shadow-2xl border border-outline-variant/30 flex flex-col">
        
        {/* Header */}
        <div className="absolute top-0 w-full p-md flex justify-between items-center z-10 bg-gradient-to-b from-black/60 to-transparent">
          <div className="flex flex-col">
            <h2 className="font-title-md text-title-md text-white font-semibold shadow-sm">
              {incomingCall ? incomingCall.callerName : targetUser?.displayName || 'User'}
            </h2>
            <p className="font-body-sm text-white/80 capitalize">{callStatus}</p>
          </div>
        </div>

        {/* Video Canvas */}
        <div className="relative flex-1 bg-black flex items-center justify-center overflow-hidden">
          {callStatus === 'connected' ? (
            <video 
              ref={remoteVideoRef} 
              autoPlay 
              playsInline 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex flex-col items-center animate-pulse">
              <div className="w-32 h-32 rounded-full border-4 border-primary/30 flex items-center justify-center mb-md">
                <img src={incomingCall ? '/avatars/avatar_female_light.jpg' : targetUser?.avatarUrl || '/avatars/avatar_female_light.jpg'} className="w-full h-full rounded-full object-cover" />
              </div>
              <p className="text-white font-title-sm text-title-sm">{callStatus === 'ringing' ? 'Incoming Call...' : 'Calling...'}</p>
            </div>
          )}

          {/* Local Mini Video */}
          <div className="absolute bottom-6 right-6 w-48 h-72 bg-surface-container rounded-xl overflow-hidden shadow-2xl border-2 border-outline-variant/30 z-10 transition-transform hover:scale-105">
            <video 
              ref={localVideoRef} 
              autoPlay 
              playsInline 
              muted 
              className={`w-full h-full object-cover ${isVideoOff ? 'opacity-0' : 'opacity-100'}`}
            />
            {isVideoOff && (
              <div className="absolute inset-0 flex items-center justify-center bg-surface-container-high text-on-surface-variant">
                <span className="material-symbols-outlined text-[48px]">videocam_off</span>
              </div>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="h-24 bg-surface-container-lowest border-t border-outline-variant/30 flex items-center justify-center gap-lg">
          <button 
            onClick={toggleMute}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-ambient ${isMuted ? 'bg-error text-on-error' : 'bg-surface hover:bg-surface-container-high text-on-surface'}`}
          >
            <span className="material-symbols-outlined text-[24px]">{isMuted ? 'mic_off' : 'mic'}</span>
          </button>
          
          {callStatus === 'ringing' ? (
            <button 
              onClick={answerCall}
              className="w-16 h-16 rounded-full flex items-center justify-center bg-green-500 hover:bg-green-600 text-white shadow-ambient animate-bounce"
            >
              <span className="material-symbols-outlined text-[28px]" style={{ fontVariationSettings: "'FILL' 1" }}>call</span>
            </button>
          ) : null}

          <button 
            onClick={handleEndCall}
            className="w-16 h-16 rounded-full flex items-center justify-center bg-error hover:bg-error-container hover:text-on-error-container text-on-error shadow-ambient transition-colors"
          >
            <span className="material-symbols-outlined text-[28px]" style={{ fontVariationSettings: "'FILL' 1" }}>call_end</span>
          </button>

          <button 
            onClick={toggleVideo}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-ambient ${isVideoOff ? 'bg-error text-on-error' : 'bg-surface hover:bg-surface-container-high text-on-surface'}`}
          >
            <span className="material-symbols-outlined text-[24px]">{isVideoOff ? 'videocam_off' : 'videocam'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
