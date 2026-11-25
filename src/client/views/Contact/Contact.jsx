import { useState } from 'react';
import { Link } from 'react-router';
import ContactForm from './ContactForm.jsx';
import mapIcon from '../../assets/icon-map.svg';
import arrowIcon from '../../assets/icon-arrow-right.svg';
import atIcon from '../../assets/icon-at.svg';
import videoIcon from '../../assets/icon-video.svg';
import camIcon from '../../assets/icon-cam.svg';
import chatIcon from '../../assets/icon-chat.svg';
import './Contact.css';

// 16 · Contacto: formulario para escribir al equipo y, al lado, otras formas de contacto,
// preguntas frecuentes y redes sociales. Se llega desde el pie, el menú móvil y Acceso.
// El formulario (ContactForm) guarda el mensaje en la base de datos con POST /api/contact.
// Diseño: Figma › Mockups › 16 · Contacto
// https://www.figma.com/design/jxq2ktu8XWk06sm5n6F8CP?node-id=59-1254

const FAQS = [
  {
    question: '¿De dónde salen los datos?',
    answer:
      'Las clasificaciones, los partidos, los jugadores y los árbitros salen de football-data.org. Lo que no se puede consultar ahí está marcado como estimado.',
  },
  {
    question: '¿Cada cuánto se actualizan?',
    answer:
      'Se actualizan automáticamente cada pocos minutos durante los partidos, y la clasificación al terminar cada uno.',
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

export default function Contact() {
  const [sent, setSent] = useState(false);
  // Cambia tras cada envío correcto: React vuelve a montar el formulario y queda vacío y sin errores
  const [formKey, setFormKey] = useState(0);

  function handleSent() {
    setSent(true);
    setFormKey((key) => key + 1);
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
        <ContactForm key={formKey} sent={sent} onSent={handleSent} onChange={() => setSent(false)} />

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
                      <Link className="contact__faq-link" to={faq.link.to}>
                        {faq.link.label}
                      </Link>
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
