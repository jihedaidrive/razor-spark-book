import React from 'react';
import LoginForm from '@/components/Auth/LoginForm';
import PhoneDebug from '@/components/PhoneDebug';

const Login: React.FC = () => {
  return (
    <div>
      {/* Temporary debug tool - remove in production */}
      {import.meta.env.DEV && <PhoneDebug />}
      <LoginForm />
    </div>
  );
};

export default Login;