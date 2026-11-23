import { useState } from 'react';
import Select from '../../components/Select/Select.jsx';
import { PLAYERS, getPlayer, getTeam } from '../../data/mockData.js';
import { playerBlockHtml, simpleBlockHtml } from './blockHtml.js';
import listIcon from '../../assets/icon-list.svg';
import quoteIcon from '../../assets/icon-quote.svg';
import linkIcon from '../../assets/icon-link.svg';
import imageIcon from '../../assets/icon-image.svg';
import chartIcon from '../../assets/icon-chart-small.svg';
import userIcon from '../../assets/icon-user-small.svg';

// Barra de herramientas del texto y, debajo, el desplegable de «Jugador»
export default function EditorToolbar({ formats, commands }) {
  const { command, toggleHeading, toggleQuote, addLink, insertBlock } = commands;
  const [playerPicker, setPlayerPicker] = useState(false);

  function insertPlayer(event) {
    const player = getPlayer(event.target.value);
    setPlayerPicker(false);
    if (player) insertBlock(playerBlockHtml(player));
  }

  return (
    <>
      <div className="article-editor__toolbar" role="toolbar" aria-label="Formato del texto">
        <ToolButton
          label="Negrita"
          active={formats.bold}
          onClick={() => command('bold')}
          className="article-editor__tool--bold"
        >
          B
        </ToolButton>
        <ToolButton
          label="Cursiva"
          active={formats.italic}
          onClick={() => command('italic')}
          className="article-editor__tool--italic"
        >
          I
        </ToolButton>
        <ToolButton label="Título de sección" active={formats.heading} onClick={toggleHeading}>
          H2
        </ToolButton>
        <span className="article-editor__separator" aria-hidden="true" />
        <ToolButton label="Lista" icon={listIcon} onClick={() => command('insertUnorderedList')} />
        <ToolButton label="Cita" icon={quoteIcon} onClick={toggleQuote} />
        <ToolButton label="Enlace" icon={linkIcon} onClick={addLink} />
        <ToolButton
          label="Imagen"
          icon={imageIcon}
          onClick={() => insertBlock(simpleBlockHtml('image', 'Imagen', 'Ilustración del artículo'))}
        />
        <ToolButton
          label="Gráfico"
          icon={chartIcon}
          onClick={() => insertBlock(simpleBlockHtml('chart', 'Gráfico', 'Barras por jornada'))}
        />
        <ToolButton
          label="Jugador"
          icon={userIcon}
          active={playerPicker}
          onClick={() => setPlayerPicker((open) => !open)}
        />
      </div>

      {playerPicker && (
        <div className="article-editor__picker">
          <Select
            size="sm"
            label="Jugador que quieres insertar"
            hideLabel
            placeholder="Elige un jugador…"
            options={Object.values(PLAYERS).map((player) => ({
              value: player.id,
              label: `${player.name} · ${getTeam(player.teamId)?.name ?? ''}`,
            }))}
            value=""
            onChange={insertPlayer}
          />
        </div>
      )}
    </>
  );
}

// Botón de la barra de herramientas. onMouseDown con preventDefault: así no se pierde el texto seleccionado.
function ToolButton({ label, icon, active = false, onClick, className = '', children }) {
  return (
    <button
      type="button"
      className={`article-editor__tool${active ? ' article-editor__tool--active' : ''} ${className}`.trim()}
      aria-label={label}
      aria-pressed={active}
      title={label}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
    >
      {icon ? (
        <>
          <img src={icon} alt="" width="16" height="16" />
          <span className="article-editor__tool-text">{label}</span>
        </>
      ) : (
        children
      )}
    </button>
  );
}
