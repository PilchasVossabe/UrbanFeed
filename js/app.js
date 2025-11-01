document.getElementById('user-icon').onclick = function() {
  document.getElementById('login-modal').style.display = 'flex';
};

document.getElementById('guardar-datos').onclick = function() {
  const nombre = document.getElementById('nombre').value;
  const apellido = document.getElementById('apellido').value;
  const direccion = document.getElementById('direccion').value;
  localStorage.setItem('cliente', JSON.stringify({nombre, apellido, direccion}));
  alert('Datos guardados correctamente.');
  document.getElementById('login-modal').style.display = 'none';
};

// Música básica
const canciones = ['music/tema1.mp3','music/tema02.mp3','music/tema03.mp3'];
let indice = Math.floor(Math.random()*canciones.length);
let audio = new Audio(canciones[indice]);

document.getElementById('play').onclick = () => {
  if (audio.paused) audio.play(); else audio.pause();
};

document.getElementById('next').onclick = () => {
  indice = (indice+1)%canciones.length;
  audio.src = canciones[indice];
  audio.play();
};

document.getElementById('prev').onclick = () => {
  indice = (indice-1+canciones.length)%canciones.length;
  audio.src = canciones[indice];
  audio.play();
};
