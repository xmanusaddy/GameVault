const express = require("express");
const supabase = require("./config/supabase");

const app = express();
const PORT = process.env.PORT || 5000;

require("dotenv").config();

app.use(express.json());
app.use(express.static("public"));

app.get("/", (req, res) => {
    res.sendFile(__dirname + "/public/index.html");
});

app.get("/test-db", async (req, res) => {
    const { data, error } = await supabase
        .from("games")
        .select("*");

    if (error) {
        return res.status(500).json(error);
    }

    res.json(data);
});

app.get("/games", async (req, res) => {
    const { data, error } = await supabase
        .from("games")
        .select("*")
        .order("id", { ascending: true });

    if (error) {
        console.error("Error al obtener videojuegos desde Supabase:", {
            code: error.code,
            message: error.message,
            details: error.details,
            hint: error.hint
        });

        return res.status(500).json({
            message: "No se pudieron obtener los videojuegos.",
            error: error.message
        });
    }

    res.json(data);
});

app.post("/games", async (req, res) => {
    const { title, genre, platform, developer, release_year, price } = req.body;
    const newGame = {
        title: String(title || "").trim(),
        genre: String(genre || "").trim(),
        platform: String(platform || "").trim(),
        developer: String(developer || "").trim(),
        release_year: Number(release_year),
        price: Number(price)
    };

    if (!newGame.title || !newGame.genre || !newGame.platform || !newGame.developer || !newGame.release_year || Number.isNaN(newGame.price)) {
        return res.status(400).json({
            message: "Todos los campos son obligatorios."
        });
    }

    try {
        const { data, error } = await supabase
            .from("games")
            .insert(newGame)
            .select()
            .single();

        if (error) {
            console.error("Error al insertar videojuego en Supabase:", {
                payload: newGame,
                code: error.code,
                message: error.message,
                details: error.details,
                hint: error.hint
            });

            if (error.code === "42501") {
                return res.status(403).json({
                    message: "Supabase rechazo la insercion por las politicas de seguridad de la tabla games.",
                    error: error.message
                });
            }

            return res.status(500).json({
                message: "No se pudo crear el videojuego.",
                error: error.message
            });
        }

        res.status(201).json({
            message: "Videojuego creado correctamente.",
            game: data
        });
    } catch (error) {
        console.error("Error inesperado en POST /games:", error);

        res.status(500).json({
            message: "Ocurrio un error inesperado al crear el videojuego."
        });
    }
});

app.listen(PORT, () => {
    console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
});
