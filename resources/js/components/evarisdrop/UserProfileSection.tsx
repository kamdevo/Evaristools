import { useState } from 'react';
import { User, Edit2, Check, X, Moon, Sun, LogIn } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { RoomCodeDisplay } from './RoomCodeDisplay';
import { ThemeMode } from '@/types/evarisdrop/enums';

interface UserProfileSectionProps {
  username: string;
  roomCode: string;
  theme: ThemeMode;
  onUsernameChange: (username: string) => void;
  onThemeChange: (theme: ThemeMode) => void;
  onGenerateNewUsername: () => void;
  onJoinRoom?: (roomCode: string) => void;
}

export function UserProfileSection({ 
  username, 
  roomCode, 
  theme,
  onUsernameChange, 
  onThemeChange,
  onGenerateNewUsername,
  onJoinRoom 
}: UserProfileSectionProps) {
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [editedUsername, setEditedUsername] = useState(username);
  const [isJoinRoomOpen, setIsJoinRoomOpen] = useState(false);
  const [joinRoomCode, setJoinRoomCode] = useState('');

  const handleSaveUsername = () => {
    if (editedUsername.trim()) {
      onUsernameChange(editedUsername.trim());
      setIsEditingUsername(false);
    }
  };

  const handleCancelEdit = () => {
    setEditedUsername(username);
    setIsEditingUsername(false);
  };

  const isDarkMode = theme === ThemeMode.DARK;

  const handleJoinRoom = () => {
    if (joinRoomCode.trim() && onJoinRoom) {
      onJoinRoom(joinRoomCode.trim().toUpperCase());
      setJoinRoomCode('');
      setIsJoinRoomOpen(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="w-5 h-5" />
          Perfil de Usuario
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Username Section */}
        <div className="space-y-2">
          <Label htmlFor="username">Nombre de Usuario</Label>
          <div className="flex items-center gap-2">
            {isEditingUsername ? (
              <>
                <Input
                  id="username"
                  value={editedUsername}
                  onChange={(e) => setEditedUsername(e.target.value)}
                  className="flex-1"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveUsername();
                    if (e.key === 'Escape') handleCancelEdit();
                  }}
                />
                <Button size="sm" variant="ghost" onClick={handleSaveUsername}>
                  <Check className="w-4 h-4" />
                </Button>
                <Button size="sm" variant="ghost" onClick={handleCancelEdit}>
                  <X className="w-4 h-4" />
                </Button>
              </>
            ) : (
              <>
                <span className="flex-1 px-3 py-2 bg-muted rounded-md text-sm">
                  {username}
                </span>
                <Button size="sm" variant="ghost" onClick={() => setIsEditingUsername(true)}>
                  <Edit2 className="w-4 h-4" />
                </Button>
              </>
            )}
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onGenerateNewUsername}
            className="text-xs"
          >
            Generar Usuario Aleatorio
          </Button>
        </div>

        {/* Room Code Section */}
        <div className="space-y-2">
          <Label>Código de Sala</Label>
          <RoomCodeDisplay roomCode={roomCode} />
          {onJoinRoom && (
            <Dialog open={isJoinRoomOpen} onOpenChange={setIsJoinRoomOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline" className="w-full">
                  <LogIn className="w-4 h-4 mr-2" />
                  Unirse a Sala
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Unirse a Sala Privada</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="join-room-code">Código de Sala</Label>
                    <Input
                      id="join-room-code"
                      placeholder="Ej: ABCD-1234"
                      value={joinRoomCode}
                      onChange={(e) => setJoinRoomCode(e.target.value)}
                      className="uppercase"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleJoinRoom();
                      }}
                    />
                  </div>
                  <Button onClick={handleJoinRoom} className="w-full" disabled={!joinRoomCode.trim()}>
                    Unirse a Sala
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Theme Toggle */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isDarkMode ? (
              <Moon className="w-4 h-4" />
            ) : (
              <Sun className="w-4 h-4" />
            )}
            <Label htmlFor="theme-toggle">
              {isDarkMode ? 'Modo Oscuro' : 'Modo Claro'}
            </Label>
          </div>
          <Switch
            id="theme-toggle"
            checked={isDarkMode}
            onCheckedChange={(checked) => 
              onThemeChange(checked ? ThemeMode.DARK : ThemeMode.LIGHT)
            }
          />
        </div>
      </CardContent>
    </Card>
  );
}