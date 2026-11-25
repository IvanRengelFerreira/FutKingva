import { useState } from 'react';
import { Link } from 'react-router';
import Avatar from '../../components/Avatar/Avatar.jsx';
import FieldError from '../../components/FieldError/FieldError.jsx';

// Colores de los jugadores de una comparativa (los mismos del Comparador: serie 1, 2, 3 y 4)
const SERIES = ['var(--series-1)', 'var(--series-2)', 'var(--series-3)', 'var(--series-4)'];
const REMOVE_ERROR_MESSAGE = 'No se ha podido eliminar la comparativa.';

// Comparativas guardadas: tabla en escritorio y tarjetas en móvil. «Abrir» lleva al Comparador.
export default function SavedComparisons({ comparisons, onRemove }) {
  const [removingId, setRemovingId] = useState(null);
  const [removeError, setRemoveError] = useState(null);

  if (comparisons.length === 0) {
    return (
      <p className="profile__empty">
        No tienes comparativas guardadas. <Link to="/comparador">Crea una</Link>.
      </p>
    );
  }

  async function handleRemove(id) {
    setRemovingId(id);
    setRemoveError(null);
    try {
      await onRemove(id);
    } catch (error) {
      setRemoveError(error?.message || REMOVE_ERROR_MESSAGE);
    } finally {
      setRemovingId(null);
    }
  }

  return (
    <>
      <FieldError>{removeError}</FieldError>

      <div className="profile-comparisons profile__desktop-block">
        <table className="profile-comparisons__table">
          <caption className="profile__sr-only">Comparativas guardadas</caption>
          <thead>
            <tr>
              <th scope="col">Nombre</th>
              <th scope="col" className="profile-comparisons__players-col">
                Jugadores
              </th>
              <th scope="col" className="profile-comparisons__date">
                Fecha
              </th>
              <th scope="col" className="profile-comparisons__actions">
                <span className="profile__sr-only">Acciones</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {comparisons.map((comparison) => (
              <tr key={comparison.id}>
                <th scope="row">{comparison.name}</th>
                <td className="profile-comparisons__players-col">
                  <ComparisonPlayers players={comparison.players} />
                </td>
                <td className="profile-comparisons__date">{comparison.date}</td>
                <td className="profile-comparisons__actions">
                  <ComparisonActions
                    comparison={comparison}
                    removing={removingId === comparison.id}
                    onRemove={handleRemove}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="profile__list profile__mobile-flex">
        {comparisons.map((comparison) => (
          <li key={comparison.id} className="profile-card">
            <ComparisonPlayers players={comparison.players} />
            <span className="profile-card__text">
              <span className="profile-card__name">{comparison.name}</span>
              <span className="profile-card__meta">{comparison.date}</span>
            </span>
            <span className="profile-card__buttons">
              <ComparisonActions
                comparison={comparison}
                removing={removingId === comparison.id}
                onRemove={handleRemove}
              />
            </span>
          </li>
        ))}
      </ul>
    </>
  );
}

// Avatares de los jugadores de una comparativa, montados uno sobre otro con el color de su serie
function ComparisonPlayers({ players }) {
  return (
    <span className="profile-comparison__players">
      {players.map((player, i) => (
        <Avatar key={player.id} name={player.name} size={30} color={SERIES[i]} />
      ))}
    </span>
  );
}

// «Abrir» (lleva al Comparador con los jugadores de la comparativa) y «Eliminar»
function ComparisonActions({ comparison, removing, onRemove }) {
  return (
    <>
      <Link
        className="profile__action"
        to="/comparador"
        state={{ playerIds: comparison.playerIds, saved: true }}
        aria-label={`Abrir la comparativa ${comparison.name}`}
      >
        Abrir
      </Link>
      <button
        type="button"
        className="profile__action profile__action--danger"
        disabled={removing}
        onClick={() => onRemove(comparison.id)}
      >
        Eliminar
      </button>
    </>
  );
}
