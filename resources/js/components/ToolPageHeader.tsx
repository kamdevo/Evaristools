import { Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Building2 } from 'lucide-react';

interface ToolPageHeaderProps {
    title: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
    showPopularBadge?: boolean;
}

export default function ToolPageHeader({ title, description, icon: Icon, showPopularBadge = false }: ToolPageHeaderProps) {
    return (
        <div className="bg-white/80 backdrop-blur-sm border-b border-white/20 dark:bg-slate-800/80 dark:border-slate-700/20">
            <div className="container mx-auto px-4 py-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <Link href="/">
                            <Button variant="outline" size="sm" className="flex items-center space-x-2">
                                <ArrowLeft className="h-4 w-4" />
                                <span>Volver</span>
                            </Button>
                        </Link>
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-institutional/10 text-institutional">
                            <Icon className="h-6 w-6" />
                        </div>
                        <div>
                            <div className="flex items-center space-x-2">
                                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                                    {title}
                                </h1>
                                {showPopularBadge && (
                                    <Badge variant="secondary" className="text-xs">
                                        Popular
                                    </Badge>
                                )}
                            </div>
                            <p className="text-slate-600 dark:text-slate-300">
                                {description}
                            </p>
                        </div>
                    </div>
                    <Badge variant="secondary" className="flex items-center space-x-1">
                        <Building2 className="h-3 w-3" />
                        <span>HUV</span>
                    </Badge>
                </div>
            </div>
        </div>
    );
}