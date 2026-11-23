import BarChart from '../../components/BarChart/BarChart.jsx';
import { getPlayer } from '../../data/mockData.js';

// En oro, las jornadas por encima del 90 %
const GOLD_THRESHOLD = 90;

// Gráfico de precisión de pase por jornada de un jugador
export default function ChartBlock({ block }) {
  const player = getPlayer(block.playerId);
  if (!player?.passAccuracyByRound) return null; // Sin datos del jugador, no hay gráfico

  const data = player.passAccuracyByRound.map((value, i) => ({
    label: `J${i + 1}`,
    value,
    tone: value >= GOLD_THRESHOLD ? 'gold' : 'win',
  }));

  return (
    <figure className="article__box article__figure">
      <figcaption className="article__box-title">{block.title}</figcaption>
      <BarChart label={block.title} data={data} min={80} max={95} height={170} />
      <p className="article__source">{block.source}</p>
    </figure>
  );
}
