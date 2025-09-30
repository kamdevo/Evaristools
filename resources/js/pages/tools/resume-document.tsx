import { useState, useRef } from 'react';
import { Head } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, FileText, Loader2, Sparkles, CheckCircle, AlertCircle, Copy } from 'lucide-react';
import ToolPageHeader from '@/components/ToolPageHeader';
import ToolCard from '@/components/ToolCard';
import FileUploadZone from '@/components/FileUploadZone';
import axios from 'axios';

type SummaryLength = 'short' | 'medium' | 'long';

interface SummaryOptions {
    length: SummaryLength;
    language: string;
}

export default function ResumeDocument() {
    const [file, setFile] = useState<File | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [summary, setSummary] = useState<string>('');
    const [error, setError] = useState<string>('');
    const [copied, setCopied] = useState(false);
    const [options, setOptions] = useState<SummaryOptions>({
        length: 'medium',
        language: 'es'
    });
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = (files: FileList) => {
        const selectedFile = files[0];
        if (!selectedFile) return;

        // Validate file type
        const validTypes = [
            'application/pdf',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
            'application/msword', // .doc
            'text/plain'
        ];
        
        if (!validTypes.includes(selectedFile.type)) {
            setError('Por favor selecciona un archivo válido (.pdf, .docx, .doc o .txt).');
            return;
        }

        // Validate file size (max 10MB)
        if (selectedFile.size > 10 * 1024 * 1024) {
            setError('El archivo es demasiado grande. Máximo 10MB permitido.');
            return;
        }

        setFile(selectedFile);
        setError('');
        setSummary('');
    };

    const generateSummary = async () => {
        if (!file) return;

        setIsProcessing(true);
        setError('');
        setSummary('');

        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('length', options.length);
            formData.append('language', options.language);

            const response = await axios.post('/tools/resume-document/generate', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
                },
                timeout: 120000 // 2 minutes timeout
            });

            setSummary(response.data.summary);

        } catch (err: any) {
            console.error('Error generating summary:', err);
            
            let errorMessage = 'Error al generar el resumen.';
            
            if (err.response?.status === 404) {
                errorMessage = 'El endpoint de resumen no está configurado. Contacta al administrador del sistema.';
            } else if (err.response?.status === 500) {
                errorMessage = err.response?.data?.message || 'Error en el servidor al procesar el archivo.';
            } else if (err.code === 'ECONNABORTED') {
                errorMessage = 'La generación del resumen está tardando demasiado. Intenta con un documento más corto.';
            } else if (err.response?.data?.error) {
                errorMessage = err.response.data.error;
            }
            
            setError(errorMessage);
        } finally {
            setIsProcessing(false);
        }
    };

    const copyToClipboard = async () => {
        if (!summary) return;
        
        try {
            await navigator.clipboard.writeText(summary);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Error copying to clipboard:', err);
        }
    };

    const resetTool = () => {
        setFile(null);
        setSummary('');
        setError('');
    };

    const getLengthDescription = (length: SummaryLength): string => {
        switch (length) {
            case 'short':
                return 'Breve (2-3 párrafos)';
            case 'medium':
                return 'Medio (4-6 párrafos)';
            case 'long':
                return 'Detallado (7-10 párrafos)';
            default:
                return '';
        }
    };

    return (
        <>
            <Head title="Resumir Documento - Evaristools" />
            
            <div className="min-h-screen bg-white dark:bg-slate-900">
                <ToolPageHeader
                    title="Resumir Documento"
                    description="Genera resúmenes automáticos de documentos usando IA"
                    icon={Sparkles}
                />

                <div className="container mx-auto px-4 py-8">
                    <div className="max-w-4xl mx-auto">
                        <div className="space-y-6">

                            {/* Upload Section */}
                            {!file && (
                                <ToolCard title="Seleccionar Documento">
                                    <FileUploadZone
                                        onFileSelect={handleFileSelect}
                                        acceptedTypes=".pdf,.docx,.doc,.txt"
                                        title="Arrastra tu documento aquí"
                                        subtitle="o haz clic para seleccionar (máximo 10MB)"
                                    />
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept=".pdf,.docx,.doc,.txt"
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

                            {/* File Info and Options */}
                            {file && !summary && (
                                <>
                                    <ToolCard title="Archivo Seleccionado">
                                        <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                                            <div className="flex items-center space-x-3">
                                                <FileText className="h-8 w-8 text-institutional" />
                                                <div>
                                                    <p className="font-medium text-slate-900 dark:text-white">
                                                        {file.name}
                                                    </p>
                                                    <p className="text-sm text-slate-600 dark:text-slate-300">
                                                        {(file.size / 1024 / 1024).toFixed(2)} MB
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </ToolCard>

                                    {/* Summary Options */}
                                    <ToolCard title="Opciones de Resumen">
                                        <div className="space-y-4">
                                            {/* Length */}
                                            <div className="space-y-2">
                                                <Label>Longitud del Resumen</Label>
                                                <Select
                                                    value={options.length}
                                                    onValueChange={(value) => setOptions({ ...options, length: value as SummaryLength })}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="short">{getLengthDescription('short')}</SelectItem>
                                                        <SelectItem value="medium">{getLengthDescription('medium')}</SelectItem>
                                                        <SelectItem value="long">{getLengthDescription('long')}</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            {/* Language */}
                                            <div className="space-y-2">
                                                <Label>Idioma del Resumen</Label>
                                                <Select
                                                    value={options.language}
                                                    onValueChange={(value) => setOptions({ ...options, language: value })}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="es">Español</SelectItem>
                                                        <SelectItem value="en">Inglés</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                    </ToolCard>

                                    {/* Action Buttons */}
                                    <ToolCard title="Acciones">
                                        <div className="flex flex-col sm:flex-row gap-4">
                                            <Button
                                                onClick={generateSummary}
                                                disabled={isProcessing}
                                                className="flex-1 bg-institutional hover:bg-institutional/90"
                                            >
                                                {isProcessing ? (
                                                    <>
                                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                        Generando Resumen...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Sparkles className="mr-2 h-4 w-4" />
                                                        Generar Resumen
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
                                    </ToolCard>
                                </>
                            )}

                            {/* Summary Result */}
                            {summary && (
                                <ToolCard title="Resumen Generado">
                                    <div className="space-y-4">
                                        <div className="p-6 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                                            <div className="prose prose-slate dark:prose-invert max-w-none">
                                                {summary.split('\n').map((paragraph, index) => (
                                                    paragraph.trim() && (
                                                        <p key={index} className="text-slate-900 dark:text-white mb-3 last:mb-0">
                                                            {paragraph}
                                                        </p>
                                                    )
                                                ))}
                                            </div>
                                        </div>

                                        <div className="flex flex-col sm:flex-row gap-4">
                                            <Button
                                                onClick={copyToClipboard}
                                                variant="outline"
                                                className="flex-1"
                                            >
                                                <Copy className="mr-2 h-4 w-4" />
                                                {copied ? '¡Copiado!' : 'Copiar Resumen'}
                                            </Button>
                                            <Button
                                                onClick={resetTool}
                                                variant="outline"
                                                className="flex-1"
                                            >
                                                <Upload className="mr-2 h-4 w-4" />
                                                Resumir Otro Documento
                                            </Button>
                                        </div>
                                    </div>
                                </ToolCard>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}