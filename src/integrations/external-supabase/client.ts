import { supabase } from '@/integrations/supabase/client'

type Filter = [column: string, operator: string, value: unknown]

type SelectOp = {
  kind: 'select'
  table: string
  columns?: string
  filters?: Filter[]
  order?: { column: string; ascending?: boolean }
  limit?: number
  single?: boolean
}
type InsertOp = { kind: 'insert'; table: string; values: unknown; returning?: boolean }
type UpdateOp = { kind: 'update'; table: string; values: Record<string, unknown>; filters: Filter[]; returning?: boolean }
type DeleteOp = { kind: 'delete'; table: string; filters: Filter[] }
type RpcOp = { kind: 'rpc'; fn: string; args?: Record<string, unknown> }
type Op = SelectOp | InsertOp | UpdateOp | DeleteOp | RpcOp

async function call<T = unknown>(op: Op, useServiceRole = false): Promise<T> {
  const { data, error } = await supabase.functions.invoke('external-supabase-proxy', {
    body: { op, useServiceRole },
  })
  if (error) throw error
  if (data?.error) throw new Error(data.error)
  return data?.data as T
}

/**
 * Cliente para o Supabase EXTERNO do usuário (via edge function proxy).
 * Use para ler/gravar tabelas, chamar RPCs, etc., no Supabase próprio.
 */
export const externalSupabase = {
  select: <T = unknown>(args: Omit<SelectOp, 'kind'>, useServiceRole?: boolean) =>
    call<T>({ kind: 'select', ...args }, useServiceRole),
  insert: <T = unknown>(args: Omit<InsertOp, 'kind'>, useServiceRole?: boolean) =>
    call<T>({ kind: 'insert', ...args }, useServiceRole),
  update: <T = unknown>(args: Omit<UpdateOp, 'kind'>, useServiceRole?: boolean) =>
    call<T>({ kind: 'update', ...args }, useServiceRole),
  delete: <T = unknown>(args: Omit<DeleteOp, 'kind'>, useServiceRole?: boolean) =>
    call<T>({ kind: 'delete', ...args }, useServiceRole),
  rpc: <T = unknown>(fn: string, args?: Record<string, unknown>, useServiceRole?: boolean) =>
    call<T>({ kind: 'rpc', fn, args }, useServiceRole),
}
