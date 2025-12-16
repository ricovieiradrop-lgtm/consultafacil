import { Router } from 'express'
import { createClient } from '@supabase/supabase-js'

const router = Router()

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * POST /appointments
 * Cria um agendamento de consulta
 */
router.post('/', async (req, res) => {
  try {
    const { doctor_id, start_time } = req.body

    // 1. Validação básica
    if (!doctor_id || !start_time) {
      return res.status(400).json({ error: 'Dados incompletos' })
    }

    // 2. Identificar usuário autenticado
    const authHeader = req.headers.authorization
    if (!authHeader) {
      return res.status(401).json({ error: 'Não autenticado' })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: userData, error: authError } =
      await supabase.auth.getUser(token)

    if (authError || !userData.user) {
      return res.status(401).json({ error: 'Usuário inválido' })
    }

    const patient_id = userData.user.id

    // 3. Criar consulta (o banco garante não duplicar)
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
      // Conflito de horário
      if (error.code === '23505') {
        return res
          .status(409)
          .json({ error: 'Horário já ocupado' })
      }

      return res.status(500).json({ error: error.message })
    }

    return res.status(201).json(data)
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Erro interno' })
  }
})

export default router
