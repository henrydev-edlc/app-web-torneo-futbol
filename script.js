// =========================
// script.js - actualizado para operar con operaciones.php
// =========================

// =========================
// LOGIN
// =========================
document.addEventListener("DOMContentLoaded", () => {
    const btnIngresar = document.getElementById("ingresar");
    if (btnIngresar) {
        btnIngresar.addEventListener("click", async (e) => {
            e.preventDefault();
            const usuario = document.getElementById("usuario").value.trim();
            const contra = document.getElementById("contra").value.trim();

            if (usuario === "" || contra === "") {
                alert("Por favor ingresa usuario y contraseña.");
                return;
            }

            try {
                const res = await fetch("operaciones.php", {
                    method: "POST",
                    body: new URLSearchParams({
                        accion: "login",
                        usuario,
                        contra
                    })
                });
                const data = await res.json();

                if (data.success) {
                    window.location.href = "menu.html"; // redirige al menú principal
                } else {
                    alert("Usuario o contraseña incorrectos ⚠️");
                }
            } catch (error) {
                alert("Error al conectar con el servidor PHP.");
                console.error(error);
            }
        });
    }
});

// =========================
// MOSTRAR SECCIONES
// =========================
function mostrar(seccionId) {
    document.querySelectorAll(".seccion").forEach(sec => sec.style.display = "none");
    const target = document.getElementById(seccionId);
    if (target) target.style.display = "block";

    if (seccionId === "equipos") listarEquipos();
    if (seccionId === "partidos") listarPartidos();
    if (seccionId === "galeria") listarGaleria();
}

// =========================
// CERRAR SESIÓN
// =========================
async function cerrarSesion() {
    if (!confirm("¿Deseas cerrar sesión?")) return;

    const res = await fetch("operaciones.php", {
        method: "POST",
        body: new URLSearchParams({ accion: "logout" })
    });
    const data = await res.json();

    if (data.success) {
        window.location.href = "login.html";
    }
}

// =========================
// CRUD EQUIPOS
// =========================
async function crearEquipo() {
    const nombre = document.getElementById("nombreEquipo").value.trim();
    const integrantes = document.getElementById("numIntegrantes").value.trim();
    const capitan = document.getElementById("capitanEquipo").value.trim();

    if (!nombre || !integrantes || !capitan) {
        alert("Completa todos los campos.");
        return;
    }

    const res = await fetch("operaciones.php", {
        method: "POST",
        body: new URLSearchParams({
            accion: "crearEquipo",
            nombre,
            integrantes,
            capitan
        })
    });

    const data = await res.json();
    if (data.success) {
        listarEquipos();
        document.getElementById("formEquipos").reset();
    }
}

async function listarEquipos() {
    const res = await fetch("operaciones.php", {
        method: "POST",
        body: new URLSearchParams({ accion: "listarEquipos" })
    });
    const data = await res.json();

    const tbody = document.querySelector("#tablaEquipos tbody");
    if (!tbody) return;
    tbody.innerHTML = "";
    data.data.forEach(eq => {
        const tr = document.createElement("tr");
        // agrego data-id por si más adelante lo necesitas
        tr.setAttribute("data-id", eq.id);
        tr.innerHTML = `
            <td>${eq.id}</td>
            <td>${eq.nombre}</td>
            <td>${eq.integrantes}</td>
            <td>${eq.capitan}</td>
        `;
        tbody.appendChild(tr);
    });

    // Cargar equipos en combobox de partidos y galería
    actualizarCombosEquipos(data.data);
}

// =========================
// NUEVA LÓGICA DE SELECCIÓN Y EDICIÓN DE EQUIPOS
// =========================
let equipoSeleccionado = null;
let modoEdicion = false;

// Detectar selección de fila (equipos)
document.addEventListener("click", (e) => {
    if (e.target.closest("#tablaEquipos tbody tr")) {
        const fila = e.target.closest("tr");
        document.querySelectorAll("#tablaEquipos tbody tr").forEach(tr => tr.classList.remove("seleccionado"));
        fila.classList.add("seleccionado");

        // Guardar datos seleccionados
        equipoSeleccionado = {
            id: fila.children[0].textContent,
            nombre: fila.children[1].textContent,
            integrantes: fila.children[2].textContent,
            capitan: fila.children[3].textContent
        };
    }
});

// =========================
// EDITAR / GUARDAR EQUIPO
// =========================
async function editarEquipo() {
    const btnEditar = document.querySelector("button[onclick='editarEquipo()']");

    if (!equipoSeleccionado) {
        alert("Selecciona primero un equipo de la tabla.");
        return;
    }

    if (modoEdicion) {
        if (!confirm("¿Confirmas los cambios realizados?")) return;

        const nombre = document.getElementById("nombreEquipo").value.trim();
        const integrantes = document.getElementById("numIntegrantes").value.trim();
        const capitan = document.getElementById("capitanEquipo").value.trim();

        const res = await fetch("operaciones.php", {
            method: "POST",
            body: new URLSearchParams({
                accion: "editarEquipo",
                id: equipoSeleccionado.id,
                nombre,
                integrantes,
                capitan
            })
        });

        const data = await res.json();
        if (data.success) {
            listarEquipos();
            cancelarOperacion();
        } else {
            alert("No se pudieron guardar los cambios ⚠️");
        }

        if (btnEditar) btnEditar.textContent = "Editar / Guardar";
        modoEdicion = false;
    } else {
        document.getElementById("nombreEquipo").value = equipoSeleccionado.nombre;
        document.getElementById("numIntegrantes").value = equipoSeleccionado.integrantes;
        document.getElementById("capitanEquipo").value = equipoSeleccionado.capitan;

        if (btnEditar) btnEditar.textContent = "Guardar";
        modoEdicion = true;
    }
}

// =========================
// CANCELAR OPERACIÓN
// =========================
function cancelarOperacion() {
    const form = document.getElementById("formEquipos");
    if (form) form.reset();
    document.querySelectorAll("#tablaEquipos tbody tr").forEach(tr => tr.classList.remove("seleccionado"));
    equipoSeleccionado = null;
    modoEdicion = false;
    const btn = document.querySelector("button[onclick='editarEquipo()']");
    if (btn) btn.textContent = "Editar / Guardar";
}

// =========================
// BORRAR EQUIPO
// =========================
async function borrarEquipo() {
    if (!equipoSeleccionado) {
        alert("Selecciona primero un equipo para eliminar.");
        return;
    }

    if (!confirm(`¿Seguro que deseas eliminar el equipo "${equipoSeleccionado.nombre}"?`)) return;

    const res = await fetch("operaciones.php", {
        method: "POST",
        body: new URLSearchParams({
            accion: "borrarEquipo",
            id: equipoSeleccionado.id
        })
    });

    const data = await res.json();
    if (data.success) {
        listarEquipos();
        cancelarOperacion();
    }
}


// =========================
// CRUD PARTIDOS
// =========================
async function crearPartido() {
    const equipo1 = document.getElementById("equipo1").value;
    const equipo2 = document.getElementById("equipo2").value;

    if (equipo1 === equipo2) {
        alert("Los equipos deben ser diferentes.");
        return;
    }

    const res = await fetch("operaciones.php", {
        method: "POST",
        body: new URLSearchParams({
            accion: "crearPartido",
            equipo1,
            equipo2
        })
    });

    const data = await res.json();
    if (data.success) listarPartidos();
}

async function listarPartidos() {
    const res = await fetch("operaciones.php", {
        method: "POST",
        body: new URLSearchParams({ accion: "listarPartidos" })
    });

    const data = await res.json();
    const tbody = document.querySelector("#tablaPartidos tbody");
    if (!tbody) return;
    tbody.innerHTML = "";
    data.data.forEach(p => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${p.id}</td>
            <td>${p.equipo1}</td>
            <td>
                <input type="text" class="inputMarcador" value="${p.marcador}" style="width:80px;text-align:center;" readonly>
            </td>
            <td>${p.equipo2}</td>
        `;
        tbody.appendChild(tr);
    });
}

let partidoSeleccionado = null;
let modoEdicionPartido = false;

// Detectar selección de fila (partidos)
document.addEventListener("click", (e) => {
    if (e.target.closest("#tablaPartidos tbody tr")) {
        const fila = e.target.closest("tr");
        document.querySelectorAll("#tablaPartidos tbody tr").forEach(tr => tr.classList.remove("seleccionado"));
        fila.classList.add("seleccionado");

        partidoSeleccionado = {
            id: fila.children[0].textContent,
            equipo1: fila.children[1].textContent,
            marcador: fila.children[2].textContent,
            equipo2: fila.children[3].textContent
        };
    }
});

async function borrarPartido() {
    if (!partidoSeleccionado) {
        alert("Selecciona primero un partido para eliminar.");
        return;
    }

    if (!confirm(`¿Seguro que deseas eliminar el partido ${partidoSeleccionado.equipo1} vs ${partidoSeleccionado.equipo2}?`)) return;

    const res = await fetch("operaciones.php", {
        method: "POST",
        body: new URLSearchParams({
            accion: "borrarPartido",
            id: partidoSeleccionado.id
        })
    });

    const data = await res.json();
    if (data.success) {
        listarPartidos();
        partidoSeleccionado = null;
    }
}


async function editarPartido() {
    const btnEditar = document.querySelector("button[onclick='editarPartido()']");
    const select1 = document.getElementById("equipo1");
    const select2 = document.getElementById("equipo2");
    const tabla = document.querySelector("#tablaPartidos tbody");

    if (!partidoSeleccionado) {
        alert("Selecciona primero un partido para editar.");
        return;
    }

    if (modoEdicionPartido) {
        if (!confirm("¿Deseas guardar los cambios realizados?")) return;

        const equipo1 = select1.value;
        const equipo2 = select2.value;

        if (equipo1 === equipo2) {
            alert("Los equipos deben ser diferentes.");
            return;
        }

        const filaSeleccionada = tabla.querySelector(".seleccionado");
        const inputMarcador = filaSeleccionada.querySelector(".inputMarcador");
        const marcador = inputMarcador ? inputMarcador.value : partidoSeleccionado.marcador;

        const res = await fetch("operaciones.php", {
            method: "POST",
            body: new URLSearchParams({
                accion: "editarPartido",
                id: partidoSeleccionado.id,
                equipo1,
                equipo2,
                marcador
            })
        });

        const data = await res.json();
        if (data.success) {
            listarPartidos();
            cancelarOperacionPartido();
        }

        if (btnEditar) btnEditar.textContent = "Editar / Guardar";
        modoEdicionPartido = false;
        return;
    }

    modoEdicionPartido = true;
    if (btnEditar) btnEditar.textContent = "Guardar";

    select1.value = partidoSeleccionado.equipo1;
    select2.value = partidoSeleccionado.equipo2;

    const filaSeleccionada = tabla.querySelector("tr.seleccionado");
    const tdMarcador = filaSeleccionada.children[2];

    let valorActual = partidoSeleccionado.marcador;
    const inputExistente = tdMarcador.querySelector(".inputMarcador");
    if (inputExistente) valorActual = inputExistente.value;

    tdMarcador.innerHTML = `
        <input type="text" class="inputMarcador" value="${valorActual}" 
        style="width:80px; text-align:center;">
    `;
}

function cancelarOperacionPartido() {
    const tabla = document.querySelector("#tablaPartidos tbody");
    const select1 = document.getElementById("equipo1");
    const select2 = document.getElementById("equipo2");
    const btnEditar = document.querySelector("button[onclick='editarPartido()']");

    tabla.querySelectorAll("tr").forEach(tr => tr.classList.remove("seleccionado"));

    if (partidoSeleccionado) {
        const filaSeleccionada = tabla.querySelector(`tr[data-id='${partidoSeleccionado.id}']`);
        if (filaSeleccionada) {
            const tdMarcador = filaSeleccionada.children[2];
            tdMarcador.innerHTML = `<input type="text" class="inputMarcador" value="${partidoSeleccionado.marcador}" style="width:80px;text-align:center;" readonly>`;
        }
    }

    if (select1) select1.selectedIndex = 0;
    if (select2) select2.selectedIndex = 0;

    partidoSeleccionado = null;
    modoEdicionPartido = false;
    if (btnEditar) btnEditar.textContent = "Editar / Guardar";
}


// =========================
// GALERÍA DE ESCUDOS (integrada con operaciones.php)
// =========================

/*
  Reglas:
  - operaciones.php espera:
    - POST con FormData: { accion: 'agregarEscudo' | 'cambiarEscudo', escudo: <file>, equipo: <nombreEquipo> }
    - Para eliminar: POST body urlencoded { accion: 'eliminarEscudo', equipo: <nombreEquipo> }
    - Para listar: POST body urlencoded { accion: 'listarGaleria' }
*/

let idEquipoSeleccionado = null;
const escudos = {}; // { equipoNombre: { nombre, src } }


document.addEventListener("DOMContentLoaded", () => {

    async function listarGaleria() {
        // pide a operaciones.php la lista (data/galeria.json)
        try {
            const res = await fetch("operaciones.php", {
                method: "POST",
                body: new URLSearchParams({ accion: "listarGaleria" })
            });
            const data = await res.json();
            if (!data.ok) {
                console.error("Error listarGaleria:", data);
                return;
            }
            // data.data es array de { equipo, url }
            // Limpiar escudos y poblar
            Object.keys(escudos).forEach(k => delete escudos[k]);
            (data.data || []).forEach(item => {
                // item.equipo es el identificador que usamos (en tu PHP usas el nombre del equipo)
                escudos[item.equipo] = {
                    nombre: item.equipo,
                    src: item.url // suponemos que ruta pública ya está construida en PHP (p.ej. '/escudos/archivo.png')
                };
            });
            // actualizar UI
            mostrarEscudos();
            actualizarBotones(); // por si no hay selección
        } catch (err) {
            console.error("Error cargando galería:", err);
        }
    }

    // Helper: subir archivo al servidor usando operaciones.php
    async function subirArchivoAlServidor(archivo, equipo, accion) {
        const form = new FormData();
        form.append("escudo", archivo);
        form.append("equipo", equipo);
        form.append("accion", accion); // 'agregarEscudo' o 'cambiarEscudo'

        const res = await fetch("operaciones.php", {
            method: "POST",
            body: form
        });

        if (!res.ok) {
            const txt = await res.text();
            throw new Error("Error al subir: " + txt);
        }

        const data = await res.json();
        if (!data.ok) throw new Error(data.error || "Respuesta inválida del servidor");
        return data.url;
    }

    async function eliminarEscudoServidor(equipo) {
        const res = await fetch("operaciones.php", {
            method: "POST",
            body: new URLSearchParams({ accion: "eliminarEscudo", equipo })
        });
        return await res.json(); // { ok: true } o { ok: false, error }
    }


    // obtener referencias (si existen)
    const selectGaleria = document.getElementById("selectGaleria");
    const btnAgregar = document.getElementById("btnAgregar");
    const btnCambiar = document.getElementById("btnCambiar");
    const btnEliminar = document.getElementById("btnEliminar");
    const galeriaGrid = document.getElementById("galeriaGrid");

    // si no existe el selectGaleria significa que la vista actual no tiene galería, así que no hacemos nada
    if (!selectGaleria) return;

    // cuando se cargan equipos, actualizarCombosEquipos (desde listarEquipos) llenará el select
    selectGaleria.addEventListener("change", () => {
        idEquipoSeleccionado = selectGaleria.value;
        actualizarBotones();
        mostrarEscudos();
    });

    // AGREGAR
    if (btnAgregar) {
        btnAgregar.addEventListener("click", () => {
            if (!idEquipoSeleccionado) return;

            const input = document.createElement("input");
            input.type = "file";
            input.accept = "image/*";

            input.onchange = async e => {
                const archivo = e.target.files[0];
                if (!archivo) return;

                try {
                    const urlServidor = await subirArchivoAlServidor(archivo, idEquipoSeleccionado, "agregarEscudo");
                    escudos[idEquipoSeleccionado] = {
                        nombre: idEquipoSeleccionado,
                        src: urlServidor
                    };
                    mostrarEscudos();
                    actualizarBotones();
                } catch (err) {
                    console.error(err);
                    alert("No se pudo subir el escudo: " + err.message);
                }
            };

            input.click();
        });
    }

    // CAMBIAR
    if (btnCambiar) {
        btnCambiar.addEventListener("click", () => {
            if (!idEquipoSeleccionado || !escudos[idEquipoSeleccionado]) return;

            const input = document.createElement("input");
            input.type = "file";
            input.accept = "image/*";

            input.onchange = async e => {
                const archivo = e.target.files[0];
                if (!archivo) return;

                try {
                    const urlServidor = await subirArchivoAlServidor(archivo, idEquipoSeleccionado, "cambiarEscudo");
                    escudos[idEquipoSeleccionado].src = urlServidor;
                    mostrarEscudos();
                } catch (err) {
                    console.error(err);
                    alert("No se pudo actualizar el escudo: " + err.message);
                }
            };

            input.click();
        });
    }

    // ELIMINAR
    if (btnEliminar) {
        btnEliminar.addEventListener("click", async () => {
            if (!idEquipoSeleccionado || !escudos[idEquipoSeleccionado]) return;

            if (!confirm(`¿Deseas eliminar el escudo de "${idEquipoSeleccionado}"?`)) return;

            try {
                const data = await eliminarEscudoServidor(idEquipoSeleccionado);
                if (data.ok) {
                    delete escudos[idEquipoSeleccionado];
                    mostrarEscudos();
                    actualizarBotones();
                } else {
                    alert("No se pudo eliminar el escudo: " + (data.error || "error desconocido"));
                }
            } catch (err) {
                console.error(err);
                alert("Error al eliminar en el servidor: " + err.message);
            }
        });
    }

    // ----- Funciones de UI para la galería (deben estar en ámbito global) -----
    let lastRenderedKeys = null;

    function mostrarEscudos() {
        // obtener elementos cuando se requiere (puede llamarse antes de DOMContentLoaded en algunos flujos)
        const galeriaGrid = document.getElementById("galeriaGrid");
        const selectGaleria = document.getElementById("selectGaleria");

        if (!galeriaGrid) return;

        const keys = Object.keys(escudos).sort().join(',');
        if (lastRenderedKeys === keys) return;
        lastRenderedKeys = keys;

        galeriaGrid.innerHTML = "";

        for (const id in escudos) {
            const escudo = escudos[id];
            const card = document.createElement("div");
            card.className = "escudo-card";

            const img = document.createElement("img");

            // Normalizar src recibido
            // Normalizar src recibido
            let src = String(escudo.src || '');
            src = src.replace(/^file:\/\//i, '').replace(/^[a-zA-Z]:\\/, '').replace(/\\/g, '/').trim();

            if (!/^https?:\/\//i.test(src) && !src.startsWith('/')) {
                src = '/' + src;
            }

            img.src = src;

            try {
                const parts = src.split('?');
                parts[0] = parts[0].split('/').map(encodeURIComponent).join('/');
                src = parts.join('?');
            } catch (e) { /* ignore */ }

            img.src = src;
            img.alt = escudo.nombre || id;
            img.style.maxWidth = "100%";
            img.style.display = "block";

            img.onerror = function () {
                img.onerror = null; // prevenir loop
                // ajusta ruta aquí si tu placeholder está en otro sitio
                img.src = '/img/placeholder.png';
            };

            const p = document.createElement("p");
            p.textContent = escudo.nombre || id;

            card.appendChild(img);
            card.appendChild(p);

            card.addEventListener("click", () => {
                galeriaGrid.querySelectorAll(".escudo-card").forEach(c => c.classList.remove("seleccionado"));
                card.classList.add("seleccionado");
                idEquipoSeleccionado = id;
                if (selectGaleria) selectGaleria.value = id;
                actualizarBotones();
            });

            galeriaGrid.appendChild(card);
        }
    }

    function actualizarBotones() {
        const selectGaleria = document.getElementById("selectGaleria");
        const btnAgregar = document.getElementById("btnAgregar");
        const btnCambiar = document.getElementById("btnCambiar");
        const btnEliminar = document.getElementById("btnEliminar");

        if (!btnAgregar || !btnCambiar || !btnEliminar || !selectGaleria) return;

        const tieneEscudo = !!escudos[idEquipoSeleccionado];
        btnAgregar.disabled = !idEquipoSeleccionado || tieneEscudo;
        btnCambiar.disabled = !tieneEscudo;
        btnEliminar.disabled = !tieneEscudo;
    }

    // al cargar la página de galería, pedir la lista actual
    listarGaleria();
});


//===========================================================================================
// FASE FINAL
// ==========================
let equiposGanadores = []; // Se llena desde los partidos

document.addEventListener("DOMContentLoaded", () => {
    const rondasContainer = document.getElementById("rondasContainer");
    const faseInicio = document.getElementById("faseInicio");
    const btnGenerarRonda = document.getElementById("btnGenerarRonda");

    if (!btnGenerarRonda) return;
    btnGenerarRonda.addEventListener("click", () => {
        if (!equiposGanadores.length) {
            alert("No hay ganadores registrados de los partidos.");
            return;
        }
        generarFaseFinal(faseInicio.value);
    });
});

// ================= Registrar Ganadores de Partidos =================
function registrarGanadoresPartidos() {
    const filas = document.querySelectorAll("#tablaPartidos tbody tr");
    equiposGanadores = [];

    filas.forEach(fila => {
        const marcador = fila.children[2].querySelector(".inputMarcador")?.value || fila.children[2].textContent;
        if (!marcador.includes("-")) return;
        const [g1, g2] = marcador.split("-").map(n => parseInt(n.trim()));
        if (isNaN(g1) || isNaN(g2)) return;

        if (g1 > g2) equiposGanadores.push(fila.children[1].textContent);
        else if (g2 > g1) equiposGanadores.push(fila.children[3].textContent);
    });

    console.log("Ganadores registrados:", equiposGanadores);
}

// ================= Generar Fase Final =================
function generarFaseFinal(fase) {
    const rondasContainer = document.getElementById("rondasContainer");
    if (!rondasContainer) return;
    rondasContainer.innerHTML = "";

    let equipos = [...equiposGanadores];
    const cantidadNecesaria = fase === "cuartos" ? 8 : 4;

    if (equipos.length < cantidadNecesaria) {
        alert(`Se necesitan ${cantidadNecesaria} equipos para ${fase}`);
        return;
    }

    equipos = equipos.slice(0, cantidadNecesaria);
    let rondaActual = fase;

    while (equipos.length >= 2) {
        crearTablaRonda(rondaActual, equipos);
        const siguienteRonda = [];
        for (let i = 0; i < Math.floor(equipos.length / 2); i++) {
            siguienteRonda.push("-", "-");
        }
        equipos = siguienteRonda;

        if (rondaActual === "cuartos") rondaActual = "semifinal";
        else if (rondaActual === "semifinal") rondaActual = "final";
        else break;
    }

    actualizarSiguienteRonda();
}

// ================= Crear Tabla de Cada Ronda =================
function crearTablaRonda(nombreRonda, equipos) {
    const rondasContainer = document.getElementById("rondasContainer");
    if (!rondasContainer) return;
    const div = document.createElement("div");
    div.style.marginTop = "20px";
    div.innerHTML = `<h2>${nombreRonda.charAt(0).toUpperCase() + nombreRonda.slice(1)}</h2>`;

    const table = document.createElement("table");
    table.style.marginTop = "5px";
    table.style.borderCollapse = "collapse";
    table.innerHTML = `
        <thead>
            <tr>
                <th>#</th>
                <th>Equipo 1</th>
                <th>Marcador</th>
                <th>Equipo 2</th>
                <th>Ganador</th>
            </tr>
        </thead>
        <tbody></tbody>
    `;
    div.appendChild(table);
    rondasContainer.appendChild(div);

    const tbody = table.querySelector("tbody");

    for (let i = 0; i < equipos.length; i += 2) {
        const eq1 = equipos[i] || "-";
        const eq2 = equipos[i + 1] || "-";

        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${i / 2 + 1}</td>
            <td>${eq1}</td>
            <td><input type="text" class="inputMarcador" value="0-0" style="width:50px;text-align:center;"></td>
            <td>${eq2}</td>
            <td class="ganador">-</td>
        `;
        tbody.appendChild(tr);

        const inputMarcador = tr.querySelector(".inputMarcador");
        inputMarcador.addEventListener("blur", () => {
            actualizarGanadorFila(tr);
            actualizarSiguienteRonda();
        });
    }
}

// ================= Actualizar ganador de una fila =================
function actualizarGanadorFila(fila) {
    const marcador = fila.querySelector(".inputMarcador").value.trim();
    const eq1 = fila.children[1].textContent;
    const eq2 = fila.children[3].textContent;
    const tdGanador = fila.querySelector(".ganador");

    if (!marcador.includes("-")) {
        tdGanador.textContent = "-";
        return;
    }

    const [g1, g2] = marcador.split("-").map(n => parseInt(n.trim()));
    if (isNaN(g1) || isNaN(g2)) {
        tdGanador.textContent = "-";
        return;
    }

    tdGanador.textContent = g1 > g2 ? eq1 : g2 > g1 ? eq2 : "-";
}

// ================= Actualizar Siguiente Ronda =================
function actualizarSiguienteRonda() {
    const rondasContainer = document.getElementById("rondasContainer");
    if (!rondasContainer) return;
    const tablas = rondasContainer.querySelectorAll("table");

    for (let t = 0; t < tablas.length - 1; t++) {
        const filas = tablas[t].querySelectorAll("tbody tr");
        const siguiente = tablas[t + 1].querySelectorAll("tbody tr");

        let idxSiguiente = 0;
        let equipoPos = 1;

        filas.forEach(fila => {
            const ganador = fila.querySelector(".ganador").textContent;
            if (!ganador || ganador === "-") return;

            const c1 = siguiente[idxSiguiente].children[1];
            const c2 = siguiente[idxSiguiente].children[3];

            if (equipoPos === 1) {
                if (c1.textContent === "-") c1.textContent = ganador;
                equipoPos = 2;
            } else {
                if (c2.textContent === "-") c2.textContent = ganador;
                equipoPos = 1;
                idxSiguiente++;
            }
        });
    }
}


// ====================================================================================================

// CODIGO PARTE GALERIA - helpers adicionales
function actualizarCombosEquipos(equipos) {
    const select1 = document.getElementById("equipo1");
    const select2 = document.getElementById("equipo2");
    const selectGaleria = document.getElementById("selectGaleria");

    if (!select1 || !select2 || !selectGaleria) return;

    // Limpiar opciones previas
    select1.innerHTML = "";
    select2.innerHTML = "";
    selectGaleria.innerHTML = "";

    equipos.forEach(eq => {
        const opt1 = document.createElement("option");
        opt1.value = eq.nombre;    // usamos nombre como identificador, que es lo que espera tu PHP
        opt1.textContent = eq.nombre;
        select1.appendChild(opt1);

        const opt2 = opt1.cloneNode(true);
        select2.appendChild(opt2);

        const opt3 = opt1.cloneNode(true);
        selectGaleria.appendChild(opt3);
    });

    // Activar/desactivar botones de galería según haya equipos
    const btnAgregar = document.getElementById("btnAgregar");
    const btnCambiar = document.getElementById("btnCambiar");
    const btnEliminar = document.getElementById("btnEliminar");
    if (btnAgregar) btnAgregar.disabled = equipos.length === 0;
    if (btnCambiar) btnCambiar.disabled = equipos.length === 0;
    if (btnEliminar) btnEliminar.disabled = equipos.length === 0;
}
