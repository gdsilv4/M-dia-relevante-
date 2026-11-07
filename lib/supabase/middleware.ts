import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { getSupabaseEnv } from '@/lib/supabase/env'
import type { CookieParaGravar } from '@/lib/types'

// Renova a sessão a cada requisição e protege todas as páginas:
// sem login, qualquer endereço leva para /login.
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request })
  const { pathname } = request.nextUrl
  const naTelaDeLogin = pathname === '/login' || pathname.startsWith('/login/')

  const env = getSupabaseEnv()
  if (!env) {
    // Sem configuração não há como autenticar: só a tela de login (com aviso) fica acessível.
    if (naTelaDeLogin) return response
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.search = ''
    return NextResponse.redirect(url)
  }

  const supabase = createServerClient(env.url, env.key, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet: CookieParaGravar[]) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        response = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
      },
    },
  })

  // getUser() valida o token no servidor do Supabase (mais seguro que confiar só no cookie).
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const redirecionar = (destino: string) => {
    const url = request.nextUrl.clone()
    url.pathname = destino
    url.search = ''
    const redirect = NextResponse.redirect(url)
    response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie))
    return redirect
  }

  if (!user && !naTelaDeLogin) return redirecionar('/login')
  if (user && naTelaDeLogin) return redirecionar('/')

  return response
}
