/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body, Container, Head, Heading, Html, Preview, Section, Text,
} from 'npm:@react-email/components@0.0.22'

interface ReauthenticationEmailProps {
  siteName?: string
  token: string
}

export const ReauthenticationEmail = ({ siteName = 'KnowledgeAI', token }: ReauthenticationEmailProps) => (
  <Html lang="pt-BR" dir="ltr">
    <Head />
    <Preview>Seu código de verificação</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={brandSection}><Text style={brand}>{siteName}</Text></Section>
        <Heading style={h1}>Confirmar sua identidade</Heading>
        <Text style={text}>Use o código abaixo para confirmar sua identidade:</Text>
        <Section style={btnWrap}>
          <Text style={codeStyle}>{token}</Text>
        </Section>
        <Text style={smallText}>
          Este código expira em alguns minutos. Se você não solicitou esta ação,
          pode ignorar este e-mail com segurança.
        </Text>
        <Text style={footer}>© {new Date().getFullYear()} {siteName}. Todos os direitos reservados.</Text>
      </Container>
    </Body>
  </Html>
)

export default ReauthenticationEmail

const main = { backgroundColor: '#ffffff', fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif' }
const container = { padding: '32px 28px', maxWidth: '560px' }
const brandSection = { borderBottom: '1px solid #e5e5e5', paddingBottom: '16px', marginBottom: '32px' }
const brand = { fontSize: '16px', fontWeight: 600, color: '#0a0a0a', margin: 0, letterSpacing: '-0.01em' }
const h1 = { fontSize: '24px', fontWeight: 600, color: '#0a0a0a', margin: '0 0 16px', letterSpacing: '-0.02em' }
const text = { fontSize: '15px', color: '#404040', lineHeight: '1.6', margin: '0 0 20px' }
const smallText = { fontSize: '13px', color: '#737373', lineHeight: '1.6', margin: '24px 0 0' }
const btnWrap = { textAlign: 'center' as const, margin: '32px 0' }
const codeStyle = { fontFamily: 'ui-monospace, "SF Mono", Menlo, Monaco, Consolas, monospace', fontSize: '32px', fontWeight: 600, color: '#0a0a0a', letterSpacing: '0.2em', margin: 0, padding: '16px 24px', backgroundColor: '#f5f5f5', borderRadius: '8px', display: 'inline-block' }
const footer = { fontSize: '12px', color: '#a3a3a3', margin: '40px 0 0', borderTop: '1px solid #e5e5e5', paddingTop: '20px' }
