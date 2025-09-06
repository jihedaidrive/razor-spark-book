import React from 'react';
import LoginForm from '@/components/Auth/LoginForm';

const Login: React.FC = () => {
  return (
    <div>
      {/* Temporary debug tool - remove in production */}
      <LoginForm />
    </div>
  );
};

export default Login;