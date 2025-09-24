import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, Phone, Lock, User } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const RegisterForm: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [phoneError, setPhoneError] = useState('');
  const { register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();

  // PHONE VALIDATION: Must be exactly 8 digits
  const validatePhone = (phoneNumber: string): boolean => {
    const cleanPhone = phoneNumber.replace(/\D/g, ''); // Remove non-digits
    if (cleanPhone.length !== 8) {
      setPhoneError(t('validation.phoneInvalid'));
      return false;
    }
    setPhoneError('');
    return true;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    if (name === 'phone') {
      // Only allow digits and limit to 8 characters
      const cleanValue = value.replace(/\D/g, '').slice(0, 8);
      setFormData({
        ...formData,
        [name]: cleanValue,
      });

      // Clear error when user starts typing
      if (phoneError) {
        setPhoneError('');
      }
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate phone number before submission
    if (!validatePhone(formData.phone)) {
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      return; // Error already shown in UI
    }

    if (!formData.name || !formData.phone || !formData.password) return;

    setIsLoading(true);
    try {
      await register(formData.phone, formData.password, formData.name);

      // Check for return URL or intended service
      const returnTo = location.state?.returnTo;
      const intendedService = sessionStorage.getItem('intendedService');

      if (returnTo) {
        navigate(returnTo, { replace: true });
      } else if (intendedService) {
        sessionStorage.removeItem('intendedService');
        navigate(`/booking?service=${intendedService}`, { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    } catch (error) {
      // Error is handled by the auth context
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid =
    formData.name &&
    formData.phone &&
    formData.password &&
    formData.confirmPassword &&
    formData.password === formData.confirmPassword &&
    phoneError === '';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-primary-foreground font-bold text-2xl">B</span>
          </div>
          <CardTitle className="text-2xl font-bold">{t('auth.register')}</CardTitle>
          <CardDescription>
            Join us and book your perfect cut today
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">{t('forms.name')}</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="name"
                  name="name"
                  type="text"
                  placeholder={t('forms.namePlaceholder')}
                  value={formData.name}
                  onChange={handleChange}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">{t('forms.phone')}</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  placeholder={t('forms.phonePlaceholder')}
                  value={formData.phone}
                  onChange={handleChange}
                  className={`pl-10 ${phoneError ? 'border-destructive' : ''}`}
                  required
                  maxLength={8}
                />
              </div>
              {phoneError && (
                <p className="text-sm text-destructive">{phoneError}</p>
              )}
              <p className="text-xs text-muted-foreground">{t('forms.phonePlaceholder')}</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">{t('forms.password')}</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder={t('forms.passwordPlaceholder')}
                  value={formData.password}
                  onChange={handleChange}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">{t('forms.confirmPassword')}</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  placeholder={t('forms.confirmPasswordPlaceholder')}
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="pl-10"
                  required
                />
              </div>
              {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                <p className="text-sm text-destructive">{t('validation.passwordsDoNotMatch')}</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading || !isFormValid}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('forms.registerButton')}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm">
            <span className="text-muted-foreground">Already have an account? </span>
            <Link
              to="/login"
              className="text-primary hover:text-primary/80 font-medium"
            >
              {t('auth.login')}
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RegisterForm;