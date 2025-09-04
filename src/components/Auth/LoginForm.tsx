import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, Phone, Lock } from 'lucide-react';

const LoginForm: React.FC = () => {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [phoneError, setPhoneError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  // PHONE VALIDATION: Must be exactly 8 digits
  const validatePhone = (phoneNumber: string): boolean => {
    const cleanPhone = phoneNumber.replace(/\D/g, ''); // Remove non-digits
    if (cleanPhone.length !== 8) {
      setPhoneError('Phone number must be exactly 8 digits');
      return false;
    }
    setPhoneError('');
    return true;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Only allow digits and limit to 8 characters
    const cleanValue = value.replace(/\D/g, '').slice(0, 8);
    setPhone(cleanValue);
    
    // Clear error when user starts typing
    if (phoneError) {
      setPhoneError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate phone number before submission
    if (!validatePhone(phone)) {
      return;
    }
    
    if (!password) {
      return;
    }

    setIsLoading(true);
    try {
      await login(phone, password);
      navigate('/dashboard'); // Navigate to dashboard after successful login
    } catch (error) {
      // Error is handled by the auth context
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-primary-foreground font-bold text-2xl">B</span>
          </div>
          <CardTitle className="text-2xl font-bold">Welcome Back</CardTitle>
          <CardDescription>
            Sign in to your account to book appointments
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="phone"
                  type="tel"
                  placeholder="12345678"
                  value={phone}
                  onChange={handlePhoneChange}
                  className={`pl-10 ${phoneError ? 'border-destructive' : ''}`}
                  required
                  maxLength={8}
                />
              </div>
              {phoneError && (
                <p className="text-sm text-destructive">{phoneError}</p>
              )}
              <p className="text-xs text-muted-foreground">Enter exactly 8 digits</p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>
            
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading || !phone || !password || phoneError !== ''}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Sign In
            </Button>
          </form>

          <div className="mt-6 text-center text-sm">
            <span className="text-muted-foreground">Don't have an account? </span>
            <Link
              to="/register"
              className="text-primary hover:text-primary/80 font-medium"
            >
              Sign up
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginForm;
