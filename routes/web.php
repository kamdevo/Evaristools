<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('evaristools');
})->name('home');

// Tools Routes
Route::prefix('tools')->name('tools.')->group(function () {
    Route::get('qr-generator', function () {
        return Inertia::render('tools/qr-generator');
    })->name('qr-generator');
    
    Route::get('pdf-compress', function () {
        return Inertia::render('tools/pdf-compress');
    })->name('pdf-compress');
    
    Route::get('ocr-extract', function () {
        return Inertia::render('tools/ocr-extract');
    })->name('ocr-extract');
    
    Route::get('merge-pdfs', function () {
        return Inertia::render('tools/merge-pdfs');
    })->name('merge-pdfs');
    
    Route::get('split-pdf', function () {
        return Inertia::render('tools/split-pdf');
    })->name('split-pdf');
    
    Route::get('images-to-pdf', function () {
        return Inertia::render('tools/images-to-pdf');
    })->name('images-to-pdf');
    
    Route::get('images-to-word', function () {
        return Inertia::render('tools/images-to-word');
    })->name('images-to-word');
    
    Route::get('pdf-to-images', function () {
        return Inertia::render('tools/pdf-to-images');
    })->name('pdf-to-images');
    
    Route::get('word-to-pdf', function () {
        return Inertia::render('tools/word-to-pdf');
    })->name('word-to-pdf');
    
    Route::get('rotate-pdf', function () {
        return Inertia::render('tools/rotate-pdf');
    })->name('rotate-pdf');
    
    Route::get('page-numbers', function () {
        return Inertia::render('tools/page-numbers');
    })->name('page-numbers');
    
    Route::get('watermark-pdf', function () {
        return Inertia::render('tools/watermark-pdf');
    })->name('watermark-pdf');
    
    Route::get('sort-pdf', function () {
        return Inertia::render('tools/sort-pdf');
    })->name('sort-pdf');
    
    Route::get('crop-pdf', function () {
        return Inertia::render('tools/crop-pdf');
    })->name('crop-pdf');
    
    Route::get('unlock-pdf', function () {
        return Inertia::render('tools/unlock-pdf');
    })->name('unlock-pdf');
    
    Route::get('powerpoint-to-pdf', function () {
        return Inertia::render('tools/powerpoint-to-pdf');
    })->name('powerpoint-to-pdf');
    
    Route::get('excel-to-pdf', function () {
        return Inertia::render('tools/excel-to-pdf');
    })->name('excel-to-pdf');
    
    Route::get('resume-document', function () {
        return Inertia::render('tools/resume-document');
    })->name('resume-document');
    
    Route::get('sign-pdf', function () {
        return Inertia::render('tools/sign-pdf');
    })->name('sign-pdf');
    
    Route::get('protect-pdf', function () {
        return Inertia::render('tools/protect-pdf');
    })->name('protect-pdf');
    
    Route::get('cuvs', function () {
        return Inertia::render('tools/cuvs');
    })->name('cuvs');
    
    Route::get('evarisdrop', function () {
        return Inertia::render('tools/evarisdrop');
    })->name('evarisdrop');
    
    // API endpoints for tools
    Route::post('word-to-pdf/convert', [App\Http\Controllers\WordToPDFController::class, 'convert'])->name('word-to-pdf.convert');
    Route::post('resume-document/generate', [App\Http\Controllers\ResumeDocumentController::class, 'generate'])->name('resume-document.generate');
    Route::post('sign-pdf/sign', [App\Http\Controllers\SignPDFController::class, 'sign'])->name('sign-pdf.sign');
    Route::post('protect-pdf/protect', [App\Http\Controllers\ProtectPDFController::class, 'protect'])->name('protect-pdf.protect');
    
    // CUVS endpoints
    Route::post('cuvs/process-json-sos', [App\Http\Controllers\CuvsController::class, 'processJsonSOS'])->name('cuvs.process-json-sos');
    Route::get('cuvs/download-processed/{filename}', [App\Http\Controllers\CuvsController::class, 'downloadProcessed'])->name('cuvs.download-processed');
    
    // Evarisdrop endpoints
    Route::post('evarisdrop/room/create', [App\Http\Controllers\EvarisdropRoomController::class, 'createRoom'])->name('evarisdrop.room.create');
    Route::post('evarisdrop/room/join', [App\Http\Controllers\EvarisdropRoomController::class, 'joinRoom'])->name('evarisdrop.room.join');
    Route::get('evarisdrop/room/{roomCode}/devices', [App\Http\Controllers\EvarisdropRoomController::class, 'getRoomDevices'])->name('evarisdrop.room.devices');
    Route::post('evarisdrop/room/leave', [App\Http\Controllers\EvarisdropRoomController::class, 'leaveRoom'])->name('evarisdrop.room.leave');
    Route::post('evarisdrop/transfer/request', [App\Http\Controllers\EvarisdropFileTransferController::class, 'requestTransfer'])->name('evarisdrop.transfer.request');
    Route::get('evarisdrop/transfer/pending', [App\Http\Controllers\EvarisdropFileTransferController::class, 'getPendingRequests'])->name('evarisdrop.transfer.pending');
    Route::post('evarisdrop/transfer/{transferId}/respond', [App\Http\Controllers\EvarisdropFileTransferController::class, 'respondToTransfer'])->name('evarisdrop.transfer.respond');
    Route::get('evarisdrop/transfer/{transferId}/download', [App\Http\Controllers\EvarisdropFileTransferController::class, 'downloadFile'])->name('evarisdrop.transfer.download');
    Route::get('evarisdrop/transfer/{transferId}/status', [App\Http\Controllers\EvarisdropFileTransferController::class, 'getTransferStatus'])->name('evarisdrop.transfer.status');
});

// API Routes for Tool Popularity System
Route::prefix('api/tools')->name('api.tools.')->group(function () {
    Route::post('click', [App\Http\Controllers\ToolPopularityController::class, 'recordClick'])->name('click');
    Route::get('popular', [App\Http\Controllers\ToolPopularityController::class, 'getPopularTools'])->name('popular');
    Route::get('{toolId}/stats', [App\Http\Controllers\ToolPopularityController::class, 'getToolStats'])->name('stats');
});

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
