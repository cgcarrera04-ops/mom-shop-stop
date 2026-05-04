# Mom Shop Stop - Documentación Técnica y Flujo de Trabajo

Esta documentación explica la arquitectura final de Mom Shop Stop, el flujo de ventas, y cómo mantener y administrar el proyecto de forma eficiente.

## 1. Estructura de la Base de Datos (Google Sheets)
La tienda lee la información de un único Google Sheet mediante diferentes pestañas. 

**ID de Google Sheet:** `10nPfebrAzLCb6SfDWkPk7G4hBNIycPRZI-4AhA8AOis`

Debes asegurar que las siguientes pestañas existan y respeten exactamente estos nombres de columna:

### Pestaña: `Productos`
- `id`: Identificador único (ej. `p1`, `p2`). No usar espacios.
- `name`: Nombre del producto.
- `price`: Precio numérico (ej. `199`).
- `image`: URL de la imagen.
- `shortDesc`: Descripción corta para las tarjetas.
- `quantity`: Presentación (ej. `120 Cápsulas`).
- `description`: Descripción larga (puede incluir HTML básico).
- `isBestSeller`: `VERDADERO` o `FALSO`.
- `soldOut`: `VERDADERO` (agotado) o `FALSO` (disponible).
- `isOffer`: `VERDADERO` o `FALSO`.
- `category`: Categorías separadas por comas (ej. `Inmune, Corazón`).
- `usageInstructions`: Texto del ritual de bienestar/uso.
- `sealName`: (Opcional) Nombre del sello de calidad.
- `sealUrl`: (Opcional) URL de la imagen del sello.
- `r1_name`, `r1_rating`, `r1_comment`, `r2_...`, `r3_...`: Datos de hasta 3 reviews.

### Pestaña: `Blog`
1. **title**: (Un título SEO magnético, persuasivo y que genere curiosidad, máx. 60 caracteres).
2. **meta_description**: (Un resumen SEO atractivo que incite al clic, máx. 150 caracteres).
3. **featured_product_id**: (El ID del producto que se enlazará en el llamado a la acción, ej. p3).
4. **content_html**: (El código HTML del cuerpo del artículo. Debe incluir contenido exhaustivo, ciencia detrás de los suplementos, mitos desmentidos y seguir el estilo de Tailwind especificado, incluyendo el botón de compra con el formato: `<a href="https://momshopstop.netlify.app/?p=[ID]">...</a>`).

### Pestaña: `Agencias`
- `courier`: Empresa de transporte (ej. `Olva Courier` o `Shalom`).
- `departamento`: Departamento (ej. `Amazonas`).
- `provincia`: Provincia (ej. `Chachapoyas`).
- `distrito`: Distrito (ej. `Chachapoyas`).
- `nombre_agencia`: Nombre visible de la agencia (ej. `Olva Chachapoyas`).
- `dirección`: Dirección exacta de la sucursal (ej. `Jr. Octavio Ortiz Arrieta 270`).

---

## 2. Flujo de Compra: ¿Qué sucede cuando un cliente paga?

1. **El cliente finaliza el Checkout:** 
   - Llena sus datos de contacto.
   - Selecciona si desea "A domicilio" o "Recojo en Agencia".
   - Filtra su ubicación (Departamento, Provincia, Distrito).
   - El sistema le muestra las opciones de courier según la zona elegida y el costo de envío (que será gratis si lleva 3+ productos).
   - Finalmente, si es agencia, filtra dinámicamente usando la pestaña de "Agencias" de Sheets.
2. **Registro de Pedido:** La aplicación frontend toma toda la información del carrito y del usuario y llama a la función backend alojada en Netlify (`netlify/functions/pagar.js`).
3. **Notificación y Registro:**
   - La función Netlify enviará un correo o mensaje de confirmación interno. El cliente es redirigido al WhatsApp oficial de ventas (+51 916626663) con un resumen pre-armado y el monto a pagar.
4. **El cliente debe confirmar enviando la captura del pago por WhatsApp.** (Si el pago es por Mercado Pago u otro método automatizado, se valida directamente).

---

## 3. Despliegue y Configuración en Netlify desde 0

Para publicar la tienda y que funcione todo correctamente, debes configurarlo en Netlify siguiendo estos pasos:

### Pasos iniciales
1. Entra a [Netlify](https://www.netlify.com/) y haz login con tu cuenta.
2. Haz clic en **"Add new site"** y elige **"Import an existing project"** desde GitHub.
3. Conecta tu cuenta de GitHub y selecciona el repositorio de `Mom Shop Stop`.

### Configuración del Build
Al configurar el proyecto, te pedirá "Build settings". Debes colocar:
- **Base directory**: `.` (Dejar vacío o simplemente la raíz)
- **Build command**: `npm install && node build.js`
- **Publish directory**: `.` (Asegúrate de que `index.html` esté en la raíz expuesta).

Haz clic en **"Deploy site"**. Netlify comenzará a instalar las dependencias (como `PapaParse` y otras que usa `build.js`) y generará los archivos estáticos del Blog.

### ¿Qué hace `build.js`?
Este script es fundamental. Durante el build de Netlify, se conecta a tu Google Sheet (pestaña `Blog`), extrae todos los posts y genera **archivos estáticos reales** (ej. `beneficios-del-colageno.html`). Esto garantiza que tu sitio cargue a la velocidad de la luz y que Google lo indexe perfectamente para SEO.

> **Importante:** Si escribes un nuevo post en el Excel, la página no se actualizará mágicamente al instante, ya que requiere que Netlify genere los HTMLs estáticos. Para hacer esto con un solo clic (sin entrar a Netlify), puedes configurar un Webhook.

### Automatiza el Despliegue desde Google Sheets (Botón "PUBLICAR BLOG")

En lugar de entrar a Netlify cada vez que escribas un post, puedes crear un botón mágico en tu Excel que lance la actualización. Sigue estos pasos:

**Paso 1: Consigue la URL del Webhook en Netlify**
1. Ve a tu proyecto en Netlify.
2. Ve a **Site configuration** > **Build & deploy** > **Continuous deployment**.
3. Baja hasta la sección **Build hooks** y haz clic en **"Add build hook"**.
4. Ponle un nombre (ej. "Google Sheets Botón") y elige la rama `main` (o `master`).
5. Copia la URL que te genera (ej. `https://api.netlify.com/build_hooks/xxxxxxxxx`).

**Paso 2: Agrega el código a Google Sheets**
1. En tu archivo de Google Sheets, ve a **Extensiones** > **Apps Script**.
2. Borra lo que haya y pega este código:

```javascript
function publicarBlogEnNetlify() {
  // REEMPLAZA LA URL DE ABAJO CON TU BUILD HOOK DE NETLIFY
  var webhookUrl = "https://api.netlify.com/build_hooks/AQUI_TU_ID";
  
  var options = {
    "method": "post"
  };
  
  try {
    UrlFetchApp.fetch(webhookUrl, options);
    SpreadsheetApp.getUi().alert("✅ ¡Éxito! Netlify está construyendo tu blog. Tu nueva página estará disponible en unos minutos.");
  } catch(e) {
    SpreadsheetApp.getUi().alert("❌ Ocurrió un error al intentar avisar a Netlify: " + e.message);
  }
}
```
3. Reemplaza la URL en el código con la que copiaste en el Paso 1 y haz clic en el botón de **Guardar** 💾.
4. Cierra la pestaña de Apps Script.

**Paso 3: Crea el Botón en tu Hoja**
1. En tu Google Sheet (en la pestaña Blog o donde gustes), ve a **Insertar** > **Dibujo**.
2. Dibuja un botón bonito (puedes usar la herramienta de formas) y ponle texto como **"🚀 PUBLICAR BLOG"**. Haz clic en "Guardar y cerrar".
3. El botón aparecerá en tu hoja. Haz clic derecho sobre él o haz clic en los 3 puntitos que aparecen en la esquina del botón.
4. Selecciona **Asignar secuencia de comandos**.
5. Escribe exactamente el nombre de la función: `publicarBlogEnNetlify` y dale a Aceptar.

¡Listo! La primera vez que le des clic te pedirá permisos de Google (Autorización requerida -> Continuar -> Elige tu cuenta -> Configuración Avanzada -> Ir a Proyecto). A partir de ahí, solo dale clic y tu blog se publicará mágicamente en internet en 1 o 2 minutos.

---

## 4. Notas de Optimización y UX Implementadas

- **Animación en Cascada (Intersection Observer):** Las tarjetas de producto solo cargan su animación al aparecer en pantalla, reduciendo el trabajo del navegador.
- **Validación Visual de Teléfono:** Al escribir 9 dígitos empezando con 9, un check verde confirma al usuario que el número es correcto.
- **Buscador Animado y Memoria:** El placeholder sugiere búsquedas y almacena el historial del usuario localmente (`localStorage`).
- **Carrito Inteligente y Cross-Sell Avanzado:** 
  - Si un usuario se va y vuelve, el carrito se recupera.
  - El modal del carrito, cuando se añade algo, se abre automáticamente para mejor visibilidad.
  - El sistema de "También te podría interesar" ahora mezcla productos de *diferentes categorías* asegurando siempre una oferta variada.
- **FAQ Dinámico Nativos:** Construido con `<details>` y `<summary>` para un mejor SEO sin dependencia en JavaScript.

---
*¡Con esto, Mom Shop Stop está lista para escalar, vender sin fricciones y posicionarse impecablemente en buscadores!*
