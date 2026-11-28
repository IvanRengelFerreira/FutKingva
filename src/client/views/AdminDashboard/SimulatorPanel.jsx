// Simulador de partidos para la demo (RF9): el administrador empieza un partido con dos equipos reales
// de la temporada y puede forzar goles para que los avisos en directo no dependan del azar.
// Quien siga a alguno de los dos equipos recibe los avisos (campana y aviso emergente); el marcador
// cambia en Inicio para todos. Nunca cuenta en la clasificación ni en ninguna estadística.
// Rutas: /api/admin/simulator (services/simulator.js). Estilos comunes con SyncPanel (SyncPanel.css).

import { useEffect, useState } from 'react';
import Button from '../../components/Button/Button.jsx';
import ErrorState from '../../components/ErrorState/ErrorState.jsx';
import FieldError from '../../components/FieldError/FieldError.jsx';
import LoadingState from '../../components/LoadingState/LoadingState.jsx';
import Select from '../../components/Select/Select.jsx';
import Tag from '../../components/Tag/Tag.jsx';
import { getStandings } from '../../services/standings.js';
import { onEvent } from '../../services/realtime.js';
import {
  deleteSimulatedMatch,
  finishSimulatedMatch,
  getSimulatedMatches,
  scoreSimulatedGoal,
  startSimulatedMatch,
} from '../../services/simulator.js';
import { useApi } from '../../services/useApi.js';
import { useFormSubmit } from '../../services/useFormSubmit.js';
import { validateSimulatorStart } from '../../../shared/validation/simulator.js';
import './SyncPanel.css';

const LIVE_STATUSES = ['IN_PLAY', 'PAUSED'];

function scoreText(match) {
  const [home, away] = match.score ?? [0, 0];
  return `${match.homeTeam.shortName} ${home} – ${away} ${match.awayTeam.shortName}`;
}

function SimulatedMatchRow({ match, sending, onAction }) {
  const live = LIVE_STATUSES.includes(match.status);
  return (
    <li className="admin-sync__item">
      <div className="admin-sync__item-head">
        <span className="admin-sync__item-title">{scoreText(match)}</span>
        {live ? (
          <Tag category="Crónica" className="admin-tag">
            En juego · {match.minute ?? 0}&apos;
          </Tag>
        ) : (
          <Tag className="admin-tag admin-sync__status--ok">Terminado</Tag>
        )}
      </div>
      <div className="admin-sync__actions">
        {live && (
          <>
            <Button
              variant="secondary"
              disabled={sending}
              onClick={() =>
                onAction(() => scoreSimulatedGoal(match.id, 'home'), `Gol del ${match.homeTeam.shortName}.`)
              }
            >
              Gol {match.homeTeam.shortName}
            </Button>
            <Button
              variant="secondary"
              disabled={sending}
              onClick={() =>
                onAction(() => scoreSimulatedGoal(match.id, 'away'), `Gol del ${match.awayTeam.shortName}.`)
              }
            >
              Gol {match.awayTeam.shortName}
            </Button>
            <Button
              variant="secondary"
              disabled={sending}
              onClick={() => onAction(() => finishSimulatedMatch(match.id), 'Partido terminado.')}
            >
              Terminar
            </Button>
          </>
        )}
        <Button
          variant="danger"
          disabled={sending}
          onClick={() => onAction(() => deleteSimulatedMatch(match.id), 'Partido simulado borrado.')}
        >
          Borrar
        </Button>
      </div>
    </li>
  );
}

export default function SimulatorPanel() {
  const matches = useApi((signal) => getSimulatedMatches({ signal }), []);
  const standings = useApi((signal) => getStandings(undefined, { signal }), []);
  const { submitted, sending, serverFields, message, clearServerError, submit } = useFormSubmit();
  // Las acciones de cada partido van aparte: no marcan los errores del formulario de empezar
  const action = useFormSubmit();
  // Minuto y marcador al día que llegan en directo, por id de partido (sin pedir la lista otra vez)
  const [liveMatches, setLiveMatches] = useState({});
  const [homeTeamId, setHomeTeamId] = useState('');
  const [awayTeamId, setAwayTeamId] = useState('');
  const [feedback, setFeedback] = useState('');

  // El reloj del simulador avanza en el servidor: cada minuto actualiza su fila; la lista solo se pide
  // otra vez cuando un partido termina o se borra
  const reloadMatches = matches.reload;
  useEffect(() => {
    const offs = [
      onEvent('match:update', ({ match }) => setLiveMatches((current) => ({ ...current, [match.id]: match }))),
      onEvent('match:finished', ({ match }) => forget(match.id)),
      onEvent('match:removed', ({ matchId }) => forget(matchId)),
    ];
    // Se olvida su estado en directo (si no, taparía el final) y se pide la lista al día
    function forget(matchId) {
      setLiveMatches(({ [matchId]: _gone, ...rest }) => rest);
      reloadMatches();
    }
    return () => offs.forEach((off) => off());
  }, [reloadMatches]);

  const teamOptions = (standings.data?.table ?? []).map((row) => ({ value: String(row.teamId), label: row.team.name }));
  const body = { homeTeamId: Number(homeTeamId), awayTeamId: Number(awayTeamId) };
  const errors = validateSimulatorStart(body);
  const fieldErrors = {
    homeTeamId: (submitted && errors.homeTeamId) || serverFields.homeTeamId,
    awayTeamId: (submitted && errors.awayTeamId) || serverFields.awayTeamId,
  };

  function runAction(request, successMessage) {
    setFeedback('');
    action.submit(async () => {
      await request();
      setFeedback(successMessage);
      matches.reload();
    });
  }

  function handleStart(event) {
    event.preventDefault();
    setFeedback('');
    submit(async () => {
      await startSimulatedMatch(body);
      setFeedback('Partido simulado en juego: los seguidores de los dos equipos recibirán los avisos.');
      matches.reload();
    }, errors);
  }

  return (
    <section className="admin-sync" aria-labelledby="admin-simulator-heading">
      <div className="admin-sync__header">
        <div className="admin-sync__title-row">
          <h2 className="admin-sync__title" id="admin-simulator-heading">
            Simulador de partidos (demo)
          </h2>
          <Tag category="Táctica" className="admin-tag">
            Demo
          </Tag>
        </div>
        <p className="admin-sync__subtitle">
          Juega un partido con equipos reales para enseñar los avisos en directo. Cada minuto dura unos segundos; con
          los botones de gol no hay que esperar al azar.
        </p>
      </div>

      {standings.error ? (
        <ErrorState error={standings.error} title="No se han podido cargar los equipos" onRetry={standings.reload} />
      ) : (
        <form className="admin-sync__actions" onSubmit={handleStart} noValidate>
          <Select
            size="sm"
            label="Equipo local"
            placeholder="Equipo local"
            options={teamOptions}
            value={homeTeamId}
            error={fieldErrors.homeTeamId}
            onChange={(e) => {
              setHomeTeamId(e.target.value);
              clearServerError('homeTeamId');
            }}
          />
          <Select
            size="sm"
            label="Equipo visitante"
            placeholder="Equipo visitante"
            options={teamOptions}
            value={awayTeamId}
            error={fieldErrors.awayTeamId}
            onChange={(e) => {
              setAwayTeamId(e.target.value);
              clearServerError('awayTeamId');
            }}
          />
          <Button type="submit" variant="secondary" disabled={sending || standings.loading}>
            Empezar partido
          </Button>
        </form>
      )}

      <FieldError>{message ?? action.message}</FieldError>
      <p className="admin-reports__message" role="status">
        {feedback}
      </p>

      {matches.loading && !matches.data ? (
        <LoadingState label="Cargando partidos simulados…" />
      ) : matches.error ? (
        <ErrorState
          error={matches.error}
          title="No se han podido cargar los partidos simulados"
          onRetry={matches.reload}
        />
      ) : matches.data.items.length === 0 ? (
        <p className="admin-sync__item-empty">Todavía no hay partidos simulados.</p>
      ) : (
        <ul className="admin-sync__list">
          {matches.data.items.map((match) => (
            <SimulatedMatchRow
              key={match.id}
              match={liveMatches[match.id] ?? match}
              sending={action.sending}
              onAction={runAction}
            />
          ))}
        </ul>
      )}
    </section>
  );
}
