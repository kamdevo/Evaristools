import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface ToolCardProps {
    title: string;
    description?: string;
    icon?: React.ComponentType<{ className?: string }>;
    children: React.ReactNode;
    className?: string;
    [key: string]: any; // Allow any additional props like data-tour
}

export default function ToolCard({ title, description, icon: Icon, children, className = "", ...rest }: ToolCardProps) {
    return (
        <Card className={className} {...rest}>
            <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                    {Icon && <Icon className="h-5 w-5" />}
                    <span>{title}</span>
                </CardTitle>
                {description && (
                    <CardDescription>
                        {description}
                    </CardDescription>
                )}
            </CardHeader>
            <CardContent className="space-y-4">
                {children}
            </CardContent>
        </Card>
    );
}