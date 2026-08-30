/**
 * @file Move o foco para o primeiro campo com erro dentro de um formulário.
 */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateRequired(value, label = 'Este campo') {
  if (!String(value ?? '').trim()) {
    return `${label} é obrigatório.`;
  }

  return null;
}

export function validateEmail(value) {
  const normalized = String(value ?? '').trim();

  if (!normalized) {
    return 'Informe seu e-mail.';
  }

  if (!EMAIL_REGEX.test(normalized)) {
    return 'Informe um endereço de e-mail válido.';
  }

  return null;
}

export function validateMinLength(value, min, label = 'Este campo') {
  const text = String(value ?? '');

  if (!text) {
    return `${label} é obrigatório.`;
  }

  if (text.length < min) {
    return `${label} deve ter pelo menos ${min} caracteres (atual: ${text.length}).`;
  }

  return null;
}

export function validateExactDigits(value, length, label = 'O código') {
  const normalized = String(value ?? '').trim();

  if (!normalized) {
    return `Informe ${label.toLowerCase()}.`;
  }

  if (!/^\d+$/.test(normalized)) {
    return `${label} deve conter apenas números.`;
  }

  if (normalized.length !== length) {
    return `${label} deve ter exatamente ${length} dígitos.`;
  }

  return null;
}

export function validatePasswordMatch(password, confirmation) {
  if (!String(confirmation ?? '')) {
    return 'Confirme a nova senha.';
  }

  if (password !== confirmation) {
    return 'As senhas não coincidem.';
  }

  return null;
}

/**
 * Move o foco para o primeiro campo com erro dentro de um formulário.
 */
export function focusFirstInvalidField(formElement, fieldNames) {
  if (!formElement) {
    return;
  }

  for (const name of fieldNames) {
    const field = formElement.elements?.namedItem?.(name);

    if (field && typeof field.focus === 'function') {
      field.focus();

      return;
    }
  }
}
