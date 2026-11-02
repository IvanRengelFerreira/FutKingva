import { useEffect, useState } from 'react';
import RoleNotice from '../../components/RoleNotice/RoleNotice.jsx';
import Breadcrumbs from '../../components/Breadcrumbs/Breadcrumbs.jsx';
import TextField from '../../components/TextField/TextField.jsx';
import Select from '../../components/Select/Select.jsx';
import Button from '../../components/Button/Button.jsx';
import Avatar from '../../components/Avatar/Avatar.jsx';
import Crest from '../../components/Crest/Crest.jsx';
import { PLAYERS, TEAMS, SEASON, getPlayer, getTeam } from '../../data/mockData.js';
import { CHANGE_HISTORY, CURRENT_EDITOR, PEDRI_REPORT } from './changeHistory.js';
import syncIcon from '../../assets/icon-sync.svg';
import saveIcon from '../../assets/icon-save.svg';
import searchIcon from '../../assets/icon-search-small.svg';
import './PlayerDataEditor.css';

// 19 · Actualizar datos de jugadores (RF11): corregir las estadísticas que llegan del proveedor.
// Se abre como en Figma: Pedri con las amarillas cambiadas de 2 a 3 por el aviso que llegó desde Contacto (16).
// «Guardar cambios» añade cada campo cambiado al historial; «Cancelar» vuelve a los datos de mockData.js.
// Sin servidor: los cambios duran hasta que se recarga la página.
// Diseño: Figma › Mockups › 19 · Actualizar datos de jugadores
// https://www.figma.com/design/jxq2ktu8XWk06sm5n6F8CP?node-id=62-1286

// Campos que se pueden corregir: clave en PLAYERS, etiqueta, nombre corto para el historial
const FIELDS = [
  { key: 'matches', label: 'Partidos' },
  { key: 'minutes', label: 'Minutos' },
  { key: 'goals', label: 'Goles' },
  { key: 'assists', label: 'Asistencias' },
  { key: 'xg', label: 'xG', decimal: true },
  { key: 'shotsOnTarget', label: 'Tiros a puerta' },
  { key: 'cards', label: 'Tarjetas amarillas', short: 'Amarillas' },
  { key: 'redCards', label: 'Tarjetas rojas', short: 'Rojas' },
];

const POSITIONS = ['Portero', 'Defensa', 'Centrocampista', 'Extremo', 'Delantero'];

const SYNC_SECONDS = 1200;

export default function PlayerDataEditor() {
  const [saved, setSaved] = useState({}); // Datos ya corregidos en esta visita: { playerId: { campo: valor } }
  const [history, setHistory] = useState(CHANGE_HISTORY);
  const [playerId, setPlayerId] = useState(PEDRI_REPORT.playerId);
  const [values, setValues] = useState(() => ({ ...originalValues(PEDRI_REPORT.playerId, {}), ...PEDRI_REPORT.changes }));
  const [reason, setReason] = useState(PEDRI_REPORT.reason);
  const [submitted, setSubmitted] = useState(false);
  const [message, setMessage] = useState('');

  const [query, setQuery] = useState('');
  const [teamId, setTeamId] = useState('all');
  const [listOpen, setListOpen] = useState(false); // Lista de jugadores para elegir (al buscar o filtrar por equipo)

  const [lastSync, setLastSync] = useState('10:05');
  const [syncing, setSyncing] = useState(false);

  const player = getPlayer(playerId);
  const team = getTeam(player.teamId);
  const original = originalValues(playerId, saved);
  const changed = [...FIELDS.map((field) => field.key), 'position'].filter((key) => values[key] !== original[key]);

  const errors = {
    ...Object.fromEntries(
      FIELDS.map((field) => [field.key, isValidNumber(values[field.key], field.decimal) ? null : 'Número no válido'])
    ),
    reason: changed.length > 0 && !reason.trim() ? 'Explica el motivo del cambio' : null,
  };
  const shown = (field) => (submitted ? errors[field] : null);

  // «Sincronizar ahora»: un momento «Sincronizando…» y se actualiza la hora
  useEffect(() => {
    if (!syncing) return undefined;
    const timer = setTimeout(() => {
      setSyncing(false);
      setLastSync(new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }));
    }, SYNC_SECONDS);
    return () => clearTimeout(timer);
  }, [syncing]);

  function change(key, value) {
    setValues((current) => ({ ...current, [key]: value }));
    setMessage('');
  }

  function choosePlayer(id) {
    setPlayerId(id);
    setValues(originalValues(id, saved));
    setReason('');
    setSubmitted(false);
    setMessage('');
    setQuery('');
    setListOpen(false);
  }

  function cancel() {
    setValues(original);
    setReason('');
    setSubmitted(false);
    setMessage('Cambios descartados.');
  }

  function save() {
    if (changed.length === 0) {
      setMessage('No hay cambios que guardar.');
      return;
    }
    if (Object.values(errors).some(Boolean)) {
      setSubmitted(true);
      return;
    }
    const entries = changed.map((key, i) => ({
      id: Date.now() + i,
      date: todayShort(),
      playerId,
      field: fieldName(key),
      from: original[key],
      to: values[key],
      by: CURRENT_EDITOR.initials,
    }));
    setHistory((list) => [...entries, ...list]);
    setSaved((all) => ({ ...all, [playerId]: { ...all[playerId], ...pick(values, changed) } }));
    setReason('');
    setSubmitted(false);
    setMessage(`Cambios guardados: ${entries.map((e) => `${e.field} ${e.from} → ${e.to}`).join(', ')}.`);
  }

  const suggestions = listOpen ? getSuggestions(query, teamId, playerId) : [];
  const showOrigin = playerId === PEDRI_REPORT.playerId && !saved[playerId];

  return (
    <section className="page player-data">
      <RoleNotice role="editor" />
      <Breadcrumbs
        items={[
          { label: 'Panel de editor', to: '/editor' },
          { label: 'Actualizar datos de jugadores', shortLabel: 'Actualizar datos' },
        ]}
      />

      <header className="page-header">
        <div className="page-header__text">
          <p className="page-header__eyebrow">Zona de editor<span className="player-data__more"> · RF11</span></p>
          <h1 className="page-header__title">Actualizar datos de jugadores</h1>
          <p className="page-header__subtitle player-data__more">
            Corrige o completa las estadísticas recibidas del proveedor de datos.
          </p>
        </div>

        <div className="player-data__sync">
          <span className={`player-data__dot${syncing ? ' player-data__dot--syncing' : ''}`} aria-hidden="true" />
          <div className="player-data__sync-text">
            <p className="player-data__sync-title">
              <span className="player-data__more">Conectado a </span>football-data.org
            </p>
            <p className="player-data__sync-time" role="status">
              {syncing ? 'Sincronizando…' : (
                <>
                  <span className="player-data__more">Última sincronización: </span>
                  <span className="player-data__capital">hoy {lastSync}</span>
                  <span className="player-data__more"> · próxima en 4 min</span>
                </>
              )}
            </p>
          </div>
          <Button variant="tertiary" className="player-data__button" onClick={() => setSyncing(true)} disabled={syncing}>
            <img src={syncIcon} alt="" width="16" height="16" />
            <span>Sincronizar<span className="player-data__more"> ahora</span></span>
          </Button>
        </div>
      </header>

      <div className="player-data__filters">
        <div className="player-data__search">
          <TextField
            size="sm"
            label="Buscar jugador"
            hideLabel
            placeholder={player.name}
            icon={searchIcon}
            value={query}
            onChange={(e) => { setQuery(e.target.value); setListOpen(true); }}
            autoComplete="off"
          />
          {suggestions.length > 0 && (
            <ul className="player-data__suggestions">
              {suggestions.map((item) => (
                <li key={item.id}>
                  <button type="button" className="player-data__suggestion" onClick={() => choosePlayer(item.id)}>
                    <Avatar name={item.name} size={24} />
                    {item.name}
                    <span className="player-data__suggestion-team">{getTeam(item.teamId)?.name}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <Select
          size="sm"
          label="Filtrar por equipo"
          hideLabel
          options={[{ value: 'all', label: 'Equipo: Todos' }, ...teamsWithPlayers()]}
          value={teamId}
          onChange={(e) => { setTeamId(e.target.value); setListOpen(true); }}
        />
        <Select
          size="sm"
          label="Temporada"
          hideLabel
          options={[{ value: SEASON, label: `Temporada ${SEASON}` }]}
          value={SEASON}
          onChange={() => {}}
        />
      </div>

      <div className="player-data__layout">
        <form className="player-data__card" onSubmit={(e) => { e.preventDefault(); save(); }} noValidate>
          <div className="player-data__who">
            <span className="player-data__badge">
              <Avatar className="player-data__avatar" name={player.name} size={68} />
              <Crest className="player-data__crest" teamId={player.teamId} size={24} />
            </span>
            <div className="player-data__who-text">
              <h2 className="player-data__name">{player.name}</h2>
              <p className="player-data__meta">
                {team?.name} · {values.position} · Temporada {SEASON}
              </p>
            </div>
            {changed.length > 0 && (
              <span className="player-data__changed">
                {changed.length} {changed.length === 1 ? 'campo modificado' : 'campos modificados'}
              </span>
            )}
          </div>

          <div className="player-data__fields">
            {FIELDS.map((field) => (
              <div key={field.key} className={`player-data__field${changed.includes(field.key) ? ' player-data__field--changed' : ''}`}>
                <TextField
                  label={field.label}
                  inputMode={field.decimal ? 'decimal' : 'numeric'}
                  value={values[field.key]}
                  onChange={(e) => change(field.key, e.target.value)}
                  error={shown(field.key)}
                />
                {changed.includes(field.key) && <span className="player-data__before">antes {original[field.key]}</span>}
              </div>
            ))}
            <div className={`player-data__field player-data__field--position${changed.includes('position') ? ' player-data__field--changed' : ''}`}>
              <Select label="Posición" options={POSITIONS} value={values.position} onChange={(e) => change('position', e.target.value)} />
            </div>
          </div>

          {showOrigin && (
            <p className="player-data__origin">
              <span className="player-data__mail" aria-hidden="true" />
              {PEDRI_REPORT.origin}
            </p>
          )}

          <TextField
            label="Motivo del cambio"
            placeholder="Por qué se corrige el dato (partido, minuto…)"
            value={reason}
            onChange={(e) => { setReason(e.target.value); setMessage(''); }}
            error={shown('reason')}
          />

          <div className="player-data__actions">
            <Button variant="tertiary" className="player-data__button" onClick={cancel}>Cancelar</Button>
            <Button type="submit" className="player-data__button">
              <img src={saveIcon} alt="" width="16" height="16" />
              Guardar cambios
            </Button>
            <p className="player-data__message" role="status">{message}</p>
          </div>
        </form>

        <div className="player-data__history">
          <h2 className="player-data__history-title">Historial de cambios</h2>
          <div className="player-data__table">
            <table>
              <thead>
                <tr>
                  <th scope="col"><span className="player-data__more">Fecha</span><span className="player-data__less">Día</span></th>
                  <th scope="col">Jugador · campo</th>
                  <th scope="col">Cambio</th>
                  <th scope="col" className="player-data__by">Por</th>
                </tr>
              </thead>
              <tbody>
                {history.map((entry) => {
                  const who = getPlayer(entry.playerId);
                  return (
                    <tr key={entry.id}>
                      <td className="player-data__date">{entry.date}</td>
                      <td>
                        <span className="player-data__entry">
                          <Avatar name={who?.name} size={26} />
                          <span>
                            <span className="player-data__entry-name">{who?.name}</span>
                            <span className="player-data__entry-field">{entry.field}</span>
                          </span>
                        </span>
                      </td>
                      <td className="player-data__change">
                        {entry.from} <span className="player-data__arrow" aria-label="pasa a" /> <strong>{entry.to}</strong>
                      </td>
                      <td className="player-data__by"><Avatar initials={entry.by} name={entry.by} size={26} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}

// Valores del jugador tal como están (mockData.js + lo ya guardado en esta visita), como textos para los campos
function originalValues(playerId, saved) {
  const player = getPlayer(playerId);
  const values = { position: player.position };
  FIELDS.forEach((field) => {
    const value = player[field.key] ?? 0;
    values[field.key] = field.decimal ? value.toLocaleString('es-ES') : String(value);
  });
  return { ...values, ...saved[playerId] };
}

function isValidNumber(text, decimal) {
  return decimal ? /^\d+([.,]\d+)?$/.test(text.trim()) : /^\d+$/.test(text.trim());
}

function fieldName(key) {
  if (key === 'position') return 'Posición';
  const field = FIELDS.find((item) => item.key === key);
  return field.short ?? field.label;
}

function pick(object, keys) {
  return Object.fromEntries(keys.map((key) => [key, object[key]]));
}

// Fecha de hoy en la maqueta (sábado 17/10/2026)
function todayShort() {
  return '17/10';
}

// Equipos que tienen jugadores en mockData.js
function teamsWithPlayers() {
  const ids = new Set(Object.values(PLAYERS).map((player) => player.teamId));
  return Object.values(TEAMS)
    .filter((team) => ids.has(team.id))
    .map((team) => ({ value: team.id, label: team.name }));
}

// Jugadores que coinciden con lo buscado y con el equipo elegido (máximo 6)
function getSuggestions(query, teamId, currentId) {
  const text = normalize(query);
  if (!text && teamId === 'all') return [];
  return Object.values(PLAYERS)
    .filter((player) => player.id !== currentId)
    .filter((player) => teamId === 'all' || player.teamId === teamId)
    .filter((player) => !text || normalize(player.name).includes(text))
    .slice(0, 6);
}

function normalize(text = '') {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}
