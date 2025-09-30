import { useState, useRef } from 'react';
import { Head } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Upload, FileText, Loader2, Download, Unlock, CheckCircle, AlertCircle } from 'lucide-react';
import ToolPageHeader from '@/components/ToolPageHeader';
import ToolCard from '@/components/ToolCard';
import FileUploadZone from '@/components/FileUploadZone';
import { PDFDocument } from 'pdf-lib';

export default function UnlockPDF() {
    const [pdfFile, setPdfFile] = useState<File | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isUnlocked, setIsUnlocked] = useState(false);
    const [unlockedPdfUrl, setUnlockedPdfUrl] = useState<string>('');
    const [error, setError] = useState<string>('');
    const [warning, setWarning] = useState<string>('');
    const [dragOver, setDragOver] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = (files: FileList) => {
        const file = files[0];
        if (!file) return;

        if (file.type !== 'application/pdf') {
            setError('Por favor selecciona un archivo PDF válido.');
            return;
        }

        if (file.size > 50 * 1024 * 1024) {
            setError('El archivo es demasiado grande. Máximo 50MB permitido.');
            return;
        }

        setPdfFile(file);
        setError('');
        setWarning('');
        setIsUnlocked(false);
        setUnlockedPdfUrl('');
    };

    const unlockPDF = async () => {
        if (!pdfFile) return;

        setIsProcessing(true);
        setError('');
        setWarning('');

        try {
            const arrayBuffer = await pdfFile.arrayBuffer();
            
            // Try to load the PDF
            let pdfDoc: PDFDocument;
            try {
                pdfDoc = await PDFDocument.load(arrayBuffer, { 
                    ignoreEncryption: true,
                    updateMetadata: false 
                });
            } catch (loadError: any) {
                if (loadError.message?.includes('password') || loadError.message?.includes('encrypted')) {
                    setError('Este PDF está protegido con contraseña de usuario. No se puede desbloquear sin la contraseña correcta.');
                    setIsProcessing(false);
                    return;
                }
                throw loadError;
            }

            // Create a new PDF and copy all pages
            const newPdfDoc = await PDFDocument.create();
            
            // Copy pages
            const pageCount = pdfDoc.getPageCount();
            const pages = await newPdfDoc.copyPages(pdfDoc, Array.from({ length: pageCount }, (_, i) => i));
            
            pages.forEach(page => {
                newPdfDoc.addPage(page);
            });

            // Set metadata without restrictions
            newPdfDoc.setTitle(pdfDoc.getTitle() || '');
            newPdfDoc.setAuthor(pdfDoc.getAuthor() || '');
            newPdfDoc.setSubject(pdfDoc.getSubject() || '');
            newPdfDoc.setCreator('Evaristools - Hospital Universitario del Valle');
            newPdfDoc.setProducer('Evaristools PDF Unlocker');
            newPdfDoc.setCreationDate(new Date());
            newPdfDoc.setModificationDate(new Date());

            // Save the unlocked PDF
            const pdfBytes = await newPdfDoc.save();
            const blob = new Blob([pdfBytes], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);

            setUnlockedPdfUrl(url);
            setIsUnlocked(true);
            setWarning('Se eliminaron las restricciones de impresión, copia y edición. El PDF ahora está completamente desbloqueado.');

        } catch (err: any) {
            console.error('Error unlocking PDF:', err);
            
            if (err.message?.includes('password') || err.message?.includes('encrypted')) {
                setError('Este PDF requiere una contraseña para abrirse. Esta herramienta solo puede desbloquear PDFs con restricciones de impresión/copia pero sin contraseña de usuario.');
            } else {
                setError('Error al desbloquear el PDF. El archivo puede estar corrupto o tener una protección no soportada.');
            }
        } finally {
            setIsProcessing(false);
        }
    };

    const downloadUnlockedPDF = () => {
        if (!unlockedPdfUrl || !pdfFile) return;

        const link = document.createElement('a');
        link.href = unlockedPdfUrl;
        link.download = `${pdfFile.name.replace('.pdf', '')}_desbloqueado.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const resetTool = () => {
        setPdfFile(null);
        setIsUnlocked(false);
        setUnlockedPdfUrl('');
        setError('');
        setWarning('');
        if (unlockedPdfUrl) {
            URL.revokeObjectURL(unlockedPdfUrl);
        }
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
            <Head title="Desbloquear PDF - Evaristools" />
            
            <div className="min-h-screen bg-white dark:bg-slate-900">
                <ToolPageHeader
                    title="Desbloquear PDF"
                    description="Elimina restricciones de impresión, copia y edición de documentos PDF"
                    icon={Unlock}
                />

                <div className="container mx-auto px-4 py-8">
                    <div className="max-w-6xl mx-auto">
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">

                            {/* Left Column: File Upload and Info */}
                            <div className="space-y-6">
                                {!pdfFile && (
                                <ToolCard title="Seleccionar PDF">
                                    <FileUploadZone
                                        onFileSelect={handleFileSelect}
                                        acceptedTypes=".pdf"
                                        title="Arrastra tu PDF aquí"
                                        subtitle="o haz clic para seleccionar (máximo 50MB)"
                                    />
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept=".pdf"
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

                                {pdfFile && (
                                    <ToolCard title="Archivo Seleccionado">
                                        <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                                            <div className="flex items-center space-x-3">
                                                <FileText className="h-8 w-8 text-institutional" />
                                                <div>
                                                    <p className="font-medium text-slate-900 dark:text-white">
                                                        {pdfFile.name}
                                                    </p>
                                                    <p className="text-sm text-slate-600 dark:text-slate-300">
                                                        {(pdfFile.size / 1024 / 1024).toFixed(2)} MB
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </ToolCard>
                                )}

                                {error && (
                                    <ToolCard title="Error">
                                        <div className="flex items-start space-x-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                                            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                                            <p className="text-red-800 dark:text-red-200">{error}</p>
                                        </div>
                                    </ToolCard>
                                )}

                                {isUnlocked && unlockedPdfUrl && (
                                    <ToolCard title="¡PDF Desbloqueado Exitosamente!">
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-center space-x-3 p-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                                                <CheckCircle className="h-8 w-8 text-green-600" />
                                                <div>
                                                    <p className="font-medium text-green-800 dark:text-green-200">
                                                        ¡El PDF se desbloqueó correctamente!
                                                    </p>
                                                    <p className="text-sm text-green-600 dark:text-green-300">
                                                        {warning}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex flex-col sm:flex-row gap-4">
                                                <Button
                                                    onClick={downloadUnlockedPDF}
                                                    className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                                                >
                                                    <Download className="mr-2 h-4 w-4" />
                                                    Descargar PDF Desbloqueado
                                                </Button>
                                                <Button
                                                    onClick={resetTool}
                                                    variant="outline"
                                                    className="flex-1"
                                                >
                                                    <Upload className="mr-2 h-4 w-4" />
                                                    Desbloquear Otro PDF
                                                </Button>
                                            </div>
                                        </div>
                                    </ToolCard>
                                )}
                            </div>

                            {/* Right Column: Actions and Instructions */}
                            <div className="space-y-6">
                                <ToolCard title="Acciones">
                                        <div className="flex flex-col sm:flex-row gap-4">
                                            <Button
                                                onClick={unlockPDF}
                                                disabled={isProcessing || !pdfFile}
                                                className="flex-1 bg-institutional hover:bg-institutional/90"
                                            >
                                                {isProcessing ? (
                                                    <>
                                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                        Desbloqueando...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Unlock className="mr-2 h-4 w-4" />
                                                        Desbloquear PDF
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
                                                Seleccionar Otro PDF
                                            </Button>
                                        </div>
                                </ToolCard>

                                <ToolCard title="Instrucciones">
                                    <div className="space-y-3 text-sm">
                                        <div className="flex items-start space-x-2">
                                            <span className="font-medium text-institutional">1.</span>
                                            <span>Selecciona el PDF que deseas desbloquear</span>
                                        </div>
                                        <div className="flex items-start space-x-2">
                                            <span className="font-medium text-institutional">2.</span>
                                            <span>Haz clic en "Desbloquear PDF"</span>
                                        </div>
                                        <div className="flex items-start space-x-2">
                                            <span className="font-medium text-institutional">3.</span>
                                            <span>Descarga el PDF sin restricciones</span>
                                        </div>
                                        <div className="flex items-start space-x-2">
                                            <span className="font-medium text-institutional">4.</span>
                                            <span>Usa responsablemente respetando derechos de autor</span>
                                        </div>
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