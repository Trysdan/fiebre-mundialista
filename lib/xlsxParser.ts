export function convertXlsxToQuinielaJson(data: Uint8Array) {
  // Dynamic require to avoid type conflicts with lucide-react
  const XLSX = require("xlsx");
  const wb = XLSX.read(data, { type: "array" });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1 });

  const s = (row: number, col: number) => {
    const v = rows[row]?.[col];
    if (v === undefined || v === null) return "";
    return String(v).trim();
  };

  const n = (row: number, col: number) => {
    const v = rows[row]?.[col];
    if (v === undefined || v === null) return 0;
    const str = String(v).replace(".0", "");
    const parsed = parseInt(str, 10);
    return isNaN(parsed) ? 0 : parsed;
  };

  const nombre = s(6, 4) || "Sin_Nombre";

  const result: any = {
    participante: nombre,
    archivo_fuente: "",
    fase_de_grupos: [],
    mejores_terceros: [],
    fase_final: {
      dieciseisavos: [],
      octavos: [],
      cuartos: [],
      semifinal: [],
      tercer_puesto: [],
      final: [],
    },
    cuadro_de_honor: {},
  };

  for (let i = 8; i <= 102 && i < rows.length; i++) {
    if (s(i, 0).toLowerCase() !== "grupo") continue;
    const letra = s(i + 1, 0);

    const tabla_posiciones: Record<string, string> = {};
    for (let off = 3; off <= 6; off++) {
      const f = i + off;
      if (f >= rows.length) break;
      const equipo = s(f, 12);
      if (equipo) {
        const pos = s(f, 11) || String(off - 2);
        tabla_posiciones[`POS_${pos}`] = equipo;
      }
    }

    const partidos: any[] = [];
    for (let j = 1; j <= 6; j++) {
      const f = i + j;
      if (f >= rows.length) break;
      const casa = s(f, 4);
      const fuera = s(f, 9);
      if (!casa || !fuera) continue;
      partidos.push({
        partido_id: `G_${letra}_P${j}`,
        casa,
        fuera,
        pronostico: { goles_casa: n(f, 6), goles_fuera: n(f, 7) },
      });
    }

    result.fase_de_grupos.push({ grupo: letra, tabla_posiciones, partidos });
  }

  for (let i = 106; i <= 117 && i < rows.length; i++) {
    const equipo = s(i, 12);
    if (equipo) {
      result.mejores_terceros.push({ posicion: s(i, 11), equipo });
    }
  }

  const extraerFase = (inicio: number, fin: number) => {
    const juegos: any[] = [];
    for (let idx = inicio - 1; idx < fin && idx < rows.length; idx++) {
      const casa = s(idx, 4);
      if (!casa) continue;
      juegos.push({
        juego_id: s(idx, 3),
        casa,
        fuera: s(idx, 9),
        pronostico: {
          goles_casa: n(idx, 6),
          goles_fuera: n(idx, 7),
          marca_ganador_casa: s(idx, 5),
          marca_ganador_fuera: s(idx, 8),
        },
      });
    }
    return juegos;
  };

  result.fase_final.dieciseisavos = extraerFase(107, 122);
  result.fase_final.octavos = extraerFase(127, 134);
  result.fase_final.cuartos = extraerFase(139, 142);
  result.fase_final.semifinal = extraerFase(147, 148);
  result.fase_final.tercer_puesto = extraerFase(153, 153);
  result.fase_final.final = extraerFase(158, 158);

  const getN = (fila: number) => s(fila - 1, 13);
  result.cuadro_de_honor = {
    campeon: getN(148),
    subcampeon: getN(149),
    tercer_puesto: getN(150),
    bota_oro: getN(152),
    bota_plata: getN(153),
    bota_bronce: getN(154),
    balon_oro: getN(156),
    balon_plata: getN(157),
    balon_bronce: getN(158),
  };

  return result;
}
