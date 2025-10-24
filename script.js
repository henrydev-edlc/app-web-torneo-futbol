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
    document.getElementById(seccionId).style.display = "block";

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
    tbody.innerHTML = "";
    data.data.forEach(eq => {
        const tr = document.createElement("tr");
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

// Detectar selección de fila
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

        // Reflejar en los inputs
        //document.getElementById("nombreEquipo").value = equipoSeleccionado.nombre;
        //document.getElementById("numIntegrantes").value = equipoSeleccionado.integrantes;
        //document.getElementById("capitanEquipo").value = equipoSeleccionado.capitan;
    }
});

// =========================
// EDITAR / GUARDAR EQUIPO
// =========================
async function editarEquipo() {
    const btnEditar = document.querySelector("button[onclick='editarEquipo()']");

    // Verificar que haya selección
    if (!equipoSeleccionado) {
        alert("Selecciona primero un equipo de la tabla.");
        return;
    }

    // Si estamos en modo edición → guardar cambios
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
            //alert("Cambios guardados correctamente ✅");
        } else {
            alert("No se pudieron guardar los cambios ⚠️");
        }

        btnEditar.textContent = "Editar / Guardar";
        modoEdicion = false;
    }
    else {
        // Entrar en modo edición
        //const confirmar = confirm("¿Deseas editar el equipo seleccionado?");
        //if (!confirmar) return;

        // Reflejar los datos seleccionados recién ahora
        document.getElementById("nombreEquipo").value = equipoSeleccionado.nombre;
        document.getElementById("numIntegrantes").value = equipoSeleccionado.integrantes;
        document.getElementById("capitanEquipo").value = equipoSeleccionado.capitan;

        btnEditar.textContent = "Guardar";
        modoEdicion = true;
    }
}


// =========================
// CANCELAR OPERACIÓN
// =========================
function cancelarOperacion() {
    document.getElementById("formEquipos").reset();
    document.querySelectorAll("#tablaEquipos tbody tr").forEach(tr => tr.classList.remove("seleccionado"));
    equipoSeleccionado = null;
    modoEdicion = false;
    document.querySelector("button[onclick='editarEquipo()']").textContent = "Editar / Guardar";
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
        //alert("Equipo eliminado correctamente 🗑️");
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

// Detectar selección de fila
document.addEventListener("click", (e) => {
    if (e.target.closest("#tablaPartidos tbody tr")) {
        const fila = e.target.closest("tr");
        document.querySelectorAll("#tablaPartidos tbody tr").forEach(tr => tr.classList.remove("seleccionado"));
        fila.classList.add("seleccionado");

        // Guardar datos del partido seleccionado
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

    // Si estamos en modo edición → guardar cambios
    if (modoEdicionPartido) {
        if (!confirm("¿Deseas guardar los cambios realizados?")) return;

        const equipo1 = select1.value;
        const equipo2 = select2.value;

        if (equipo1 === equipo2) {
            alert("Los equipos deben ser diferentes.");
            return;
        }

        // Obtener marcador editado, si no se cambió se queda igual
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

        btnEditar.textContent = "Editar / Guardar";
        modoEdicionPartido = false;
        return;
    }

    // Si no estamos en modo edición → entrar en modo edición
    modoEdicionPartido = true;
    btnEditar.textContent = "Guardar";

    // Reflejar valores actuales en los selects
    select1.value = partidoSeleccionado.equipo1;
    select2.value = partidoSeleccionado.equipo2;

    // Hacer editable el marcador sin limpiar el valor actual
    const filaSeleccionada = tabla.querySelector("tr.seleccionado");
    const tdMarcador = filaSeleccionada.children[2];

    let valorActual = partidoSeleccionado.marcador; // valor por defecto
    const inputExistente = tdMarcador.querySelector(".inputMarcador");
    if (inputExistente) valorActual = inputExistente.value; // mantener valor si ya estaba

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

    // Quitar la selección visual
    tabla.querySelectorAll("tr").forEach(tr => tr.classList.remove("seleccionado"));

    // Restaurar marcador original en input readonly
    if (partidoSeleccionado) {
        const filaSeleccionada = tabla.querySelector(`tr[data-id='${partidoSeleccionado.id}']`);
        if (filaSeleccionada) {
            const tdMarcador = filaSeleccionada.children[2];
            tdMarcador.innerHTML = `<input type="text" class="inputMarcador" value="${partidoSeleccionado.marcador}" style="width:80px;text-align:center;" readonly>`;
        }
    }

    // Resetear selects
    if (select1) select1.selectedIndex = 0;
    if (select2) select2.selectedIndex = 0;

    // Restaurar variables y botón
    partidoSeleccionado = null;
    modoEdicionPartido = false;
    if (btnEditar) btnEditar.textContent = "Editar / Guardar";
}




// =========================
// GALERÍA DE ESCUDOS
// =========================
// =========================
// GALERÍA DE ESCUDOS (versión final dinámica)
// =========================

document.addEventListener("DOMContentLoaded", () => {
    const selectGaleria = document.getElementById("selectGaleria");
    const btnAgregar = document.getElementById("btnAgregar");
    const btnCambiar = document.getElementById("btnCambiar");
    const btnEliminar = document.getElementById("btnEliminar");
    const galeriaGrid = document.getElementById("galeriaGrid");

    let idEquipoSeleccionado = null;
    const escudos = {}; // { idEquipo: { nombre, src } }

    // ✅ Esperar a que los equipos se carguen en el select
    // (se asume que ya están cargados dinámicamente desde tu sistema)
    // Si los equipos se cargan después con JS, este listener seguirá funcionando bien

    // === Evento cambio en select (cuando se elige un equipo) ===
    selectGaleria.addEventListener("change", () => {
        idEquipoSeleccionado = selectGaleria.value;
        actualizarBotones();
        mostrarEscudos();
    });

    // === Agregar Escudo ===
    btnAgregar.addEventListener("click", () => {
        if (!idEquipoSeleccionado) return;

        const input = document.createElement("input");
        input.type = "file";
        input.accept = "image/*";

        input.onchange = e => {
            const archivo = e.target.files[0];
            if (!archivo) return;

            const lector = new FileReader();
            lector.onload = ev => {
                const nombreEquipo = selectGaleria.options[selectGaleria.selectedIndex].text;
                escudos[idEquipoSeleccionado] = {
                    nombre: nombreEquipo,
                    src: ev.target.result
                };
                mostrarEscudos();
                actualizarBotones();
            };
            lector.readAsDataURL(archivo);
        };

        input.click();
    });

    // === Cambiar Escudo ===
    btnCambiar.addEventListener("click", () => {
        if (!idEquipoSeleccionado || !escudos[idEquipoSeleccionado]) return;

        const input = document.createElement("input");
        input.type = "file";
        input.accept = "image/*";

        input.onchange = e => {
            const archivo = e.target.files[0];
            if (!archivo) return;

            const lector = new FileReader();
            lector.onload = ev => {
                escudos[idEquipoSeleccionado].src = ev.target.result;
                mostrarEscudos();
            };
            lector.readAsDataURL(archivo);
        };

        input.click();
    });

    // === Eliminar Escudo ===
    btnEliminar.addEventListener("click", () => {
        if (!idEquipoSeleccionado || !escudos[idEquipoSeleccionado]) return;
        delete escudos[idEquipoSeleccionado];
        mostrarEscudos();
        actualizarBotones();
    });

    // === Funciones ===
    function mostrarEscudos() {
        galeriaGrid.innerHTML = "";
        for (const id in escudos) {
            const escudo = escudos[id];
            const card = document.createElement("div");
            card.className = "escudo-card";
            card.innerHTML = `
                <img src="${escudo.src}" alt="${escudo.nombre}">
                <p>${escudo.nombre}</p>
            `;

            // Permite seleccionar escudo haciendo clic en su tarjeta
            card.addEventListener("click", () => {
                galeriaGrid.querySelectorAll(".escudo-card").forEach(c => c.classList.remove("seleccionado"));
                card.classList.add("seleccionado");
                idEquipoSeleccionado = id;
                selectGaleria.value = id;
                actualizarBotones();
            });

            galeriaGrid.appendChild(card);
        }
    }

    function actualizarBotones() {
        const tieneEscudo = escudos[idEquipoSeleccionado] !== undefined;
        btnAgregar.disabled = !idEquipoSeleccionado || tieneEscudo;
        btnCambiar.disabled = !tieneEscudo;
        btnEliminar.disabled = !tieneEscudo;
    }
});


// ======= FASE FINAL ==============
function registrarGanadoresPartidos() {
    const filas = document.querySelectorAll("#tablaPartidos tbody tr");
    equiposGanadores = [];

    filas.forEach(fila => {
        let marcador = fila.children[2].querySelector(".inputMarcador")?.value || fila.children[2].textContent;
        const goles = marcador.split("-").map(n => parseInt(n.trim()));
        if (goles[0] > goles[1]) equiposGanadores.push(fila.children[1].textContent);
        else if (goles[1] > goles[0]) equiposGanadores.push(fila.children[3].textContent);
        // si empate, ignorar o pedir desempate
    });

    console.log("Equipos ganadores actualizados:", equiposGanadores);
}

function generarFaseFinal() {
    const fase = document.getElementById("faseInicio").value;
    const tbody = document.querySelector("#tablaFaseFinal tbody");
    tbody.innerHTML = "";

    // Tomar los equipos ganadores ya registrados
    let equipos = [...equiposGanadores];

    // Validar cantidad de equipos según fase
    const cantidadNecesaria = fase === "cuartos" ? 8 : 4;
    if (equipos.length < cantidadNecesaria) {
        alert(`Se necesitan ${cantidadNecesaria} equipos para ${fase}`);
        return;
    }

    equipos = equipos.slice(0, cantidadNecesaria); // solo los necesarios

    // Generar cruces
    for (let i = 0; i < equipos.length; i += 2) {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${i / 2 + 1}</td>
            <td>${equipos[i]}</td>
            <td><input type="number" class="gol1" min="0" value="0" style="width:40px;text-align:center;"></td>
            <td>${equipos[i + 1]}</td>
            <td class="ganador">-</td>
        `;
        tbody.appendChild(tr);
    }
}


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
        opt1.value = eq.nombre;
        opt1.textContent = eq.nombre;
        select1.appendChild(opt1);

        const opt2 = opt1.cloneNode(true);
        select2.appendChild(opt2);

        const opt3 = opt1.cloneNode(true);
        selectGaleria.appendChild(opt3);
    });

    // Activar botones de galería cuando haya equipos
    document.getElementById("btnAgregar").disabled = equipos.length === 0;
    document.getElementById("btnCambiar").disabled = equipos.length === 0;
    document.getElementById("btnEliminar").disabled = equipos.length === 0;
}
