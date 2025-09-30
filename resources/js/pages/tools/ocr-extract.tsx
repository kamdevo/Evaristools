import { useState, useRef } from 'react';
import { Head } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Download, Upload, Loader2, Eye, Copy, ScanText } from 'lucide-react';
import { createWorker } from 'tesseract.js';
import ToolPageHeader from '@/components/ToolPageHeader';
import ToolCard from '@/components/ToolCard';
import FileUploadZone from '@/components/FileUploadZone';
import ProgressBar from '@/components/ProgressBar';

interface OCROptions {
    language: 'spa' | 'eng' | 'spa+eng';
    outputFormat: 'text' | 'json';
}

export default function OCRExtract() {
    const [file, setFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string>('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState<number>(0);
    const [extractedText, setExtractedText] = useState<string>('');
    const [confidence, setConfidence] = useState<number>(0);
    const [processingStep, setProcessingStep] = useState<string>('');
    const [options, setOptions] = useState<OCROptions>({
        language: 'spa+eng',
        outputFormat: 'text'
    });
    
    const fileInputRef = useRef<HTMLInputElement>(null);
    const dropZoneRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const supportedFormats = ['image/jpeg', 'image/jpg', 'image/png', 'image/bmp', 'image/tiff'];
    const imageFormats = ['image/jpeg', 'image/jpg', 'image/png', 'image/bmp', 'image/tiff'];

    const handleFileSelect = (selectedFile: File) => {
        // Check if it's a PDF
        if (selectedFile.type === 'application/pdf') {
            alert('⚠️ Los archivos PDF no son soportados directamente por el OCR.\n\n💡 Sugerencias:\n• Convierte las páginas del PDF a imágenes (JPG/PNG)\n• Usa herramientas como "PDF a Imágenes"\n• Toma capturas de pantalla de las páginas\n\nFormatos soportados: JPG, PNG, BMP, TIFF');
            return;
        }
        
        if (!imageFormats.includes(selectedFile.type)) {
            alert('Por favor selecciona un archivo de imagen válido.\n\nFormatos soportados: JPG, PNG, BMP, TIFF');
            return;
        }
        
        setFile(selectedFile);
        setExtractedText('');
        setConfidence(0);
        setProgress(0);
        
        // Create preview URL
        const url = URL.createObjectURL(selectedFile);
        setPreviewUrl(url);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDragEnter = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        
        const files = Array.from(e.dataTransfer.files);
        if (files.length > 0) {
            handleFileSelect(files[0]);
        }
    };

    const extractText = async () => {
        if (!file) return;

        setIsProcessing(true);
        setProgress(0);
        setExtractedText('');
        setConfidence(0);

        try {
            setProcessingStep('Inicializando OCR...');
            
            // Create Tesseract worker
            const worker = await createWorker(options.language, 1, {
                logger: (m) => {
                    console.log(m);
                    if (m.status === 'recognizing text') {
                        const progressPercent = Math.round(m.progress * 100);
                        setProgress(progressPercent);
                        setProcessingStep(`Reconociendo texto... ${progressPercent}%`);
                    }
                }
            });

            setProcessingStep('Procesando imagen...');

            // Recognize text
            const { data: { text, confidence } } = await worker.recognize(file);
            
            setExtractedText(text);
            setConfidence(Math.round(confidence));
            setProcessingStep('¡Texto extraído exitosamente!');

            // Terminate worker
            await worker.terminate();

        } catch (error) {
            console.error('Error extrayendo texto:', error);
            alert('Error al extraer texto de la imagen. Por favor intenta con otra imagen.');
            setProcessingStep('Error en el procesamiento');
        } finally {
            setIsProcessing(false);
            setProgress(100);
        }
    };

    const downloadText = () => {
        if (!extractedText || !file) return;

        const blob = new Blob([extractedText], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        const fileName = file.name.replace(/\.[^/.]+$/, '') + '_texto_extraido.txt';
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const copyToClipboard = async () => {
        if (!extractedText) return;

        try {
            await navigator.clipboard.writeText(extractedText);
            alert('Texto copiado al portapapeles');
        } catch (error) {
            console.error('Error copiando al portapapeles:', error);
            // Fallback for older browsers
            if (textareaRef.current) {
                textareaRef.current.select();
                document.execCommand('copy');
                alert('Texto copiado al portapapeles');
            }
        }
    };

    const reset = () => {
        setFile(null);
        setPreviewUrl('');
        setExtractedText('');
        setConfidence(0);
        setProgress(0);
        setProcessingStep('');
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
        if (previewUrl) {
            URL.revokeObjectURL(previewUrl);
        }
    };

    const getLanguageLabel = (lang: string) => {
        switch (lang) {
            case 'spa': return 'Español';
            case 'eng': return 'Inglés';
            case 'spa+eng': return 'Español + Inglés';
            default: return lang;
        }
    };

    return (
        <>
            <Head title="OCR y Extracción de Texto - Evaristools">
                <meta name="description" content="Extrae texto de imágenes y documentos PDF escaneados - Hospital Universitario del Valle" />
            </Head>

            <div className="min-h-screen bg-white dark:bg-slate-900">
                <ToolPageHeader
                    title="OCR y Extracción de Texto"
                    description="Convierte imágenes en texto editable mediante OCR"
                    icon={ScanText}
                    showPopularBadge={true}
                />

                {/* Main Content */}
                <div className="container mx-auto px-4 py-8">
                    <div className="max-w-6xl mx-auto">
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                            {/* Upload and Preview Section */}
                            <div className="space-y-6">
                                <ToolCard
                                    title="Subir Imagen"
                                    description="Selecciona una imagen para extraer el texto mediante OCR"
                                    icon={Upload}
                                >
                                    <FileUploadZone
                                        onFileSelect={(files) => handleFileSelect(files[0])}
                                        acceptedTypes=".jpg,.jpeg,.png,.bmp,.tiff"
                                        multiple={false}
                                        hasFiles={!!file}
                                        title="Arrastra tu archivo aquí"
                                        subtitle="Soporta JPG, PNG, BMP, TIFF"
                                        buttonText="Seleccionar Archivo"
                                        fileInfo={file ? (
                                            <div className="space-y-2">
                                                <ScanText className="h-12 w-12 mx-auto text-institutional" />
                                                <p className="font-medium text-slate-900 dark:text-white">
                                                    {file.name}
                                                </p>
                                                <p className="text-sm text-slate-600 dark:text-slate-300">
                                                    Listo para procesar
                                                </p>
                                            </div>
                                        ) : undefined}
                                    />
                                    
                                    {file && (
                                        <Button
                                            onClick={reset}
                                            variant="outline"
                                            className="w-full"
                                        >
                                            Cambiar Archivo
                                        </Button>
                                    )}
                                </ToolCard>

                                {/* Preview Section */}
                                {previewUrl && (
                                    <ToolCard
                                        title="Vista Previa"
                                        icon={Eye}
                                    >
                                            <div className="border rounded-lg overflow-hidden">
                                                {file?.type === 'application/pdf' ? (
                                                    <div className="p-8 text-center bg-slate-50 dark:bg-slate-800">
                                                        <StickyNote className="h-16 w-16 mx-auto text-slate-400 mb-4" />
                                                        <p className="text-slate-600 dark:text-slate-300">
                                                            Archivo PDF listo para procesar
                                                        </p>
                                                    </div>
                                                ) : (
                                                    <img
                                                        src={previewUrl}
                                                        alt="Vista previa"
                                                        className="w-full h-auto max-h-96 object-contain"
                                                    />
                                                )}
                                            </div>
                                    </ToolCard>
                                )}
                            </div>

                            {/* Options and Results Section */}
                            <div className="space-y-6">
                                <ToolCard
                                    title="Opciones de OCR"
                                    description="Configura el reconocimiento óptico de caracteres"
                                    icon={ScanText}
                                >
                                        <div>
                                            <Label htmlFor="language">Idioma de Reconocimiento</Label>
                                            <Select
                                                value={options.language}
                                                onValueChange={(value: 'spa' | 'eng' | 'spa+eng') =>
                                                    setOptions({ ...options, language: value })
                                                }
                                            >
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="spa+eng">Español + Inglés</SelectItem>
                                                    <SelectItem value="spa">Solo Español</SelectItem>
                                                    <SelectItem value="eng">Solo Inglés</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                    <Button
                                        onClick={extractText}
                                        disabled={!file || isProcessing}
                                        className="w-full bg-institutional hover:bg-institutional/90"
                                    >
                                        {isProcessing ? (
                                            <>
                                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                {processingStep}
                                            </>
                                        ) : (
                                            <>
                                                <ScanText className="h-4 w-4 mr-2" />
                                                Extraer Texto
                                            </>
                                        )}
                                    </Button>

                                    {/* Progress Bar */}
                                    {isProcessing && (
                                        <ProgressBar
                                            progress={progress}
                                            message="Progreso"
                                            showPercentage={true}
                                        />
                                    )}
                                </ToolCard>

                                {/* Results Section */}
                                {extractedText && (
                                    <ToolCard
                                        title={
                                            <div className="flex items-center justify-between w-full">
                                                <span>Texto Extraído</span>
                                                <Badge variant="outline" className="text-xs">
                                                    Confianza: {confidence}%
                                                </Badge>
                                            </div>
                                        }
                                        description={`Idioma: ${getLanguageLabel(options.language)}`}
                                        icon={ScanText}
                                    >
                                            <textarea
                                                ref={textareaRef}
                                                value={extractedText}
                                                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setExtractedText(e.target.value)}
                                                placeholder="El texto extraído aparecerá aquí..."
                                                className="min-h-48 resize-vertical w-full p-3 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-institutional focus:border-transparent"
                                                rows={12}
                                            />

                                            <div className="flex gap-2">
                                                <Button
                                                    onClick={copyToClipboard}
                                                    variant="outline"
                                                    className="flex-1"
                                                >
                                                    <Copy className="h-4 w-4 mr-2" />
                                                    Copiar
                                                </Button>
                                                <Button
                                                    onClick={downloadText}
                                                    className="flex-1 bg-institutional hover:bg-institutional/90 text-white"
                                                >
                                                    <Download className="h-4 w-4 mr-2" />
                                                    Descargar
                                                </Button>
                                            </div>
                                    </ToolCard>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}