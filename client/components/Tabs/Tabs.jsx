import { useRef } from 'react';
import './Tabs.css';

// Pestañas con subrayado oro. La página guarda cuál está activa y pinta su contenido debajo.
// Diseño: Figma › Guía de estilo › 3. Componentes › Pestañas
// https://www.figma.com/design/jxq2ktu8XWk06sm5n6F8CP?node-id=30-46
// Uso:
//   const [tab, setTab] = useState('summary');
//   <Tabs
//     label="Secciones del equipo"
//     tabs={[{ id: 'summary', label: 'Resumen' }, { id: 'stats', label: 'Estadísticas' }]}
//     active={tab}
//     onChange={setTab}
//   />
//   {tab === 'summary' && <Resumen />}
export default function Tabs({ tabs, active, onChange, label, className = '' }) {
  const tabRefs = useRef([]);

  // Con el teclado: las flechas mueven a la pestaña de al lado (como en las pestañas del sistema)
  function handleKeyDown(event, index) {
    const step = { ArrowRight: 1, ArrowLeft: -1 }[event.key];
    if (!step) return;
    event.preventDefault();
    const next = (index + step + tabs.length) % tabs.length;
    onChange(tabs[next].id);
    tabRefs.current[next]?.focus();
  }

  return (
    <div className={`tabs ${className}`.trim()} role="tablist" aria-label={label}>
      {tabs.map((tab, index) => {
        const selected = tab.id === active;
        return (
          <button
            key={tab.id}
            ref={(element) => { tabRefs.current[index] = element; }}
            className={`tabs__tab${selected ? ' tabs__tab--active' : ''}`}
            type="button"
            role="tab"
            aria-selected={selected}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(tab.id)}
            onKeyDown={(event) => handleKeyDown(event, index)}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
