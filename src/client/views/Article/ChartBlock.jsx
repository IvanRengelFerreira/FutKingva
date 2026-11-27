// Gráfico de acierto en el pase por jornada de un jugador.
// La BD todavía no guarda el % de pase de cada partido (solo el de la temporada): el recuadro del mockup
// se queda con su título y un aviso hasta tener el dato (con él, se pinta con <BarChart>, oro por encima del 90 %).
export default function ChartBlock({ block, player }) {
  return (
    <figure className="article__box article__figure">
      <figcaption className="article__box-title">{block.title}</figcaption>
      <p className="article__chart-empty">Todavía no hay datos por jornada{player ? ` de ${player.name}` : ''}.</p>
      {block.source && <p className="article__source">{block.source}</p>}
    </figure>
  );
}
