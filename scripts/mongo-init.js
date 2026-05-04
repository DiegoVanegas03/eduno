// scripts/mongo-init.js
// Este script se ejecuta UNA VEZ cuando el contenedor arranca por primera vez.
// Inicializa el replica set "rs0" para habilitar transacciones multi-documento.

try {
  const status = rs.status();
  print("Replica set ya inicializado: " + status.set);
} catch (e) {
  // Error 94 = no replica set configured → inicializar
  if (e.code === 94) {
    rs.initiate({
      _id: "rs0",
      members: [{ _id: 0, host: "localhost:27017" }],
    });
    print("✅ Replica set rs0 inicializado correctamente.");
  } else {
    print("⚠️  Error inesperado: " + e.message);
  }
}
