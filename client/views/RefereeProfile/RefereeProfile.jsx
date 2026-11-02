import { Link, useParams } from 'react-router';
import Breadcrumbs from '../../components/Breadcrumbs/Breadcrumbs.jsx';
import Avatar from '../../components/Avatar/Avatar.jsx';
import StatCard from '../../components/StatCard/StatCard.jsx';
import Select from '../../components/Select/Select.jsx';
import BarChart from '../../components/BarChart/BarChart.jsx';
import Crest from '../../components/Crest/Crest.jsx';
import CardCount from '../Referees/CardCount.jsx';
import { formatDecimal } from '../Referees/format.js';
import { getReferee, getTeam, LEAGUE_CARDS_PER_MATCH, SEASON } from '../../data/mockData.js';
import './RefereeProfile.css';

// 07 · Ficha de árbitro: cabecera con sus tarjetas por partido frente a la media de LaLiga, indicadores,
// gráfico de tarjetas por jornada (BarChart de Ivan: amarillas + rojas apiladas) y últimos partidos dirigidos.
// El árbitro sale de la dirección: /arbitros/gil-manzano → getReferee('gil-manzano').
// Solo Gil Manzano tiene los partidos uno a uno (cardsByMatch); en los demás, el gráfico y la tabla
// enseñan un aviso en vez de inventar partidos.
// Diseño: Figma › Mockups › 07 · Ficha de árbitro
// https://www.figma.com/design/jxq2ktu8XWk06sm5n6F8CP?node-id=51-743

const CURRENT_YEAR = 2026;

export default function RefereeProfile() {
  const { refereeId } = useParams();
  const referee = getReferee(refereeId);

  if (!referee) {
    return (
      <section className="placeholder">
        <h1>Árbitro no encontrado</h1>
        <p>
          No tenemos ningún árbitro con esa dirección. <Link to="/arbitros">Ver todos los árbitros</Link>
        </p>
      </section>
    );
  }

  const difference = Math.round((referee.cardsPerMatch / LEAGUE_CARDS_PER_MATCH - 1) * 100);
  const comparison = difference === 0
    ? `En la media de LaLiga (${formatDecimal(LEAGUE_CARDS_PER_MATCH)})`
    : `${difference > 0 ? '+' : '−'}${Math.abs(difference)} % ${difference > 0 ? 'sobre' : 'bajo'} la media de LaLiga (${formatDecimal(LEAGUE_CARDS_PER_MATCH)})`;
  const seasons = referee.since ? CURRENT_YEAR - referee.since : null;
  const meta = [
    'España',
    referee.age && `${referee.age} años`,
    referee.committeeAdjective && `Comité ${referee.committeeAdjective}`,
  ].filter(Boolean);
  const matches = referee.cardsByMatch ?? [];
  // El gráfico va de la jornada más antigua a la más reciente; la tabla, al revés
  const chartData = [...matches]
    .sort((a, b) => a.round - b.round)
    .map((match) => ({
      label: `J${match.round}`,
      segments: [{ value: match.yellow, tone: 'yellow-card' }, { value: match.red, tone: 'red-card' }],
    }));

  return (
    <section className="page referee-profile">
      <Breadcrumbs
        items={[
          { label: 'Árbitros', to: '/arbitros' },
          { label: 'LaLiga', to: '/arbitros', hideOnMobile: true },
          { label: referee.name, shortLabel: referee.shortName },
        ]}
      />

      <header className="referee-hero">
        <Avatar name={referee.name} size={132} className="referee-hero__avatar referee-profile__desktop-flex" />
        <Avatar name={referee.name} size={96} className="referee-hero__avatar referee-profile__mobile-flex" />
        <div className="referee-hero__text">
          <p className="referee-hero__eyebrow">Árbitro{referee.fifa ? ' FIFA' : ''} · LaLiga</p>
          <h1 className="referee-hero__name">
            <span className="referee-profile__desktop">{referee.name}</span>
            <span className="referee-profile__mobile">{referee.shortName ?? referee.name}</span>
          </h1>
          <p className="referee-hero__meta">
            {meta.join('  ·  ')}
            {referee.since && <span className="referee-profile__desktop">{`  ·  Primera División desde ${referee.since}`}</span>}
          </p>
        </div>
        <div className="referee-hero__highlight">
          <span className="referee-hero__value">{formatDecimal(referee.cardsPerMatch)}</span>
          <span className="referee-hero__label">Tarjetas / partido</span>
          <span className="referee-hero__comparison">{comparison}</span>
        </div>
      </header>

      <div className="referee-profile__stats">
        <StatCard value={referee.matches ?? '—'} label={<Label long="Partidos dirigidos" short="Partidos" />} />
        <StatCard value={referee.yellowCards ?? '—'} label={<Label long="Tarjetas amarillas" short="Amarillas" />} tone="yellow" />
        <StatCard value={referee.redCards ?? '—'} label={<Label long="Tarjetas rojas" short="Rojas" />} tone="loss" />
        <StatCard value={referee.penalties ?? '—'} label={<Label long="Penaltis señalados" short="Penaltis" />} />
        <StatCard value={formatDecimal(referee.cardsPerMatch)} label={<Label long="Tarjetas / partido" short="Tarj. / partido" />} tone="amber" />
        {seasons != null && (
          <StatCard className="referee-profile__mobile-flex" value={seasons} label="Temporadas" />
        )}
      </div>

      <div className="referee-profile__columns">
        <section className="referee-profile__section" aria-labelledby="referee-chart-title">
          <div className="referee-profile__section-header">
            <h2 id="referee-chart-title" className="referee-profile__section-title">Tarjetas por jornada</h2>
            <Select
              className="referee-profile__season referee-profile__desktop-flex"
              size="sm"
              label="Temporada"
              hideLabel
              options={[{ value: SEASON, label: `Temporada ${SEASON}` }]}
            />
          </div>
          {chartData.length > 0 ? (
            <div className="referee-profile__chart">
              <div className="referee-profile__desktop-block">
                <BarChart
                  label={`Tarjetas por jornada de ${referee.name}`}
                  data={chartData}
                  max={8}
                  gridSteps={4}
                  average={LEAGUE_CARDS_PER_MATCH}
                  averageTone="neutral"
                  height={230}
                  barWidth={72}
                />
              </div>
              <div className="referee-profile__mobile-block">
                <BarChart
                  label={`Tarjetas por jornada de ${referee.name}`}
                  data={chartData}
                  max={8}
                  gridSteps={4}
                  average={LEAGUE_CARDS_PER_MATCH}
                  averageTone="neutral"
                  height={150}
                  barWidth={36}
                />
              </div>
              <ul className="referee-profile__legend">
                <li className="referee-profile__legend-item referee-profile__legend-item--yellow">Amarillas</li>
                <li className="referee-profile__legend-item referee-profile__legend-item--red">Rojas</li>
                <li className="referee-profile__legend-item referee-profile__legend-item--average">
                  Media LaLiga ({formatDecimal(LEAGUE_CARDS_PER_MATCH)})
                </li>
              </ul>
            </div>
          ) : (
            <p className="referee-profile__empty">Todavía no tenemos sus tarjetas partido a partido.</p>
          )}
        </section>

        <section className="referee-profile__section" aria-labelledby="referee-matches-title">
          <div className="referee-profile__section-header">
            <h2 id="referee-matches-title" className="referee-profile__section-title">
              <span className="referee-profile__desktop">Últimos partidos dirigidos</span>
              <span className="referee-profile__mobile">Últimos partidos</span>
            </h2>
          </div>
          {matches.length > 0 ? (
            <div className="referee-matches">
              <table className="referee-matches__table">
                <caption className="referee-profile__sr-only">Últimos partidos dirigidos por {referee.name}</caption>
                <thead>
                  <tr>
                    <th scope="col" className="referee-matches__date">
                      <span className="referee-profile__desktop">Fecha</span>
                      <span className="referee-profile__mobile">Día</span>
                    </th>
                    <th scope="col">Partido</th>
                    <th scope="col" className="referee-matches__cards">
                      <span className="referee-profile__desktop">Tarjetas</span>
                      <span className="referee-profile__mobile">Tarj.</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {matches.map((match) => {
                    const home = getTeam(match.homeId);
                    const away = getTeam(match.awayId);
                    const score = `${match.score[0]} – ${match.score[1]}`;
                    return (
                      <tr key={`${match.round}-${match.homeId}`}>
                        <td className="referee-matches__date">{match.date}</td>
                        <th scope="row">
                          <span className="referee-matches__match">
                            <Crest teamId={match.homeId} size={24} className="referee-profile__desktop-flex" />
                            <span className="referee-profile__desktop">{tableName(home)} {score} {tableName(away)}</span>
                            <span className="referee-profile__mobile">{home?.shortName} {score} {away?.shortName}</span>
                          </span>
                        </th>
                        <td className="referee-matches__cards">
                          <span className="referee-matches__cards-cell">
                            <CardCount color="yellow" value={match.yellow} />
                            <CardCount color="red" value={match.red} />
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="referee-profile__empty">Todavía no tenemos sus últimos partidos.</p>
          )}
        </section>
      </div>
    </section>
  );
}

// Nombre del equipo en la tabla de escritorio: el completo, salvo los muy largos («Atlético de Madrid» → «Atlético»)
function tableName(team) {
  if (!team) return '';
  return team.name.length > 14 ? team.shortName : team.name;
}

// Etiqueta de indicador larga en escritorio y corta en móvil («Partidos dirigidos» / «Partidos»)
function Label({ long, short }) {
  return (
    <>
      <span className="referee-profile__desktop">{long}</span>
      <span className="referee-profile__mobile">{short}</span>
    </>
  );
}
