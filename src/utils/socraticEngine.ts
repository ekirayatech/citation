/**
 * Motor Pedagógico Socrático para el Tutor IA de Cita Master (Colegio Ekirayá)
 * Ofrece orientación guiada, reflexiva y de alta calidad pedagógica cuando el estudiante
 * realiza consultas sobre citación o referencias, respetando la regla de oro:
 * Guiar con preguntas y método sin resolver la cita directamente.
 */

export function generateSocraticFallbackGuidance(message: string, context?: any): string {
  const m = (message || '').toLowerCase();

  // Caso 1: Revisar el formulario actual del estudiante
  if (
    m.includes('revisar') ||
    m.includes('formulario') ||
    m.includes('mis campos') ||
    m.includes('cómo voy') ||
    m.includes('qué opinas') ||
    m.includes('borrador')
  ) {
    const feedback: string[] = [];
    const missing: string[] = [];

    if (context) {
      if (context.title) {
        feedback.push(
          `• **Título:** Ya ingresaste "${context.title}". Pregúntate: ¿esta obra es completa y autónoma (como un libro o tesis) o forma parte de otra publicación mayor (como un artículo de revista)? Recuerda que en APA 7 solo las obras completas llevan el título en cursiva.`
        );
      } else {
        missing.push('el **Título** del trabajo');
      }

      if (
        (context.authors &&
          context.authors.length > 0 &&
          context.authors.some((a: any) => a.lastName)) ||
        (context.isInstitutionalAuthor &&
          (context.institutionalName || context.institutionName))
      ) {
        feedback.push(
          `• **Autoría:** Identificaste al autor. Recuerda la regla: en la lista de referencias se coloca el apellido seguido de la inicial del nombre (ej. Gómez, M.), mientras que en el texto se usa solo el apellido.`
        );
      } else {
        missing.push('el **Autor** (personal o institucional)');
      }

      if (context.year) {
        feedback.push(
          `• **Año:** Tienes el año (${context.year}). En la referencia debe ir entre paréntesis inmediatamente después del autor.`
        );
      } else {
        missing.push('la **Fecha/Año** (o verificar si corresponde colocar "s.f." si de verdad no existe)');
      }

      if (context.publisher || context.url || context.doi) {
        feedback.push(
          `• **Fuente:** Tienes información de la editorial o enlace (${
            context.publisher || context.url || context.doi
          }). En APA 7 ya no se coloca "Recuperado de" ni la ciudad física para libros.`
        );
      } else {
        missing.push('la **Editorial, Revista o Enlace oficial**');
      }
    }

    let response = `¡Buen trabajo revisando tus avances! 🦉\n\n`;
    if (feedback.length > 0) {
      response += `**Lo que tienes identificado hasta ahora:**\n${feedback.join('\n')}\n\n`;
    }
    if (missing.length > 0) {
      response += `**Elementos que aún debes investigar o completar:**\nTe falta definir ${missing.join(', ')}.\n\n`;
    }
    response += `¿Cuál de estos datos te está costando más trabajo localizar en tu fuente?`;
    return response;
  }

  // Caso 2: Piden que les hagan la cita directamente
  if (
    m.includes('hazme la cita') ||
    m.includes('dame la cita') ||
    m.includes('cómo queda') ||
    m.includes('escríbeme') ||
    m.includes('hazme') ||
    m.includes('dime la cita')
  ) {
    return `¡Hola! Como tu Tutor Socrático de Ekirayá, no te entrego la cita terminada para que tú mismo desarrolles tu pensamiento crítico y autonomía académica 🧠.

En cambio, desglosémosla juntos respondiendo estas 4 preguntas clave:
1. **¿Quién?** (Autor: ¿tienes el primer apellido del autor?).
2. **¿Cuándo?** (Año: ¿en qué año se publicó?).
3. **¿Qué?** (Título: ¿es un libro completo o un artículo dentro de otra revista?).
4. **¿Dónde?** (Fuente: ¿cuál es la editorial o enlace?).

Dime: ¿qué datos tienes de estos cuatro y te guío con el orden y los signos de puntuación?`;
  }

  // Caso 3: Pregunta sobre autores (3 o más, et al.)
  if (
    m.includes('autor') &&
    (m.includes('3') ||
      m.includes('4') ||
      m.includes('varios') ||
      m.includes('et al') ||
      m.includes('muchos'))
  ) {
    return `¡Excelente pregunta sobre la regla de autores múltiples en **APA 7.ª edición**! 📚

Piensa en estas dos situaciones:
• **Para 1 o 2 autores:** Siempre se mencionan ambos autores en cada cita dentro del texto (ej. García y Pérez, 2024).
• **Para 3 o más autores:** ¿Conoces la locución latina *et al.*? En APA 7 se coloca únicamente el primer apellido del primer autor seguido de *"et al."* y el año, ¡desde la primera vez que lo citas en el texto!

¿Cómo se apellida el primer autor de tu lista? Intenta redactar cómo quedaría tu cita en el texto.`;
  }

  // Caso 4: Página web sin autor personal
  if (
    m.includes('sin autor') ||
    m.includes('página web') ||
    m.includes('pagina web') ||
    m.includes('sitio web') ||
    m.includes('institucional')
  ) {
    return `Este es uno de los dilemas más comunes en investigación escolar 🔍.

Pregúntate primero: **¿Quién es responsable de la información que estás leyendo?**
• Si es una organización, entidad o institución reconocida (por ejemplo: la *Organización Mundial de la Salud*, la *NASA*, o el *Ministerio de Educación*), ellos son el **autor institucional o corporativo**.
• Solo si no existe absolutamente ninguna persona ni entidad responsable, la norma APA indica que el **título de la obra** sube a ocupar la posición del autor.

Revisa la página web: ¿encontraste el logotipo o la entidad en la parte superior o en el pie de página? ¿Quién respalda ese contenido?`;
  }

  // Caso 5: Fecha o año faltante
  if (
    m.includes('fecha') ||
    m.includes('año') ||
    m.includes('s.f.') ||
    m.includes('sin fecha') ||
    m.includes('dia') ||
    m.includes('mes')
  ) {
    return `Ubicar la fecha en fuentes digitales requiere buen ojo crítico 🧐:

1. **Revisa bien:** Busca cerca del título del artículo o al final de la página (frecuentemente junto al símbolo de copyright ©).
2. **Cuidado con las fechas dinámicas:** La fecha de actualización de toda la web no siempre es la fecha en que se escribió ese artículo específico.
3. **Si definitivamente no hay fecha:** La norma APA establece usar la abreviatura entre paréntesis: **(s.f.)**, que significa *sin fecha*.

¿Revisaste al inicio o al pie del texto? Si no la encuentras, ¿te animas a ingresar *(s.f.)* en el campo de año del formulario?`;
  }

  // Caso 6: Cursiva (itálica)
  if (
    m.includes('cursiva') ||
    m.includes('italica') ||
    m.includes('formato') ||
    m.includes('itálica')
  ) {
    return `La regla de la cursiva en APA 7 sigue una lógica muy sencilla e intuitiva 💡:

• **Si la obra es "independiente y completa"** (un libro, una tesis, un informe, una película o una página web completa), el **Título de la obra va en cursiva**.
• **Si la obra "forma parte de otra obra mayor"** (un artículo de revista, un capítulo de un libro compilado o una canción de un álbum), el título del artículo va en **texto normal**, y lo que va en cursiva es el **nombre de la revista o del libro contenedor**.

¿Tu fuente es una obra completa o un capítulo/artículo dentro de algo más grande?`;
  }

  // Caso 7: Cita narrativa vs parentética
  if (
    m.includes('narrativa') ||
    m.includes('parentética') ||
    m.includes('parentetica') ||
    m.includes('diferencia') ||
    m.includes('en el texto')
  ) {
    return `¡Comprender esta diferencia transformará tu redacción académica! ✍️

• **Cita Parentética (énfasis en el contenido):** El autor y el año van juntos al final de la idea, encerrados entre paréntesis.
  *Pista:* Se usa cuando lo más importante es el dato o la idea misma.
• **Cita Narrativa (énfasis en el autor):** El autor se incorpora naturalmente en la redacción de la oración, y solo el año va entre paréntesis.
  *Pista:* Se usa cuando quieres destacar la autoridad del investigador (ej. "Como afirma Freire (1970)...").

¿En tu párrafo actual, te interesa darle protagonismo a la voz del autor o a la idea que estás explicando?`;
  }

  // Fallback general pedagógico socrático
  return `¡Hola! Como tu Tutor Socrático de Citación del Colegio Ekirayá 🦉, estoy aquí para guiarte a pensar como un verdadero investigador.

Para resolver tu duda, repasemos los 4 datos esenciales de toda referencia:
1. **¿Quién?** (Autor o autores).
2. **¿Cuándo?** (Año o fecha de publicación).
3. **¿Qué?** (Título del documento).
4. **¿Dónde?** (Editorial, revista o enlace oficial).

Cuéntame: ¿con cuál de estos 4 elementos tienes dudas y qué datos has encontrado hasta el momento?`;
}
