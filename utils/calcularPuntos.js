function calcularDiferencia(golesCasa, golesFuera) {
  return golesCasa - golesFuera;
}

function obtenerGanador1X2(golesCasa, golesFuera) {
  if (golesCasa > golesFuera) return "1";
  if (golesCasa < golesFuera) return "2";
  return "X";
}

const CONFIG_DEFAULT = {
  grupos: { exacto: 4, diferencia: 3, ganador: 2 },
  clasificado: {
    dieciseisavos: 0, octavos: 0, cuartos: 0,
    semifinal: 0, tercer_puesto: 0, final: 0,
  },
  cuadro_de_honor: {
    campeon: 15, subcampeon: 10, tercer_puesto: 5,
    bota_oro: 8, bota_plata: 5, bota_bronce: 3,
    balon_oro: 8, balon_plata: 5, balon_bronce: 3,
  },
};

const FASE_LABELS = {
  dieciseisavos: "Dieciseisavos de Final",
  octavos: "Octavos de Final",
  cuartos: "Cuartos de Final",
  semifinal: "Semifinal",
  tercer_puesto: "Tercer Lugar",
  final: "Gran Final",
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

function normalizeStr(str) {
  return (str || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function esNombreGenerico(nombre) {
  if (!nombre) return true;
  return /°\s*grupo|ganador\s+\d+|^\d+°/.test(nombre);
}

export { evaluarPartidoGrupo, evaluarPartidoEliminatoria, esNombreGenerico, normalizeStr };

function evaluarPartidoEliminatoria(pronostico, resultadoReal, config, matchData, quinielaPartido) {
  if (matchData && quinielaPartido) {
    const actualCasa = normalizeStr(matchData.casa);
    const actualFuera = normalizeStr(matchData.fuera);
    if (!esNombreGenerico(actualCasa) && !esNombreGenerico(actualFuera)) {
      const predCasa = normalizeStr(quinielaPartido.casa);
      const predFuera = normalizeStr(quinielaPartido.fuera);
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
    if (marcaPron && marcaReal && normalizeStr(marcaPron) === normalizeStr(marcaReal)) {
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
    const acierto = valorPred && valorPred !== "nan" && normalizeStr(valorPred) === normalizeStr(valorReal);
    const puntos = acierto ? (chConfig[field] || 0) : 0;
    pts += puntos;
    detalle.push({ fase: "cuadro_de_honor", campo: field, pts: puntos });
  }
  return { pts, detalle };
}

export default function calcularPuntos(quiniela, resultadosReales, puntajeConfig, partidos, disabledPhases = [], chManualPts = {}) {
  const config = puntajeConfig || CONFIG_DEFAULT;
  const puntajeBase = config.grupos || CONFIG_DEFAULT.grupos;
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
      const pts = evaluarPartidoGrupo(partido.pronostico, resultado, puntajeBase);
      totalPuntos += pts;
      detalle.push({ partido_id: partido.partido_id, pts, fase: "grupos" });
    }
  }

  const faseFinal = quiniela.fase_final || {};
  for (const [faseKey, partidosArr] of Object.entries(faseFinal)) {
    const disabled = (disabledPhases || []).includes(faseKey);
    for (const partido of partidosArr || []) {
      const id = partido.juego_id || partido.partido_id;
      const matchData = idxPartidos[id];
      const resultado = resultadosReales[id];

      if (resultado) {
        const pts = disabled ? 0 : evaluarPartidoEliminatoria(partido.pronostico, resultado, puntajeBase, matchData, partido);
        totalPuntos += pts;
        detalle.push({ partido_id: id, pts, fase: faseKey });
      }

      if (!disabled && matchData && partido && partido.casa && partido.fuera) {
        const rC = normalizeStr(matchData.casa);
        const rF = normalizeStr(matchData.fuera);
        if (rC && rF && !esNombreGenerico(rC) && !esNombreGenerico(rF)) {
          const pC = normalizeStr(partido.casa);
          const pF = normalizeStr(partido.fuera);
          if (pC && pF && pC === rC && pF === rF) {
            const bonus = (config.clasificado || CONFIG_DEFAULT.clasificado)[faseKey] || 0;
            if (bonus > 0) {
              totalPuntos += bonus;
              detalle.push({ fase: `llave_${faseKey}`, pts: bonus, partido_id: id });
            }
          }
        }
      }
    }
  }

  const clasifConfig = config.clasificado || CONFIG_DEFAULT.clasificado;
  for (const [faseKey, ptsPorAcierto] of Object.entries(clasifConfig)) {
    if (!ptsPorAcierto) continue;
    if ((disabledPhases || []).includes(faseKey)) continue;
    const faseLabel = FASE_LABELS[faseKey];
    if (!faseLabel) continue;

    const predPartidos = (quiniela.fase_final || {})[faseKey] || [];
    const predEquipos = new Set();
    for (const p of predPartidos) {
      const c = normalizeStr(p.casa);
      const f = normalizeStr(p.fuera);
      if (c && c !== "nan") predEquipos.add(c);
      if (f && f !== "nan") predEquipos.add(f);
    }

    const realPartidos = (partidos || []).filter((m) => m.fase === faseLabel);
    const realEquipos = new Set();
    for (const m of realPartidos) {
      const c = normalizeStr(m.casa || m.equipos?.local);
      const f = normalizeStr(m.fuera || m.equipos?.visitante);
      if (c && c !== "nan") realEquipos.add(c);
      if (f && f !== "nan") realEquipos.add(f);
    }

    let aciertos = 0;
    for (const eq of predEquipos) {
      if (realEquipos.has(eq)) aciertos++;
    }

    const puntos = aciertos * ptsPorAcierto;
    totalPuntos += puntos;
    if (puntos > 0) {
      detalle.push({ fase: `clasificado_${faseKey}`, pts: puntos, aciertos });
    }
  }

  const ch = evaluarCuadroDeHonor(quiniela, resultadosReales, config);
  const manualPts = chManualPts[quiniela.participante];
  const chPts = manualPts != null ? manualPts : ch.pts;
  if (manualPts != null) {
    detalle.push({ fase: "cuadro_de_honor", campo: "__manual__", pts: chPts });
  }
  totalPuntos += chPts;
  if (manualPts == null) {
    detalle.push(...ch.detalle);
  }

  return { total: totalPuntos, detalle };
}
