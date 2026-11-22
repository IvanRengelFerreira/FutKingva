import { useState } from 'react';
import StandingsTable from '../../components/StandingsTable/StandingsTable.jsx';
import Select from '../../components/Select/Select.jsx';
import LoadingState from '../../components/LoadingState/LoadingState.jsx';
import ErrorState from '../../components/ErrorState/ErrorState.jsx';
import { useApi } from '../../services/useApi.js';
import { getStandings } from '../../services/standings.js';
import { timeAgo } from '../../services/format.js';
import clockIcon from '../../assets/icon-clock.svg';
import './Standings.css';

// 05 · Clasificaciones (RF6): tabla de LaLiga con zonas de color, forma y leyenda.
// Los chips cambian de liga; solo hay datos de LaLiga, así que las demás enseñan un aviso de «Próximamente».
// Datos de la API (GET /api/standings): la temporada se elige en el desplegable (todas las de la BD).
// «Total» se queda fijo: no se separan los partidos de casa y fuera.
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
  // undefined = la temporada actual (la elige el servidor)
  const [season, setSeason] = useState();
  const { data, error, loading, reload } = useApi((signal) => getStandings(season, { signal }), [season]);
  const info = data?.season;
  const matchday = info?.matchday;

  return (
    <section className="page standings">
      <header className="page-header">
        <div className="page-header__text">
          <p className="page-header__eyebrow">
            {info ? (
              <>
                <span className="standings__desktop">
                  Temporada {info.label}
                  {matchday ? ` · Jornada ${matchday}` : ''}
                </span>
                <span className="standings__mobile">
                  {info.label}
                  {matchday ? ` · Jornada ${matchday}` : ''}
                  {info.isCurrent ? ' en juego' : ''}
                </span>
              </>
            ) : (
              'LaLiga'
            )}
          </p>
          <h1 className="page-header__title">Clasificaciones</h1>
          <p className="page-header__subtitle standings__desktop">
            Tablas actualizadas automáticamente tras cada jornada.
          </p>
        </div>
        {info?.isCurrent && matchday && (
          <p className="standings__live">
            <span className="standings__live-dot" aria-hidden="true" />
            Jornada {matchday} en juego · se actualiza en directo
          </p>
        )}
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
            options={
              data
                ? data.seasons.map((item) => ({ value: item.year, label: `Temporada ${item.label}` }))
                : [{ value: '', label: 'Temporada' }]
            }
            value={info?.year ?? ''}
            onChange={(e) => setSeason(Number(e.target.value))}
            disabled={!data}
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
        <LaLigaTable data={data} error={error} loading={loading} reload={reload} />
      ) : (
        <div className="standings__empty">
          <p className="standings__empty-title">Próximamente</p>
          <p className="standings__empty-text">
            Todavía no tenemos la clasificación de la {current.label}: en esta primera versión, FutKingva solo tiene los
            datos de LaLiga.
          </p>
          <button type="button" className="standings__empty-link" onClick={() => setLeague('laliga')}>
            Ver la clasificación de LaLiga →
          </button>
        </div>
      )}
    </section>
  );
}

// Tabla de LaLiga: cargando, error, sin datos o la clasificación de la temporada elegida
function LaLigaTable({ data, error, loading, reload }) {
  if (loading) return <LoadingState label="Cargando clasificación…" />;
  if (error) return <ErrorState error={error} title="No se ha podido cargar la clasificación" onRetry={reload} />;
  if (!data.table.length) {
    return (
      <div className="standings__empty">
        <p className="standings__empty-title">Sin clasificación</p>
        <p className="standings__empty-text">
          Todavía no tenemos la clasificación de la temporada {data.season.label}.
        </p>
      </div>
    );
  }

  return (
    <StandingsTable
      standings={data.table}
      caption={`Clasificación de LaLiga ${data.season.label}`}
      legendExtra={
        data.updatedAt && (
          <p className="standings__updated">
            <img src={clockIcon} alt="" width="14" height="14" />
            Actualizada automáticamente · {timeAgo(data.updatedAt)}
          </p>
        )
      }
    />
  );
}
