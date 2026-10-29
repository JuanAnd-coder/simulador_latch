# ⚡ Laboratorio de Cronogramas: Compuertas Lógicas y Latch S-R

Un simulador web interactivo para el análisis y aprendizaje de circuitos digitales **combinacionales** (compuertas lógicas básicas) y **secuenciales** (biestables Latch S-R asíncronos con compuertas NOR y NAND).

Permite modificar formas de onda en tiempo real, simular condiciones de carrera y analizar mapas de tiempo/estado paso a paso.


## 📋 Índice

* [Características Principales](#-características-principales)

* [Circuitos y Lógica Soportada](#-circuitos-y-lógica-soportada)

* [Estructura del Proyecto](#-estructura-del-proyecto)

* [Tecnologías Utilizadas](#-tecnologías-utilizadas)

* [Uso Local](#-uso-local)

* [Autor](#-autor)

## 🚀 Características Principales

* 🔄 **Modo Combinacional:** Análisis de compuertas lógicas estándar con tablas de verdad dinámicas y diagramas de circuitos paso a paso.

* ⏱️ **Modo Secuencial (Latch S-R):**

  * Soporte para Latch con compuertas **NOR** (activo en alto) y **NAND** (activo en bajo).

  * Manejo del **estado prohibido** ($S=1, R=1$ en NOR o $\bar{S}=0, \bar{R}=0$ en NAND) y detección de **condiciones de carrera** con estados indeterminados (`?`).

  * Selección del estado inicial de $Q$ (`?`, `0`, `1`).

* 📊 **Cronograma Interactivo:** Generación gráfica en SVG con reproductor paso a paso, ajuste de velocidad y selección directa de tiempo $t$.

* 🎨 **Interfaz Moderna:** Diseño responsivo, selector de tema claro/oscuro dinámico y entrada de secuencias editable por teclado o clics.

## 🧩 Circuitos y Lógica Soportada

### 1. Lógica Combinacional

* **Compuertas:** `AND`, `OR`, `NOT`, `NAND`, `NOR`, `XOR`, `XNOR`.

* Muestra la expresión booleana, descripción funcional y la tabla de verdad destacando la combinación activa en la posición de tiempo seleccionada.

### 2. Lógica Secuencial

* **Latch S-R:** Análisis de entradas de `Set` y `Reset`, estado mantenido ($Q_t$), estado complementario ($\bar{Q}_t$) y tabla de funcionamiento con resaltado en vivo.

## 📁 Estructura del Proyecto

```
simulador-latch-cronogramas/
├── index.html       # Estructura semántica de la interfaz gráfica
├── styles.css       # Estilos visuales, temas (Light/Dark) y componentes SVG
├── script.js       # Lógica del simulador, motor de tiempo y renderizado SVG
└── README.md        # Documentación general del proyecto

```

## 🛠️ Tecnologías Utilizadas

* **HTML5:** Maquetación semántica y accesible.

* **CSS3:** Variables dinámicas para temas, Flexbox/Grid y efectos `glassmorphism`.

* **JavaScript (ES6+):** Motor de simulación sin dependencias externas (*Vanilla JS*).

* **SVG Integrado:** Renderizado vectorial dinámico para los circuitos y cronogramas.

## 🔧 Uso Local

1. **Clonar el repositorio:**

   ```
   git clone https://github.com/JuanAnd-coder/simulador-latch-cronogramas.git
   cd simulador-latch-cronogramas
   
   ```

2. **Ejecutar en el navegador:**
   Abre el archivo `index.html` en tu navegador de preferencia o utiliza la extensión **Live Server** en Visual Studio Code.

## 👤 Autor

Desarrollado por **Juan Andrés Cárdenas** ([@JuanAnd-coder](https://github.com/JuanAnd-coder)).
