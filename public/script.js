// Elementos principales del frontend.
const gameForm = document.querySelector("#game-form");
const gameNameInput = document.querySelector("#game-name");
const gameGenreInput = document.querySelector("#game-genre");
const gamePlatformInput = document.querySelector("#game-platform");
const gameYearInput = document.querySelector("#game-year");
const gamesTableBody = document.querySelector("#games-table-body");

// Objeto base para mantener organizadas futuras referencias del formulario.
const formFields = {
    name: gameNameInput,
    genre: gameGenreInput,
    platform: gamePlatformInput,
    year: gameYearInput
};

// TODO(create): Capturar el envio del formulario y agregar un videojuego.
// TODO(read): Cargar los videojuegos desde el backend o Supabase.
// TODO(update): Preparar la accion del boton Editar para completar el formulario.
// TODO(delete): Preparar la accion del boton Eliminar para quitar un registro.

gameForm.addEventListener("submit", (event) => {
    event.preventDefault();

    // Por ahora no se realiza ninguna peticion ni cambio de datos.
    // Esta funcion queda lista para implementarse en la rama create.
});
