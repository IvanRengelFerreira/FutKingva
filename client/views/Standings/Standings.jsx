import { useState } from 'react';
import StandingsTable from '../../components/StandingsTable/StandingsTable.jsx';
import Select from '../../components/Select/Select.jsx';
import { SEASON, TODAY } from '../../data/mockData.js';
import clockIcon from '../../assets/icon-clock.svg';
import './Standings.css';

// 05 · Clasificaciones (RF6): tabla de LaLiga con zonas de color, forma y leyenda.
// Los chips cambian de liga; solo hay datos de LaLiga, así que las demás enseñan un aviso de «Próximamente».
// Temporada y «Total» se quedan fijos: solo hay datos de la 2026/27 y no se separan los partidos de casa y fuera.
// Diseño: Figma › Mockups › 05 · Clasificaciones
// https://www.figma.com/design/jxq2ktu8XWk06sm5n6F8CP?node-id=48-288

// label: texto del chip en escritorio · short: en móvil
const LEAGUES = [
  { id: 'laliga', label: 'LaLiga', short: 'LaLiga' },
  { id: 'premier', label: 'Premier League', short: 'Premier' },
  { id: 'serie-a', label: 'Serie A', short: 'Serie A' },
  { id: 'bundesliga', label: 'Bundesliga', short: 'Bundesliga' },
  { id: 'ligue-1', label: 'Ligue 1', short: 'Ligue 1' },
];

export default function Standings() {
  const [league, setLeague] = useState('laliga');
  const current = LEAGUES.find((item) => item.id === league);

  return (
    <section className="page standings">
      <header className="page-header">
        <div className="page-header__text">
          <p className="page-header__eyebrow">
            <span className="standings__desktop">Temporada {SEASON} · Jornada {TODAY.round}</span>
            <span className="standings__mobile">{SEASON} · Jornada {TODAY.round} en juego</span>
          </p>
          <h1 className="page-header__title">Clasificaciones</h1>
          <p className="page-header__subtitle standings__desktop">Tablas actualizadas automáticamente tras cada jornada.</p>
        </div>
        <p className="standings__live">
          <span className="standings__live-dot" aria-hidden="true" />
          Jornada {TODAY.round} en juego · se actualiza en directo
        </p>
      </header>

      <div className="standings__toolbar">
        <div className="standings__chips" role="group" aria-label="Elegir liga">
          {LEAGUES.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`standings__chip${item.id === league ? ' standings__chip--active' : ''}`}
              aria-pressed={item.id === league}
              onClick={() => setLeague(item.id)}
            >
              <span className="standings__desktop">{item.label}</span>
              <span className="standings__mobile">{item.short}</span>
            </button>
          ))}
        </div>

        <div className="standings__filters">
          <Select
            className="standings__filter standings__filter--season"
            size="sm"
            label="Temporada"
            hideLabel
            options={[{ value: SEASON, label: `Temporada ${SEASON}` }]}
          />
          <Select
            className="standings__filter standings__filter--venue"
            size="sm"
            label="Partidos"
            hideLabel
            options={[{ value: 'total', label: 'Total' }]}
          />
        </div>
      </div>

      {league === 'laliga' ? (
        <StandingsTable
          legendExtra={
            <p className="standings__updated">
              <img src={clockIcon} alt="" width="14" height="14" />
              Actualizada automáticamente · hace 5 min
            </p>
          }
        />
      ) : (
        <div className="standings__empty">
          <p className="standings__empty-title">Próximamente</p>
          <p className="standings__empty-text">
            Todavía no tenemos la clasificación de la {current.label}. De momento, FutKingva solo sigue LaLiga.
          </p>
          <button type="button" className="standings__empty-link" onClick={() => setLeague('laliga')}>
            Ver la clasificación de LaLiga →
          </button>
        </div>
      )}
    </section>
  );
}
