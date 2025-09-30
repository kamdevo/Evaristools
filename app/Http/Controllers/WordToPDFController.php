<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use PhpOffice\PhpWord\Settings;
use PhpOffice\PhpWord\IOFactory;
use Illuminate\Support\Facades\Storage;

class WordToPDFController extends Controller
{
    /**
     * Convert uploaded Word document to PDF
     */
    public function convert(Request $request)
    {
        try {
            // Validate the uploaded file
            $request->validate([
                'file' => 'required|mimes:doc,docx|max:10240', // Max 10MB
            ]);

            // Get the uploaded file
            $file = $request->file('file');
            
            // Generate unique filename
            $fileName = 'word_' . time() . '.' . $file->getClientOriginalExtension();
            
            // Store the uploaded file temporarily
            $file->move(storage_path('app/temp'), $fileName);
            $wordFilePath = storage_path('app/temp/' . $fileName);

            // Configure DomPDF renderer for PHPWord
            $domPdfPath = base_path('vendor/dompdf/dompdf');
            Settings::setPdfRendererPath($domPdfPath);
            Settings::setPdfRendererName('DomPDF');

            // Load the Word document
            $phpWord = IOFactory::load($wordFilePath);
            
            // Create PDF writer
            $pdfWriter = IOFactory::createWriter($phpWord, 'PDF');
            
            // Generate PDF filename
            $pdfFileName = 'converted_' . time() . '.pdf';
            $pdfFilePath = storage_path('app/temp/' . $pdfFileName);
            
            // Save the PDF
            $pdfWriter->save($pdfFilePath);

            // Delete the original Word file
            if (file_exists($wordFilePath)) {
                unlink($wordFilePath);
            }

            // Return the PDF file as download and then delete it
            return response()->download($pdfFilePath, $pdfFileName)->deleteFileAfterSend(true);

        } catch (\Exception $e) {
            // Log the error
            \Log::error('Word to PDF conversion error: ' . $e->getMessage());
            
            // Return error response
            return response()->json([
                'error' => 'Error al convertir el documento: ' . $e->getMessage()
            ], 500);
        }
    }
}
