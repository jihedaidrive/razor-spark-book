import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Bug, Copy } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

const VapidDebugHelper: React.FC = () => {
    const { user } = useAuth();
    const token = localStorage.getItem('accessToken');
    const [debugResult, setDebugResult] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);

    const testVapidEndpoint = async () => {
        if (!token) return;

        setIsLoading(true);
        setDebugResult(null);

        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'https://barber-backend-4817.onrender.com';
            const response = await fetch(`${apiUrl}/notifications/vapid-public-key`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            });

            const responseText = await response.text();
            let parsedData;

            try {
                parsedData = JSON.parse(responseText);
            } catch (e) {
                parsedData = 'Could not parse as JSON';
            }

            setDebugResult({
                status: response.status,
                statusText: response.statusText,
                headers: Object.fromEntries(response.headers.entries()),
                rawResponse: responseText,
                parsedData: parsedData,
                dataType: typeof parsedData,
                dataKeys: parsedData && typeof parsedData === 'object' ? Object.keys(parsedData) : 'N/A'
            });
        } catch (error) {
            setDebugResult({
                error: error.message,
                errorType: error.constructor.name
            });
        }

        setIsLoading(false);
    };

    const copyResult = () => {
        navigator.clipboard.writeText(JSON.stringify(debugResult, null, 2));
        toast({
            title: 'Copied to clipboard',
            description: 'Debug result copied successfully',
        });
    };

    if (!user || user.role !== 'admin') {
        return null;
    }

    return (
        <Card className="mobile-card">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Bug className="w-5 h-5" />
                    VAPID Debug Helper
                </CardTitle>
                <CardDescription>
                    Test what your production backend is returning for VAPID key
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <Button
                    onClick={testVapidEndpoint}
                    disabled={isLoading}
                    variant="outline"
                >
                    {isLoading ? 'Testing...' : 'Test VAPID Endpoint'}
                </Button>

                {debugResult && (
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <h4 className="font-medium">Debug Result:</h4>
                            <Button
                                onClick={copyResult}
                                variant="ghost"
                                size="sm"
                            >
                                <Copy className="w-4 h-4" />
                            </Button>
                        </div>

                        <div className="bg-muted rounded p-3 text-xs font-mono max-h-96 overflow-auto">
                            <pre className="whitespace-pre-wrap">
                                {JSON.stringify(debugResult, null, 2)}
                            </pre>
                        </div>

                        {debugResult.parsedData && typeof debugResult.parsedData === 'object' && (
                            <Alert>
                                <Bug className="h-4 w-4" />
                                <AlertDescription>
                                    <strong>Found the issue!</strong> Your backend is returning an object instead of a string.
                                    The response structure shows: {JSON.stringify(Object.keys(debugResult.parsedData))}
                                </AlertDescription>
                            </Alert>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default VapidDebugHelper;