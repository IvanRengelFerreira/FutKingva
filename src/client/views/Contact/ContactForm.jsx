import { useState } from 'react';
import TextField from '../../components/TextField/TextField.jsx';
import Select from '../../components/Select/Select.jsx';
import Checkbox from '../../components/Checkbox/Checkbox.jsx';
import Button from '../../components/Button/Button.jsx';
import FieldError from '../../components/FieldError/FieldError.jsx';
import { CONTACT_MESSAGE_MAX, CONTACT_SUBJECTS, validateContact } from '../../../shared/validation/contact.js';
import { useFormSubmit } from '../../services/useFormSubmit.js';
import { sendContactMessage } from '../../services/contact.js';
import sendIcon from '../../assets/icon-send.svg';

// Formulario de 16 · Contacto. Envía el mensaje a la API (POST /api/contact).
// Los errores salen al pulsar «Enviar mensaje» y desaparecen al corregir el campo (como en Acceso).
// Al enviarse bien llama a onSent(); la página vuelve a montar el formulario (key) para que quede vacío.
// `sent` enseña el aviso verde; onChange() avisa de que se ha tocado algo para quitarlo.
// Los textos de ayuda son el ejemplo de Figma: la usuaria que avisa de la tarjeta de Pedri,
// que luego se corrige en Actualizar datos (19).

const EMPTY_FORM = { name: '', email: '', subject: '', message: '', accepted: false };

export default function ContactForm({ sent, onSent, onChange }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const { submitted, sending, serverFields, message, clearServerError, submit } = useFormSubmit();

  const errors = validateContact(form);
  const shown = (field) => (submitted ? errors[field] : null) ?? serverFields[field];

  function change(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
    clearServerError(field);
    onChange();
  }

  function handleSubmit(event) {
    event.preventDefault();
    submit(async () => {
      await sendContactMessage(form);
      onSent();
    }, errors);
  }

  return (
    <form className="contact__form" onSubmit={handleSubmit} noValidate>
      <div className="contact__row">
        <TextField
          label="Nombre"
          placeholder="Carlota"
          autoComplete="name"
          value={form.name}
          onChange={(e) => change('name', e.target.value)}
          error={shown('name')}
        />
        <TextField
          label="Correo electrónico"
          type="email"
          placeholder="carlota.r@ejemplo.com"
          autoComplete="email"
          value={form.email}
          onChange={(e) => change('email', e.target.value)}
          error={shown('email')}
        />
      </div>

      <Select
        label="Asunto"
        placeholder="Elige un asunto"
        options={CONTACT_SUBJECTS}
        value={form.subject}
        onChange={(e) => change('subject', e.target.value)}
        error={shown('subject')}
      />

      <TextField
        className="contact__message"
        label="Mensaje"
        multiline
        maxLength={CONTACT_MESSAGE_MAX}
        placeholder="En la ficha de Pedri aparecen 2 tarjetas, pero en el último partido vio otra amarilla. ¿Podéis revisarlo?"
        value={form.message}
        onChange={(e) => change('message', e.target.value)}
        error={shown('message')}
      />

      <Checkbox
        checked={form.accepted}
        onChange={(e) => change('accepted', e.target.checked)}
        error={shown('accepted')}
      >
        Acepto la política de privacidad
      </Checkbox>

      <FieldError>{message}</FieldError>
      <div className="contact__actions">
        <Button type="submit" className="contact__submit" disabled={sending}>
          <img src={sendIcon} alt="" width="16" height="16" />
          {sending ? 'Enviando…' : 'Enviar mensaje'}
        </Button>
        <p className="contact__sent" role="status">
          {sent && (
            <>
              <span className="contact__sent-icon" aria-hidden="true" />
              Mensaje enviado. Te responderemos en 48 h.
            </>
          )}
        </p>
      </div>
    </form>
  );
}
