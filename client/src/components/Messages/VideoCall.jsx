// client/src/components/Messages/VideoCall.jsx
import React, { useState, useRef, useEffect } from 'react';
import { 
  Video, VideoOff, Mic, MicOff, PhoneOff
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';

const VideoCall = ({ callData, onEndCall }) => {
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [callState, setCallState] = useState(callData?.state || 'calling');
  const [error, setError] = useState('');

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const callTimerRef = useRef(null);

  const { user } = useAuth();
  const { socket, connected, startCall, endCall: endCallContext } = useSocket();

  useEffect(() => {
    if (!callData) {
      setError('No call data provided');
      return;
    }
    
    console.log('🎥 VideoCall mounted with callData:', callData);
    startCall();
    initializeCall();
    
    return () => {
      console.log('🎥 VideoCall unmounting, cleaning up...');
      cleanupCall();
      endCallContext();
    };
  }, []);

  useEffect(() => {
    if (callState === 'active') {
      callTimerRef.current = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    }

    return () => {
      if (callTimerRef.current) {
        clearInterval(callTimerRef.current);
      }
    };
  }, [callState]);

  const initializeCall = async () => {
    try {
      console.log('🎥 Requesting media devices...');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720 },
        audio: true
      });

      console.log('✅ Media stream obtained:', stream.id);
      setLocalStream(stream);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      const peerConnection = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
          { urls: 'stun:stun2.l.google.com:19302' }
        ]
      });

      peerConnectionRef.current = peerConnection;
      console.log('🔗 Peer connection created');

      stream.getTracks().forEach(track => {
        peerConnection.addTrack(track, stream);
        console.log('➕ Added track to peer connection:', track.kind);
      });

      peerConnection.ontrack = (event) => {
        console.log('📥 Received remote track:', event.streams[0].id);
        if (event.streams && event.streams[0]) {
          setRemoteStream(event.streams[0]);
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = event.streams[0];
          }
          setCallState('active');
        }
      };

      peerConnection.onicecandidate = (event) => {
        if (event.candidate && socket) {
          console.log('🧊 Sending ICE candidate');
          socket.emit('ice-candidate', {
            to: callData.to || callData.from,
            candidate: event.candidate,
            callId: callData.callId
          });
        }
      };

      peerConnection.onconnectionstatechange = () => {
        console.log('🔗 Connection state:', peerConnection.connectionState);
        if (peerConnection.connectionState === 'connected') {
          setCallState('active');
        }
        if (peerConnection.connectionState === 'failed' || 
            peerConnection.connectionState === 'disconnected') {
          console.log('❌ Peer connection failed/disconnected');
          endCall();
        }
      };

      peerConnection.oniceconnectionstatechange = () => {
        console.log('🧊 ICE connection state:', peerConnection.iceConnectionState);
      };

      if (callData.state === 'calling') {
        console.log('📞 Creating offer...');
        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);
        console.log('✅ Local description set');

        if (socket && connected) {
          console.log('📤 Sending call-user with callId:', callData.callId);
          socket.emit('call-user', {
            to: callData.to,
            from: callData.from,
            fromName: callData.fromName,
            offer: offer,
            callId: callData.callId
          });
        } else {
          console.error('❌ Socket not connected!');
          setError('Connection error. Please try again.');
          return;
        }

        setCallState('calling');
      } 
      else if (callData.state === 'answering' || callData.state === 'incoming') {
        console.log('✅ Answering call with offer:', callData.offer);
        if (callData.offer) {
          await peerConnection.setRemoteDescription(
            new RTCSessionDescription(callData.offer)
          );
          console.log('✅ Remote description set');

          const answer = await peerConnection.createAnswer();
          await peerConnection.setLocalDescription(answer);
          console.log('✅ Answer created and local description set');

          if (socket && connected) {
            console.log('📤 Sending answer-call with callId:', callData.callId);
            socket.emit('answer-call', {
              to: callData.from,
              answer: answer,
              callId: callData.callId
            });
          } else {
            console.error('❌ Socket not connected!');
            setError('Connection error. Please try again.');
            return;
          }
        }

        setCallState('active');
      }

      if (socket) {
        socket.on('call-answered', async ({ answer, callId }) => {
          console.log('✅ Call answered event received, callId:', callId);
          if (peerConnection && answer) {
            try {
              if (peerConnection.signalingState === 'have-local-offer') {
                await peerConnection.setRemoteDescription(
                  new RTCSessionDescription(answer)
                );
                console.log('✅ Remote answer set');
                setCallState('active');
              }
            } catch (err) {
              console.error('❌ Error setting remote description:', err);
            }
          }
        });

        socket.on('ice-candidate', async ({ candidate, callId }) => {
          console.log('🧊 ICE candidate received');
          if (peerConnection && candidate) {
            try {
              await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
              console.log('✅ ICE candidate added');
            } catch (err) {
              console.error('❌ Error adding ICE candidate:', err);
            }
          }
        });

        socket.on('call-ended', ({ callId }) => {
          console.log('📴 Call ended event received, callId:', callId);
          endCall();
        });

        socket.on('call-rejected', ({ callId }) => {
          console.log('❌ Call rejected event received, callId:', callId);
          endCall();
        });

        socket.on('call-cancelled', ({ callId }) => {
          console.log('🚫 Call cancelled event received, callId:', callId);
          endCall();
        });
      }
    } catch (err) {
      console.error('❌ Error initializing call:', err);
      setError('Failed to access camera/microphone. Please check permissions. ' + err.message);
    }
  };

  const cleanupCall = () => {
    console.log('🧹 Cleaning up call resources...');
    
    // Stop all local tracks
    if (localStream) {
      localStream.getTracks().forEach(track => {
        track.stop();
        console.log('⏹️ Stopped local track:', track.kind);
      });
    }

    // Stop all remote tracks
    if (remoteStream) {
      remoteStream.getTracks().forEach(track => {
        track.stop();
      });
    }

    // Close peer connection
    if (peerConnectionRef.current) {
      peerConnectionRef.current.ontrack = null;
      peerConnectionRef.current.onicecandidate = null;
      peerConnectionRef.current.onconnectionstatechange = null;
      peerConnectionRef.current.oniceconnectionstatechange = null;
      peerConnectionRef.current.close();
      console.log('🔌 Peer connection closed');
    }

    // Clear timers
    if (callTimerRef.current) {
      clearInterval(callTimerRef.current);
    }

    // Reset video refs
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }

    // Remove socket listeners
    if (socket) {
      socket.off('call-answered');
      socket.off('ice-candidate');
      socket.off('call-ended');
      socket.off('call-rejected');
      socket.off('call-cancelled');
    }
  };

  const toggleMute = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!isMuted);
      console.log(isMuted ? '🔊 Unmuted' : '🔇 Muted');
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsVideoOff(!isVideoOff);
      console.log(isVideoOff ? '📹 Video on' : '📹 Video off');
    }
  };

  const endCall = () => {
    console.log('📴 Ending call...');
    cleanupCall();

    if (socket && connected && callData?.callId) {
      console.log('📤 Sending end-call with callId:', callData.callId);
      socket.emit('end-call', {
        to: callData.to || callData.from,
        callId: callData.callId
      });
    }

    endCallContext();

    // Give socket time to send message before closing
    setTimeout(() => {
      console.log('📴 Closing VideoCall component');
      onEndCall();
    }, 300);
  };

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
    return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  if (error) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: '#000',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        color: 'white',
        flexDirection: 'column',
        gap: '20px'
      }}>
        <div style={{ fontSize: '48px' }}>❌</div>
        <div style={{ fontSize: '20px', textAlign: 'center', maxWidth: '500px', padding: '0 20px' }}>
          {error}
        </div>
        <button
          onClick={() => {
            cleanupCall();
            endCallContext();
            onEndCall();
          }}
          style={{
            padding: '12px 24px',
            backgroundColor: '#dc2626',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: '#000',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        backgroundColor: '#1a1a1a'
      }}>
        {/* Remote Video */}
        <div style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#1a1a1a'
        }}>
          {remoteStream ? (
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover'
              }}
            />
          ) : (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              gap: '20px'
            }}>
              <div style={{ fontSize: '64px' }}>👤</div>
              <div style={{ fontSize: '20px' }}>
                {callState === 'calling' ? 'Calling...' : 'Connecting...'}
              </div>
            </div>
          )}
        </div>

        {/* Local Video (Picture in Picture) */}
        <div style={{
          position: 'absolute',
          bottom: '100px',
          right: '20px',
          width: '240px',
          height: '180px',
          borderRadius: '12px',
          overflow: 'hidden',
          backgroundColor: '#000',
          border: '3px solid white',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)'
        }}>
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transform: 'scaleX(-1)'
            }}
          />

          {isVideoOff && (
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.9)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              flexDirection: 'column',
              gap: '10px'
            }}>
              <VideoOff size={40} />
              <div style={{ fontSize: '12px' }}>Video Off</div>
            </div>
          )}
        </div>

        {/* Call Info */}
        <div style={{
          position: 'absolute',
          top: '20px',
          left: '20px',
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          color: 'white',
          padding: '16px 24px',
          borderRadius: '12px',
          backdropFilter: 'blur(10px)'
        }}>
          <div style={{ fontSize: '20px', fontWeight: '600', marginBottom: '8px' }}>
            {callData.toName || callData.fromName || 'User'}
          </div>
          <div style={{ fontSize: '14px', color: '#a0a0a0' }}>
            {callState === 'calling' ? '📞 Calling...' : 
             callState === 'active' ? `⏱️ ${formatTime(callDuration)}` : 
             '🔄 Connecting...'}
          </div>
        </div>

        {/* Controls */}
        <div style={{
          position: 'absolute',
          bottom: '30px',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          gap: '16px',
          alignItems: 'center'
        }}>
          <button
            onClick={toggleMute}
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              border: 'none',
              backgroundColor: isMuted ? '#dc2626' : 'rgba(75, 85, 99, 0.8)',
              color: 'white',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease',
              backdropFilter: 'blur(10px)'
            }}
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <MicOff size={28} /> : <Mic size={28} />}
          </button>

          <button
            onClick={toggleVideo}
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              border: 'none',
              backgroundColor: isVideoOff ? '#dc2626' : 'rgba(75, 85, 99, 0.8)',
              color: 'white',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease',
              backdropFilter: 'blur(10px)'
            }}
            title={isVideoOff ? 'Turn on video' : 'Turn off video'}
          >
            {isVideoOff ? <VideoOff size={28} /> : <Video size={28} />}
          </button>

          <button
            onClick={endCall}
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              border: 'none',
              backgroundColor: '#dc2626',
              color: 'white',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease',
              boxShadow: '0 4px 12px rgba(220, 38, 38, 0.4)'
            }}
            title="End call"
          >
            <PhoneOff size={28} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default VideoCall;