// Elementos principales del frontend.
const gameForm = document.querySelector("#game-form");
const gameNameInput = document.querySelector("#game-name");
const gameGenreInput = document.querySelector("#game-genre");
const gamePlatformInput = document.querySelector("#game-platform");
const gameDeveloperInput = document.querySelector("#game-developer");
const gameYearInput = document.querySelector("#game-year");
const gamePriceInput = document.querySelector("#game-price");
const gamesTableBody = document.querySelector("#games-table-body");

// Objeto base para mantener organizadas futuras referencias del formulario.
const formFields = {
    name: gameNameInput,
    genre: gameGenreInput,
    platform: gamePlatformInput,
    developer: gameDeveloperInput,
    year: gameYearInput,
    price: gamePriceInput
};

// TODO(create): Mejorar la experiencia visual del mensaje de resultado.
// TODO(read): Cargar los videojuegos desde el backend o Supabase.
// TODO(update): Preparar la accion del boton Editar para completar el formulario.
// TODO(delete): Preparar la accion del boton Eliminar para quitar un registro.

gameForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const gameData = {
        title: formFields.name.value.trim(),
        genre: formFields.genre.value.trim(),
        platform: formFields.platform.value.trim(),
        developer: formFields.developer.value.trim(),
        release_year: formFields.year.value.trim(),
        price: formFields.price.value.trim()
    };

    const hasEmptyField = Object.values(gameData).some((value) => value === "");

    if (hasEmptyField) {
        alert("Completa todos los campos antes de agregar el videojuego.");
        return;
    }

    try {
        const response = await fetch("/games", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(gameData)
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || "No se pudo guardar el videojuego.");
        }

        alert(result.message || "Videojuego agregado correctamente.");
        gameForm.reset();
    } catch (error) {
        alert(error.message || "Ocurrio un error al guardar el videojuego.");
    }
});
