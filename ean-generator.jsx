import React, { useState, useEffect } from 'react';
import { Plus, X, Download, Upload, Check, AlertCircle } from 'lucide-react';

export default function EANGenerator() {
  const [marcasTexto, setMarcasTexto] = useState('');
  const [marcasSegmentadas, setMarcasSegmentadas] = useState([]);
  const [claseSeleccionada, setClaseSeleccionada] = useState('');
  const [marca, setMarca] = useState('');
  const [baseManual, setBaseManual] = useState('');
  const [eansGenerados, setEansGenerados] = useState([]);
  const [blacklist, setBlacklist] = useState([]);
  const [nuevoBlacklist, setNuevoBlacklist] = useState('');
  const [eanCheckerInput, setEanCheckerInput] = useState('');
  const [resultadoChecker, setResultadoChecker] = useState(null);
  const [contador, setContador] = useState(0);
  const [mensaje, setMensaje] = useState({ texto: '', tipo: '' });

  const segmentarMarcas = (texto) => {
    const marcas = texto
      .split(/[\n,;]+/)
      .map((item) => item.trim())
      .filter(Boolean);

    return marcas.map((nombre, index) => ({
      nombre,
      clase: `marca-${index + 1}`
    }));
  };

  // Cargar datos del localStorage al iniciar
  useEffect(() => {
    const datosGuardados = localStorage.getItem('ean-data');
    if (datosGuardados) {
      try {
        const datos = JSON.parse(datosGuardados);
        setMarcasTexto(datos.marcasTexto || '');
        setMarcasSegmentadas(datos.marcasSegmentadas || []);
        setClaseSeleccionada(datos.claseSeleccionada || '');
        setMarca(datos.marca || '');
        setEansGenerados(datos.eansGenerados || []);
        setBlacklist(datos.blacklist || []);
        setContador(datos.contador || 0);
      } catch (e) {
        console.error('Error al cargar datos:', e);
      }
    }
  }, []);

  // Guardar datos en localStorage cuando cambien
  useEffect(() => {
    const nuevasMarcas = segmentarMarcas(marcasTexto);
    setMarcasSegmentadas(nuevasMarcas);

    if (claseSeleccionada && !nuevasMarcas.some((m) => m.clase === claseSeleccionada)) {
      setClaseSeleccionada('');
    }
  }, [marcasTexto, claseSeleccionada]);

  useEffect(() => {
    const datos = {
      marcasTexto,
      marcasSegmentadas,
      claseSeleccionada,
      marca,
      eansGenerados,
      blacklist,
      contador
    };
    localStorage.setItem('ean-data', JSON.stringify(datos));
  }, [marcasTexto, marcasSegmentadas, claseSeleccionada, marca, eansGenerados, blacklist, contador]);

  // Calcular dígito de control EAN-13
  const calcularDigitoControl = (codigo) => {
    const digitos = codigo.split('').map(Number);
    let suma = 0;
    
    for (let i = 0; i < 12; i++) {
      suma += digitos[i] * (i % 2 === 0 ? 1 : 3);
    }
    
    const modulo = suma % 10;
    return modulo === 0 ? 0 : 10 - modulo;
  };

  // Generar código EAN completo
  const generarEAN = (base, secuencia) => {
    // Asegurar que la base + secuencia tenga 12 dígitos
    const codigo12 = (base + secuencia).padStart(12, '0').slice(0, 12);
    const digitoControl = calcularDigitoControl(codigo12);
    return codigo12 + digitoControl;
  };

  // Verificar si un EAN es válido
  const validarEAN = (ean) => {
    if (ean.length !== 13) return false;
    const codigo12 = ean.slice(0, 12);
    const digitoControl = parseInt(ean[12]);
    return calcularDigitoControl(codigo12) === digitoControl;
  };

  // Mostrar mensaje temporal
  const mostrarMensaje = (texto, tipo = 'info') => {
    setMensaje({ texto, tipo });
    setTimeout(() => setMensaje({ texto: '', tipo: '' }), 3000);
  };

  const generarLoteEAN = (cantidad) => {
    if (!marca && !baseManual) {
      mostrarMensaje('Debes cargar una marca o base manual', 'error');
      return;
    }

    const baseActual = baseManual || marca;
    let secuenciaActual = contador;
    const nuevosRegistros = [];

    for (let i = 0; i < cantidad; i++) {
      let intentos = 0;
      let nuevoEAN;

      do {
        secuenciaActual++;
        nuevoEAN = generarEAN(baseActual, secuenciaActual.toString());
        intentos++;

        if (intentos > 10000) {
          mostrarMensaje('No se pudo generar un EAN válido después de 10000 intentos', 'error');
          return;
        }
      } while (
        blacklist.includes(nuevoEAN) ||
        eansGenerados.some((e) => e.codigo === nuevoEAN) ||
        nuevosRegistros.some((e) => e.codigo === nuevoEAN)
      );

      const marcaSegmentada = marcasSegmentadas.find((m) => m.clase === claseSeleccionada);

      nuevosRegistros.push({
        codigo: nuevoEAN,
        fecha: new Date().toISOString(),
        base: baseActual,
        secuencia: secuenciaActual,
        clase: claseSeleccionada || null,
        marcaTexto: marcaSegmentada ? marcaSegmentada.nombre : null
      });
    }

    setEansGenerados([...nuevosRegistros.reverse(), ...eansGenerados]);
    setContador(secuenciaActual);
    mostrarMensaje(
      cantidad === 1
        ? `EAN generado: ${nuevosRegistros[0].codigo}`
        : `Se generaron ${cantidad} EANs consecutivos`,
      'success'
    );
  };

  // Generar nuevo EAN
  const generarNuevoEAN = () => {
    generarLoteEAN(1);
  };

  // Generar 5 EANs consecutivos
  const generarCincoEAN = () => {
    generarLoteEAN(5);
  };

  // Comprobar EAN e indicar dígito recomendado si falta
  const comprobarEAN = () => {
    const eanLimpio = eanCheckerInput.replace(/\D/g, '');

    if (!eanLimpio) {
      mostrarMensaje('Ingresa un EAN para comprobar', 'error');
      return;
    }

    if (eanLimpio.length === 13) {
      const codigo12 = eanLimpio.slice(0, 12);
      const esperado = calcularDigitoControl(codigo12);
      const actual = Number(eanLimpio[12]);

      if (esperado === actual) {
        setResultadoChecker({
          tipo: 'success',
          texto: 'EAN válido. El dígito de control es correcto.'
        });
      } else {
        setResultadoChecker({
          tipo: 'error',
          texto: `EAN inválido. Debería terminar en ${esperado}. Recomendado: ${codigo12}${esperado}`
        });
      }
      return;
    }

    if (eanLimpio.length === 12) {
      const recomendado = calcularDigitoControl(eanLimpio);
      setResultadoChecker({
        tipo: 'info',
        texto: `Falta 1 dígito. Recomendado: ${eanLimpio}${recomendado}`
      });
      return;
    }

    setResultadoChecker({
      tipo: 'error',
      texto: 'Ingresa 12 dígitos (falta check digit) o 13 dígitos (EAN completo).'
    });
  };

  // Agregar EAN a la blacklist
  const agregarABlacklist = () => {
    const eanLimpio = nuevoBlacklist.replace(/\s/g, '');
    
    if (!eanLimpio) return;
    
    if (eanLimpio.length !== 13) {
      mostrarMensaje('El EAN debe tener 13 dígitos', 'error');
      return;
    }

    if (!validarEAN(eanLimpio)) {
      mostrarMensaje('El EAN no es válido (dígito de control incorrecto)', 'error');
      return;
    }

    if (blacklist.includes(eanLimpio)) {
      mostrarMensaje('Este EAN ya está en la blacklist', 'error');
      return;
    }

    setBlacklist([...blacklist, eanLimpio]);
    setNuevoBlacklist('');
    mostrarMensaje('EAN agregado a la blacklist', 'success');
  };

  // Eliminar de blacklist
  const eliminarDeBlacklist = (ean) => {
    setBlacklist(blacklist.filter(e => e !== ean));
    mostrarMensaje('EAN eliminado de la blacklist', 'info');
  };

  // Eliminar EAN generado
  const eliminarEANGenerado = (codigo) => {
    setEansGenerados(eansGenerados.filter(e => e.codigo !== codigo));
    mostrarMensaje('EAN eliminado', 'info');
  };

  // Autocompletar base manual
  const autocompletarBase = () => {
    if (!baseManual) {
      mostrarMensaje('Ingresa al menos algunos dígitos', 'error');
      return;
    }

    const eanCompleto = generarEAN(baseManual, contador.toString());
    setBaseManual(eanCompleto.slice(0, 12));
    mostrarMensaje('Base autocompletada', 'success');
  };

  // Exportar datos
  const exportarDatos = () => {
    const datos = {
      marcasTexto,
      marcasSegmentadas,
      claseSeleccionada,
      marca,
      eansGenerados,
      blacklist,
      contador,
      fechaExportacion: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(datos, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ean-data-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    mostrarMensaje('Datos exportados', 'success');
  };

  // Importar datos
  const importarDatos = (e) => {
    const archivo = e.target.files[0];
    if (!archivo) return;

    const reader = new FileReader();
    reader.onload = (evento) => {
      try {
        const datos = JSON.parse(evento.target.result);
        setMarcasTexto(datos.marcasTexto || '');
        setMarcasSegmentadas(datos.marcasSegmentadas || []);
        setClaseSeleccionada(datos.claseSeleccionada || '');
        setMarca(datos.marca || '');
        setEansGenerados(datos.eansGenerados || []);
        setBlacklist(datos.blacklist || []);
        setContador(datos.contador || 0);
        mostrarMensaje('Datos importados correctamente', 'success');
      } catch (error) {
        mostrarMensaje('Error al importar los datos', 'error');
      }
    };
    reader.readAsText(archivo);
  };

  // Limpiar todos los datos
  const limpiarDatos = () => {
    if (confirm('¿Estás seguro de que quieres borrar todos los datos?')) {
      setMarca('');
      setMarcasTexto('');
      setMarcasSegmentadas([]);
      setClaseSeleccionada('');
      setBaseManual('');
      setEansGenerados([]);
      setBlacklist([]);
      setEanCheckerInput('');
      setResultadoChecker(null);
      setContador(0);
      localStorage.removeItem('ean-data');
      mostrarMensaje('Todos los datos han sido borrados', 'info');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Generador de Códigos EAN</h1>
          <p className="text-gray-600">Gestiona y genera códigos EAN-13 automáticamente</p>
        </div>

        {/* Mensaje de notificación */}
        {mensaje.texto && (
          <div className={`mb-6 p-4 rounded-lg flex items-center gap-2 ${
            mensaje.tipo === 'success' ? 'bg-green-100 text-green-800' :
            mensaje.tipo === 'error' ? 'bg-red-100 text-red-800' :
            'bg-blue-100 text-blue-800'
          }`}>
            {mensaje.tipo === 'success' && <Check className="w-5 h-5" />}
            {mensaje.tipo === 'error' && <AlertCircle className="w-5 h-5" />}
            <span>{mensaje.texto}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Panel de configuración */}
          <div className="space-y-6">
            {/* Configuración de marca */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Configuración</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Marcas (texto)
                  </label>
                  <textarea
                    value={marcasTexto}
                    onChange={(e) => setMarcasTexto(e.target.value)}
                    placeholder="Escribe una marca por línea (o separadas por coma)"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-28"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    La app segmenta las marcas y las guarda como clases (marca-1, marca-2, ...).
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Clase de marca para los próximos EANs
                  </label>
                  <select
                    value={claseSeleccionada}
                    onChange={(e) => setClaseSeleccionada(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Sin clase</option>
                    {marcasSegmentadas.map((m) => (
                      <option key={m.clase} value={m.clase}>
                        {m.clase} - {m.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-wrap gap-2">
                  {marcasSegmentadas.length === 0 ? (
                    <span className="text-xs text-gray-500">No hay marcas segmentadas</span>
                  ) : (
                    marcasSegmentadas.map((m) => (
                      <span key={m.clase} className="px-2 py-1 text-xs rounded-full bg-indigo-100 text-indigo-800">
                        {m.clase}: {m.nombre}
                      </span>
                    ))
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Marca / Prefijo base
                  </label>
                  <input
                    type="text"
                    value={marca}
                    onChange={(e) => setMarca(e.target.value.replace(/\D/g, ''))}
                    placeholder="Ej: 779"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    maxLength="12"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Prefijo GS1 de tu empresa (hasta 12 dígitos)
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Base manual (opcional)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={baseManual}
                      onChange={(e) => setBaseManual(e.target.value.replace(/\D/g, ''))}
                      placeholder="Ingresa los primeros dígitos"
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      maxLength="12"
                    />
                    <button
                      onClick={autocompletarBase}
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                    >
                      Autocompletar
                    </button>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    Si se usa, tiene prioridad sobre la marca
                  </p>
                </div>

                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span>Contador: <strong>{contador}</strong></span>
                  <span>Generados: <strong>{eansGenerados.length}</strong></span>
                  <span>Blacklist: <strong>{blacklist.length}</strong></span>
                </div>
              </div>
            </div>

            {/* Generador */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Generar EAN</h2>
              
              <button
                onClick={generarNuevoEAN}
                className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold flex items-center justify-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Generar Nuevo EAN
              </button>
              <button
                onClick={generarCincoEAN}
                className="w-full mt-2 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-semibold"
              >
                Generar 5 EANs consecutivos
              </button>

              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">
                  Se generará un código EAN-13 basado en {baseManual ? 'la base manual' : 'la marca'} 
                  {' '}que no esté en la blacklist ni ya generado.
                </p>
              </div>
            </div>

            {/* EAN Checker */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">EAN Checker</h2>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={eanCheckerInput}
                  onChange={(e) => setEanCheckerInput(e.target.value.replace(/\D/g, ''))}
                  placeholder="Ingresa 12 o 13 dígitos"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  maxLength="13"
                />
                <button
                  onClick={comprobarEAN}
                  className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800 transition-colors"
                >
                  Comprobar
                </button>
              </div>

              {resultadoChecker && (
                <div className={`mt-4 p-3 rounded-lg text-sm ${
                  resultadoChecker.tipo === 'success'
                    ? 'bg-green-100 text-green-800'
                    : resultadoChecker.tipo === 'error'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-blue-100 text-blue-800'
                }`}>
                  {resultadoChecker.texto}
                </div>
              )}
            </div>

            {/* Blacklist */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Blacklist de EANs</h2>
              
              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  value={nuevoBlacklist}
                  onChange={(e) => setNuevoBlacklist(e.target.value.replace(/\D/g, ''))}
                  placeholder="Ingresa un EAN usado o no válido"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  maxLength="13"
                  onKeyPress={(e) => e.key === 'Enter' && agregarABlacklist()}
                />
                <button
                  onClick={agregarABlacklist}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>

              <div className="max-h-60 overflow-y-auto space-y-2">
                {blacklist.length === 0 ? (
                  <p className="text-gray-500 text-sm text-center py-4">
                    No hay EANs en la blacklist
                  </p>
                ) : (
                  blacklist.map((ean, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-red-50 rounded-lg"
                    >
                      <span className="font-mono text-sm">{ean}</span>
                      <button
                        onClick={() => eliminarDeBlacklist(ean)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Acciones */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Acciones</h2>
              
              <div className="space-y-2">
                <button
                  onClick={exportarDatos}
                  className="w-full py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Exportar Datos
                </button>
                
                <label className="w-full py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors flex items-center justify-center gap-2 cursor-pointer">
                  <Upload className="w-4 h-4" />
                  Importar Datos
                  <input
                    type="file"
                    accept=".json"
                    onChange={importarDatos}
                    className="hidden"
                  />
                </label>

                <button
                  onClick={limpiarDatos}
                  className="w-full py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Limpiar Todos los Datos
                </button>
              </div>
            </div>
          </div>

          {/* Lista de EANs generados */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">EANs Generados</h2>
            
            <div className="max-h-[800px] overflow-y-auto space-y-2">
              {eansGenerados.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  No hay EANs generados todavía
                </p>
              ) : (
                eansGenerados.map((ean, index) => (
                  <div
                    key={index}
                    className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="font-mono text-2xl font-bold text-blue-900 mb-2">
                          {ean.codigo}
                        </div>
                        <div className="text-xs text-gray-600 space-y-1">
                          <div>Base: <span className="font-mono">{ean.base}</span></div>
                          <div>Secuencia: <span className="font-mono">{ean.secuencia}</span></div>
                          {ean.clase && <div>Clase: <span className="font-mono">{ean.clase}</span></div>}
                          {ean.marcaTexto && <div>Marca: <span>{ean.marcaTexto}</span></div>}
                          <div>Fecha: {new Date(ean.fecha).toLocaleString('es-AR')}</div>
                        </div>
                      </div>
                      <button
                        onClick={() => eliminarEANGenerado(ean.codigo)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                    
                    {/* Código de barras simulado */}
                    <div className="mt-3 flex gap-[2px] h-16">
                      {ean.codigo.split('').map((digito, i) => {
                        const alturas = [60, 80, 70, 85, 75, 90, 65, 95, 70, 80, 75, 85, 70];
                        return (
                          <div
                            key={i}
                            className="flex-1 bg-gray-800 rounded-sm"
                            style={{ height: `${alturas[i]}%` }}
                          />
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 bg-white rounded-lg shadow-lg p-4">
          <p className="text-sm text-gray-600 text-center">
            Los datos se guardan automáticamente en tu navegador. 
            Exporta regularmente para hacer backup.
          </p>
        </div>
      </div>
    </div>
  );
}
