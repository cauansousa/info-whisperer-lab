import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

type Op =
  | { kind: 'select'; table: string; columns?: string; filters?: Array<[string, string, unknown]>; order?: { column: string; ascending?: boolean }; limit?: number; single?: boolean }
  | { kind: 'insert'; table: string; values: unknown; returning?: boolean }
  | { kind: 'update'; table: string; values: Record<string, unknown>; filters: Array<[string, string, unknown]>; returning?: boolean }
  | { kind: 'delete'; table: string; filters: Array<[string, string, unknown]> }
  | { kind: 'rpc'; fn: string; args?: Record<string, unknown> }

const EXTERNAL_URL = Deno.env.get('EXTERNAL_SUPABASE_URL')
const EXTERNAL_ANON = Deno.env.get('EXTERNAL_SUPABASE_ANON_KEY')
const EXTERNAL_SERVICE = Deno.env.get('EXTERNAL_SUPABASE_SERVICE_ROLE_KEY')

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  if (!EXTERNAL_URL || !EXTERNAL_ANON) {
    return json({ error: 'External Supabase secrets not configured' }, 500)
  }

  let body: { op: Op; useServiceRole?: boolean }
  try {
    body = await req.json()
  } catch {
    return json({ error: 'Invalid JSON' }, 400)
  }

  const key = body.useServiceRole && EXTERNAL_SERVICE ? EXTERNAL_SERVICE : EXTERNAL_ANON
  const client = createClient(EXTERNAL_URL, key)

  const { op } = body
  try {
    let q: any
    switch (op.kind) {
      case 'select':
        q = client.from(op.table).select(op.columns ?? '*')
        for (const [col, opr, val] of op.filters ?? []) q = q.filter(col, opr, val as any)
        if (op.order) q = q.order(op.order.column, { ascending: op.order.ascending ?? true })
        if (op.limit) q = q.limit(op.limit)
        if (op.single) q = q.single()
        break
      case 'insert':
        q = client.from(op.table).insert(op.values as any)
        if (op.returning) q = q.select()
        break
      case 'update':
        q = client.from(op.table).update(op.values)
        for (const [col, opr, val] of op.filters) q = q.filter(col, opr, val as any)
        if (op.returning) q = q.select()
        break
      case 'delete':
        q = client.from(op.table).delete()
        for (const [col, opr, val] of op.filters) q = q.filter(col, opr, val as any)
        break
      case 'rpc':
        q = client.rpc(op.fn, op.args ?? {})
        break
      default:
        return json({ error: 'Unknown op.kind' }, 400)
    }

    const { data, error } = await q
    if (error) return json({ error: error.message, details: error }, 400)
    return json({ data }, 200)
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : 'Unknown error' }, 500)
  }
})

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}
