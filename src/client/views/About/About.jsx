import { Link } from 'react-router';
import Avatar from '../../components/Avatar/Avatar.jsx';
import logo from '../../assets/logo-access.svg';
import chartIcon from '../../assets/icon-chart.svg';
import compareIcon from '../../assets/icon-compare-info.svg';
import pitchIcon from '../../assets/icon-pitch-win.svg';
import bellIcon from '../../assets/icon-bell-live.svg';
import dbIcon from '../../assets/icon-db.svg';
import './About.css';

// 15 · Sobre nosotros: qué es FutKingva, qué ofrece, quién lo hace y de dónde salen los datos.
// Se llega desde el pie y el menú móvil. Textos y cifras de Figma (son de presentación, no están en mockData.js).
// Las tarjetas de «Qué ofrecemos» llevan a su página (menos «Avisos en directo», que no tiene página propia).
// Diseño: Figma › Mockups › 15 · Sobre nosotros
// https://www.figma.com/design/jxq2ktu8XWk06sm5n6F8CP?node-id=59-994

const FIGURES = [
  { value: '5', label: 'Ligas' },
  { value: '96', label: 'Equipos' },
  { value: '2.400+', label: 'Jugadores' },
];

// tone: color del cuadrado del icono (oro, azul, verde y rojo, como en Figma)
const FEATURES = [
  {
    title: 'Estadísticas al día',
    text: 'Equipos, jugadores, clasificaciones y árbitros de las cinco grandes ligas, actualizados de forma automática. En esta primera versión, con los datos de LaLiga.',
    icon: chartIcon,
    tone: 'gold',
    to: '/clasificaciones',
  },
  {
    title: 'Comparador de jugadores',
    text: 'Pon a dos o más jugadores frente a frente y guarda tus comparativas.',
    icon: compareIcon,
    tone: 'info',
    to: '/comparador',
  },
  {
    title: 'Tu equipo ideal',
    text: 'Monta tu once con jugadores de cualquier club según sus números reales.',
    icon: pitchIcon,
    tone: 'win',
    to: '/equipo-ideal',
  },
  {
    title: 'Avisos en directo',
    text: 'Goles y cambios de clasificación de los equipos que sigues, al momento.',
    icon: bellIcon,
    tone: 'live',
  },
];

const TEAM = [
  { name: 'Ivan Rafael Rengel Ferreira', initials: 'IR' },
  { name: 'Angel Martin Trejo', initials: 'AM' },
  { name: 'Carlota Ruiz Campesino', initials: 'CR' },
];

export default function About() {
  return (
    <section className="page about">
      <div className="about__intro">
        <div className="about__intro-text">
          <p className="page-header__eyebrow">Sobre nosotros</p>
          <h1 className="about__title">Sobre FutKingva</h1>
          <p className="about__lead">
            Los datos de fútbol están dispersos entre apps de noticias, notificaciones y redes sociales, y casi nunca
            se pueden explorar. FutKingva reúne en un solo sitio los datos reales de las principales ligas europeas
            para que cada aficionado los consulte, los compare y los guarde a su manera.
          </p>
          <dl className="about__figures">
            {FIGURES.map((figure) => (
              <div key={figure.label} className="about__figure">
                <dt className="about__figure-label">{figure.label}</dt>
                <dd className="about__figure-value">{figure.value}</dd>
              </div>
            ))}
          </dl>
        </div>

        {/* Ilustración de marca: medio campo dibujado con el logo en el centro */}
        <div className="about__brand" aria-hidden="true">
          <svg className="about__pitch" viewBox="0 0 620 360" preserveAspectRatio="none">
            <rect x="24" y="24" width="572" height="312" />
            <path d="M310 24V336" />
            <circle cx="310" cy="180" r="72" />
            <rect x="24" y="108" width="74.4" height="144" />
            <rect x="521.6" y="108" width="74.4" height="144" />
          </svg>
          <img className="about__logo" src={logo} alt="" />
          <span className="about__brand-text">Football stats</span>
        </div>
      </div>

      <div className="about__section">
        <h2 className="about__section-title">Qué ofrecemos</h2>
        <ul className="about__features">
          {FEATURES.map((feature) => {
            const content = (
              <>
                <span className={`about__feature-icon about__feature-icon--${feature.tone}`}>
                  <img src={feature.icon} alt="" width="26" height="26" />
                </span>
                <span className="about__feature-text">
                  <span className="about__feature-title">{feature.title}</span>
                  <span className="about__feature-description">{feature.text}</span>
                </span>
              </>
            );
            return (
              <li key={feature.title}>
                {feature.to ? (
                  <Link className="about__feature about__feature--link" to={feature.to}>{content}</Link>
                ) : (
                  <div className="about__feature">{content}</div>
                )}
              </li>
            );
          })}
        </ul>
      </div>

      <div className="about__section">
        <h2 className="about__section-title">El equipo</h2>
        <ul className="about__team">
          {TEAM.map((member) => (
            <li key={member.name} className="about__member">
              <Avatar className="about__avatar" name={member.name} initials={member.initials} size={96} />
              <div className="about__member-text">
                <p className="about__member-name">{member.name}</p>
                <p className="about__member-role">Ing. de Sistemas de Información · 4.º</p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="about__source">
        <span className="about__source-icon">
          <img src={dbIcon} alt="" width="22" height="22" />
        </span>
        <div>
          <p className="about__source-title">Fuente de los datos</p>
          <p className="about__source-text">
            Los datos proceden de football-data.org y se actualizan automáticamente cada pocos minutos durante los partidos.
          </p>
        </div>
      </div>
    </section>
  );
}
