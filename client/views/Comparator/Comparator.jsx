import { useState } from 'react';
import Button from '../../components/Button/Button.jsx';
import Select from '../../components/Select/Select.jsx';
import Avatar from '../../components/Avatar/Avatar.jsx';
import Crest from '../../components/Crest/Crest.jsx';
import Radar from '../../components/Radar/Radar.jsx';
import PlayerSearch from './PlayerSearch.jsx';
import StatsTable from './StatsTable.jsx';
import { RADAR_AXES, MODES, MAX_PLAYERS, compactName, radarValues } from './stats.js';
import { SEASON, COMPARISON_EXAMPLE, getPlayer, getTeam } from '../../data/mockData.js';
import plusIcon from '../../assets/icon-plus-light.svg';
import plusGoldIcon from '../../assets/icon-plus.svg';
import saveIcon from '../../assets/icon-save.svg';
import removeIcon from '../../assets/icon-remove.svg';
import './Comparator.css';

// 10 · Comparador (RF4): comparar de 2 a 4 jugadores lado a lado y en un gráfico radar.
// Empieza con la comparativa de ejemplo (Pedri, Bellingham y Lamine Yamal). Cada jugador tiene su
// color (serie 1–4) en la tarjeta, la tabla y el radar; al quitar uno, los siguientes cambian de color.
// «Guardar comparativa» la marca como guardada (sin servidor no se guarda en ningún sitio).
// Diseño: Figma › Mockups › 10 · Comparador
// https://www.figma.com/design/jxq2ktu8XWk06sm5n6F8CP?node-id=54-623
export default function Comparator() {
  const [playerIds, setPlayerIds] = useState(COMPARISON_EXAMPLE);
  const [mode, setMode] = useState('totals');
  const [saved, setSaved] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false); // Solo en móvil: buscador debajo de las tarjetas

  const players = playerIds.map(getPlayer);
  const canAdd = players.length < MAX_PLAYERS;

  function change(ids) {
    setPlayerIds(ids);
    setSaved(false);
  }

  function add(id) {
    change([...playerIds, id]);
    setSearchOpen(false);
  }

  return (
    <section className="page comparator">
      <header className="page-header">
        <div className="page-header__text">
          <p className="page-header__eyebrow" aria-live="polite">
            {saved ? 'Comparativa guardada' : 'Comparativa sin guardar'}
          </p>
          <h1 className="page-header__title">
            Comparador<span className="comparator__desktop"> de jugadores</span>
          </h1>
          <p className="page-header__subtitle">
            <span className="comparator__desktop">Elige dos o más jugadores y compara sus estadísticas de la temporada.</span>
            <span className="comparator__mobile">Compara dos o más jugadores.</span>
          </p>
        </div>
        <div className="page-header__actions comparator__actions">
          <Button variant="tertiary" className="comparator__new" onClick={() => change([])}>
            <img src={plusIcon} alt="" width="16" height="16" />
            Nueva comparativa
          </Button>
          <Button className="comparator__save" onClick={() => setSaved(true)} disabled={players.length < 2 || saved}>
            <img src={saveIcon} alt="" width="16" height="16" />
            {saved ? 'Comparativa guardada' : 'Guardar comparativa'}
          </Button>
        </div>
      </header>

      <div className="comparator__filters">
        {/* Temporada y competición: solo hay una de cada; en móvil el texto es más corto */}
        <Select size="sm" label="Temporada" hideLabel options={[`Temporada ${SEASON}`]} value={`Temporada ${SEASON}`} onChange={() => {}} className="comparator__desktop-block" />
        <Select size="sm" label="Competición" hideLabel options={['Competición: LaLiga']} value="Competición: LaLiga" onChange={() => {}} className="comparator__desktop-block" />
        <Select size="sm" label="Temporada" hideLabel options={[SEASON]} value={SEASON} onChange={() => {}} className="comparator__mobile-block" />
        <Select size="sm" label="Competición" hideLabel options={['LaLiga']} value="LaLiga" onChange={() => {}} className="comparator__mobile-block" />
        <Select
          size="sm"
          label="Totales o por partido"
          hideLabel
          options={MODES}
          value={mode}
          onChange={(e) => setMode(e.target.value)}
          className="comparator__mode"
        />
      </div>

      <ul className="comparator__players" aria-label="Jugadores de la comparativa">
        {players.map((player, i) => {
          const team = getTeam(player.teamId);
          return (
            <li key={player.id} className={`comparator-player comparator-series--${i + 1}`}>
              <div className="comparator-player__top">
                <span className="comparator-player__dot" aria-hidden="true" />
                <button
                  type="button"
                  className="comparator-player__remove"
                  onClick={() => change(playerIds.filter((id) => id !== player.id))}
                  aria-label={`Quitar a ${player.name}`}
                >
                  <img src={removeIcon} alt="" width="14" height="14" />
                  <span className="comparator__desktop">Quitar</span>
                </button>
              </div>
              <Avatar name={player.name} size={84} className="comparator-player__avatar" />
              <p className="comparator-player__name">
                <span className="comparator__desktop">{player.name}</span>
                <span className="comparator__mobile">{compactName(player)}</span>
              </p>
              <p className="comparator-player__team">
                <Crest teamId={player.teamId} size={20} className="comparator-player__crest" />
                <span className="comparator__desktop">{team?.name} · {player.position}</span>
                <span className="comparator__mobile">{team?.code}</span>
              </p>
            </li>
          );
        })}

        {canAdd && (
          <li className="comparator-add">
            <button
              type="button"
              className="comparator-add__button"
              onClick={() => setSearchOpen(!searchOpen)}
              aria-expanded={searchOpen}
              aria-label="Añadir jugador"
            >
              <img src={plusGoldIcon} alt="" width="22" height="22" />
            </button>
            <p className="comparator-add__title" aria-hidden="true">
              <span className="comparator__desktop">Añadir jugador</span>
              <span className="comparator__mobile">Añadir</span>
            </p>
            <PlayerSearch selectedIds={playerIds} onSelect={add} className="comparator-add__search" />
            <p className="comparator-add__hint">Máx. {MAX_PLAYERS} jugadores</p>
          </li>
        )}
      </ul>

      {/* En móvil el buscador no cabe en la tarjeta: sale debajo al pulsar «+» */}
      {canAdd && searchOpen && (
        <PlayerSearch selectedIds={playerIds} onSelect={add} autoFocus className="comparator__search-mobile" />
      )}

      {players.length < 2 && (
        <p className="comparator__empty">
          {players.length === 0 ? 'Añade al menos dos jugadores para compararlos.' : 'Añade otro jugador para compararlo.'}
        </p>
      )}

      {players.length > 0 && (
        <div className="comparator__results">
          <section className="comparator__stats" aria-labelledby="comparator-stats-title">
            <h2 id="comparator-stats-title" className="comparator__section-title">
              <span className="comparator__desktop">Estadísticas lado a lado</span>
              <span className="comparator__mobile">Estadísticas</span>
            </h2>
            <StatsTable players={players} mode={mode} />
            <p className="comparator__legend">
              <span className="comparator-crown" aria-hidden="true" />
              Mejor valor de cada estadística
            </p>
          </section>

          <section className="comparator__radar" aria-labelledby="comparator-radar-title">
            <h2 id="comparator-radar-title" className="comparator__section-title">Gráfico radar</h2>
            <div className="comparator__radar-card">
              <Radar
                label={`Comparativa de ${players.map(compactName).join(', ')}`}
                axes={RADAR_AXES}
                series={players.map((player) => ({ name: compactName(player), values: radarValues(player) }))}
              />
            </div>
          </section>
        </div>
      )}
    </section>
  );
}
