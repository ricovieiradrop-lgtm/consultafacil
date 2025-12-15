# 🔒 GUIA DE SEGURANÇA E CONFORMIDADE LGPD

## ⚠️ IMPORTANTE: CONFIGURAÇÃO DO SUPABASE

### 1. Aplicar o Schema SQL

No painel do Supabase:
1. Acesse **SQL Editor**
2. Cole o conteúdo do arquivo `supabase/schema.sql`
3. Execute o script
4. Verifique se todas as tabelas foram criadas com sucesso

### 2. Configurar Autenticação por Telefone

No painel do Supabase:

1. Vá em **Authentication** → **Providers** → **Phone**
2. **Habilite o provider de telefone**
3. Configure o serviço de SMS (Twilio ou MessageBird)
4. **CRÍTICO**: Configure as variáveis:
   - `TWILIO_ACCOUNT_SID`
   - `TWILIO_AUTH_TOKEN`
   - `TWILIO_PHONE_NUMBER`

### 3. Configurar Rate Limiting (Obrigatório)

No painel do Supabase:

1. Vá em **Authentication** → **Rate Limits**
2. Configure:
   - **OTP por hora**: 5 tentativas
   - **Verificação OTP**: 10 tentativas por hora
   - **Login**: 20 tentativas por hora

Isso protege contra ataques de força bruta.

---

## 🛡️ SEGURANÇA IMPLEMENTADA

### Row Level Security (RLS)

Todas as tabelas sensíveis têm RLS ativado:

#### ✅ Tabela `profiles`

**Usuário pode:**
- Ler apenas seu próprio perfil
- Atualizar apenas seu próprio perfil

**Médico pode:**
- Ver dados básicos (SEM CPF) de pacientes que têm consultas com ele

**Admin pode:**
- Ler e atualizar todos os perfis (COM CPF)
- Criar novos profiles (para cadastrar médicos)

**CPF:**
- NUNCA é exposto para outros usuários
- NUNCA é acessível por médicos
- Apenas o próprio usuário e admin têm acesso

#### ✅ Tabela `doctors`

**Todos podem:**
- Ler médicos ativos (informações públicas)

**Médico pode:**
- Atualizar apenas seu próprio perfil

**Admin pode:**
- Gerenciar todos os médicos

#### ✅ Tabela `appointments`

**Paciente pode:**
- Ver apenas suas próprias consultas
- Criar consultas (apenas como patient_id = auth.uid())
- Cancelar apenas suas próprias consultas pendentes

**Médico pode:**
- Ver apenas suas próprias consultas
- Atualizar status das suas consultas

**Admin pode:**
- Gerenciar todas as consultas

### Proteção de Dados Sensíveis

```sql
-- ❌ CPF NUNCA aparece em views públicas
CREATE OR REPLACE VIEW doctor_listings AS
SELECT 
  d.id,
  p.full_name,
  p.phone,
  p.avatar_url,
  -- ⚠️ CPF não está aqui!
  ...
FROM doctors d
JOIN profiles p ON d.id = p.id;
```

### Function Segura para Médicos

```sql
CREATE OR REPLACE FUNCTION get_patient_safe_info(patient_uuid UUID)
RETURNS TABLE (
  id UUID,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT
  -- ⚠️ CPF não está aqui!
)
```

Esta function:
- Verifica se o médico tem consulta com o paciente
- Retorna apenas dados básicos (SEM CPF)
- Usa `SECURITY DEFINER` para bypass RLS controlado

---

## 📋 CONFORMIDADE LGPD

### Dados Coletados

| Dado | Finalidade | Base Legal |
|------|-----------|------------|
| **CPF** | Identificação única do usuário | Execução de contrato |
| **Nome completo** | Identificação e comunicação | Execução de contrato |
| **Telefone** | Autenticação e notificações | Execução de contrato |
| **Localização** | Busca de médicos próximos | Legítimo interesse |

### Direitos do Titular

Implementar endpoints/funcionalidades para:

1. **Acesso**: Usuário pode ver seus dados (já implementado via perfil)
2. **Retificação**: Usuário pode editar seus dados (já implementado)
3. **Eliminação**: Implementar soft delete (ver seção abaixo)
4. **Portabilidade**: Exportar dados em JSON
5. **Oposição**: Permitir opt-out de comunicações

### Implementação Futura: Right to be Forgotten

```sql
-- Adicionar coluna deleted_at
ALTER TABLE profiles ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE;

-- Soft delete function
CREATE OR REPLACE FUNCTION soft_delete_profile(user_uuid UUID)
RETURNS void AS $$
BEGIN
  UPDATE profiles
  SET deleted_at = NOW(),
      cpf = 'DELETED',
      phone = 'DELETED',
      full_name = 'Usuário Deletado'
  WHERE id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Atualizar policies para excluir usuários deletados
CREATE POLICY "Hide deleted profiles"
  ON profiles FOR SELECT
  USING (deleted_at IS NULL);
```

---

## 🚨 PONTOS CRÍTICOS DE SEGURANÇA

### ❌ NUNCA FAÇA ISSO:

1. **Desabilitar RLS em produção**
   ```sql
   ALTER TABLE profiles DISABLE ROW LEVEL SECURITY; -- ❌ NUNCA!
   ```

2. **Expor CPF em queries públicas**
   ```typescript
   // ❌ NUNCA!
   const { data } = await supabase
     .from('profiles')
     .select('cpf, full_name')
   ```

3. **Usar SELECT * com dados sensíveis**
   ```typescript
   // ❌ NUNCA!
   const { data } = await supabase
     .from('profiles')
     .select('*')
   ```

4. **Logar dados sensíveis**
   ```typescript
   console.log('CPF:', profile.cpf); // ❌ NUNCA!
   ```

### ✅ SEMPRE FAÇA ISSO:

1. **Use SELECT específico**
   ```typescript
   const { data } = await supabase
     .from('profiles')
     .select('id, full_name, phone, avatar_url') // ✅ Sem CPF
   ```

2. **Valide auth.uid() nas policies**
   ```sql
   CREATE POLICY "Users own data"
     ON profiles FOR SELECT
     USING (auth.uid() = id); -- ✅
   ```

3. **Use views para queries públicas**
   ```sql
   CREATE VIEW doctor_listings AS
   SELECT ... -- apenas campos públicos
   ```

4. **Implemente rate limiting**
   - Configure no Supabase Dashboard
   - Use Edge Functions com rate limiting

---

## 🔐 CHECKLIST DE SEGURANÇA

Antes de ir para produção:

- [ ] RLS ativado em todas as tabelas sensíveis
- [ ] Policies testadas com diferentes perfis (patient, doctor, admin)
- [ ] Rate limiting configurado no Supabase
- [ ] SMS provider (Twilio) configurado e testado
- [ ] Backups automáticos habilitados
- [ ] SSL/TLS habilitado (Supabase já fornece)
- [ ] Monitoramento de logs ativado
- [ ] 2FA habilitado para conta admin do Supabase
- [ ] Secrets no `.env` e NUNCA commitados
- [ ] Documentação de privacidade e termos criada
- [ ] Consentimento explícito implementado (já feito no onboarding)

---

## 🧪 TESTANDO SEGURANÇA

### Teste 1: RLS para Pacientes

```typescript
// Login como paciente 1
const { data: myProfile } = await supabase
  .from('profiles')
  .select('*')
  .eq('id', 'patient-1-uuid')
  .single();
// ✅ Deve funcionar

const { data: otherProfile } = await supabase
  .from('profiles')
  .select('*')
  .eq('id', 'patient-2-uuid')
  .single();
// ❌ Deve retornar erro ou null
```

### Teste 2: Médico não pode ver CPF

```typescript
// Login como médico
const { data: patient } = await supabase
  .from('profiles')
  .select('cpf')
  .eq('id', 'patient-uuid')
  .single();
// ❌ Deve retornar erro ou null

// Usar function segura
const { data: patientSafe } = await supabase
  .rpc('get_patient_safe_info', { patient_uuid: 'patient-uuid' });
// ✅ Deve retornar dados SEM CPF
```

### Teste 3: Paciente não pode criar consulta para outro paciente

```typescript
// Login como paciente 1
const { error } = await supabase
  .from('appointments')
  .insert({
    patient_id: 'patient-2-uuid', // ❌ Outro paciente
    doctor_id: 'doctor-uuid',
    appointment_date: '2025-01-20',
    appointment_time: '10:00',
    status: 'scheduled',
    price: 150.00
  });
// ❌ Deve retornar erro de RLS
```

---

## 📊 MONITORAMENTO

### Logs Importantes

No Supabase Dashboard → Logs:

1. **Auth logs**: Monitorar tentativas de login
2. **Database logs**: Verificar queries suspeitas
3. **API logs**: Identificar rate limit violations

### Alertas Recomendados

Configure alertas para:
- Múltiplas tentativas de OTP falhadas
- Queries SELECT com CPF (não deveria acontecer)
- Tentativas de UPDATE em profiles de outros usuários
- Rate limit violations

---

## 🚀 PRÓXIMOS PASSOS

1. **Implementar soft delete** (right to be forgotten)
2. **Criar endpoint de exportação de dados** (portabilidade)
3. **Adicionar auditoria de acessos** (logs de quem acessou o CPF)
4. **Implementar criptografia adicional para CPF** (opcional, mas recomendado)
5. **Criar política de retenção de dados** (quanto tempo manter consultas antigas)
6. **Implementar verificação de integridade de dados**
7. **Adicionar 2FA para admin** (além do OTP)

---

## 📞 CONTATO E SUPORTE

Para questões de segurança críticas:
1. Nunca exponha vulnerabilidades publicamente
2. Reporte diretamente ao time responsável
3. Documente o incidente
4. Siga o protocolo de resposta a incidentes

---

**⚠️ LEMBRE-SE**: Este app lida com dados sensíveis de saúde. Segurança não é opcional.

**Última atualização**: 2025-12-15
