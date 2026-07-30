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

app.listen(PORT, () => {
    console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
});