// Iconos de las acciones del panel (candado, papelera, bandera, check). Van en línea con
// stroke="currentColor" para que cojan el color de su botón (oro, verde o rojo).
// Diseño: Figma › Mockups › 20 · Panel de administración › Icono lock / unlock / trash / flag / check
// https://www.figma.com/design/jxq2ktu8XWk06sm5n6F8CP?node-id=64-1365
const PATHS = {
  lock: (
    <>
      <rect x="2.5" y="6" width="9" height="6.5" rx="1.5" />
      <path d="M4.5 6V4.5a2.5 2.5 0 0 1 5 0V6" />
    </>
  ),
  unlock: (
    <>
      <rect x="2.5" y="6" width="9" height="6.5" rx="1.5" />
      <path d="M4.5 6V4.5a2.5 2.5 0 0 1 4.7-1.2" />
    </>
  ),
  trash: <path d="M2 3.8h10M5.3 3.8V2.5h3.4v1.3M3.4 3.8l.5 7.7h6.2l.5-7.7M5.6 6v3.6M8.4 6v3.6" />,
  flag: <path d="M3.5 12.5v-11M3.5 2h6.5l-1.3 2.4L10 6.8H3.5" />,
  check: <path d="M2.5 7.3l3 3L11.5 4" />,
};

export default function AdminIcon({ name, size = 14 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 14 14"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {PATHS[name]}
    </svg>
  );
}
