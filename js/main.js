async function cargarProductos(idGrid, estado='todos') {
  const res = await fetch('data/productos.json');
  const productos = await res.json();
  const grid = document.getElementById(idGrid);
  grid.innerHTML = '';

  let filtrados = productos;
  if(estado !== 'todos'){
    filtrados = productos.filter(p => p.estado === estado);
  }

  filtrados.forEach(p => {
    const card = document.createElement('div');
    card.classList.add('card');
    card.innerHTML = `
      <img src="images/${p.imagen}" alt="${p.nombre}">
      <h3>${p.nombre}</h3>
      <p>$${p.precio.toLocaleString('es-AR')}</p>
      ${p.estado === 'liquidacion'?'<span class="etiqueta">💸 Liquidación</span>':''}
      ${p.estado === 'nuevo'?'<span class="etiqueta">🚀 Nuevo</span>':''}
    `;
    grid.appendChild(card);
  });
}

document.addEventListener('DOMContentLoaded', ()=>{
  // Si existe grid de inicio
  if(document.getElementById('tendencia-grid')){
    cargarProductos('tendencia-grid');
  }
  if(document.getElementById('catalogo-grid')){
    cargarProductos('catalogo-grid');
  }
  if(document.getElementById('liquidacion-grid')){
    cargarProductos('liquidacion-grid','liquidacion');
  }
  if(document.getElementById('lanzamientos-grid')){
    cargarProductos('lanzamientos-grid','nuevo');
  }

  // Evitar enviar formulario (solo demo)
  const form = document.getElementById('consultaForm');
  if(form){
    form.addEventListener('submit', e=>{
      e.preventDefault();
      alert('Consulta enviada! Nos comunicaremos pronto.');
      form.reset();
    });
  }
});
