<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Smalot\PdfParser\Parser as PdfParser;
use PhpOffice\PhpWord\IOFactory;
use Exception;

class ResumeDocumentController extends Controller
{
    private $openRouterApiKey = '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';
    private $model = 'qwen/qwen3-235b-a22b:free';
    
    public function __construct()
    {
        // API key is now hardcoded for this tool
        // Using Qwen3 235B A22B which has 131K context and optimized reasoning capabilities
    }
    
    public function generate(Request $request)
    {
        // Extend PHP execution time for AI processing (can take longer than 60s)
        set_time_limit(180); // 3 minutes
        
        try {
            $request->validate([
                'file' => 'required|file|mimes:pdf,docx,txt|max:10240', // 10MB max (removed .doc for compatibility)
                'length' => 'required|in:short,medium,long',
                'language' => 'required|in:es,en'
            ]);

            $file = $request->file('file');
            $length = $request->input('length');
            $language = $request->input('language');

            // Extract text from document
            $text = $this->extractTextFromFile($file);

            if (empty($text)) {
                return response()->json([
                    'error' => 'No se pudo extraer texto del documento. Verifica que el archivo no esté vacío o corrupto.'
                ], 400);
            }

            // Limit text to avoid token limits (approximately 120,000 characters = ~30,000 tokens)
            // Qwen3 235B supports 131K context with good performance
            if (strlen($text) > 120000) {
                $text = substr($text, 0, 120000) . '...';
            }

            // Generate summary using Qwen3 235B via OpenRouter
            $summary = $this->generateSummaryWithAI($text, $length, $language);

            return response()->json([
                'summary' => $summary,
                'success' => true
            ]);

        } catch (Exception $e) {
            \Log::error('Error in ResumeDocumentController: ' . $e->getMessage());
            
            return response()->json([
                'error' => 'Error al procesar el documento: ' . $e->getMessage()
            ], 500);
        }
    }

    private function extractTextFromFile($file)
    {
        $extension = $file->getClientOriginalExtension();
        $text = '';

        try {
            switch ($extension) {
                case 'txt':
                    $text = file_get_contents($file->getRealPath());
                    break;

                case 'pdf':
                    $parser = new PdfParser();
                    $pdf = $parser->parseFile($file->getRealPath());
                    $text = $pdf->getText();
                    break;

                case 'docx':
                    // For Word documents, we need PhpWord
                    try {
                        $phpWord = IOFactory::load($file->getRealPath());
                        $text = '';
                        
                        foreach ($phpWord->getSections() as $section) {
                            foreach ($section->getElements() as $element) {
                                if (method_exists($element, 'getText')) {
                                    $text .= $element->getText() . "\n";
                                } elseif (method_exists($element, 'getElements')) {
                                    foreach ($element->getElements() as $childElement) {
                                        if (method_exists($childElement, 'getText')) {
                                            $text .= $childElement->getText() . "\n";
                                        }
                                    }
                                }
                            }
                        }
                    } catch (\Exception $e) {
                        \Log::error('PhpWord error: ' . $e->getMessage());
                        throw new Exception('El archivo Word parece estar corrupto o no es un formato válido. Por favor intenta con otro archivo o convértelo a PDF.');
                    }
                    break;

                default:
                    throw new Exception('Formato de archivo no soportado');
            }

            // Clean up the text
            $text = trim($text);
            $text = preg_replace('/\s+/', ' ', $text); // Remove extra whitespace
            
            return $text;

        } catch (Exception $e) {
            \Log::error('Error extracting text: ' . $e->getMessage());
            throw new Exception('Error al extraer texto del documento: ' . $e->getMessage());
        }
    }

    private function generateSummaryWithAI($text, $length, $language)
    {
        // Define prompts based on length and language
        $lengthInstructions = [
            'short' => $language === 'es' 
                ? 'Genera un resumen breve en 2-3 párrafos.' 
                : 'Generate a brief summary in 2-3 paragraphs.',
            'medium' => $language === 'es' 
                ? 'Genera un resumen de longitud media en 4-6 párrafos.' 
                : 'Generate a medium-length summary in 4-6 paragraphs.',
            'long' => $language === 'es' 
                ? 'Genera un resumen detallado en 7-10 párrafos.' 
                : 'Generate a detailed summary in 7-10 paragraphs.'
        ];

        $prompt = $language === 'es'
            ? "Por favor, resume el siguiente documento. {$lengthInstructions[$length]} El resumen debe capturar los puntos principales, ideas clave y conclusiones importantes. Mantén un tono profesional y objetivo. Responde ÚNICAMENTE con el resumen final, sin incluir procesos de pensamiento o etiquetas adicionales.\n\nDocumento:\n{$text}\n\nResumen:"
            : "Please summarize the following document. {$lengthInstructions[$length]} The summary should capture the main points, key ideas, and important conclusions. Maintain a professional and objective tone. Respond ONLY with the final summary, without including thinking processes or additional tags.\n\nDocument:\n{$text}\n\nSummary:";

        try {
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $this->openRouterApiKey,
                'HTTP-Referer' => config('app.url'),
                'X-Title' => 'Evaristools - HUV',
                'Content-Type' => 'application/json'
            ])->timeout(120)->post('https://openrouter.ai/api/v1/chat/completions', [
                'model' => $this->model,
                'messages' => [
                    [
                        'role' => 'user',
                        'content' => $prompt
                    ]
                ],
                'temperature' => 0.7,
                'max_tokens' => 4000
            ]);

            if ($response->failed()) {
                throw new Exception('Error en la API de OpenRouter: ' . $response->body());
            }

            $data = $response->json();
            
            if (!isset($data['choices'][0]['message']['content'])) {
                throw new Exception('Respuesta inválida de la API');
            }

            $content = $data['choices'][0]['message']['content'];
            
            // Clean thinking tags from Qwen3 model response
            $content = $this->cleanThinkingTags($content);
            
            return trim($content);

        } catch (Exception $e) {
            \Log::error('Error calling OpenRouter API: ' . $e->getMessage());
            throw new Exception('Error al generar el resumen con IA: ' . $e->getMessage());
        }
    }
    
    /**
     * Clean thinking tags from model response
     */
    private function cleanThinkingTags($content)
    {
        // Remove <think>...</think> blocks (including nested content)
        $content = preg_replace('/<think>.*?<\/think>/s', '', $content);
        
        // Remove any remaining thinking-related tags
        $content = preg_replace('/<\/?think>/i', '', $content);
        
        // Clean up extra whitespace and line breaks
        $content = preg_replace('/\n\s*\n\s*\n/', "\n\n", $content);
        $content = trim($content);
        
        return $content;
    }
}
