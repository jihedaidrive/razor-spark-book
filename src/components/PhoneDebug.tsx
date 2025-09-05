import React, { useState } from 'react';
import { sanitizePhone, isValidPhone } from '@/utils/security';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const PhoneDebug: React.FC = () => {
    const [testPhone, setTestPhone] = useState('');

    const testPhoneValidation = () => {
        const sanitized = sanitizePhone(testPhone);
        const isValid = isValidPhone(sanitized);
        const digitsOnly = testPhone.replace(/\D/g, '');

        console.log('Phone Validation Test:', {
            original: testPhone,
            sanitized: sanitized,
            digitsOnly: digitsOnly,
            digitCount: digitsOnly.length,
            isValid: isValid
        });

        alert(`
Original: "${testPhone}"
Sanitized: "${sanitized}"
Digits only: "${digitsOnly}" (${digitsOnly.length} digits)
Is Valid: ${isValid}
    `);
    };

    if (import.meta.env.PROD) {
        return null; // Don't show in production
    }

    return (
        <Card className="m-4">
            <CardHeader>
                <CardTitle>Phone Number Debug Tool</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <Input
                    placeholder="Enter phone number to test"
                    value={testPhone}
                    onChange={(e) => setTestPhone(e.target.value)}
                />
                <Button onClick={testPhoneValidation}>Test Phone Validation</Button>

                <div className="text-sm text-muted-foreground">
                    <p><strong>Examples that should work:</strong></p>
                    <ul className="list-disc list-inside">
                        <li>1234567890</li>
                        <li>(123) 456-7890</li>
                        <li>123-456-7890</li>
                        <li>+1 123 456 7890</li>
                        <li>123.456.7890</li>
                    </ul>
                </div>
            </CardContent>
        </Card>
    );
};

export default PhoneDebug;