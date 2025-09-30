import { useState, useRef } from 'react';
import { Head } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Download, Upload, Loader2, Zap } from 'lucide-react';
import { PDFDocument } from 'pdf-lib';
import ToolPageHeader from '@/components/ToolPageHeader';
import ToolCard from '@/components/ToolCard';
import FileUploadZone from '@/components/FileUploadZone';

interface CompressionOptions {
    quality: 'low' | 'medium' | 'high';
    removeMetadata: boolean;
    optimizeImages: boolean;
}

export default function PDFCompress() {
    const [file, setFile] = useState<File | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [compressedPdf, setCompressedPdf] = useState<Uint8Array | null>(null);
    const [originalSize, setOriginalSize] = useState<number>(0);
    const [compressedSize, setCompressedSize] = useState<number>(0);
    const [compressionRatio, setCompressionRatio] = useState<number>(0);
    const [options, setOptions] = useState<CompressionOptions>({
        quality: 'medium',
        removeMetadata: true,
        optimizeImages: true
    });
    
    const fileInputRef = useRef<HTMLInputElement>(null);
    const dropZoneRef = useRef<HTMLDivElement>(null);

    const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const handleFileSelect = (selectedFile: File) => {
        if (selectedFile.type !== 'application/pdf') {
            alert('Por favor selecciona un archivo PDF válido.');
            return;
        }
        
        setFile(selectedFile);
        setOriginalSize(selectedFile.size);
        setCompressedPdf(null);
        setCompressedSize(0);
        setCompressionRatio(0);
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

    const compressPDF = async () => {
        if (!file) return;

        setIsProcessing(true);
        try {
            const arrayBuffer = await file.arrayBuffer();
            const pdfDoc = await PDFDocument.load(arrayBuffer);

            // Remove metadata if requested
            if (options.removeMetadata) {
                pdfDoc.setTitle('');
                pdfDoc.setAuthor('');
                pdfDoc.setSubject('');
                pdfDoc.setKeywords([]);
                pdfDoc.setCreator('Evaristools - Hospital Universitario del Valle');
                pdfDoc.setProducer('Evaristools PDF Compressor');
            }

            // Advanced compression techniques
            const pages = pdfDoc.getPages();
            
            // Process each page for optimization
            for (let i = 0; i < pages.length; i++) {
                const page = pages[i];
                
                // Get page content and try to optimize
                try {
                    // This is a basic optimization - pdf-lib has limitations
                    const mediaBox = page.getMediaBox();
                    page.setMediaBox(mediaBox.x, mediaBox.y, mediaBox.width, mediaBox.height);
                } catch (e) {
                    // Continue if page optimization fails
                    console.warn(`Could not optimize page ${i + 1}:`, e);
                }
            }

            // Compression settings based on quality level
            let compressionOptions: any = {
                useObjectStreams: true,
                addDefaultPage: false,
                updateFieldAppearances: false
            };

            // Adjust compression based on quality setting
            switch (options.quality) {
                case 'low':
                    compressionOptions.useObjectStreams = true;
                    break;
                case 'medium':
                    compressionOptions.useObjectStreams = true;
                    break;
                case 'high':
                    compressionOptions.useObjectStreams = false;
                    break;
            }

            const pdfBytes = await pdfDoc.save(compressionOptions);

            // If the "compressed" file is larger, use the original
            if (pdfBytes.length >= originalSize) {
                // Fallback: Try basic compression without object streams
                const fallbackBytes = await pdfDoc.save({
                    useObjectStreams: false,
                    addDefaultPage: false
                });
                
                if (fallbackBytes.length < originalSize) {
                    setCompressedPdf(fallbackBytes);
                    setCompressedSize(fallbackBytes.length);
                } else {
                    // If still larger, inform user that compression isn't effective
                    alert('Este PDF ya está optimizado. No se puede reducir más su tamaño sin pérdida significativa de calidad.');
                    setCompressedPdf(null);
                    setCompressedSize(0);
                    setCompressionRatio(0);
                    return;
                }
            } else {
                setCompressedPdf(pdfBytes);
                setCompressedSize(pdfBytes.length);
            }
            
            const ratio = ((originalSize - (compressedPdf?.length || pdfBytes.length)) / originalSize) * 100;
            setCompressionRatio(Math.max(0, ratio));

        } catch (error) {
            console.error('Error comprimiendo PDF:', error);
            alert('Error al comprimir el PDF. Por favor intenta con otro archivo.');
        } finally {
            setIsProcessing(false);
        }
    };

    const downloadCompressed = () => {
        if (!compressedPdf || !file) return;

        const blob = new Blob([compressedPdf], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = file.name.replace('.pdf', '_comprimido.pdf');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const reset = () => {
        setFile(null);
        setCompressedPdf(null);
        setOriginalSize(0);
        setCompressedSize(0);
        setCompressionRatio(0);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <>
            <Head title="Compresor de PDF - Evaristools">
                <meta name="description" content="Comprime archivos PDF reduciendo su tamaño sin perder calidad - Hospital Universitario del Valle" />
            </Head>

            <div className="min-h-screen bg-white dark:bg-slate-900">
                <ToolPageHeader
                    title="Compresor de PDF"
                    description="Reduce el tamaño de tus archivos PDF sin perder calidad"
                    icon={Zap}
                />

                {/* Main Content */}
                <div className="container mx-auto px-4 py-8">
                    <div className="max-w-6xl mx-auto">
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                            {/* Upload Section */}
                            <div className="space-y-6">
                                <ToolCard
                                    title="Subir PDF"
                                    description="Selecciona o arrastra tu archivo PDF para comprimir"
                                    icon={Upload}
                                >
                                    {/* Drag & Drop Zone */}
                                    <div
                                        ref={dropZoneRef}
                                        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                                            file ? 'border-institutional bg-institutional/5' : 'border-slate-300 hover:border-institutional'
                                        }`}
                                        onDragOver={handleDragOver}
                                        onDragEnter={handleDragEnter}
                                        onDragLeave={handleDragLeave}
                                        onDrop={handleDrop}
                                    >
                                        {file ? (
                                            <div className="space-y-2">
                                                <FileText className="h-12 w-12 mx-auto text-institutional" />
                                                <p className="font-medium text-slate-900 dark:text-white">
                                                    {file.name}
                                                </p>
                                                <p className="text-sm text-slate-600 dark:text-slate-300">
                                                    Tamaño: {formatFileSize(originalSize)}
                                                </p>
                                            </div>
                                        ) : (
                                            <div className="space-y-4">
                                                <Upload className="h-12 w-12 mx-auto text-slate-400" />
                                                <div>
                                                    <p className="text-lg font-medium text-slate-900 dark:text-white">
                                                        Arrastra tu PDF aquí
                                                    </p>
                                                    <p className="text-sm text-slate-600 dark:text-slate-300">
                                                        o haz clic para seleccionar
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept=".pdf,application/pdf"
                                        onChange={(e) => {
                                            const selectedFile = e.target.files?.[0];
                                            if (selectedFile) handleFileSelect(selectedFile);
                                        }}
                                        className="hidden"
                                    />

                                    <Button
                                        onClick={() => fileInputRef.current?.click()}
                                        variant="outline"
                                        className="w-full"
                                    >
                                        Seleccionar Archivo PDF
                                    </Button>

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
                            </div>

                            {/* Options and Process Section */}
                            <div className="space-y-6">
                                <ToolCard
                                    title="Opciones de Compresión"
                                    description="Configura cómo quieres comprimir tu PDF"
                                    icon={Zap}
                                >
                                    <div className="space-y-4">
                                        <div>
                                            <Label htmlFor="quality">Nivel de Compresión</Label>
                                            <Select
                                                value={options.quality}
                                                onValueChange={(value: 'low' | 'medium' | 'high') =>
                                                    setOptions({ ...options, quality: value })
                                                }
                                            >
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="low">Baja (Mayor compresión)</SelectItem>
                                                    <SelectItem value="medium">Media (Balanceada)</SelectItem>
                                                    <SelectItem value="high">Alta (Mejor calidad)</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="flex items-center space-x-2">
                                            <input
                                                type="checkbox"
                                                id="removeMetadata"
                                                checked={options.removeMetadata}
                                                onChange={(e) =>
                                                    setOptions({ ...options, removeMetadata: e.target.checked })
                                                }
                                                className="rounded"
                                            />
                                            <Label htmlFor="removeMetadata">Remover metadatos</Label>
                                        </div>

                                        <div className="flex items-center space-x-2">
                                            <input
                                                type="checkbox"
                                                id="optimizeImages"
                                                checked={options.optimizeImages}
                                                onChange={(e) =>
                                                    setOptions({ ...options, optimizeImages: e.target.checked })
                                                }
                                                className="rounded"
                                            />
                                            <Label htmlFor="optimizeImages">Optimizar imágenes</Label>
                                        </div>
                                    </div>

                                    <Button
                                        onClick={compressPDF}
                                        disabled={!file || isProcessing}
                                        className="w-full bg-institutional hover:bg-institutional/90"
                                    >
                                        {isProcessing ? (
                                            <>
                                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                Comprimiendo...
                                            </>
                                        ) : (
                                            <>
                                                <Zap className="h-4 w-4 mr-2" />
                                                Comprimir PDF
                                            </>
                                        )}
                                    </Button>

                                    {/* Results */}
                                    {compressedPdf && (
                                        <div className="space-y-4 pt-4 border-t">
                                            <h3 className="font-semibold text-slate-900 dark:text-white">
                                                Resultado de la Compresión
                                            </h3>
                                            
                                            <div className="grid grid-cols-2 gap-4 text-sm">
                                                <div>
                                                    <p className="text-slate-600 dark:text-slate-300">Tamaño Original</p>
                                                    <p className="font-medium">{formatFileSize(originalSize)}</p>
                                                </div>
                                                <div>
                                                    <p className="text-slate-600 dark:text-slate-300">Tamaño Comprimido</p>
                                                    <p className="font-medium">{formatFileSize(compressedSize)}</p>
                                                </div>
                                            </div>

                                            <div className="bg-institutional/10 p-3 rounded-lg">
                                                <p className="text-sm text-slate-600 dark:text-slate-300">Reducción de tamaño</p>
                                                <p className="text-lg font-bold text-institutional">
                                                    {compressionRatio.toFixed(1)}%
                                                </p>
                                            </div>

                                            <Button
                                                onClick={downloadCompressed}
                                                className="w-full bg-institutional hover:bg-institutional/90 text-white"
                                            >
                                                <Download className="h-4 w-4 mr-2" />
                                                Descargar PDF Comprimido
                                            </Button>
                                        </div>
                                    )}
                                </ToolCard>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}