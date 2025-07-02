const express = require("express");
const bodyParser = require("body-parser");
const db = require("./database");
const app = express();
const port = 3000;
const methodOverride = require("method-override");

app.use(methodOverride("_method"));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.set("view engine", "ejs");

// === VISTA HTML ===
app.get("/", (req, res) => {
  db.all("SELECT * FROM personas", [], (err, rows) => {
    res.render("index", { personas: rows });
  });
});

app.get("/editar/:id", (req, res) => {
  const id = req.params.id;
  db.get("SELECT * FROM personas WHERE id = ?", [id], (err, persona) => {
    if (err) return res.status(500).send("Error al obtener persona");
    if (!persona) return res.status(404).send("Persona no encontrada");
    res.render("edit", { persona });
  });
});

// === API ===

// GET ALL
app.get("/api/personas", (req, res) => {
  db.all("SELECT * FROM personas", [], (err, rows) => {
    if (err) return res.status(500).json(err);
    res.json(rows);
  });
});

// GET BY ID
app.get("/api/personas/:id", (req, res) => {
  db.get("SELECT * FROM personas WHERE id = ?", [req.params.id], (err, row) => {
    if (err) return res.status(500).json(err);
    if (!row) return res.status(204).json({ error: "No encontrado" });
    res.json(row);
  });
});

// CREATE
app.post("/api/personas", (req, res) => {
  const { nombre, edad } = req.body;
  db.run(
    "INSERT INTO personas (nombre, edad) VALUES (?, ?)",
    [nombre, edad],
    function (err) {
      if (err) return res.status(202).json(err);
      res.json({ message: "Persona registrada correctamente" });
    }
  );
});

// UPDATE (PUT)
app.put("/api/personas/:id", (req, res) => {
  const { nombre, edad } = req.body;
  db.run(
    "UPDATE personas SET nombre = ?, edad = ? WHERE id = ?",
    [nombre, edad, req.params.id],
    function (err) {
      if (err) return res.status(500).json({ error: "Error al actualizar" });
      if (this.changes === 0) {
        return res.status(204).json({ error: "Persona no encontrada" });
      }
      res.json({ message: "Persona editada correctamente" });
    }
  );
});

// PATCH (solo nombre o edad)
app.patch("/api/personas/:id", (req, res) => {
  const fields = [];
  const values = [];
  if (req.body.nombre) {
    fields.push("nombre = ?");
    values.push(req.body.nombre);
  }
  if (req.body.edad) {
    fields.push("edad = ?");
    values.push(req.body.edad);
  }
  values.push(req.params.id);
  db.run(
    `UPDATE personas SET ${fields.join(", ")} WHERE id = ?`,
    values,
    function (err) {
      if (err) return res.status(500).json(err);
      if (this.changes === 0) {
        return res.status(204).json({ error: "Persona no encontrada" });
      }
      res.json({ message: "Persona editada correctamente" });
    }
  );
});

// DELETE
app.delete("/api/personas/:id", (req, res) => {
  db.run("DELETE FROM personas WHERE id = ?", [req.params.id], function (err) {
    if (err) {
      return res.status(500).json({ error: "Error al eliminar" });
    }
    if (this.changes === 0) {
      return res.status(204).json({ error: "Persona no encontrada" });
    }
    res.json({ message: "Persona eliminada correctamente" });
  });
});

app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
});
