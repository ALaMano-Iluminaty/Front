import { useState, type FormEvent } from 'react';
import { Button, Input } from '@/components';
import { useLogin } from '../hooks/useLogin';

export function LoginForm() {
  const { submit, loading, error } = useLogin();
  const [email, setEmail] = useState('cliente@barberia.dev');
  const [password, setPassword] = useState('demo1234');

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    void submit({ email, password });
  };

  return (
    <form className="login-form" onSubmit={onSubmit}>
      <Input
        label="Correo"
        type="email"
        value={email}
        autoComplete="username"
        onChange={(event) => setEmail(event.target.value)}
      />
      <Input
        label="Contraseña"
        type="password"
        value={password}
        autoComplete="current-password"
        onChange={(event) => setPassword(event.target.value)}
        error={error ?? undefined}
      />
      <Button type="submit" loading={loading}>
        Entrar
      </Button>
      <p className="login-form__hint">Demo: cualquier correo entra como cliente; uno que empiece por «barbero» entra como barbero.</p>
    </form>
  );
}
