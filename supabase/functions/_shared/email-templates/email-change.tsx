/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body, Button, Container, Head, Heading, Html, Preview, Section, Text,
} from 'npm:@react-email/components@0.0.22'

interface EmailChangeEmailProps {
  siteName: string
  email: string
  newEmail: string
  confirmationUrl: string
}

export const EmailChangeEmail = ({ siteName, email, newEmail, confirmationUrl }: EmailChangeEmailProps) => (
  <Html lang="pt-BR" dir="ltr">
    <Head />
    <Preview>Confirme a alteração do seu e-mail no {siteName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={brandSection}><Text style={brand}>{siteName}</Text></Section>
        <Heading style={h1}>Confirmar alteração de e-mail</Heading>
        <Text style={text}>
          Você solicitou alterar o e-mail da sua conta no <strong>{siteName}</strong>{' '}
          de <strong>{email}</strong> para <strong>{newEmail}</strong>.
        </Text>
        <Text style={text}>Clique no botão abaixo para confirmar essa alteração:</Text>
        <Section style={btnWrap}>
          <Button style={button} href={confirmationUrl}>Confirmar alteração</Button>
        </Section>
        <Text style={smallText}>
          Se você não solicitou esta alteração, proteja sua conta imediatamente alterando sua senha.
        </Text>
        <Text style={footer}>© {new Date().getFullYear()} {siteName}. Todos os direitos reservados.</Text>
      </Container>
    </Body>
  </Html>
)

export default EmailChangeEmail

const main = { backgroundColor: '#ffffff', fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif' }
const container = { padding: '32px 28px', maxWidth: '560px' }
const brandSection = { borderBottom: '1px solid #e5e5e5', paddingBottom: '16px', marginBottom: '32px' }
const brand = { fontSize: '16px', fontWeight: 600, color: '#0a0a0a', margin: 0, letterSpacing: '-0.01em' }
const h1 = { fontSize: '24px', fontWeight: 600, color: '#0a0a0a', margin: '0 0 16px', letterSpacing: '-0.02em' }
const text = { fontSize: '15px', color: '#404040', lineHeight: '1.6', margin: '0 0 20px' }
const smallText = { fontSize: '13px', color: '#737373', lineHeight: '1.6', margin: '24px 0 0' }
const btnWrap = { textAlign: 'center' as const, margin: '32px 0' }
const button = { backgroundColor: '#0a0a0a', color: '#ffffff', fontSize: '14px', fontWeight: 500, borderRadius: '8px', padding: '12px 24px', textDecoration: 'none', display: 'inline-block' }
const footer = { fontSize: '12px', color: '#a3a3a3', margin: '40px 0 0', borderTop: '1px solid #e5e5e5', paddingTop: '20px' }
