import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import SimpleThemeToggle from '@/components/simple-theme-toggle';
import AppearanceToggleDropdown from '@/components/appearance-dropdown';
import { useAppearance } from '@/hooks/use-appearance';
import { Moon, Sun, Monitor, Palette, Lightbulb, Eye, ArrowDown } from 'lucide-react';

export default function ThemeTogglePreview() {
    const { appearance, updateAppearance } = useAppearance();

    const getCurrentThemeInfo = () => {
        switch (appearance) {
            case 'dark':
                return {
                    icon: <Moon className="h-6 w-6" />,
                    name: 'Modo Oscuro',
                    description: 'Interfaz oscura activa',
                    color: 'text-blue-400'
                };
            case 'light':
                return {
                    icon: <Sun className="h-6 w-6" />,
                    name: 'Modo Claro', 
                    description: 'Interfaz clara activa',
                    color: 'text-yellow-500'
                };
            default:
                return {
                    icon: <Monitor className="h-6 w-6" />,
                    name: 'Modo Sistema',
                    description: 'Siguiendo configuración del sistema',
                    color: 'text-purple-500'
                };
        }
    };

    const themeInfo = getCurrentThemeInfo();

    return (
        <div className="min-h-screen bg-background transition-colors duration-500">
            {/* Header with MULTIPLE theme toggle options */}
            <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="container mx-auto flex h-20 items-center justify-between px-6">
                    <div className="flex items-center space-x-3">
                        <Palette className="h-8 w-8 text-primary" />
                        <div>
                            <h1 className="text-2xl font-bold">Evaristools</h1>
                            <p className="text-sm text-muted-foreground">Control de Tema</p>
                        </div>
                    </div>
                    
                    {/* MULTIPLE THEME TOGGLE BUTTONS - VERY VISIBLE */}
                    <div className="flex items-center space-x-4">
                        {/* Simple Toggle Button */}
                        <div className="flex flex-col items-center space-y-1">
                            <SimpleThemeToggle />
                            <span className="text-xs text-muted-foreground">Simple</span>
                        </div>
                        
                        {/* Dropdown Toggle Button */}
                        <div className="flex flex-col items-center space-y-1">
                            <AppearanceToggleDropdown />
                            <span className="text-xs text-muted-foreground">Dropdown</span>
                        </div>
                        
                        {/* Large Toggle Button with Label */}
                        <SimpleThemeToggle showLabel={true} className="border-2 border-primary/30" />
                    </div>
                </div>
            </header>

            {/* Main content */}
            <div className="container mx-auto px-6 py-12 max-w-6xl">
                <div className="space-y-12">
                    {/* Hero Section with Giant Theme Status */}
                    <div className="text-center space-y-6">
                        <div className="flex items-center justify-center space-x-4">
                            <div className={`p-4 rounded-full bg-primary/10 ${themeInfo.color}`}>
                                {themeInfo.icon}
                            </div>
                            <div className="text-left">
                                <h1 className="text-5xl font-bold">{themeInfo.name}</h1>
                                <p className="text-xl text-muted-foreground">{themeInfo.description}</p>
                            </div>
                        </div>
                        
                        {/* Arrow pointing to buttons */}
                        <div className="flex flex-col items-center space-y-2 text-primary animate-bounce">
                            <ArrowDown className="h-8 w-8" />
                            <p className="text-lg font-semibold">¡Los botones están arriba!</p>
                        </div>
                    </div>

                    {/* Current Status Card */}
                    <Card className="border-4 border-primary/30 shadow-2xl">
                        <CardHeader className="text-center">
                            <CardTitle className="text-3xl flex items-center justify-center space-x-3">
                                <Lightbulb className="h-8 w-8 text-primary" />
                                <span>Estado del Tema</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="text-center space-y-4">
                                <Badge variant="secondary" className="text-2xl px-8 py-4">
                                    Tema Activo: {appearance}
                                </Badge>
                                
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
                                    <Button 
                                        variant={appearance === 'light' ? 'default' : 'outline'}
                                        size="lg"
                                        onClick={() => updateAppearance('light')}
                                        className="h-16 text-lg"
                                    >
                                        <Sun className="h-6 w-6 mr-3" />
                                        Modo Claro
                                    </Button>
                                    
                                    <Button 
                                        variant={appearance === 'dark' ? 'default' : 'outline'}
                                        size="lg"
                                        onClick={() => updateAppearance('dark')}
                                        className="h-16 text-lg"
                                    >
                                        <Moon className="h-6 w-6 mr-3" />
                                        Modo Oscuro
                                    </Button>
                                    
                                    <Button 
                                        variant={appearance === 'system' ? 'default' : 'outline'}
                                        size="lg"
                                        onClick={() => updateAppearance('system')}
                                        className="h-16 text-lg"
                                    >
                                        <Monitor className="h-6 w-6 mr-3" />
                                        Modo Sistema
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Visual Demo Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        <Card className="hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                            <CardHeader>
                                <CardTitle className="flex items-center space-x-2 text-xl">
                                    <Sun className="h-6 w-6 text-yellow-500" />
                                    <span>Modo Claro</span>
                                </CardTitle>
                                <CardDescription className="text-lg">
                                    Interfaz brillante y clara
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div className="h-6 bg-white border-2 rounded-lg shadow-sm"></div>
                                    <div className="h-6 bg-gray-100 rounded-lg"></div>
                                    <div className="h-6 bg-gray-200 rounded-lg"></div>
                                    <Button 
                                        variant="outline" 
                                        className="w-full"
                                        onClick={() => updateAppearance('light')}
                                    >
                                        Activar Modo Claro
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                            <CardHeader>
                                <CardTitle className="flex items-center space-x-2 text-xl">
                                    <Moon className="h-6 w-6 text-blue-400" />
                                    <span>Modo Oscuro</span>
                                </CardTitle>
                                <CardDescription className="text-lg">
                                    Interfaz oscura y elegante
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div className="h-6 bg-gray-800 rounded-lg"></div>
                                    <div className="h-6 bg-gray-700 rounded-lg"></div>
                                    <div className="h-6 bg-gray-600 rounded-lg"></div>
                                    <Button 
                                        variant="outline" 
                                        className="w-full"
                                        onClick={() => updateAppearance('dark')}
                                    >
                                        Activar Modo Oscuro
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                            <CardHeader>
                                <CardTitle className="flex items-center space-x-2 text-xl">
                                    <Monitor className="h-6 w-6 text-purple-500" />
                                    <span>Modo Sistema</span>
                                </CardTitle>
                                <CardDescription className="text-lg">
                                    Sigue la configuración del SO
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div className="h-6 bg-gradient-to-r from-white via-gray-400 to-gray-800 rounded-lg"></div>
                                    <div className="h-6 bg-gradient-to-r from-gray-100 via-gray-500 to-gray-700 rounded-lg"></div>
                                    <div className="h-6 bg-gradient-to-r from-gray-200 via-gray-600 to-gray-600 rounded-lg"></div>
                                    <Button 
                                        variant="outline" 
                                        className="w-full"
                                        onClick={() => updateAppearance('system')}
                                    >
                                        Activar Modo Sistema
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Instructions */}
                    <Card className="bg-primary/5 border-primary/30 border-2">
                        <CardHeader>
                            <CardTitle className="text-primary text-2xl flex items-center space-x-2">
                                <Eye className="h-6 w-6" />
                                <span>¿Dónde están los botones?</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="bg-background rounded-xl p-6 border-2">
                                <h4 className="font-bold text-xl mb-4 text-primary">🎯 Ubicaciones de los Botones de Tema:</h4>
                                <div className="space-y-3 text-lg">
                                    <p>✅ <strong>Header Superior:</strong> Mira en la parte superior de esta página</p>
                                    <p>✅ <strong>Botones Grandes:</strong> En las tarjetas de abajo</p>
                                    <p>✅ <strong>Múltiples Opciones:</strong> Simple, Dropdown y con Etiqueta</p>
                                </div>
                            </div>
                            
                            <div className="bg-background rounded-xl p-6 border-2">
                                <h4 className="font-bold text-xl mb-4 text-primary">🖱️ Cómo Usar:</h4>
                                <div className="space-y-3 text-lg">
                                    <p>1. Haz clic en cualquier botón de tema</p>
                                    <p>2. Observa el cambio inmediato</p>
                                    <p>3. Tu preferencia se guarda automáticamente</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}