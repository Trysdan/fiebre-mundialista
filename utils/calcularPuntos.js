function calcularDiferencia(golesCasa, golesFuera) {
  return golesCasa - golesFuera;
}

function obtenerGanador1X2(golesCasa, golesFuera) {
  if (golesCasa > golesFuera) return "1";
  if (golesCasa < golesFuera) return "2";
  return "X";
}

function getPuntajePorFase(juegoId, config) {
  const id = parseInt(juegoId, 10);
  if (isNaN(id)) return { fase: "grupos", ...config.grupos };
  if (id >= 104) return { fase: "final", ...config.final };
  if (id >= 103) return { fase: "tercer_puesto", ...config.tercer_puesto };
  if (id >= 101) return { fase: "semifinal", ...config.semifinal };
  if (id >= 97) return { fase: "cuartos", ...config.cuartos };
  if (id >= 89) return { fase: "octavos", ...config.octavos };
  return { fase: "dieciseisavos", ...config.dieciseisavos };
}

const CONFIG_DEFAULT = {
  grupos: { exacto: 4, diferencia: 3, ganador: 2 },
  dieciseisavos: { exacto: 5, diferencia: 4, ganador: 2 },
  octavos: { exacto: 6, diferencia: 4, ganador: 3 },
  cuartos: { exacto: 7, diferencia: 5, ganador: 3 },
  semifinal: { exacto: 8, diferencia: 6, ganador: 4 },
  tercer_puesto: { exacto: 9, diferencia: 6, ganador: 4 },
  final: { exacto: 11, diferencia: 8, ganador: 5 },
};

function evaluarPartidoGrupo(pronostico, resultadoReal, config) {
  const { goles_casa, goles_fuera } = pronostico;
  const realCasa = resultadoReal.goles_local ?? resultadoReal.goles_casa;
  const realFuera = resultadoReal.goles_visitante ?? resultadoReal.goles_fuera;

  const exacto = goles_casa === realCasa && goles_fuera === realFuera;
  if (exacto) return config.exacto;

  const diffPron = calcularDiferencia(goles_casa, goles_fuera);
  const diffReal = calcularDiferencia(realCasa, realFuera);
  if (diffPron === diffReal) return config.diferencia;

  const ganadorPron = obtenerGanador1X2(goles_casa, goles_fuera);
  const ganadorReal = obtenerGanador1X2(realCasa, realFuera);
  if (ganadorPron === ganadorReal) return config.ganador;

  return 0;
}

function esNombreGenerico(nombre) {
  if (!nombre) return true;
  return /°\s*Grupo|Ganador\s+\d+|^\d+°/.test(nombre);
}

export { evaluarPartidoGrupo, evaluarPartidoEliminatoria, getPuntajePorFase, esNombreGenerico };

function evaluarPartidoEliminatoria(pronostico, resultadoReal, config, matchData, quinielaPartido) {
  if (matchData && quinielaPartido) {
    const actualCasa = (matchData.casa || "").trim().toLowerCase();
    const actualFuera = (matchData.fuera || "").trim().toLowerCase();
    if (!esNombreGenerico(actualCasa)) {
      const predCasa = (quinielaPartido.casa || "").trim().toLowerCase();
      const predFuera = (quinielaPartido.fuera || "").trim().toLowerCase();
      if (predCasa !== actualCasa || predFuera !== actualFuera) {
        return 0;
      }
    }
  }
  const { goles_casa, goles_fuera, marca_ganador_casa, marca_ganador_fuera } = pronostico;
  const realCasa = resultadoReal.goles_local ?? resultadoReal.goles_casa;
  const realFuera = resultadoReal.goles_visitante ?? resultadoReal.goles_fuera;

  const exacto = goles_casa === realCasa && goles_fuera === realFuera;
  if (exacto) return config.exacto;

  const diffPron = calcularDiferencia(goles_casa, goles_fuera);
  const diffReal = calcularDiferencia(realCasa, realFuera);

  const huboEmpateEnReal = realCasa === realFuera;
  const huboEmpateEnPron = goles_casa === goles_fuera;

  if (huboEmpateEnReal && huboEmpateEnPron) {
    const marcaPron = marca_ganador_casa || marca_ganador_fuera || "";
    const marcaReal = resultadoReal.ganador_penales || "";
    if (marcaPron && marcaReal && marcaPron.toLowerCase() === marcaReal.toLowerCase()) {
      return config.exacto;
    }
    if (marcaPron === "" && marcaReal === "") {
      return config.exacto;
    }
  }

  if (diffPron === diffReal) return config.diferencia;

  const ganadorPron = obtenerGanador1X2(goles_casa, goles_fuera);
  const ganadorReal = obtenerGanador1X2(realCasa, realFuera);
  if (ganadorPron === ganadorReal) return config.ganador;

  return 0;
}

const CUADRO_FIELDS = [
  "campeon", "subcampeon", "tercer_puesto",
  "bota_oro", "bota_plata", "bota_bronce",
  "balon_oro", "balon_plata", "balon_bronce",
];

function evaluarCuadroDeHonor(quiniela, resultadosReales, config) {
  const chConfig = config.cuadro_de_honor || {};
  const correctos = resultadosReales.cuadro_de_honor || {};
  const prediccion = quiniela.cuadro_de_honor || {};
  let pts = 0;
  const detalle = [];
  for (const field of CUADRO_FIELDS) {
    const valorReal = correctos[field];
    if (!valorReal || valorReal === "nan") continue;
    const valorPred = prediccion[field];
    const acierto = valorPred && valorPred !== "nan" && valorPred.toLowerCase().trim() === valorReal.toLowerCase().trim();
    const puntos = acierto ? (chConfig[field] || 0) : 0;
    pts += puntos;
    detalle.push({ fase: "cuadro_de_honor", campo: field, pts: puntos });
  }
  return { pts, detalle };
}

export default function calcularPuntos(quiniela, resultadosReales, puntajeConfig, partidos) {
  const config = puntajeConfig || CONFIG_DEFAULT;
  let totalPuntos = 0;
  const detalle = [];

  const idxPartidos = {};
  if (partidos) {
    for (const p of partidos) {
      idxPartidos[p.partido_id] = p;
    }
  }

  const grupos = quiniela.fase_de_grupos || [];
  for (const grupo of grupos) {
    for (const partido of grupo.partidos || []) {
      const resultado = resultadosReales[partido.partido_id];
      if (!resultado) continue;
      const pts = evaluarPartidoGrupo(partido.pronostico, resultado, config.grupos);
      totalPuntos += pts;
      detalle.push({ partido_id: partido.partido_id, pts, fase: "grupos" });
    }
  }

  const faseFinal = quiniela.fase_final || {};
  for (const [faseKey, partidosArr] of Object.entries(faseFinal)) {
    for (const partido of partidosArr || []) {
      const id = partido.juego_id || partido.partido_id;
      const resultado = resultadosReales[id];
      if (!resultado) continue;
      const faseConfig = getPuntajePorFase(id, config);
      const matchData = idxPartidos[id];
      const pts = evaluarPartidoEliminatoria(partido.pronostico, resultado, faseConfig, matchData, partido);
      totalPuntos += pts;
      detalle.push({ partido_id: id, pts, fase: faseKey });
    }
  }

  const ch = evaluarCuadroDeHonor(quiniela, resultadosReales, config);
  totalPuntos += ch.pts;
  detalle.push(...ch.detalle);

  return { total: totalPuntos, detalle };
}
