import { Hono } from 'hono'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export const appointmentsRouter = new Hono()

appointmentsRouter.post('/', async (c) => {
  try {
    const body = await c.req.json()
    const { doctor_id, start_time } = body

    if (!doctor_id || !start_time) {
      return c.json({ error: 'Dados incompletos' }, 400)
    }

    // Auth header
    const authHeader = c.req.header('authorization')
    if (!authHeader) {
      return c.json({ error: 'Não autenticado' }, 401)
    }

    const token = authHeader.replace('Bearer ', '')

    const { data: userData, error: authError } =
      await supabase.auth.getUser(token)

    if (authError || !userData.user) {
      return c.json({ error: 'Usuário inválido' }, 401)
    }

    const patient_id = userData.user.id

    const { data, error } = await supabase
      .from('appointments')
      .insert({
        doctor_id,
        patient_id,
        start_time,
        status: 'scheduled',
      })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        return c.json({ error: 'Horário já ocupado' }, 409)
      }
      return c.json({ error: error.message }, 500)
    }

    return c.json(data, 201)
  } catch (err) {
    console.error(err)
    return c.json({ error: 'Erro interno' }, 500)
  }
})
