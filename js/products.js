/* =========================================================
   CONFIGURACIÓN DEL CATÁLOGO — Google Sheets
   -----------------------------------------------------------
   Los productos ya NO se editan a mano en un archivo. Se
   cargan en vivo desde una Google Sheet, y se administran
   desde el panel en admin.html.

   Ver el archivo README.md, sección "Catálogo con Google
   Sheets", para los pasos de configuración.
   ========================================================= */

const CATALOG_SHEET_URL = "https://script.google.com/macros/s/AKfycbyh_8ogzwEXMMJtzQ0_QbeKkixHlDGfr6PEMMl7Zk_1OzR8JWaBlzk1KUMNJEJcgWb9/exec";

/* Secciones fijas del catálogo. Se usan tanto para los filtros
   del catálogo público como para el desplegable del panel de
   administrador, así siempre coinciden. */
const CATALOG_CATEGORIES = [
  "Estampados y sublimación",
  "Tarjetería",
  "Etiquetas y vinilos",
  "Stickers",
  "Eventos",
  "Regalos personalizados",
  "Impresión 3D",
];
