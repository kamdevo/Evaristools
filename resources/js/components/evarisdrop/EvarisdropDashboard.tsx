import { useState, useEffect } from 'react';
import { WifiHigh, Plus, LogIn, Settings, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { EnhancedDeviceCard } from './EnhancedDeviceCard';
import { TransferProgressCard } from './TransferProgressCard';
import { UserProfileSection } from './UserProfileSection';
import { FileDropZone } from './FileDropZone';
import { FileQueueCard } from './FileQueueCard';
import { TransferRequestDialog } from './TransferRequestDialog';
import { ApiService, type ApiDevice, type ApiTransferRequest } from '@/services/apiService';
import { ConnectionStatus, TransferStatus, ThemeMode, DeviceLocation } from '@/types/evarisdrop/enums';
import type { Device, FileTransfer, QueuedFile, TransferRequest } from '@/types/evarisdrop/schema';

interface EvarisdropDashboardProps {
  appName: string;
  maxFileSize: number;
  networkName: string;
}

export function EvarisdropDashboard({ appName, maxFileSize, networkName }: EvarisdropDashboardProps) {
  // Real API state
  const [currentUser, setCurrentUser] = useState({
    id: '',
    username: '',
    roomCode: '',
    isInRoom: false,
    theme: ThemeMode.LIGHT,
    deviceName: '',
    deviceType: 'laptop' as 'laptop' | 'desktop' | 'mobile' | 'tablet'
  });
  const [devices, setDevices] = useState<Device[]>([]);
  const [transfers, setTransfers] = useState<FileTransfer[]>([]);
  const [connectionStatus, setConnectionStatus] = useState(ConnectionStatus.DISCONNECTED);
  const [isJoinRoomOpen, setIsJoinRoomOpen] = useState(false);
  const [joinRoomCode, setJoinRoomCode] = useState('');
  const [queuedFiles, setQueuedFiles] = useState<QueuedFile[]>([]);
  const [transferRequests, setTransferRequests] = useState<TransferRequest[]>([]);
  const [currentRequest, setCurrentRequest] = useState<TransferRequest | null>(null);
  
  // Loading states
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Apply theme to document
  useEffect(() => {
    const isDark = currentUser.theme === ThemeMode.DARK;
    document.documentElement.classList.toggle('dark', isDark);
  }, [currentUser.theme]);

  const handleUsernameChange = (username: string) => {
    setCurrentUser(prev => ({ ...prev, username }));
  };

  const handleThemeChange = (theme: ThemeMode) => {
    setCurrentUser(prev => ({ ...prev, theme }));
  };

  // Initialize with auto-detected device info
  useEffect(() => {
    const deviceType = ApiService.detectDeviceType();
    const deviceName = ApiService.detectDeviceName();
    const username = generateRandomUsername();
    
    setCurrentUser(prev => ({
      ...prev,
      username,
      deviceName,
      deviceType
    }));
  }, []);

  // Auto-create room when user info is ready
  useEffect(() => {
    if (currentUser.username && !currentUser.isInRoom && !isLoading) {
      console.log('🚀 Auto-creating room on page load for:', currentUser.username);
      handleCreateRoom();
    }
  }, [currentUser.username, currentUser.isInRoom, isLoading]);

  // Polling for device updates when in room
  useEffect(() => {
    if (!currentUser.isInRoom || !currentUser.roomCode) return;

    const pollDevices = async () => {
      try {
        const response = await ApiService.getRoomDevices(currentUser.roomCode);
        const apiDevices = response.devices || [];
        
        // Convert API devices to UI format
        const uiDevices: Device[] = apiDevices
          .filter(d => d.id !== response.currentDeviceId) // Exclude current device
          .map(apiDevice => ({
            id: apiDevice.id,
            name: apiDevice.name,
            type: apiDevice.type as Device['type'],
            status: ConnectionStatus.CONNECTED,
            lastSeen: apiDevice.lastSeen,
            location: DeviceLocation.SAME_ROOM,
            roomCode: currentUser.roomCode,
            userName: apiDevice.userName
          }));
        
        setDevices(uiDevices);
        setConnectionStatus(ConnectionStatus.CONNECTED);
      } catch (error) {
        console.error('Error polling devices:', error);
        setError('Error al obtener dispositivos');
      }
    };

    // Poll immediately, then every 3 seconds
    pollDevices();
    const interval = setInterval(pollDevices, 3000);
    
    return () => clearInterval(interval);
  }, [currentUser.isInRoom, currentUser.roomCode]);

  // Poll for pending transfer requests
  useEffect(() => {
    if (!currentUser.isInRoom) return;

    const pollRequests = async () => {
      try {
        const response = await ApiService.getPendingRequests();
        const apiRequests = response.requests || [];
        
        // Convert to UI format and show first pending request
        if (apiRequests.length > 0 && !currentRequest) {
          const firstRequest = apiRequests[0];
          const uiRequest: TransferRequest = {
            id: firstRequest.id,
            fileName: firstRequest.fileName,
            fileSize: firstRequest.fileSize,
            fromDevice: 'unknown',
            fromUserName: firstRequest.fromUserName,
            requestedAt: firstRequest.requestedAt,
            status: 'pending'
          };
          setCurrentRequest(uiRequest);
        }
      } catch (error) {
        console.error('Error polling requests:', error);
      }
    };

    const interval = setInterval(pollRequests, 2000);
    return () => clearInterval(interval);
  }, [currentUser.isInRoom, currentRequest]);

  const generateRandomUsername = () => {
    const adjectives = [
      'Azul', 'Rápido', 'Brillante', 'Veloz', 'Inteligente', 'Genial', 'Ágil',
      'Verde', 'Mágico', 'Estelar', 'Dorado', 'Plateado', 'Cristal', 'Solar',
      'Lunar', 'Cyber', 'Neo', 'Ultra', 'Mega', 'Super', 'Turbo', 'Quantum'
    ];
    const nouns = [
      'Caminante', 'Explorador', 'Navegante', 'Pionero', 'Guardián', 'Viajero',
      'Aventurero', 'Descobridor', 'Ingeniero', 'Arquitecto', 'Desarrollador',
      'Creador', 'Innovador', 'Maestro', 'Experto', 'Líder', 'Campeón', 'Héroe'
    ];
    const number = Math.floor(Math.random() * 9999) + 1;
    const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];
    return `${adjective}${noun}${number}`;
  };

  const handleGenerateNewUsername = () => {
    const newUsername = generateRandomUsername();
    handleUsernameChange(newUsername);
  };

  const generateSecureRoomCode = () => {
    const chars = 'ABCDEFGHIJKLMNPQRSTUVWXYZ123456789'; // Excluding O, 0 for clarity
    let result = '';
    for (let i = 0; i < 4; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    result += '-';
    for (let i = 0; i < 4; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const handleCreateRoom = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('🚀 Creating room with:', {
        deviceName: currentUser.deviceName || ApiService.detectDeviceName(),
        deviceType: currentUser.deviceType || ApiService.detectDeviceType(),
        username: currentUser.username
      });
      
      const response = await ApiService.createRoom(
        currentUser.deviceName || ApiService.detectDeviceName(),
        currentUser.deviceType || ApiService.detectDeviceType(),
        currentUser.username
      );
      
      console.log('✅ Room created response:', response);
      
      setCurrentUser(prev => ({
        ...prev,
        id: response.device.id,
        roomCode: response.roomCode,
        isInRoom: true
      }));
      setConnectionStatus(ConnectionStatus.CONNECTED);
      
      console.log('🎯 Room code set:', response.roomCode);
      
    } catch (error) {
      console.error('❌ Error creating room:', error);
      
      // Fallback: Create local room code if API fails
      const fallbackRoomCode = generateSecureRoomCode();
      console.log('🔄 Using fallback room code:', fallbackRoomCode);
      
      setCurrentUser(prev => ({
        ...prev,
        id: `local-${Date.now()}`,
        roomCode: fallbackRoomCode,
        isInRoom: true
      }));
      setConnectionStatus(ConnectionStatus.CONNECTED);
      
      setError('Usando modo local. Otros dispositivos pueden unirse con el código mostrado.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinRoom = async (roomCode: string) => {
    if (isLoading) return;
    
    setIsLoading(true);
    setError(null);
    setConnectionStatus(ConnectionStatus.CONNECTING);
    
    try {
      console.log('🚀 Joining room with code:', roomCode);
      
      const response = await ApiService.joinRoom(
        roomCode,
        currentUser.deviceName || ApiService.detectDeviceName(),
        currentUser.deviceType || ApiService.detectDeviceType(),
        currentUser.username
      );
      
      console.log('✅ Room joined response:', response);
      
      setCurrentUser(prev => ({
        ...prev,
        id: response.device.id,
        roomCode: response.roomCode,
        isInRoom: true
      }));
      setConnectionStatus(ConnectionStatus.CONNECTED);
      
      console.log('🎯 Successfully joined room:', response.roomCode);
      
    } catch (error) {
      console.error('❌ Error joining room:', error);
      setError('No se pudo unir a la sala. Verifica el código e intenta nuevamente.');
      setConnectionStatus(ConnectionStatus.DISCONNECTED);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSelect = (files: File[]) => {
    // Add files to queue instead of transferring immediately
    files.forEach((file) => {
      const queuedFile: QueuedFile = {
        id: `queued-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        file,
        status: 'queued',
        addedAt: new Date().toISOString()
      };
      
      setQueuedFiles(prev => [...prev, queuedFile]);
    });
  };

  const handleSendFile = async (fileId: string, deviceId: string) => {
    const queuedFile = queuedFiles.find(f => f.id === fileId);
    if (!queuedFile) return;

    // Mark as sending
    setQueuedFiles(prev => prev.map(f => 
      f.id === fileId ? { ...f, status: 'sending' as const, targetDeviceId: deviceId } : f
    ));

    try {
      const response = await ApiService.requestTransfer(deviceId, queuedFile.file);
      
      // Mark as sent
      setQueuedFiles(prev => prev.map(f => 
        f.id === fileId ? { ...f, status: 'sent' as const, transferId: response.transferId } : f
      ));
      
    } catch (error) {
      console.error('Error sending file:', error);
      setError('Error al enviar archivo. Inténtalo de nuevo.');
      
      // Revert to queued state
      setQueuedFiles(prev => prev.map(f => 
        f.id === fileId ? { ...f, status: 'queued' as const, targetDeviceId: undefined } : f
      ));
    }
  };

  const handleRemoveQueuedFile = (fileId: string) => {
    setQueuedFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const handleAcceptTransfer = async (requestId: string) => {
    if (!currentRequest) return;

    try {
      await ApiService.respondToTransfer(requestId, 'accept');
      
      // Create UI transfer for progress display
      const transfer: FileTransfer = {
        id: requestId,
        fileName: currentRequest.fileName,
        fileSize: currentRequest.fileSize,
        status: TransferStatus.UPLOADING,
        progress: 0,
        speed: 1024000,
        remainingTime: Math.ceil(currentRequest.fileSize / 1024000),
        fromDevice: currentRequest.fromDevice,
        toDevice: currentUser.id,
        acceptedAt: new Date().toISOString()
      };

      setTransfers(prev => [...prev, transfer]);
      setCurrentRequest(null);

      // Start download process
      setTimeout(async () => {
        try {
          const blob = await ApiService.downloadFile(requestId);
          
          // Create download link
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = currentRequest.fileName;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
          
          // Mark as completed
          setTransfers(prev => prev.map(t => 
            t.id === requestId 
              ? { ...t, status: TransferStatus.COMPLETED, progress: 100, remainingTime: 0, completedAt: new Date().toISOString() }
              : t
          ));
          
        } catch (error) {
          console.error('Error downloading file:', error);
          setTransfers(prev => prev.map(t => 
            t.id === requestId 
              ? { ...t, status: TransferStatus.FAILED }
              : t
          ));
        }
      }, 1000);
      
    } catch (error) {
      console.error('Error accepting transfer:', error);
      setError('Error al aceptar transferencia');
    }
  };

  const handleRejectTransfer = async (requestId: string) => {
    try {
      await ApiService.respondToTransfer(requestId, 'reject');
      setCurrentRequest(null);
    } catch (error) {
      console.error('Error rejecting transfer:', error);
      setError('Error al rechazar transferencia');
    }
  };

  const handleCancelTransfer = (transferId: string) => {
    setTransfers(prev => prev.map(t => 
      t.id === transferId 
        ? { ...t, status: TransferStatus.CANCELLED }
        : t
    ));
  };

  const handleRetryTransfer = (transferId: string) => {
    setTransfers(prev => prev.map(t => 
      t.id === transferId 
        ? { ...t, status: TransferStatus.PENDING, progress: 0 }
        : t
    ));
  };

  const handleRefreshDevices = () => {
    setConnectionStatus(ConnectionStatus.CONNECTING);
    setTimeout(() => {
      setConnectionStatus(ConnectionStatus.CONNECTED);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img 
              src="/images/logo.png" 
              alt="Logo de la institución" 
              className="h-12 w-auto object-contain"
            />
            <div>
              <h1 className="text-3xl font-bold text-primary">{appName}</h1>
              <p className="text-muted-foreground">Hospital Universitario del Valle "Evaristo Garcia" E.S.E</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-sm text-muted-foreground text-right hidden sm:block">
              <p>Usuario: <span className="font-medium">{currentUser.username}</span></p>
              {currentUser.isInRoom && (
                <p>Sala: <span className="font-medium text-primary">{currentUser.roomCode}</span></p>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Devices & File Transfer */}
          <div className="lg:col-span-2 space-y-6">


            {/* Devices & File Transfer */}
            <Card>
              <CardHeader>
                <CardTitle>
                  Dispositivos Disponibles ({devices.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {devices.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <WifiHigh className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No hay dispositivos en la sala</p>
                    <p className="text-sm">{currentUser.isInRoom ? 'Esperando conexiones...' : 'Únete o crea una sala para comenzar'}</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {devices.map((device) => (
                      <EnhancedDeviceCard 
                        key={device.id} 
                        device={device}
                        hasQueuedFiles={queuedFiles.length > 0}
                        onSendFiles={() => {
                          // Auto-send first queued file for demo
                          const firstQueued = queuedFiles.find(f => f.status === 'queued');
                          if (firstQueued) {
                            handleSendFile(firstQueued.id, device.id);
                          }
                        }}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* File Transfer Zone */}
            {currentUser.isInRoom && devices.length > 0 ? (
              <FileDropZone 
                onFileSelect={handleFileSelect}
                maxFileSize={maxFileSize}
              />
            ) : (
              <Card>
                <CardContent className="text-center py-12 text-muted-foreground">
                  <div className="space-y-3">
                    <div className="text-6xl mb-4">📁</div>
                    <h3 className="text-lg font-medium">Zona de Transferencia</h3>
                    <p>Para transferir archivos necesitas:</p>
                    <div className="text-sm space-y-1">
                      <p>✓ Estar en una sala activa</p>
                      <p>✓ Tener dispositivos conectados</p>
                    </div>
                    {!currentUser.isInRoom && (
                      <p className="text-primary font-medium mt-4">
                        👆 Crea o únete a una sala para comenzar
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - User Profile & Transfers */}
          <div className="space-y-6">
            {/* User Profile */}
            <UserProfileSection
              username={currentUser.username}
              roomCode={currentUser.roomCode}
              theme={currentUser.theme}
              onUsernameChange={handleUsernameChange}
              onThemeChange={handleThemeChange}
              onGenerateNewUsername={handleGenerateNewUsername}
              onJoinRoom={handleJoinRoom}
            />

            {/* File Queue */}
            {queuedFiles.length > 0 && (
              <FileQueueCard
                queuedFiles={queuedFiles}
                devices={devices.filter(d => d.status === ConnectionStatus.CONNECTED)}
                onSendFile={handleSendFile}
                onRemoveFile={handleRemoveQueuedFile}
              />
            )}

            {/* Active Transfers */}
            {transfers.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Transferencias Activas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {transfers.map((transfer) => (
                      <TransferProgressCard
                        key={transfer.id}
                        transfer={transfer}
                        onCancel={() => handleCancelTransfer(transfer.id)}
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Transfer Request Dialog */}
        <TransferRequestDialog
          request={currentRequest}
          isOpen={currentRequest !== null}
          onClose={() => setCurrentRequest(null)}
          onAccept={handleAcceptTransfer}
          onReject={handleRejectTransfer}
        />
      </div>
    </div>
  );
}