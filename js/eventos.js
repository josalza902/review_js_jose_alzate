let db;

// Abrir la base de datos
const request = indexedDB.open("miTienda", 1);

request.onerror = function (event) {
  console.error("Error al abrir la base de datos", event);
};

request.onsuccess = function (event) {
  db = event.target.result;
  console.log("Base de datos abierta correctamente");
};

request.onupgradeneeded = function (event) {
  db = event.target.result;
  const objectStore = db.createObjectStore("productos", {
    keyPath: "codigo"
  });
  objectStore.createIndex("nombre", "nombre", { unique: false });
  objectStore.createIndex("precio", "precio", { unique: false });
};

// Menú
const menu = document.querySelectorAll("#menu > div");
menu.forEach(option => {
  option.setAttribute("onclick", `${option.id}()`);
});

// Mostrar formulario para registrar producto
function regProducto() {
  const contenedor = document.getElementById("contenedor");

  contenedor.innerHTML = `
    <form name="frmproducto" id="frmproducto">
        <span>Código</span>
        <input type="text" id="codigo" name="codigo" /><br>
        <span>Nombre</span>
        <input type="text" id="nombre" name="nombre" /><br>
        <span>Descripción</span>
        <textarea name="descripcion" id="descripcion"></textarea><br>
        <span>Precio</span>
        <input type="text" id="precio" name="precio" />
    </form>
    <div id="contenedorbotones">
        <span id="guardarproducto">Guardar</span>
        <span id="cancelar">Cancelar</span>
    </div>
  `;

  document.getElementById("cancelar").onclick = cancelar;

  document.getElementById("guardarproducto").addEventListener("click", () => {
    const formulario = document.getElementById("frmproducto");

    const producto = {
      codigo: formulario.codigo.value,
      nombre: formulario.nombre.value,
      descripcion: formulario.descripcion.value,
      precio: parseFloat(formulario.precio.value)
    };

    const transaction = db.transaction(["productos"], "readwrite");
    const store = transaction.objectStore("productos");
    const request = store.add(producto);

    request.onsuccess = function () {
      alert("Producto guardado con éxito");
      cancelar();
    };

    request.onerror = function () {
      alert("Error al guardar el producto: " + request.error);
    };
  });
}

// Cancelar y limpiar contenedor
function cancelar() {
  document.getElementById("contenedor").innerHTML = "";
}

function listar() {
  const contenedor = document.getElementById("contenedor");
  contenedor.innerHTML = `<div id="listaProductos"></div>
    <button onclick="cancelar()" style="margin-top: 20px;">Cancelar</button>`;

  const transaction = db.transaction(["productos"], "readonly");
  const store = transaction.objectStore("productos");
  const request = store.openCursor();

  const lista = document.getElementById("listaProductos");

  request.onsuccess = function (event) {
    const cursor = event.target.result;

    if (cursor) {
      const producto = cursor.value;

      const item = document.createElement("div");
      item.className = "producto-item";
      item.innerHTML = `
        <span><strong>Código:</strong> ${producto.codigo}</span>
        <span><strong>Nombre:</strong> ${producto.nombre}</span>
        <span><strong>Precio:</strong> ${producto.precio}</span>
        <span><strong>Descripción:</strong> ${producto.descripcion}</span>
        <span class="acciones">
          <a href="#" onclick="editar('${producto.codigo}')">Editar</a> |
          <a href="#" onclick="eliminar('${producto.codigo}')">Eliminar</a>
        </span>
      `;
      lista.appendChild(item);

      cursor.continue();
    } else if (!lista.hasChildNodes()) {
      lista.innerHTML = "<p>No hay productos registrados.</p>";
    }
  };
}

// Editar producto
function editarProducto(codigo) {
  const transaction = db.transaction(["productos"], "readonly");
  const store = transaction.objectStore("productos");
  const request = store.get(codigo);

  request.onsuccess = function (event) {
    const producto = event.target.result;

    if (!producto) {
      alert("Producto no encontrado");
      return;
    }

    const contenedor = document.getElementById("contenedor");

    contenedor.innerHTML = `
      <form name="frmproducto" id="frmproducto">
          <span>Código</span>
          <input type="text" id="codigo" name="codigo" value="${producto.codigo}" readonly /><br>
          <span>Nombre</span>
          <input type="text" id="nombre" name="nombre" value="${producto.nombre}" /><br>
          <span>Descripción</span>
          <textarea name="descripcion" id="descripcion">${producto.descripcion}</textarea><br>
          <span>Precio</span>
          <input type="text" id="precio" name="precio" value="${producto.precio}" />
      </form>
      <div id="contenedorbotones">
          <span id="guardarEdicion">Actualizar</span>
          <span id="cancelar">Cancelar</span>
      </div>
    `;

    document.getElementById("cancelar").onclick = cancelar;

    document.getElementById("guardarEdicion").addEventListener("click", () => {
      const formulario = document.getElementById("frmproducto");

      const codigo = formulario.codigo.value.trim();
      const nombre = formulario.nombre.value.trim();
      const descripcion = formulario.descripcion.value.trim();
      const precio = formulario.precio.value.trim();

      if (!codigo || !nombre || !descripcion || !precio) {
        alert("Por favor, completa todos los campos.");
        return;
      }

      if (isNaN(precio) || parseFloat(precio) <= 0) {
        alert("El precio debe ser un número válido mayor a 0.");
        return;
      }

      const productoActualizado = {
        codigo,
        nombre,
        descripcion,
        precio: parseFloat(precio)
      };

      const tx = db.transaction(["productos"], "readwrite");
      const storeUpdate = tx.objectStore("productos");
      const updateRequest = storeUpdate.put(productoActualizado);

      updateRequest.onsuccess = function () {
        alert("Producto actualizado correctamente");
        listar();
      };

      updateRequest.onerror = function () {
        alert("Error al actualizar: " + updateRequest.error);
      };
    });
  };

  request.onerror = function () {
    alert("Error al cargar producto para editar");
  };
}
