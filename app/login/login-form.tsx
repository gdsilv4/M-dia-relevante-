'use client'

import { useActionState, useState } from 'react'
import { signIn } from '@/app/actions/auth'
import type { LoginState } from '@/lib/types'

const estadoInicial: LoginState = { error: null }

export function LoginForm({ configurado }: { configurado: boolean }) {
  const [estado, acao, enviando] = useActionState(signIn, estadoInicial)
  const [mostrarSenha, setMostrarSenha] = useState(false)

  return (
    <form action={acao} className="login-form">
      {!configurado && (
        <p className="form-aviso" role="status">
          O sistema ainda não está conectado ao Supabase. Conclua a configuração (veja o README) para poder entrar.
        </p>
      )}

      <label className="campo">
        <span>E-mail</span>
        <input
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          required
        />
      </label>

      <label className="campo">
        <span>Senha</span>
        <div className="campo-senha">
          <input
            name="password"
            type={mostrarSenha ? 'text' : 'password'}
            autoComplete="current-password"
            required
          />
          <button
            type="button"
            className="btn-texto"
            onClick={() => setMostrarSenha((v) => !v)}
            aria-pressed={mostrarSenha}
          >
            {mostrarSenha ? 'Ocultar' : 'Mostrar'}
          </button>
        </div>
      </label>

      {estado.error && (
        <p className="form-erro" role="alert">
          {estado.error}
        </p>
      )}

      <button type="submit" className="btn-primario" disabled={enviando || !configurado}>
        {enviando ? 'Entrando…' : 'Entrar'}
      </button>
    </form>
  )
}
