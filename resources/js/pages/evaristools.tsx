import { useState, useEffect } from 'react';
import type { SharedData } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import axios from 'axios';
import { Search, FileText, QrCode, FileLock, FileUp, FileDown, FolderOutput, ArrowDown01, StickyNote, BookA, Building2, Lock, Image, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface ToolCategory {
    id: string;
    title: string;
    description: string;
    icon: React.ComponentType<{ className?: string; size?: number }>;
    tools: Tool[];
}

interface Tool {
    id: string;
    title: string;
    description: string;
    icon: React.ComponentType<{ className?: string; size?: number }>;
    category: string;
    popular?: boolean;
}

const toolCategories: ToolCategory[] = [
    {
        id: 'pdf-tools',
        title: 'Herramientas PDF',
        description: 'Edición, conversión y manipulación de documentos PDF',
        icon: FileText,
        tools: [
            {
                id: 'resume-document',
                title: 'Resumir Documento',
                description: 'Genera resúmenes automáticos con IA',
                icon: FileText,
                category: 'pdf-tools'
            },
            {
                id: 'qr-generator',
                title: 'Generador de QR',
                description: 'Crea códigos QR personalizados con logo',
                icon: QrCode,
                category: 'pdf-tools',
                popular: true
            },
            {
                id: 'merge-pdfs',
                title: 'Unir PDFs',
                description: 'Combina múltiples archivos PDF en uno solo',
                icon: FileUp,
                category: 'pdf-tools'
            },
            {
                id: 'split-pdf',
                title: 'Dividir PDF',
                description: 'Separa un PDF en múltiples archivos más pequeños',
                icon: FolderOutput,
                category: 'pdf-tools'
            },
            {
                id: 'compress-pdf',
                title: 'Comprimir PDF',
                description: 'Reduce el tamaño de tus archivos PDF',
                icon: ArrowDown01,
                category: 'pdf-tools'
            }
        ]
    },
    {
        id: 'document-tools',
        title: 'Herramientas de Documentos',
        description: 'Procesamiento y conversión de documentos',
        icon: BookA,
        tools: [
            {
                id: 'word-to-pdf',
                title: 'Word a PDF',
                description: 'Convierte documentos Word a formato PDF',
                icon: FileDown,
                category: 'document-tools'
            },
            {
                id: 'powerpoint-to-pdf',
                title: 'PowerPoint a PDF',
                description: 'Convierte presentaciones PowerPoint a PDF',
                icon: Building2,
                category: 'document-tools'
            },
            {
                id: 'excel-to-pdf',
                title: 'Excel a PDF',
                description: 'Convierte hojas de cálculo Excel a PDF',
                icon: FileText,
                category: 'document-tools'
            }
        ]
    },
    {
        id: 'security-tools',
        title: 'Herramientas de Seguridad',
        description: 'Protección y gestión de documentos',
        icon: FileLock,
        tools: [
            {
                id: 'protect-pdf',
                title: 'Proteger PDF',
                description: 'Añade protección por contraseña a tus PDFs',
                icon: Lock,
                category: 'security-tools'
            },
            {
                id: 'sign-pdf',
                title: 'Firmar PDF',
                description: 'Añade firmas digitales a tus documentos PDF',
                icon: FileLock,
                category: 'security-tools'
            },
            {
                id: 'watermark-pdf',
                title: 'Marca de agua en PDF',
                description: 'Añade marcas de agua a tus documentos PDF',
                icon: FileText,
                category: 'security-tools'
            },
            {
                id: 'rotate-pdf',
                title: 'Rotar PDF',
                description: 'Rota las páginas de tus documentos PDF',
                icon: Building2,
                category: 'security-tools'
            }
        ]
    },
    {
        id: 'organization-tools',
        title: 'Herramientas de Organización',
        description: 'Gestión y organización de documentos',
        icon: Building2,
        tools: [
            {
                id: 'sort-pdf',
                title: 'Ordenar PDF',
                description: 'Reorganiza las páginas de tus documentos PDF',
                icon: FileUp,
                category: 'organization-tools'
            },
            {
                id: 'crop-pdf',
                title: 'Recortar PDF',
                description: 'Elimina los márgenes de tus documentos PDF',
                icon: Building2,
                category: 'organization-tools'
            },
            {
                id: 'page-numbers',
                title: 'Números de página',
                description: 'Añade números de página a un PDF',
                icon: FileText,
                category: 'organization-tools'
            },
            {
                id: 'unlock-pdf',
                title: 'Desbloquear PDF',
                description: 'Elimina la protección por contraseña de PDFs',
                icon: FileLock,
                category: 'organization-tools'
            }
        ]
    },
    {
        id: 'image-tools',
        title: 'Herramientas de Imágenes',
        description: 'Conversión y procesamiento de imágenes',
        icon: Image,
        tools: [
            {
                id: 'images-to-pdf',
                title: 'Imágenes a PDF',
                description: 'Convierte imágenes a formato PDF',
                icon: FileUp,
                category: 'image-tools'
            },
            {
                id: 'pdf-to-images',
                title: 'PDF a Imágenes',
                description: 'Convierte páginas de PDF a imágenes',
                icon: FileDown,
                category: 'image-tools'
            },
            {
                id: 'images-to-word',
                title: 'Imágenes a Word',
                description: 'Convierte imágenes a documentos Word editables',
                icon: BookA,
                category: 'image-tools',
                popular: true
            },
            {
                id: 'ocr-extract',
                title: 'OCR y Extracción de Texto',
                description: 'Extrae texto de imágenes mediante OCR',
                icon: StickyNote,
                category: 'image-tools',
                popular: true
            }
        ]
    },
    {
        id: 'hospital-tools',
        title: 'Herramientas Hospitalarias',
        description: 'Procesamiento de archivos RIPS y CUV para EPS',
        icon: Activity,
        tools: [
            {
                id: 'cuvs',
                title: 'CUVS - Rips JSON HUV',
                description: 'Sistema de conversión y procesamiento de archivos RIPS JSON para diferentes EPS',
                icon: Activity,
                category: 'hospital-tools',
                popular: true
            }
        ]
    }
];

const allTools = toolCategories.flatMap(category => category.tools);

export default function Evaristools({ shared }: { shared: SharedData }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [popularToolIds, setPopularToolIds] = useState<string[]>([]);
    const [isLoadingPopular, setIsLoadingPopular] = useState(true);

    // Cargar herramientas populares al montar el componente
    useEffect(() => {
        fetchPopularTools();
    }, []);

    // Obtener herramientas populares desde el backend
    const fetchPopularTools = async () => {
        try {
            const response = await axios.get('/api/tools/popular?threshold=5');
            if (response.data.success) {
                setPopularToolIds(response.data.popular_tools);
            }
        } catch (error) {
            console.error('Error fetching popular tools:', error);
        } finally {
            setIsLoadingPopular(false);
        }
    };

    // Registrar clic cuando el usuario hace clic en una herramienta
    const handleToolClick = async (toolId: string) => {
        try {
            // Registrar el clic en el backend (fire and forget)
            axios.post('/api/tools/click', { tool_id: toolId }).catch(() => {
                // Ignorar errores silenciosamente para no interrumpir la navegación
            });
        } catch (error) {
            // Ignorar errores
        }
    };

    // Verificar si una herramienta es popular dinámicamente
    const isToolPopular = (toolId: string): boolean => {
        return popularToolIds.includes(toolId);
    };

    // Filter tools based on search term
    const filteredTools = allTools.filter(tool =>
        tool.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tool.description.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Filter categories to only show those with matching tools
    const filteredCategories = toolCategories.map(category => ({
        ...category,
        tools: category.tools.filter(tool =>
            tool.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            tool.description.toLowerCase().includes(searchTerm.toLowerCase())
        )
    })).filter(category => category.tools.length > 0);

    // Function to get route for each tool
    const getToolRoute = (toolId: string): string | null => {
        const toolRoutes: Record<string, string> = {
            'qr-generator': '/tools/qr-generator',
            'compress-pdf': '/tools/pdf-compress',
            'ocr-extract': '/tools/ocr-extract',
            'merge-pdfs': '/tools/merge-pdfs',
            'split-pdf': '/tools/split-pdf',
            'images-to-pdf': '/tools/images-to-pdf',
            'images-to-word': '/tools/images-to-word',
            'pdf-to-images': '/tools/pdf-to-images',
            'word-to-pdf': '/tools/word-to-pdf',
            'rotate-pdf': '/tools/rotate-pdf',
            'page-numbers': '/tools/page-numbers',
            'watermark-pdf': '/tools/watermark-pdf',
            'sort-pdf': '/tools/sort-pdf',
            'crop-pdf': '/tools/crop-pdf',
            'unlock-pdf': '/tools/unlock-pdf',
            'powerpoint-to-pdf': '/tools/powerpoint-to-pdf',
            'excel-to-pdf': '/tools/excel-to-pdf',
            'resume-document': '/tools/resume-document',
            'sign-pdf': '/tools/sign-pdf',
            'protect-pdf': '/tools/protect-pdf',
            'cuvs': '/tools/cuvs',
            // Add more routes as tools are implemented
        };
        return toolRoutes[toolId] || null;
    };

    return (
        <>
            <Head title="Evaristools - Herramientas de Oficina">
                <meta name="description" content="Hospital Universitario del Valle 'Evaristo Garcia' E.S.E - Herramientas completas de digitalización, OCR y procesamiento de documentos." />
            </Head>
            
            <div className="min-h-screen bg-white dark:bg-slate-900">
                {/* Header */}
                <header className="border-b border-white/20 bg-white/80 backdrop-blur-md dark:bg-slate-900/80">
                    <div className="container mx-auto px-4 py-6">
                        <div className="flex flex-col items-center space-y-4">
                            <div className="flex items-center space-x-3">
                                <div className="flex h-12 w-12 items-center justify-center">
                                    <img 
                                        src="/images/logo.png" 
                                        alt="Hospital Universitario del Valle Logo" 
                                        className="h-12 w-12 object-contain"
                                    />
                                </div>
                                <div className="text-center">
                                    <h1 className="text-2xl font-bold text-institutional">Evaristools</h1>
                                    <p className="text-sm text-muted-foreground">Hospital Universitario del Valle "Evaristo Garcia" E.S.E</p>
                                </div>
                            </div>
                            
                            {/* Search Bar */}
                            <div className="w-full max-w-md">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        placeholder="Buscar herramientas..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-10 glass-card border-white/30 bg-white/50 backdrop-blur-sm"
                                    />
                                </div>
                                {searchTerm && (
                                    <p className="text-sm text-muted-foreground mt-2 text-center">
                                        {filteredTools.length} {filteredTools.length === 1 ? 'herramienta encontrada' : 'herramientas encontradas'}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </header>

                {/* Tools Section */}
                <main className="container mx-auto px-4 py-8">
                    <Tabs defaultValue="all" className="w-full">
                        <TabsList className="grid w-full grid-cols-6 mb-8">
                            <TabsTrigger value="all">Todas las herramientas</TabsTrigger>
                            <TabsTrigger value="pdf-tools">PDF</TabsTrigger>
                            <TabsTrigger value="document-tools">Documentos</TabsTrigger>
                            <TabsTrigger value="security-tools">Seguridad</TabsTrigger>
                            <TabsTrigger value="organization-tools">Organización</TabsTrigger>
                            <TabsTrigger value="image-tools">Imágenes</TabsTrigger>
                        </TabsList>

                        <TabsContent value="all" className="space-y-8">
                            {filteredTools.length === 0 ? (
                                <div className="text-center py-12">
                                    <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                                        No se encontraron herramientas
                                    </h3>
                                    <p className="text-muted-foreground">
                                        Intenta con otros términos de búsqueda
                                    </p>
                                </div>
                            ) : (
                                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                    {filteredTools.map((tool) => {
                                        const isPopular = isToolPopular(tool.id) || tool.popular;
                                        return (
                                            <Card
                                                key={tool.id}
                                                className="group glass-card border-white/30 bg-white/60 hover-lift hover:bg-white/80 dark:bg-slate-800/60 dark:hover:bg-slate-800/80"
                                            >
                                                <CardHeader className="pb-3">
                                                    <div className="flex items-start justify-between">
                                                        <div className="flex items-center space-x-3">
                                                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-institutional/10 text-institutional group-hover:bg-institutional group-hover:text-white transition-colors">
                                                                <tool.icon className="h-5 w-5" />
                                                            </div>
                                                            <div>
                                                                <CardTitle className="text-base text-slate-900 dark:text-white">
                                                                    {tool.title}
                                                                </CardTitle>
                                                                {isPopular && (
                                                                    <Badge variant="secondary" className="mt-1 text-xs">
                                                                        Popular
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </CardHeader>
                                                <CardContent>
                                                    <CardDescription className="text-sm text-slate-600 dark:text-slate-300 mb-4">
                                                        {tool.description}
                                                    </CardDescription>
                                                    {getToolRoute(tool.id) ? (
                                                        <Link 
                                                            href={getToolRoute(tool.id)!}
                                                            onClick={() => handleToolClick(tool.id)}
                                                        >
                                                            <Button
                                                                className="w-full bg-institutional hover:bg-institutional/90"
                                                                size="sm"
                                                            >
                                                                Usar Herramienta
                                                            </Button>
                                                        </Link>
                                                    ) : (
                                                        <Button
                                                            className="w-full bg-institutional hover:bg-institutional/90"
                                                            size="sm"
                                                            disabled
                                                        >
                                                            Próximamente
                                                        </Button>
                                                    )}
                                                </CardContent>
                                            </Card>
                                        );
                                    })}
                                </div>
                            )}
                        </TabsContent>

                        {filteredCategories.map((category) => (
                            <TabsContent key={category.id} value={category.id} className="space-y-6">
                                <div className="flex items-center space-x-4 mb-6">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-institutional/10 text-institutional">
                                        <category.icon className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                                            {category.title}
                                        </h2>
                                        <p className="text-slate-600 dark:text-slate-300">
                                            {category.description}
                                        </p>
                                    </div>
                                </div>

                                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                    {category.tools.map((tool) => {
                                        const isPopular = isToolPopular(tool.id) || tool.popular;
                                        return (
                                            <Card
                                                key={tool.id}
                                                className="group glass-card border-white/30 bg-white/60 hover-lift hover:bg-white/80 dark:bg-slate-800/60 dark:hover:bg-slate-800/80"
                                            >
                                                <CardHeader className="pb-3">
                                                    <div className="flex items-start justify-between">
                                                        <div className="flex items-center space-x-3">
                                                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-institutional/10 text-institutional group-hover:bg-institutional group-hover:text-white transition-colors">
                                                                <tool.icon className="h-5 w-5" />
                                                            </div>
                                                            <div>
                                                                <CardTitle className="text-base text-slate-900 dark:text-white">
                                                                    {tool.title}
                                                                </CardTitle>
                                                                {isPopular && (
                                                                    <Badge variant="secondary" className="mt-1 text-xs">
                                                                        Popular
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </CardHeader>
                                                <CardContent>
                                                    <CardDescription className="text-sm text-slate-600 dark:text-slate-300 mb-4">
                                                        {tool.description}
                                                    </CardDescription>
                                                    {getToolRoute(tool.id) ? (
                                                        <Link 
                                                            href={getToolRoute(tool.id)!}
                                                            onClick={() => handleToolClick(tool.id)}
                                                        >
                                                            <Button
                                                                className="w-full bg-institutional hover:bg-institutional/90"
                                                                size="sm"
                                                            >
                                                                Usar Herramienta
                                                            </Button>
                                                        </Link>
                                                    ) : (
                                                        <Button
                                                            className="w-full bg-institutional hover:bg-institutional/90"
                                                            size="sm"
                                                            disabled
                                                        >
                                                            Próximamente
                                                        </Button>
                                                    )}
                                                </CardContent>
                                            </Card>
                                        );
                                    })}
                                </div>
                            </TabsContent>
                        ))}
                    </Tabs>
                </main>
            </div>
        </>
    );
}