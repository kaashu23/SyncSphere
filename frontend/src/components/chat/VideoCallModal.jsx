import React, { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import axios from 'axios';

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:global.stun.twilio.com:3478' }
  ]
};

function formatDuration(sec) {
  const m = Math.floor(sec / 60).toString().padStart(2, '0');
  const s = (sec % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export default function VideoCallModal({ isOpen, onClose, socket, targetUser, incomingCall, currentUser, isVideo }) {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const remoteAudioRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);
  const durationTimerRef = useRef(null);

  const [callStatus, setCallStatus] = useState(incomingCall ? 'ringing' : 'idle');
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [callDuration, setCallDuration] = useState(0);

  const isVideoCall = incomingCall ? !!incomingCall.isVideo : !!isVideo;

  // The socket room id of the person we are talking to (always the Clerk id)
  const remoteUserId = targetUser?.clerkId || incomingCall?.from;

  const startDurationTimer = () => {
    setCallDuration(0);
    if (durationTimerRef.current) clearInterval(durationTimerRef.current);
    durationTimerRef.current = setInterval(() => {
      setCallDuration((d) => d + 1);
    }, 1000);
  };

  const stopDurationTimer = () => {
    if (durationTimerRef.current) clearInterval(durationTimerRef.current);
    durationTimerRef.current = null;
  };

  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;

    const setupMediaAndConnection = async () => {
      try {
        // 1. Get Local Media
        const stream = await navigator.mediaDevices.getUserMedia({ video: isVideoCall, audio: true });
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
          if (event.streams && event.streams[0]) {
            if (isVideoCall && remoteVideoRef.current) {
              remoteVideoRef.current.srcObject = event.streams[0];
            } else if (!isVideoCall && remoteAudioRef.current) {
              remoteAudioRef.current.srcObject = event.streams[0];
            }
          }
        };

        // Listen for ICE candidates
        peerConnectionRef.current.onicecandidate = (event) => {
          if (event.candidate && remoteUserId) {
            socket.emit('call:ice-candidate', {
              to: remoteUserId,
              candidate: event.candidate,
              from: currentUser.id
            });
          }
        };

        // 3. Connection State Handling
        peerConnectionRef.current.onconnectionstatechange = () => {
          const state = peerConnectionRef.current.connectionState;
          if (state === 'connected') {
            setCallStatus('connected');
            startDurationTimer();
          }
          if (state === 'disconnected' || state === 'failed' || state === 'closed') {
            if (peerConnectionRef.current?.connectionState !== 'connected') handleEndCall();
          }
        };

        // 4. Handle Outgoing vs Incoming Call Logic
        if (!incomingCall && targetUser?.clerkId) {
          // Outgoing Call
          setCallStatus('calling');
          const offer = await peerConnectionRef.current.createOffer();
          await peerConnectionRef.current.setLocalDescription(offer);

          socket.emit('call:invite', {
            userToCall: targetUser.clerkId,
            signalData: offer,
            from: currentUser.id,
            name: currentUser.fullName || currentUser.username || currentUser.primaryEmailAddress?.emailAddress?.split('@')[0],
            isVideo: isVideoCall,
            isGroup: false,
            chatId: targetUser.chatId
          });
        } else if (incomingCall) {
          // Incoming Call (Waiting for user to click answer)
          setCallStatus('ringing');
        }

      } catch (err) {
        console.error("Error accessing media devices.", err);
        toast.error("Could not access camera/microphone.");
        handleCleanup();
        onClose();
      }
    };

    setupMediaAndConnection();

    // Socket Listeners
    socket.on('call:accepted', async (data) => {
      if (peerConnectionRef.current) {
        await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(data.signal));
      }
    });

    socket.on('call:ice-candidate', async (data) => {
      if (peerConnectionRef.current) {
        try {
          await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(data.candidate));
        } catch (e) {
          console.error('Error adding received ice candidate', e);
        }
      }
    });

    socket.on('call:ended', () => {
      toast('Call ended', { icon: isVideoCall ? '📹' : '📞' });
      handleEndCall(false); // don't emit again
    });

    return () => {
      isMounted = false;
      stopDurationTimer();
      handleCleanup();
      socket.off('call:accepted');
      socket.off('call:ice-candidate');
      socket.off('call:ended');
    };
  }, [isOpen]);

  const handleCleanup = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
  };

  const answerCall = async () => {
    if (!incomingCall || !peerConnectionRef.current) return;

    setCallStatus('connected');
    startDurationTimer();

    await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(incomingCall.signal));
    const answer = await peerConnectionRef.current.createAnswer();
    await peerConnectionRef.current.setLocalDescription(answer);

    socket.emit('call:answer', {
      to: incomingCall.from,
      signal: answer,
      from: currentUser.id
    });
  };

  const handleEndCall = async (emit = true) => {
    if (emit && remoteUserId) {
      socket.emit('call:end', { to: remoteUserId, from: currentUser.id });
    }
    stopDurationTimer();
    handleCleanup();
    
    // Create Call Log
    try {
      if (!incomingCall && targetUser?.chatId) {
        await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/calls`, {
          type: isVideoCall ? 'video' : 'voice',
          isGroup: false,
          chat: targetUser.chatId,
          participants: [targetUser._id],
          status: callStatus === 'connected' ? 'answered' : (emit ? 'missed' : 'declined'),
          durationSeconds: callDuration,
          startedAt: new Date(Date.now() - callDuration * 1000)
        }, {
          headers: { 'clerk-id': currentUser.id }
        });
      }
    } catch (e) {
      console.error('Failed to save call log', e);
    }

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

  const toggleScreenShare = async () => {
    if (isScreenSharing) {
      // Stop screen sharing and revert to camera
      if (localStreamRef.current) {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: !isMuted });
        const videoTrack = stream.getVideoTracks()[0];
        
        const sender = peerConnectionRef.current.getSenders().find(s => s.track.kind === 'video');
        if (sender) sender.replaceTrack(videoTrack);
        
        localStreamRef.current.getVideoTracks().forEach(track => track.stop());
        localStreamRef.current.removeTrack(localStreamRef.current.getVideoTracks()[0]);
        localStreamRef.current.addTrack(videoTrack);
        
        if (localVideoRef.current) localVideoRef.current.srcObject = localStreamRef.current;
        setIsScreenSharing(false);
      }
    } else {
      // Start screen sharing
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        const screenTrack = stream.getVideoTracks()[0];
        
        const sender = peerConnectionRef.current.getSenders().find(s => s.track.kind === 'video');
        if (sender) sender.replaceTrack(screenTrack);
        
        localStreamRef.current.getVideoTracks().forEach(track => track.stop());
        localStreamRef.current.removeTrack(localStreamRef.current.getVideoTracks()[0]);
        localStreamRef.current.addTrack(screenTrack);
        
        if (localVideoRef.current) localVideoRef.current.srcObject = localStreamRef.current;
        setIsScreenSharing(true);
        
        // Listen for user stopping screen share via browser UI
        screenTrack.onended = () => {
          toggleScreenShare(); // revert
        };
      } catch (err) {
        console.error("Error sharing screen", err);
      }
    }
  };

  if (!isOpen) return null;

  const displayName = incomingCall ? incomingCall.callerName : targetUser?.displayName || targetUser?.username || 'User';
  const displayAvatar = incomingCall ? null : targetUser?.avatarUrl;

  const statusText =
    callStatus === 'ringing' ? (incomingCall ? 'Incoming call...' : 'Ringing...') :
    callStatus === 'calling' ? 'Calling...' :
    callStatus === 'connected' ? formatDuration(callDuration) :
    callStatus;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md">
      <div className="relative w-full h-[100dvh] md:max-w-5xl md:h-[80vh] bg-surface md:rounded-2xl overflow-hidden shadow-2xl md:border border-outline-variant/30 flex flex-col">

        {/* Header */}
        <div className="absolute top-0 w-full p-md flex justify-between items-center z-10 bg-gradient-to-b from-black/60 to-transparent">
          <div className="flex flex-col">
            <h2 className="font-title-md text-title-md text-white font-semibold shadow-sm flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px]">{isVideoCall ? 'videocam' : 'call'}</span>
              {displayName}
            </h2>
            <p className="font-body-sm text-white/80">{isVideoCall ? 'Video call' : 'Voice call'} · {statusText}</p>
          </div>
        </div>

        {/* Video Canvas */}
        <div className="relative flex-1 bg-black flex items-center justify-center overflow-hidden">
          
          {/* Always render audio for voice calls so it can receive the stream immediately */}
          {!isVideoCall && <audio ref={remoteAudioRef} autoPlay playsInline className="hidden" />}

          {/* Always render video for video calls to catch early streams, but hide if not connected */}
          {isVideoCall && (
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className={`w-full h-full object-cover ${callStatus === 'connected' ? 'block' : 'hidden'}`}
            />
          )}

          {/* Fallback UI when not connected or doing voice call */}
          {(!isVideoCall || callStatus !== 'connected') && (
            <div className="flex flex-col items-center">
              <div className="w-32 h-32 rounded-full border-4 border-primary/30 flex items-center justify-center mb-md overflow-hidden">
                {incomingCall ? (
                  <span className="material-symbols-outlined text-[56px] text-white/70" style={{ fontVariationSettings: "'FILL' 1" }}>{isVideoCall ? 'videocam' : 'call'}</span>
                ) : (
                  <img src={displayAvatar || '/avatars/avatar_female_light.jpg'} className="w-full h-full object-cover" />
                )}
              </div>
              <p className="text-white font-title-sm text-title-sm">{statusText}</p>
            </div>
          )}

          {/* Local Mini Video (video calls only) */}
          {isVideoCall && (
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
          )}
        </div>

        {/* Controls */}
        <div className="h-24 bg-surface-container-lowest border-t border-outline-variant/30 flex items-center justify-center gap-lg">
          <button
            onClick={toggleMute}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-ambient ${isMuted ? 'bg-error text-on-error' : 'bg-surface hover:bg-surface-container-high text-on-surface'}`}
          >
            <span className="material-symbols-outlined text-[24px]">{isMuted ? 'mic_off' : 'mic'}</span>
          </button>

          {callStatus === 'ringing' && incomingCall ? (
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

          {isVideoCall && (
            <>
              <button
                onClick={toggleVideo}
                className={`w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-ambient ${isVideoOff ? 'bg-error text-on-error' : 'bg-surface hover:bg-surface-container-high text-on-surface'}`}
              >
                <span className="material-symbols-outlined text-[24px]">{isVideoOff ? 'videocam_off' : 'videocam'}</span>
              </button>
              
              <button
                onClick={toggleScreenShare}
                className={`w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-ambient ${isScreenSharing ? 'bg-primary text-on-primary' : 'bg-surface hover:bg-surface-container-high text-on-surface'}`}
              >
                <span className="material-symbols-outlined text-[24px]">screen_share</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
