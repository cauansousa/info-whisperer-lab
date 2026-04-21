import { createClient } from '@supabase/supabase-js'

const URL = import.meta.env.VITE_EXTERNAL_SUPABASE_URL as string
const ANON = import.meta.env.VITE_EXTERNAL_SUPABASE_ANON_KEY as string
const SERVICE = import.meta.env.VITE_EXTERNAL_SUPABASE_SERVICE_KEY as string

const anonClient = createClient(URL, ANON)
const serviceClient = SERVICE ? createClient(URL, SERVICE) : anonClient

function client(useServiceRole = false) {
  return useServiceRole ? serviceClient : anonClient
}

type Filter = [column: string, operator: string, value: unknown]

/**
 * Cliente direto para o Supabase do usuário (rgnvrzhzarpzzwbdhfxf).
 */
export const externalSupabase = {
  async select<T = unknown>(
    args: { table: string; columns?: string; filters?: Filter[]; order?: { column: string; ascending?: boolean }; limit?: number; single?: boolean },
    useServiceRole = false,
  ): Promise<T> {
    let q = client(useServiceRole).from(args.table).select(args.columns ?? '*')
    for (const [col, op, val] of args.filters ?? []) q = q.filter(col, op, val as any)
    if (args.order) q = q.order(args.order.column, { ascending: args.order.ascending ?? true })
    if (args.limit) q = q.limit(args.limit)
    if (args.single) q = (q as any).single()
    const { data, error } = await q
    if (error) throw error
    return data as T
  },

  async insert<T = unknown>(
    args: { table: string; values: unknown; returning?: boolean },
    useServiceRole = false,
  ): Promise<T> {
    let q = client(useServiceRole).from(args.table).insert(args.values as any)
    if (args.returning) q = q.select() as any
    const { data, error } = await q
    if (error) throw error
    return data as T
  },

  async update<T = unknown>(
    args: { table: string; values: Record<string, unknown>; filters: Filter[]; returning?: boolean },
    useServiceRole = false,
  ): Promise<T> {
    let q = client(useServiceRole).from(args.table).update(args.values)
    for (const [col, op, val] of args.filters) q = q.filter(col, op, val as any)
    if (args.returning) q = q.select() as any
    const { data, error } = await q
    if (error) throw error
    return data as T
  },

  async delete<T = unknown>(
    args: { table: string; filters: Filter[] },
    useServiceRole = false,
  ): Promise<T> {
    let q = client(useServiceRole).from(args.table).delete()
    for (const [col, op, val] of args.filters) q = q.filter(col, op, val as any)
    const { data, error } = await q
    if (error) throw error
    return data as T
  },

  async rpc<T = unknown>(fn: string, args?: Record<string, unknown>, useServiceRole = false): Promise<T> {
    const { data, error } = await client(useServiceRole).rpc(fn, args ?? {})
    if (error) throw error
    return data as T
  },

  /** Acesso direto ao cliente Supabase para queries complexas. */
  raw(useServiceRole = false) {
    return client(useServiceRole)
  },
}
