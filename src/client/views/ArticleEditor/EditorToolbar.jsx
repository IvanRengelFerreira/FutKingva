import { useState } from 'react';
import TextField from '../../components/TextField/TextField.jsx';
import Avatar from '../../components/Avatar/Avatar.jsx';
import { figureBlockHtml, imageBlockHtml, playerBlockHtml } from './blockHtml.js';
import { useSuggestions } from './related.js';
import listIcon from '../../assets/icon-list.svg';
import quoteIcon from '../../assets/icon-quote.svg';
import linkIcon from '../../assets/icon-link.svg';
import imageIcon from '../../assets/icon-image.svg';
import chartIcon from '../../assets/icon-chart-small.svg';
import userIcon from '../../assets/icon-user-small.svg';
import searchIcon from '../../assets/icon-search-small.svg';

// Barra de herramientas del texto y, debajo, el buscador de «Jugador» (jugadores de la BD)
export default function EditorToolbar({ formats, commands }) {
  const { command, toggleHeading, toggleQuote, addLink, insertBlock } = commands;
  const [playerPicker, setPlayerPicker] = useState(false);

  function insertPlayer(player) {
    setPlayerPicker(false);
    insertBlock(playerBlockHtml(player));
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
        <ToolButton label="Imagen" icon={imageIcon} onClick={() => insertBlock(imageBlockHtml())} />
        <ToolButton label="Gráfico" icon={chartIcon} onClick={() => insertBlock(figureBlockHtml())} />
        <ToolButton
          label="Jugador"
          icon={userIcon}
          active={playerPicker}
          onClick={() => setPlayerPicker((open) => !open)}
        />
      </div>

      {playerPicker && <PlayerPicker onPick={insertPlayer} />}
    </>
  );
}

// Buscador del jugador que se inserta como ficha
function PlayerPicker({ onPick }) {
  const [query, setQuery] = useState('');
  const suggestions = useSuggestions(query, [], { withTeams: false });

  return (
    <div className="article-editor__picker">
      <TextField
        size="sm"
        label="Jugador que quieres insertar"
        hideLabel
        placeholder="Busca un jugador…"
        icon={searchIcon}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        autoComplete="off"
        autoFocus
      />
      {suggestions.length > 0 && (
        <ul className="article-editor__suggestions">
          {suggestions.map((player) => (
            <li key={player.id}>
              <button type="button" className="article-editor__suggestion" onClick={() => onPick(player)}>
                <Avatar name={player.name} size={22} />
                {player.name}
                {player.team && <span className="article-editor__suggestion-team">{player.team.name}</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
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
