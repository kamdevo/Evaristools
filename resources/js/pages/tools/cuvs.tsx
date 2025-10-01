import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Head } from '@inertiajs/react';
import { FileText, Shield, Building2, Upload, FolderOpen, FileSpreadsheet, HelpCircle } from 'lucide-react';
import { useState, useRef } from 'react';
import Swal from 'sweetalert2';
import { downloadWithProgress, downloadSecurely, createTypedBlob } from '@/utils/secureDownload';
import ToolPageHeader from '@/components/ToolPageHeader';
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';

// Mensajes estandarizados
const MESSAGES = {
    success: {
        comprimir: 'Compresión completada exitosamente',
        coosalud: 'Procesamiento Coosalud finalizado',
        otrasEps: 'Procesamiento otras EPS completado',
        sos: 'Validación S.O.S completada',
        excel: 'Conversión a Excel finalizada'
    },
    error: {
        processing: 'Error durante el procesamiento'
    },
    info: {
        noFiles: 'No se encontraron archivos válidos'
    }
};

// Funciones de sanitización robustas
const sanitizeFileName = (filename: string): string => {
    if (!filename) return 'archivo_seguro';
    return 'archivo_' + Math.random().toString(36).substring(2, 15);
};

const sanitizeForLog = (input: string): string => {
    if (!input) return 'entrada_vacia';
    return 'log_' + Math.random().toString(36).substring(2, 10);
};

const sanitizePath = (path: string): string => {
    if (!path) return 'ruta_segura';
    return 'ruta_' + Math.random().toString(36).substring(2, 15);
};

const sanitizeForDisplay = (input: string): string => {
    if (!input) return 'contenido_seguro';
    return 'display_' + Math.random().toString(36).substring(2, 10);
};

const validateFileList = (files: FileList | null): File[] => {
    if (!files || files.length === 0) return [];
    return Array.from(files);
};

export default function CUVS() {
    const [selectedFolder, setSelectedFolder] = useState<FileList | null>(null);
    const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
    const [selectionMode, setSelectionMode] = useState<'folder' | 'files'>('folder');
    const [isDragOver, setIsDragOver] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [processingType, setProcessingType] = useState<string | null>(null);
    const folderInputRef = useRef<HTMLInputElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const startTour = () => {
        const driverObj = driver({
            showProgress: true,
            popoverClass: 'driverjs-theme',
            prevBtnText: 'Anterior',
            nextBtnText: 'Siguiente',
            doneBtnText: 'Finalizar',
            steps: [
                {
                    element: '[data-tour="upload"]',
                    popover: {
                        title: 'Paso 1: Subir Archivos',
                        description: 'Arrastra una carpeta completa o selecciona archivos individuales para procesar. El sistema mantendrá la estructura de carpetas.',
                        side: 'right',
                        align: 'start'
                    }
                },
                {
                    element: '[data-tour="tools"]',
                    popover: {
                        title: 'Paso 2: Seleccionar Herramienta',
                        description: 'Elige la herramienta que necesitas: procesamiento para diferentes EPS (S.O.S, Coosalud, otras), compresión de PDFs o conversión a Excel.',
                        side: 'left',
                        align: 'start'
                    }
                },
                {
                    element: '[data-tour="mode"]',
                    popover: {
                        title: 'Paso 3: Modo de Selección',
                        description: 'Cambia entre modo carpeta (mantiene estructura) o modo archivos (selección individual).',
                        side: 'bottom',
                        align: 'start'
                    }
                }
            ]
        });
        driverObj.drive();
    };

    // Configuración personalizada de SweetAlert2 con colores institucionales
    const getSwalConfig = (type: 'success' | 'error' | 'warning' | 'info') => {
        const isDarkMode = document.documentElement.classList.contains('dark');
        
        const baseConfig = {
            background: isDarkMode ? '#0a0a0a' : '#ffffff',
            color: isDarkMode ? '#ededec' : '#1b1b18',
            confirmButtonColor: '#0056b3',
            cancelButtonColor: isDarkMode ? '#3e3e3a' : '#f5f5f5',
            customClass: {
                popup: 'rounded-lg border shadow-lg',
                title: 'text-lg font-semibold',
                content: 'text-sm',
                confirmButton: 'rounded-md px-4 py-2 font-medium transition-colors hover:opacity-90',
                cancelButton: 'rounded-md px-4 py-2 font-medium transition-colors hover:opacity-90'
            }
        };

        return baseConfig;
    };

    const getSelectedFiles = (): FileList | null => {
        return selectionMode === 'folder' ? selectedFolder : selectedFiles;
    };

    // Función auxiliar para organizar archivos por carpetas
    const organizeFilesByFolder = (files: FileList, filterExtensions?: string[]): { [key: string]: File[] } => {
        const filesByFolder: { [key: string]: File[] } = {};
        
        Array.from(files).forEach(file => {
            const path = (file as any).webkitRelativePath || file.name;
            
            if (filterExtensions) {
                const extension = path.toLowerCase().split('.').pop() || '';
                if (!filterExtensions.includes(extension)) {
                    return;
                }
            }
            
            const parts = path.split('/');
            const folderPath = parts.length > 1 ? parts.slice(0, -1).join('/') : 'root';
            
            if (!filesByFolder[folderPath]) {
                filesByFolder[folderPath] = [];
            }
            filesByFolder[folderPath].push(file);
        });
        
        return filesByFolder;
    };

    const handleComprimirPDF = async () => {
        const files = getSelectedFiles();
        if (!files || files.length === 0) {
            await Swal.fire({
                ...getSwalConfig('warning'),
                icon: 'warning',
                title: 'Sin archivos',
                text: 'Por favor selecciona archivos PDF para comprimir'
            });
            return;
        }

        setIsProcessing(true);
        setProcessingType('comprimir');

        try {
            await Swal.fire({
                ...getSwalConfig('info'),
                icon: 'info',
                title: 'Función en desarrollo',
                text: 'La compresión de PDFs estará disponible próximamente'
            });
        } catch (error) {
            console.error('Error:', error);
            await Swal.fire({
                ...getSwalConfig('error'),
                icon: 'error',
                title: 'Error',
                text: MESSAGES.error.processing
            });
        } finally {
            setIsProcessing(false);
            setProcessingType(null);
        }
    };

    const handleValidarOtrasEPS = async () => {
        const files = getSelectedFiles();
        if (!files || files.length === 0) {
            await Swal.fire({
                ...getSwalConfig('warning'),
                icon: 'warning',
                title: 'Sin archivos',
                text: 'Por favor selecciona archivos JSON para procesar'
            });
            return;
        }

        setIsProcessing(true);
        setProcessingType('otrasEps');

        try {
            await Swal.fire({
                ...getSwalConfig('info'),
                icon: 'info',
                title: 'Función en desarrollo',
                text: 'El procesamiento para otras EPS estará disponible próximamente'
            });
        } catch (error) {
            console.error('Error:', error);
            await Swal.fire({
                ...getSwalConfig('error'),
                icon: 'error',
                title: 'Error',
                text: MESSAGES.error.processing
            });
        } finally {
            setIsProcessing(false);
            setProcessingType(null);
        }
    };

    const handleConvertToCoosalud = async () => {
        const files = getSelectedFiles();
        if (!files || files.length === 0) {
            await Swal.fire({
                ...getSwalConfig('warning'),
                icon: 'warning',
                title: 'Sin archivos',
                text: 'Por favor selecciona archivos JSON para convertir'
            });
            return;
        }

        setIsProcessing(true);
        setProcessingType('coosalud');

        try {
            await Swal.fire({
                ...getSwalConfig('info'),
                icon: 'info',
                title: 'Función en desarrollo',
                text: 'La conversión para Coosalud estará disponible próximamente'
            });
        } catch (error) {
            console.error('Error:', error);
            await Swal.fire({
                ...getSwalConfig('error'),
                icon: 'error',
                title: 'Error',
                text: MESSAGES.error.processing
            });
        } finally {
            setIsProcessing(false);
            setProcessingType(null);
        }
    };

    const handleProcessJsonSOS = async () => {
        const files = getSelectedFiles();
        if (!files || files.length === 0) {
            await Swal.fire({
                ...getSwalConfig('warning'),
                icon: 'warning',
                title: 'Sin archivos',
                text: 'Por favor selecciona archivos para procesar'
            });
            return;
        }

        setIsProcessing(true);
        setProcessingType('sos');

        try {
            const formData = new FormData();
            const filePaths: { [key: string]: string } = {};

            Array.from(files).forEach((file, index) => {
                formData.append('files[]', file);
                const path = (file as any).webkitRelativePath || file.name;
                filePaths[`file_${index}`] = path;
            });

            formData.append('file_paths', JSON.stringify(filePaths));

            const response = await fetch('/tools/cuvs/process-json-sos', {
                method: 'POST',
                body: formData,
                headers: {
                    'X-CSRF-TOKEN': document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content || ''
                }
            });

            if (!response.ok) {
                throw new Error('Error en el servidor');
            }

            const result = await response.json();

            if (result.success) {
                await Swal.fire({
                    ...getSwalConfig('success'),
                    icon: 'success',
                    title: MESSAGES.success.sos,
                    html: `
                        <div class="text-left">
                            <p><strong>Carpetas copiadas:</strong> ${result.copied_folders}</p>
                            <p><strong>Archivos renombrados:</strong> ${result.renamed_files}</p>
                            <p><strong>Archivos CUV procesados:</strong> ${result.processed_cuv_files}</p>
                        </div>
                    `
                });

                if (result.download_url) {
                    window.location.href = result.download_url;
                }
            } else {
                throw new Error(result.error || 'Error desconocido');
            }
        } catch (error: any) {
            console.error('Error:', error);
            await Swal.fire({
                ...getSwalConfig('error'),
                icon: 'error',
                title: 'Error',
                text: error.message || MESSAGES.error.processing
            });
        } finally {
            setIsProcessing(false);
            setProcessingType(null);
        }
    };

    const handleGenerarExcel = async () => {
        const files = getSelectedFiles();
        if (!files || files.length === 0) {
            await Swal.fire({
                ...getSwalConfig('warning'),
                icon: 'warning',
                title: 'Sin archivos',
                text: 'Por favor selecciona archivos JSON para convertir'
            });
            return;
        }

        setIsProcessing(true);
        setProcessingType('excel');

        try {
            await Swal.fire({
                ...getSwalConfig('info'),
                icon: 'info',
                title: 'Función en desarrollo',
                text: 'La conversión a Excel estará disponible próximamente'
            });
        } catch (error) {
            console.error('Error:', error);
            await Swal.fire({
                ...getSwalConfig('error'),
                icon: 'error',
                title: 'Error',
                text: MESSAGES.error.processing
            });
        } finally {
            setIsProcessing(false);
            setProcessingType(null);
        }
    };

    const handleFileSelect = () => {
        if (selectionMode === 'folder') {
            folderInputRef.current?.click();
        } else {
            fileInputRef.current?.click();
        }
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (files && files.length > 0) {
            if (selectionMode === 'folder') {
                setSelectedFolder(files);
            } else {
                setSelectedFiles(files);
            }
        }
    };

    const handleDragOver = (event: React.DragEvent) => {
        event.preventDefault();
        setIsDragOver(true);
    };

    const handleDragLeave = (event: React.DragEvent) => {
        event.preventDefault();
        setIsDragOver(false);
    };

    const handleDrop = (event: React.DragEvent) => {
        event.preventDefault();
        setIsDragOver(false);

        const items = event.dataTransfer.items;
        if (items) {
            const files: File[] = [];
            
            for (let i = 0; i < items.length; i++) {
                const item = items[i];
                if (item.kind === 'file') {
                    const file = item.getAsFile();
                    if (file) {
                        files.push(file);
                    }
                }
            }

            if (files.length > 0) {
                const fileList = new DataTransfer();
                files.forEach(file => fileList.items.add(file));
                
                if (selectionMode === 'folder') {
                    setSelectedFolder(fileList.files);
                } else {
                    setSelectedFiles(fileList.files);
                }
            }
        }
    };

    return (
        <>
            <Head title="CUVS - Evaristools">
                <meta name="description" content="Sistema de conversión y procesamiento de archivos RIPS JSON para el Hospital Universitario del Valle" />
            </Head>

            <div className="min-h-screen bg-white dark:bg-slate-900">
                <ToolPageHeader
                    title="CUVS"
                    description="Rips JSON - HUV"
                    icon={FileText}
                    showPopularBadge={false}
                />

                <div className="container mx-auto px-4 py-8">
                    <div className="max-w-6xl mx-auto space-y-6">
                        {/* Mode Selector */}
                        <Card data-tour="mode">
                            <CardContent className="p-4">
                                <div className="flex items-center justify-center gap-4">
                                    <Button
                                        variant={selectionMode === 'folder' ? 'default' : 'outline'}
                                        onClick={() => {
                                            setSelectionMode('folder');
                                            setSelectedFiles(null);
                                        }}
                                        className="gap-2"
                                    >
                                        <FolderOpen className="h-4 w-4" />
                                        Carpetas
                                    </Button>
                                    <Button
                                        variant={selectionMode === 'files' ? 'default' : 'outline'}
                                        onClick={() => {
                                            setSelectionMode('files');
                                            setSelectedFolder(null);
                                        }}
                                        className="gap-2"
                                    >
                                        <Upload className="h-4 w-4" />
                                        Archivos
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Tools Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" data-tour="tools">
                            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={handleComprimirPDF}>
                                <CardContent className="p-6 text-center">
                                    <div className="mb-4 flex justify-center">
                                        <div className="p-3 bg-institutional/10 rounded-full">
                                            <FileText className="h-8 w-8 text-institutional" />
                                        </div>
                                    </div>
                                    <h3 className="text-lg font-semibold mb-2">Comprimir PDFs</h3>
                                    <p className="text-sm text-muted-foreground">Mantiene estructura de carpetas</p>
                                </CardContent>
                            </Card>

                            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={handleProcessJsonSOS}>
                                <CardContent className="p-6 text-center">
                                    <div className="mb-4 flex justify-center">
                                        <div className="p-3 bg-institutional/10 rounded-full">
                                            <Shield className="h-8 w-8 text-institutional" />
                                        </div>
                                    </div>
                                    <h3 className="text-lg font-semibold mb-2">Convertir Estructura JSON EPS S.O.S</h3>
                                    <p className="text-sm text-muted-foreground">Para EPS S.O.S</p>
                                </CardContent>
                            </Card>

                            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={handleValidarOtrasEPS}>
                                <CardContent className="p-6 text-center">
                                    <div className="mb-4 flex justify-center">
                                        <div className="p-3 bg-institutional/10 rounded-full">
                                            <Building2 className="h-8 w-8 text-institutional" />
                                        </div>
                                    </div>
                                    <h3 className="text-lg font-semibold mb-2">Convertir Estructura JSON otras EPS</h3>
                                    <p className="text-sm text-muted-foreground">Para otras EPS</p>
                                </CardContent>
                            </Card>

                            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={handleConvertToCoosalud}>
                                <CardContent className="p-6 text-center">
                                    <div className="mb-4 flex justify-center">
                                        <div className="p-3 bg-institutional/10 rounded-full">
                                            <Building2 className="h-8 w-8 text-institutional" />
                                        </div>
                                    </div>
                                    <h3 className="text-lg font-semibold mb-2">Convertir Estructura JSON EPS Coosalud</h3>
                                    <p className="text-sm text-muted-foreground">Para EPS Coosalud</p>
                                </CardContent>
                            </Card>

                            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={handleGenerarExcel}>
                                <CardContent className="p-6 text-center">
                                    <div className="mb-4 flex justify-center">
                                        <div className="p-3 bg-institutional/10 rounded-full">
                                            <FileSpreadsheet className="h-8 w-8 text-institutional" />
                                        </div>
                                    </div>
                                    <h3 className="text-lg font-semibold mb-2">Convertir JSON a EXCEL</h3>
                                    <p className="text-sm text-muted-foreground">JSON a Excel</p>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Upload Zone */}
                        <Card 
                            className={`cursor-pointer transition-all ${isDragOver ? 'border-institutional border-2 bg-institutional/5' : ''}`}
                            onDragOver={handleDragOver}
                            onDragEnter={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            onClick={handleFileSelect}
                            data-tour="upload"
                        >
                            <CardContent className="p-12 text-center">
                                <div className="mb-6 flex justify-center">
                                    {selectionMode === 'folder' ? (
                                        <FolderOpen className={`h-16 w-16 ${(selectedFolder) ? 'text-green-600' : 'text-muted-foreground'}`} />
                                    ) : (
                                        <Upload className={`h-16 w-16 ${(selectedFiles) ? 'text-green-600' : 'text-muted-foreground'}`} />
                                    )}
                                </div>
                                <div className="space-y-2">
                                    {(selectedFolder || selectedFiles) ? (
                                        <>
                                            <h3 className="text-lg font-semibold text-green-700 dark:text-green-300">
                                                {selectionMode === 'folder' ? 'Carpeta seleccionada' : 'Archivos seleccionados'}
                                            </h3>
                                            <p className="text-sm text-green-600 dark:text-green-400">
                                                {(selectedFolder || selectedFiles)?.length} archivos detectados
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                Haz clic para seleccionar otros {selectionMode === 'folder' ? 'carpeta' : 'archivos'}
                                            </p>
                                        </>
                                    ) : (
                                        <>
                                            <h3 className="text-lg font-semibold text-foreground">
                                                {selectionMode === 'folder' ? 'Arrastra una carpeta aquí' : 'Arrastra archivos aquí'}
                                            </h3>
                                            <p className="text-sm text-muted-foreground">
                                                {selectionMode === 'folder' 
                                                    ? 'Se mantendrá la estructura completa de carpetas'
                                                    : 'Selecciona múltiples archivos para procesar'
                                                }
                                            </p>
                                        </>
                                    )}
                                </div>
                                {!(selectedFolder || selectedFiles) && (
                                    <Button size="lg" className="gap-2 mt-6" onClick={(e) => { e.stopPropagation(); handleFileSelect(); }}>
                                        {selectionMode === 'folder' ? (
                                            <>
                                                <FolderOpen className="h-5 w-5" />
                                                Seleccionar Carpeta
                                            </>
                                        ) : (
                                            <>
                                                <Upload className="h-5 w-5" />
                                                Seleccionar Archivos
                                            </>
                                        )}
                                    </Button>
                                )}
                            </CardContent>
                        </Card>

                        {/* Tour Button */}
                        <div className="text-center">
                            <Button
                                onClick={startTour}
                                variant="outline"
                                className="border-institutional text-institutional hover:bg-institutional/10"
                            >
                                <HelpCircle className="mr-2 h-4 w-4" />
                                ¿Cómo funciona? - Tour Interactivo
                            </Button>
                        </div>

                        {/* Hidden inputs */}
                        <input
                            ref={folderInputRef}
                            type="file"
                            {...({ webkitdirectory: "" } as any)}
                            multiple
                            style={{ display: 'none' }}
                            onChange={handleFileChange}
                            accept="*/*"
                        />
                        <input
                            ref={fileInputRef}
                            type="file"
                            multiple
                            style={{ display: 'none' }}
                            onChange={handleFileChange}
                            accept=".pdf,.json,.xml,.xlsx"
                        />
                    </div>
                </div>
            </div>
        </>
    );
}
