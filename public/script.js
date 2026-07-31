const loginScreen = document.querySelector("#login-screen");
const appContent = document.querySelector("#app-content");
const googleLoginButton = document.querySelector("#google-login-button");
const logoutButton = document.querySelector("#logout-button");
const userAvatar = document.querySelector("#user-avatar");
const userName = document.querySelector("#user-name");
const userEmail = document.querySelector("#user-email");
const gameForm = document.querySelector("#game-form");
const gameNameInput = document.querySelector("#game-name");
const gameGenreInput = document.querySelector("#game-genre");
const gamePlatformInput = document.querySelector("#game-platform");
const gameDeveloperInput = document.querySelector("#game-developer");
const gameYearInput = document.querySelector("#game-year");
const gamePriceInput = document.querySelector("#game-price");
const gamesTableBody = document.querySelector("#games-table-body");
const submitButton = gameForm.querySelector(".primary-button");
let currentGames = [];
let editingGameId = null;
let supabaseClient = null;

const formFields = {
    name: gameNameInput,
    genre: gameGenreInput,
    platform: gamePlatformInput,
    developer: gameDeveloperInput,
    year: gameYearInput,
    price: gamePriceInput
};

async function initializeSupabaseAuth() {
    const response = await fetch("/supabase-config");
    const config = await response.json();

    supabaseClient = supabase.createClient(config.url, config.key);

    const { data } = await supabaseClient.auth.getSession();
    handleSession(data.session);

    supabaseClient.auth.onAuthStateChange((event, session) => {
        handleSession(session);
    });
}

function handleSession(session) {
    if (session) {
        showApp(session.user);
        loadGames();
        return;
    }

    showLogin();
}

function showApp(user) {
    const userMetadata = user.user_metadata || {};

    userAvatar.src = userMetadata.avatar_url || "";
    userName.textContent = userMetadata.full_name || userMetadata.name || "Usuario";
    userEmail.textContent = user.email || "";
    loginScreen.classList.add("hidden");
    appContent.classList.remove("hidden");
}

function showLogin() {
    appContent.classList.add("hidden");
    loginScreen.classList.remove("hidden");
    currentGames = [];
    resetFormMode();
    showEmptyTableMessage();
}

async function loginWithGoogle() {
    const { error } = await supabaseClient.auth.signInWithOAuth({
        provider: "google",
        options: {
            redirectTo: window.location.origin
        }
    });

    if (error) {
        alert(error.message || "No se pudo iniciar sesion con Google.");
    }
}

async function logout() {
    const { error } = await supabaseClient.auth.signOut();

    if (error) {
        alert(error.message || "No se pudo cerrar sesion.");
    }
}

function showEmptyTableMessage() {
    gamesTableBody.innerHTML = `
        <tr>
            <td colspan="7" class="empty-message">No hay videojuegos registrados.</td>
        </tr>
    `;
}

function createTableCell(text) {
    const cell = document.createElement("td");
    cell.textContent = text;
    return cell;
}

function renderGames(games) {
    currentGames = games;
    gamesTableBody.innerHTML = "";

    if (!games.length) {
        showEmptyTableMessage();
        return;
    }

    games.forEach((game) => {
        const row = document.createElement("tr");
        const actionsCell = document.createElement("td");
        const editButton = document.createElement("button");
        const deleteButton = document.createElement("button");

        actionsCell.classList.add("actions");
        editButton.type = "button";
        editButton.dataset.id = game.id;
        editButton.classList.add("secondary-button");
        editButton.textContent = "Editar";
        deleteButton.type = "button";
        deleteButton.dataset.id = game.id;
        deleteButton.classList.add("danger-button");
        deleteButton.textContent = "Eliminar";

        actionsCell.append(editButton, deleteButton);
        row.append(
            createTableCell(game.title),
            createTableCell(game.genre),
            createTableCell(game.platform),
            createTableCell(game.developer),
            createTableCell(game.release_year),
            createTableCell(`$${Number(game.price).toFixed(2)}`),
            actionsCell
        );

        gamesTableBody.appendChild(row);
    });
}

function resetFormMode() {
    editingGameId = null;
    submitButton.textContent = "Agregar videojuego";
    gameForm.reset();
}

function fillFormForEdit(game) {
    editingGameId = game.id;
    formFields.name.value = game.title;
    formFields.genre.value = game.genre;
    formFields.platform.value = game.platform;
    formFields.developer.value = game.developer;
    formFields.year.value = game.release_year;
    formFields.price.value = game.price;
    submitButton.textContent = "Guardar cambios";
}

async function loadGames() {
    try {
        const response = await fetch("/games");
        const games = await response.json();

        if (!response.ok) {
            throw new Error(games.message || "No se pudieron cargar los videojuegos.");
        }

        renderGames(games);
    } catch (error) {
        console.error("Error al cargar videojuegos:", error);
        showEmptyTableMessage();
    }
}

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
        const url = editingGameId ? `/games/${editingGameId}` : "/games";
        const method = editingGameId ? "PUT" : "POST";

        const response = await fetch(url, {
            method,
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
        resetFormMode();
        await loadGames();
    } catch (error) {
        alert(error.message || "Ocurrio un error al guardar el videojuego.");
    }
});

gamesTableBody.addEventListener("click", (event) => {
    const gameId = Number(event.target.dataset.id);

    if (event.target.classList.contains("secondary-button")) {
        const selectedGame = currentGames.find((game) => game.id === gameId);

        if (selectedGame) {
            fillFormForEdit(selectedGame);
        }

        return;
    }

    if (event.target.classList.contains("danger-button")) {
        deleteGame(gameId);
    }
});

async function deleteGame(gameId) {
    const selectedGame = currentGames.find((game) => game.id === gameId);
    const gameTitle = selectedGame ? selectedGame.title : "este videojuego";
    const shouldDelete = confirm(`Seguro que deseas eliminar "${gameTitle}"?`);

    if (!shouldDelete) {
        return;
    }

    try {
        const response = await fetch(`/games/${gameId}`, {
            method: "DELETE"
        });
        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || "No se pudo eliminar el videojuego.");
        }

        if (editingGameId === gameId) {
            resetFormMode();
        }

        alert(result.message || "Videojuego eliminado correctamente.");
        await loadGames();
    } catch (error) {
        alert(error.message || "Ocurrio un error al eliminar el videojuego.");
    }
}

googleLoginButton.addEventListener("click", loginWithGoogle);
logoutButton.addEventListener("click", logout);
document.addEventListener("DOMContentLoaded", initializeSupabaseAuth);
