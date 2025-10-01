import { Head } from '@inertiajs/react';
import ToolPageHeader from '@/components/ToolPageHeader';
import { Share2 } from 'lucide-react';
import { EvarisdropDashboard } from '@/components/evarisdrop/EvarisdropDashboard';

export default function Evarisdrop() {
    return (
        <>
            <Head title="Evarisdrop - Evaristools">
                <meta name="description" content="Sistema de transferencia de archivos entre dispositivos en tiempo real" />
            </Head>

            <div className="min-h-screen bg-white dark:bg-slate-900">
                <ToolPageHeader
                    title="Evarisdrop"
                    description="Transferencia de archivos entre dispositivos"
                    icon={Share2}
                    showPopularBadge={false}
                />

                <div className="container mx-auto px-4 py-8">
                    <EvarisdropDashboard
                        appName="Evarisdrop"
                        maxFileSize={52428800} // 50MB in bytes
                        networkName="Evaristools Network"
                    />
                </div>
            </div>
        </>
    );
}
