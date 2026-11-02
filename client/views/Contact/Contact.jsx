import { useState } from 'react';
import { Link } from 'react-router';
import TextField from '../../components/TextField/TextField.jsx';
import Select from '../../components/Select/Select.jsx';
import Checkbox from '../../components/Checkbox/Checkbox.jsx';
import Button from '../../components/Button/Button.jsx';
import { isValidEmail } from '../Access/validation.js';
import sendIcon from '../../assets/icon-send.svg';
import mapIcon from '../../assets/icon-map.svg';
import arrowIcon from '../../assets/icon-arrow-right.svg';
import atIcon from '../../assets/icon-at.svg';
import videoIcon from '../../assets/icon-video.svg';
import camIcon from '../../assets/icon-cam.svg';
import chatIcon from '../../assets/icon-chat.svg';
import './Contact.css';

// 16 · Contacto: formulario para escribir al equipo y, al lado, otras formas de contacto,
// preguntas frecuentes y redes sociales. Se llega desde el pie, el menú móvil y Acceso.
// Sin servidor: al enviar no se manda nada; si todo está bien, sale el aviso verde y el formulario se vacía.
// Los errores salen al pulsar «Enviar mensaje» y desaparecen al corregir el campo (como en Acceso).
// Los textos de ayuda de los campos son el ejemplo de Figma: la usuaria que avisa de la tarjeta de Pedri,
// que luego se corrige en Actualizar datos (19).
// Diseño: Figma › Mockups › 16 · Contacto
// https://www.figma.com/design/jxq2ktu8XWk06sm5n6F8CP?node-id=59-1254

const SUBJECTS = [
  { value: 'consulta', label: 'Duda o consulta' },
  { value: 'sugerencia', label: 'Sugerencia' },
  { value: 'datos', label: 'Error en los datos' },
  { value: 'editor', label: 'Quiero ser editor' },
  { value: 'otro', label: 'Otro' },
];

const MAX_MESSAGE = 1000;

const FAQS = [
  {
    question: '¿De dónde salen los datos?',
    answer: 'Las clasificaciones, los partidos, los jugadores y los árbitros salen de football-data.org. Lo que no se puede consultar ahí está marcado como estimado.',
  },
  {
    question: '¿Cada cuánto se actualizan?',
    answer: 'Se actualizan automáticamente cada pocos minutos durante los partidos, y la clasificación al terminar cada uno.',
  },
  {
    question: '¿Cómo creo mi equipo ideal?',
    answer: 'Inicia sesión y entra en Mi equipo ideal: elige una formación y coloca a jugadores de cualquier club.',
    link: { label: 'Ir a Mi equipo ideal', to: '/equipo-ideal' },
  },
  {
    question: '¿Cómo me hago editor?',
    answer: 'Escríbenos con el asunto «Quiero ser editor» y cuéntanos qué te gustaría publicar.',
  },
];

// Las redes son de adorno: FutKingva no tiene cuentas reales
const SOCIALS = [
  { label: 'Perfil social', icon: atIcon },
  { label: 'Vídeos', icon: videoIcon },
  { label: 'Fotos', icon: camIcon },
  { label: 'Chat de la comunidad', icon: chatIcon },
];

const EMPTY_FORM = { name: '', email: '', subject: '', message: '', accepted: false };

export default function Contact() {
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitted, setSubmitted] = useState(false); // Ya ha pulsado «Enviar»: se enseñan los errores
  const [sent, setSent] = useState(false);

  // Errores de cada campo (null = está bien); se calculan siempre y se enseñan tras pulsar «Enviar»
  const errors = {
    name: !form.name.trim() ? 'Escribe tu nombre' : null,
    email: !form.email.trim() ? 'Escribe tu correo electrónico' : !isValidEmail(form.email) ? 'El correo no es válido' : null,
    subject: !form.subject ? 'Elige un asunto' : null,
    message: !form.message.trim() ? 'Escribe tu mensaje' : null,
    accepted: !form.accepted ? 'Tienes que aceptar la política de privacidad' : null,
  };
  const shown = (field) => (submitted ? errors[field] : null);

  function change(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
    setSent(false);
  }

  function handleSubmit(event) {
    event.preventDefault();
    if (Object.values(errors).some(Boolean)) {
      setSubmitted(true);
      return;
    }
    setForm(EMPTY_FORM);
    setSubmitted(false);
    setSent(true);
  }

  return (
    <section className="page contact">
      <header className="page-header">
        <div className="page-header__text">
          <p className="page-header__eyebrow">Contacto</p>
          <h1 className="page-header__title">Escríbenos</h1>
          <p className="page-header__subtitle">
            ¿Tienes dudas, sugerencias o has encontrado un error en los datos? Escríbenos.
          </p>
        </div>
      </header>

      <div className="contact__layout">
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
            options={SUBJECTS}
            value={form.subject}
            onChange={(e) => change('subject', e.target.value)}
            error={shown('subject')}
          />

          <TextField
            className="contact__message"
            label="Mensaje"
            multiline
            maxLength={MAX_MESSAGE}
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

          <div className="contact__actions">
            <Button type="submit" className="contact__submit">
              <img src={sendIcon} alt="" width="16" height="16" />
              Enviar mensaje
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

        <aside className="contact__side">
          <div className="contact__box">
            <h2 className="contact__box-title">Otras formas de contacto</h2>
            <p className="contact__info">
              <span className="contact__mail-icon" aria-hidden="true" />
              contacto@futkingva.es
            </p>
            <p className="contact__info">
              <img src={mapIcon} alt="" width="18" height="18" />
              Universidad CEU San Pablo · Madrid
            </p>
          </div>

          <div className="contact__box contact__box--faq">
            <h2 className="contact__box-title">Preguntas frecuentes</h2>
            {FAQS.map((faq) => (
              <details key={faq.question} className="contact__faq">
                <summary className="contact__faq-question">
                  {faq.question}
                  <img className="contact__faq-arrow" src={arrowIcon} alt="" width="16" height="16" />
                </summary>
                <p className="contact__faq-answer">
                  {faq.answer}
                  {faq.link && (
                    <>
                      {' '}
                      <Link className="contact__faq-link" to={faq.link.to}>{faq.link.label}</Link>
                    </>
                  )}
                </p>
              </details>
            ))}
          </div>

          <div className="contact__box">
            <h2 className="contact__box-title">Redes sociales</h2>
            <ul className="contact__socials">
              {SOCIALS.map((social) => (
                <li key={social.label} className="contact__social" title={social.label}>
                  <img src={social.icon} alt={social.label} width="22" height="22" />
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </section>
  );
}
