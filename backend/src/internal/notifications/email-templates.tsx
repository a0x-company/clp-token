import { Html, Head, Body, Container, Text, Link } from '@react-email/components';
import * as React from 'react';

export const NewDepositEmail = ({ amount, userName, depositId }) => (
  <Html>
    <Head />
    <Body>
      <Container>
        <Text>Hola administrador,</Text>
        <Text>Se ha registrado un nuevo depósito con los siguientes detalles:</Text>
        <Text>Monto: {amount}</Text>
        <Text>Usuario: {userName}</Text>
        <Text>ID del depósito: {depositId}</Text>
      </Container>
    </Body>
  </Html>
);

export const DepositApprovedEmail = ({ amount, depositId }) => (
  <Html>
    <Head />
    <Body>
      <Container>
        <Text>Hola,</Text>
        <Text>Tu depósito ha sido aprobado con los siguientes detalles:</Text>
        <Text>Monto: {amount}</Text>
        <Text>ID del depósito: {depositId}</Text>
      </Container>
    </Body>
  </Html>
);

export const DepositRejectedEmail = ({ amount, depositId, reason }) => (
  <Html>
    <Head />
    <Body>
      <Container>
        <Text>Hola,</Text>
        <Text>Lamentamos informarte que tu depósito ha sido rechazado:</Text>
        <Text>Monto: {amount}</Text>
        <Text>ID del depósito: {depositId}</Text>
        <Text>Razón: {reason}</Text>
        <Text>Si tienes alguna pregunta, por favor contáctanos.</Text>
      </Container>
    </Body>
  </Html>
);