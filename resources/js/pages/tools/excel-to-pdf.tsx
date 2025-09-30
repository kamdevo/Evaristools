import { useState, useRef } from 'react';
import { Head } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Upload, FileText, Loader2, Download, FileDown, CheckCircle, AlertCircle, HelpCircle } from 'lucide-react';
import ToolPageHeader from '@/components/ToolPageHeader';
import ToolCard from '@/components/ToolCard';
import FileUploadZone from '@/components/FileUploadZone';
import axios from 'axios';
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';

export default function ExcelToPDF() {
    const [excelFile, setExcelFile] = useState<File | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isConverted, setIsConverted] = useState(false);
    const [error, setError] = useState<string>('');
    const [dragOver, setDragOver] = useState(false);
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
                    element: '[data-tour="left-column"]',
                    popover: {
                        title: 'Paso 1: Seleccionar Excel',
                        description: 'Arrastra tu archivo Excel (.xls o .xlsx) aquí o haz clic para seleccionarlo. Tamaño máximo: 25MB.',
                        side: 'right',
                        align: 'start'
                    }
                },
                {
                    element: '[data-tour="actions"]',
                    popover: {
                        title: 'Paso 2: Convertir a PDF',
                        description: 'Una vez cargado tu archivo Excel, haz clic en "Convertir a PDF" para iniciar la conversión. El archivo se descargará automáticamente.',
                        side: 'left',
                        align: 'start'
                    }
                }
            ]
        });
        driverObj.drive();
    };

    const handleFileSelect = (files: FileList) => {
        const file = files[0];
        if (!file) return;

        // Validate file type
        const validTypes = [
            'application/vnd.ms-excel', // .xls
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' // .xlsx
        ];
        
        if (!validTypes.includes(file.type)) {
            setError('Por favor selecciona un archivo Excel válido (.xls o .xlsx).');
            return;
        }

        // Validate file size (max 25MB)
        if (file.size > 25 * 1024 * 1024) {
            setError('El archivo es demasiado grande. Máximo 25MB permitido.');
            return;
        }

        setExcelFile(file);
        setError('');
        setIsConverted(false);
    };

    const convertToPDF = async () => {
        if (!excelFile) return;

        setIsProcessing(true);
        setError('');

        try {
            const formData = new FormData();
            formData.append('file', excelFile);

            const response = await axios.post('/tools/excel-to-pdf/convert', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
                },
                responseType: 'blob',
                timeout: 120000 // 2 minutes timeout
            });

            // Create blob URL and trigger download
            const blob = new Blob([response.data], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${excelFile.name.replace(/\.(xlsx?|xls)$/i, '')}_converted.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);

            setIsConverted(true);

        } catch (err: any) {
            console.error('Error converting to PDF:', err);
            
            let errorMessage = 'Error al convertir el documento.';
            
            if (err.response?.status === 404) {
                errorMessage = 'La conversión de Excel a PDF requiere configuración adicional en el servidor. Contacta al administrador del sistema.';
            } else if (err.response?.status === 500) {
                errorMessage = 'Error en el servidor al procesar el archivo. Verifica que el archivo no esté corrupto.';
            } else if (err.code === 'ECONNABORTED') {
                errorMessage = 'La conversión está tardando demasiado. Intenta con un archivo más pequeño.';
            }
            
            setError(errorMessage);
        } finally {
            setIsProcessing(false);
        }
    };

    const resetTool = () => {
        setExcelFile(null);
        setIsConverted(false);
        setError('');
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFileSelect(files);
        }
    };

    return (
        <>
            <Head title="Excel a PDF - Evaristools" />
            
            <div className="min-h-screen bg-white dark:bg-slate-900">
                <ToolPageHeader
                    title="Excel a PDF"
                    description="Convierte hojas de cálculo Excel a formato PDF"
                    icon={FileDown}
                />

                <div className="container mx-auto px-4 py-8">
                    <div className="max-w-6xl mx-auto">
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">

                            {/* Left Column: File Upload & Messages */}
                            <div className="space-y-6" data-tour="left-column">
                                {!excelFile && (
                                <ToolCard title="Seleccionar Excel">
                                    <FileUploadZone
                                        onFileSelect={handleFileSelect}
                                        acceptedTypes=".xls,.xlsx"
                                        title="Arrastra tu hoja de cálculo aquí"
                                        subtitle="o haz clic para seleccionar (máximo 25MB)"
                                    />
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept=".xls,.xlsx"
                                        onChange={(e) => e.target.files && handleFileSelect(e.target.files)}
                                        className="hidden"
                                    />
                                </ToolCard>
                            )}

                            {/* Error Message */}
                            {error && (
                                <ToolCard title="Error">
                                    <div className="flex items-start space-x-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                                        <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                                        <p className="text-red-800 dark:text-red-200">{error}</p>
                                    </div>
                                </ToolCard>
                            )}

                                {excelFile && (
                                    <ToolCard title="Archivo Seleccionado">
                                        <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                                            <div className="flex items-center space-x-3">
                                                <FileText className="h-8 w-8 text-institutional" />
                                                <div>
                                                    <p className="font-medium text-slate-900 dark:text-white">
                                                        {excelFile.name}
                                                    </p>
                                                    <p className="text-sm text-slate-600 dark:text-slate-300">
                                                        {(excelFile.size / 1024 / 1024).toFixed(2)} MB
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </ToolCard>
                                )}

                                {isConverted && (
                                    <ToolCard title="¡Conversión Exitosa!">
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-center space-x-3 p-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                                                <CheckCircle className="h-8 w-8 text-green-600" />
                                                <div>
                                                    <p className="font-medium text-green-800 dark:text-green-200">
                                                        ¡PDF generado y descargado exitosamente!
                                                    </p>
                                                    <p className="text-sm text-green-600 dark:text-green-300">
                                                        El archivo se ha guardado en tu carpeta de descargas.
                                                    </p>
                                                </div>
                                            </div>

                                            <Button
                                                onClick={resetTool}
                                                variant="outline"
                                                className="w-full"
                                            >
                                                <Upload className="mr-2 h-4 w-4" />
                                                Convertir Otro Archivo
                                            </Button>
                                        </div>
                                    </ToolCard>
                                )}
                            </div>

                            {/* Right Column: Actions */}
                            <div className="space-y-6">
                                <ToolCard title="Acciones" data-tour="actions">
                                    <div className="space-y-3">
                                        <div className="flex flex-col sm:flex-row gap-3">
                                            <Button
                                                onClick={convertToPDF}
                                                disabled={isProcessing || !excelFile}
                                                className="flex-1 bg-institutional hover:bg-institutional/90"
                                            >
                                                {isProcessing ? (
                                                    <>
                                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                        Convirtiendo...
                                                    </>
                                                ) : (
                                                    <>
                                                        <FileDown className="mr-2 h-4 w-4" />
                                                        Convertir a PDF
                                                    </>
                                                )}
                                            </Button>
                                            <Button
                                                onClick={resetTool}
                                                variant="outline"
                                                className="flex-1"
                                                disabled={isProcessing}
                                            >
                                                <Upload className="mr-2 h-4 w-4" />
                                                Seleccionar Otro
                                            </Button>
                                        </div>
                                        <Button
                                            onClick={startTour}
                                            variant="outline"
                                            className="w-full border-institutional text-institutional hover:bg-institutional/10"
                                        >
                                            <HelpCircle className="mr-2 h-4 w-4" />
                                            ¿Cómo funciona? - Tour Interactivo
                                        </Button>
                                    </div>
                                </ToolCard>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}