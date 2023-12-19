// Abrimos conexión con la base de datos de Deno
const db = await Deno.openKv();

// Añadimos una clave-valor usando KvU64 que te permite añadir un valor numérico BigInt
// await db.set(["visits"], new Deno.KvU64(0n));

// Hacemos una operación atómica de incremento para que no haya ningún problema de concurrencia
await db
  .atomic()
  .sum(["visits"], 1n)
  .commit();

  const result = await db.get<Deno.KvU64>(["visits"]);

  console.log(result.value);