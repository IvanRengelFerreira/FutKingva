// Copia un texto al portapapeles. Si el navegador no deja usar el portapapeles moderno,
// lo intenta a la antigua (un cuadro de texto oculto + «copiar»). Devuelve si lo ha conseguido.
export async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const field = document.createElement('textarea');
    field.value = text;
    field.setAttribute('readonly', '');
    field.style.position = 'fixed';
    field.style.opacity = '0';
    document.body.append(field);
    field.select();
    const copied = document.execCommand('copy');
    field.remove();
    return copied;
  }
}
