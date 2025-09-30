import { useState, useRef } from 'react';
import { Head } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Upload, FileText, Loader2, Download, ArrowUpDown, CheckCircle, ArrowUp, ArrowDown, Trash2 } from 'lucide-react';
import ToolPageHeader from '@/components/ToolPageHeader';
import ToolCard from '@/components/ToolCard';
import FileUploadZone from '@/components/FileUploadZone';
import { PDFDocument } from 'pdf-lib';

interface PageInfo {
    index: number;
    originalIndex: number;
}

export default function SortPDF() {
    const [pdfFile, setPdfFile] = useState<File | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isSorted, setIsSorted] = useState(false);
    const [pages, setPages] = useState<PageInfo[]>([]);
    const [sortedPdfUrl, setSortedPdfUrl] = useState<string>('');
    const [error, setError] = useState<string>('');
    const [dragOver, setDragOver] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = async (files: FileList) => {
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
        setIsSorted(false);
        setSortedPdfUrl('');

        // Load PDF to get page count
        try {
            const arrayBuffer = await file.arrayBuffer();
            const pdfDoc = await PDFDocument.load(arrayBuffer);
            const pageCount = pdfDoc.getPageCount();
            
            // Initialize pages array
            const initialPages: PageInfo[] = Array.from({ length: pageCount }, (_, i) => ({
                index: i,
                originalIndex: i
            }));
            setPages(initialPages);
        } catch (err) {
            console.error('Error loading PDF:', err);
            setError('Error al cargar el PDF. El archivo puede estar corrupto.');
        }
    };

    const movePage = (fromIndex: number, toIndex: number) => {
        if (toIndex < 0 || toIndex >= pages.length) return;
        
        const newPages = [...pages];
        const [movedPage] = newPages.splice(fromIndex, 1);
        newPages.splice(toIndex, 0, movedPage);
        setPages(newPages);
    };

    const deletePage = (index: number) => {
        if (pages.length <= 1) {
            setError('No puedes eliminar todas las páginas del PDF.');
            return;
        }
        const newPages = pages.filter((_, i) => i !== index);
        setPages(newPages);
    };

    const reversePagesOrder = () => {
        setPages([...pages].reverse());
    };

    const resetOrder = () => {
        const initialPages: PageInfo[] = Array.from({ length: pages.length }, (_, i) => ({
            index: pages[i].originalIndex,
            originalIndex: pages[i].originalIndex
        })).sort((a, b) => a.originalIndex - b.originalIndex);
        setPages(initialPages);
    };

    const applySort = async () => {
        if (!pdfFile || pages.length === 0) return;

        setIsProcessing(true);
        setError('');

        try {
            const arrayBuffer = await pdfFile.arrayBuffer();
            const pdfDoc = await PDFDocument.load(arrayBuffer);
            const newPdfDoc = await PDFDocument.create();

            // Copy pages in the new order
            for (const pageInfo of pages) {
                const [copiedPage] = await newPdfDoc.copyPages(pdfDoc, [pageInfo.originalIndex]);
                newPdfDoc.addPage(copiedPage);
            }

            // Save the sorted PDF
            const pdfBytes = await newPdfDoc.save();
            const blob = new Blob([pdfBytes], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);

            setSortedPdfUrl(url);
            setIsSorted(true);

        } catch (err) {
            console.error('Error sorting PDF:', err);
            setError('Error al ordenar el PDF. Por favor intenta de nuevo.');
        } finally {
            setIsProcessing(false);
        }
    };

    const downloadSortedPDF = () => {
        if (!sortedPdfUrl || !pdfFile) return;

        const link = document.createElement('a');
        link.href = sortedPdfUrl;
        link.download = `${pdfFile.name.replace('.pdf', '')}_ordenado.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const resetTool = () => {
        setPdfFile(null);
        setIsSorted(false);
        setSortedPdfUrl('');
        setPages([]);
        setError('');
        if (sortedPdfUrl) {
            URL.revokeObjectURL(sortedPdfUrl);
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
            <Head title="Ordenar PDF - Evaristools" />
            
            <div className="min-h-screen bg-white dark:bg-slate-900">
                <ToolPageHeader
                    title="Ordenar PDF"
                    description="Reorganiza, elimina o reordena las páginas de tus documentos PDF"
                    icon={ArrowUpDown}
                />

                <div className="container mx-auto px-4 py-8">
                    <div className="max-w-4xl mx-auto">
                        <div className="space-y-6">
                            {/* Upload Section */}
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
                                    <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                                        <p className="text-red-800 dark:text-red-200">{error}</p>
                                    </div>
                                </ToolCard>
                            )}

                            {/* File Info and Page Management */}
                            {pdfFile && pages.length > 0 && !isSorted && (
                                <>
                                    <ToolCard title="Archivo Seleccionado">
                                        <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                                            <div className="flex items-center space-x-3">
                                                <FileText className="h-8 w-8 text-institutional" />
                                                <div>
                                                    <p className="font-medium text-slate-900 dark:text-white">
                                                        {pdfFile.name}
                                                    </p>
                                                    <p className="text-sm text-slate-600 dark:text-slate-300">
                                                        {pages.length} {pages.length === 1 ? 'página' : 'páginas'}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </ToolCard>

                                    {/* Quick Actions */}
                                    <ToolCard title="Acciones Rápidas">
                                        <div className="flex flex-wrap gap-2">
                                            <Button
                                                onClick={reversePagesOrder}
                                                variant="outline"
                                                size="sm"
                                            >
                                                <ArrowUpDown className="h-4 w-4 mr-2" />
                                                Invertir Orden
                                            </Button>
                                            <Button
                                                onClick={resetOrder}
                                                variant="outline"
                                                size="sm"
                                            >
                                                Restablecer Orden Original
                                            </Button>
                                        </div>
                                    </ToolCard>

                                    {/* Pages List */}
                                    <ToolCard title="Organizar Páginas">
                                        <div className="space-y-2 max-h-96 overflow-y-auto">
                                            {pages.map((page, index) => (
                                                <div
                                                    key={`${page.originalIndex}-${index}`}
                                                    className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700"
                                                >
                                                    <span className="font-medium text-slate-900 dark:text-white min-w-[60px]">
                                                        Página {index + 1}
                                                    </span>
                                                    <span className="text-sm text-slate-600 dark:text-slate-400">
                                                        (Original: {page.originalIndex + 1})
                                                    </span>
                                                    <div className="flex-1"></div>
                                                    <div className="flex gap-1">
                                                        <Button
                                                            onClick={() => movePage(index, index - 1)}
                                                            variant="outline"
                                                            size="sm"
                                                            disabled={index === 0}
                                                        >
                                                            <ArrowUp className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            onClick={() => movePage(index, index + 1)}
                                                            variant="outline"
                                                            size="sm"
                                                            disabled={index === pages.length - 1}
                                                        >
                                                            <ArrowDown className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            onClick={() => deletePage(index)}
                                                            variant="outline"
                                                            size="sm"
                                                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </ToolCard>

                                    {/* Action Buttons */}
                                    <ToolCard title="Acciones">
                                        <div className="flex flex-col sm:flex-row gap-4">
                                            <Button
                                                onClick={applySort}
                                                disabled={isProcessing}
                                                className="flex-1 bg-institutional hover:bg-institutional/90"
                                            >
                                                {isProcessing ? (
                                                    <>
                                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                        Procesando...
                                                    </>
                                                ) : (
                                                    <>
                                                        <ArrowUpDown className="mr-2 h-4 w-4" />
                                                        Aplicar Orden
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
                                </>
                            )}

                            {/* Success Message */}
                            {isSorted && sortedPdfUrl && (
                                <ToolCard title="¡PDF Ordenado Exitosamente!">
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-center space-x-3 p-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                                            <CheckCircle className="h-8 w-8 text-green-600" />
                                            <div>
                                                <p className="font-medium text-green-800 dark:text-green-200">
                                                    ¡Las páginas se ordenaron correctamente!
                                                </p>
                                                <p className="text-sm text-green-600 dark:text-green-300">
                                                    Descarga tu PDF ordenado o procesa otro archivo.
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex flex-col sm:flex-row gap-4">
                                            <Button
                                                onClick={downloadSortedPDF}
                                                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                                            >
                                                <Download className="mr-2 h-4 w-4" />
                                                Descargar PDF Ordenado
                                            </Button>
                                            <Button
                                                onClick={resetTool}
                                                variant="outline"
                                                className="flex-1"
                                            >
                                                <Upload className="mr-2 h-4 w-4" />
                                                Ordenar Otro PDF
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