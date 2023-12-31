// Tenemos que crear el servidor. Usaremos Hono
// Hono es un framework para crear servidores

import { Hono } from "https://deno.land/x/hono@v3.11.8/mod.ts";
// Importamos serveStatic para servir el index.html
import { cors, serveStatic } from "https://deno.land/x/hono@v3.11.8/middleware.ts";
// Importamos streamSSE para crear el stream de datos
import { streamSSE } from "https://deno.land/x/hono@v3.11.8/helper/streaming/index.ts";

// Creamos la aplicación con Hono
const app = new Hono();
app.use(cors());

//Abrimos conexión con la base de datos
const db = await Deno.openKv();

// Creamos un contador
let i = 0;

// Creamos una ruta para servir el index.html
app.get("/", serveStatic({ path: "./index.html" }));

// Creamos una interfaz para la última visita
interface LastVisit {
  city: string;
  country: string;
  flag: string;
}

// Creamos una ruta para añadir una visita a la base de datos
app.post("/visit", async (c) => {
  //  Recuperamos la ciudad, el país y la bandera de la petición
  const { city, country, flag } = await c.req.json<LastVisit>();
  // Añadimos la visita a la base de datos
  await db.atomic()
    .set(["lastVisit"], {
      city,
      country,
      flag,
    })
    .sum(["visits"], 1n)
    .commit();
  // Devolvemos un mensaje de OK
  return c.json({ message: "OK" });
});

// Creamos una ruta para recuperar la última visita
app.get("/visit", (c) => {
  // Creamos el stream de datos
  return streamSSE(c, async (stream) => {
    // Creamos un watcher u observador para la clave visits de la base de datos
    const watcher = db.watch([["lastVisit"]]);

    for await (const entry of watcher) {
        // Recuperamos el valor de la clave visits ya que está en el primer elemento del array
      const { value } = entry[0];

      if(value !== null){
        // Enviamos un mensaje con la última visita
        await stream.writeSSE({ data: JSON.stringify(value), event: 'update', id: String(i++)})
      }

    }

  });

});

// Servimos la aplicacion con Deno
Deno.serve(app.fetch);
