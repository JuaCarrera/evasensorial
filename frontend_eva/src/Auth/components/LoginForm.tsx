// src/Auth/components/LoginForm.tsx
import React, { useState, useEffect } from 'react';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import InputField from './InputField';
import LoginButton from './LoginButton';
import { useLogin } from '../hooks/useLogin';

interface FormData { email: string; password: string; }
interface FormErrors { email: string; password: string; }
interface LoginFormProps { onGoToRegister: () => void; }

const LoginForm: React.FC<LoginFormProps> = ({ onGoToRegister }) => {
  const [formData, setFormData] = useState<FormData>({ email: '', password: '' });
  const [errors, setErrors] = useState<FormErrors>({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  const { login, loading, serverError, setServerError } = useLogin();
  const navigate = useNavigate();

  useEffect(() => { setIsVisible(true); }, []);

  const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
    if (serverError) setServerError('');
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = { email: '', password: '' };
    if (!formData.email) newErrors.email = 'El correo electrónico es requerido';
    else if (!validateEmail(formData.email)) newErrors.email = 'Ingresa un correo electrónico válido';
    if (!formData.password) newErrors.password = 'La contraseña es requerida';
    setErrors(newErrors);
    return !newErrors.email && !newErrors.password;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;
    try {
      const res = await login({ email: formData.email, password: formData.password });

      // ✅ Redirigir según rol
      if (res?.user?.es_superadmin) {
        navigate('/dashboard', { replace: true });
      } else {
        navigate('/lite-dashboard', { replace: true });
      }
    } catch {
      // error ya lo maneja useLogin
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleLogin();
  };

  return (
    <div className={`relative w-full max-w-md transition-all duration-1000 ease-out transform ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
      <div className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8 lg:p-10">
        <div className="text-center mb-8">
          <div className="w-32 h-32 mx-auto mb-6 rounded-2xl overflow-hidden shadow-lg border-2 border-transparent">
            <img src="./eva2.png" alt="EVA Sensorial Logo" className="w-full h-full object-contain bg-transparent p-2" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">EVA Sensorial</h1>
          <p className="text-purple-200">Inicia sesión en tu cuenta</p>
        </div>

        <InputField
          id="email"
          type="email"
          label="Correo Electrónico"
          value={formData.email}
          onChange={(value) => handleInputChange('email', value)}
          onKeyPress={handleKeyPress}
          error={errors.email}
          placeholder="tu@email.com"
          icon={<Mail className="h-5 w-5 text-purple-300" />}
        />

        <div className="mb-6">
          <label htmlFor="password" className="block text-sm font-medium text-purple-100 mb-2">Contraseña</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock className="h-5 w-5 text-purple-300" />
            </div>
            <input
              type={showPassword ? 'text' : 'password'}
              id="password"
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              onKeyPress={handleKeyPress}
              className={`w-full pl-10 pr-12 py-3 bg-white/10 border rounded-xl text-white placeholder-purple-300 
                focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent 
                transition-all duration-300 ease-in-out backdrop-blur-sm
                ${errors.password ? 'border-red-400 focus:ring-red-400' : 'border-purple-300/50 hover:border-purple-300'}`}
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-purple-300 hover:text-white transition-colors duration-200"
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
          {errors.password && <p className="mt-2 text-sm text-red-300 animate-pulse">{errors.password}</p>}
        </div>

        {serverError && <p className="mb-4 text-sm text-red-300">{serverError}</p>}

        <div className="flex items-center justify-between mb-8">
          <label className="flex items-center">
            <input
              type="checkbox"
              className="w-4 h-4 text-purple-500 bg-white/10 border-purple-300/50 rounded focus:ring-purple-400 focus:ring-2"
            />
            <span className="ml-2 text-sm text-purple-200">Recordarme</span>
          </label>
          <button className="text-sm text-purple-300 hover:text-white transition-colors duration-200 hover:underline">
            ¿Olvidaste tu contraseña?
          </button>
        </div>

        <LoginButton
          onClick={handleLogin}
          isLoading={loading}
          text="Iniciar Sesión"
          loadingText="Iniciando sesión..."
        />

        <div className="mt-8 text-center">
          <p className="text-purple-200">
            Ingresa administrador
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;
