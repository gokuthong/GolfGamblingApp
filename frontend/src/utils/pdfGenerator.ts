import { Hole, Score, Player } from "../types";

interface GenerateScorecardPDFParams {
  holes: Hole[];
  scores: Score[];
  players: Player[];
  gameName?: string;
  courseName?: string;
  gameDate?: Date;
  gameId?: string;
}

export const generateScorecardPDF = async ({
  holes,
  scores,
  players,
  gameName = "Golf Game",
  courseName,
  gameDate,
  gameId,
}: GenerateScorecardPDFParams) => {
  // Sort all holes by hole number
  const sortedHoles = [...holes].sort((a, b) => a.holeNumber - b.holeNumber);
  const frontNine = sortedHoles.filter((h) => h.holeNumber <= 9);
  const backNine = sortedHoles.filter((h) => h.holeNumber > 9);

  // Helper to get strokes (returns null for non-confirmed holes)
  const getStrokesForHole = (
    playerId: string,
    holeId: string,
  ): number | null => {
    const hole = holes.find((h) => h.id === holeId);
    if (hole && hole.confirmed === false) {
      return null;
    }
    const score = scores.find(
      (s) => s.playerId === playerId && s.holeId === holeId,
    );
    if (!score) {
      return hole?.par || 0;
    }
    return score.strokes;
  };

  // Calculate total par for confirmed holes only
  const getTotalPar = (holeSet: Hole[]): number => {
    return holeSet.reduce((sum, hole) => {
      if (hole.confirmed === false) return sum;
      return sum + hole.par;
    }, 0);
  };

  // Generate a scorecard table for a set of holes
  const generateNineHoleTable = (holes: Hole[], title: string) => {
    const ninePar = getTotalPar(holes);

    // Build hole number headers
    const holeHeaders = holes
      .map((h) => `<th class="hole-cell">${h.holeNumber}</th>`)
      .join("");

    // Build stroke index row
    const strokeIndex = holes
      .map((h) => `<td class="index-cell">${h.index || ""}</td>`)
      .join("");

    // Build par row
    const parCells = holes
      .map((h) => `<td class="par-cell">${h.par}</td>`)
      .join("");

    // Build player score rows
    const playerRows = players
      .map((player) => {
        const scoreCells = holes
          .map((hole) => {
            const strokes = getStrokesForHole(player.id, hole.id);
            if (strokes === null) {
              return `<td class="score-cell" style="background-color: #ffffff;">-</td>`;
            }
            const par = hole.par;
            const diff = strokes - par;
            let className = "score-cell";
            let backgroundColor = "#ffffff";

            if (diff < -1) {
              backgroundColor = "#2196F3";
              className += " excellent-score";
            } else if (diff === -1) {
              backgroundColor = "#90CAF9";
              className += " good-score";
            } else if (diff > 0) {
              backgroundColor = "#FFCDD2";
              className += " over-par-score";
            }

            return `<td class="${className}" style="background-color: ${backgroundColor};">${strokes}</td>`;
          })
          .join("");

        const total = holes.reduce((sum, hole) => {
          if (hole.confirmed === false) return sum;
          const s = getStrokesForHole(player.id, hole.id);
          return sum + (s ?? 0);
        }, 0);

        return `
        <tr class="player-row">
          <td class="player-name-cell">${player.name}</td>
          ${scoreCells}
          <td class="total-cell">${total}</td>
        </tr>
      `;
      })
      .join("");

    return `
      <div class="nine-section">
        <h2 class="section-title">${title}</h2>
        <table class="scorecard-table">
          <thead>
            <tr class="hole-header-row">
              <th class="label-cell">Hole</th>
              ${holeHeaders}
              <th class="total-header-cell">Total</th>
            </tr>
          </thead>
          <tbody>
            <tr class="stroke-index-row">
              <td class="label-cell">Index</td>
              ${strokeIndex}
              <td class="index-cell"></td>
            </tr>
            <tr class="par-row">
              <td class="label-cell">Par</td>
              ${parCells}
              <td class="par-cell">${ninePar}</td>
            </tr>
            ${playerRows}
          </tbody>
        </table>
      </div>
    `;
  };

  // Generate totals summary table
  const generateTotalsSummary = () => {
    const frontNinePar = getTotalPar(frontNine);
    const backNinePar = getTotalPar(backNine);
    const totalPar = frontNinePar + backNinePar;

    const playerTotalsRows = players
      .map((player) => {
        const frontTotal = frontNine.reduce((sum, hole) => {
          if (hole.confirmed === false) return sum;
          const s = getStrokesForHole(player.id, hole.id);
          return sum + (s ?? 0);
        }, 0);
        const backTotal = backNine.reduce((sum, hole) => {
          if (hole.confirmed === false) return sum;
          const s = getStrokesForHole(player.id, hole.id);
          return sum + (s ?? 0);
        }, 0);
        const grandTotal = frontTotal + backTotal;
        const totalToPar = grandTotal - totalPar;

        return `
        <tr class="player-row">
          <td class="player-name-cell">${player.name}</td>
          <td class="total-cell">${frontTotal}</td>
          <td class="total-cell">${backTotal}</td>
          <td class="grand-total-cell">${grandTotal} ${totalToPar !== 0 ? `(${totalToPar > 0 ? "+" : ""}${totalToPar})` : ""}</td>
        </tr>
      `;
      })
      .join("");

    return `
      <div class="totals-section">
        <h2 class="section-title">Total Score</h2>
        <table class="scorecard-table">
          <thead>
            <tr class="hole-header-row">
              <th class="label-cell">Player</th>
              <th class="total-header-cell">Front 9</th>
              <th class="total-header-cell">Back 9</th>
              <th class="total-header-cell">Total</th>
            </tr>
          </thead>
          <tbody>
            <tr class="par-row">
              <td class="label-cell">Par</td>
              <td class="par-cell">${frontNinePar}</td>
              <td class="par-cell">${backNinePar}</td>
              <td class="par-cell">${totalPar}</td>
            </tr>
            ${playerTotalsRows}
          </tbody>
        </table>
      </div>
    `;
  };

  // Generate both front and back nine tables plus totals
  const generateScorecardTables = () => {
    return `
      ${generateNineHoleTable(frontNine, "Front Nine (Holes 1-9)")}
      ${generateNineHoleTable(backNine, "Back Nine (Holes 10-18)")}
      ${generateTotalsSummary()}
    `;
  };

  // Format date for display
  const formatDateDisplay = (date: Date): string => {
    const options: Intl.DateTimeFormatOptions = {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    };
    return date.toLocaleDateString("en-US", options);
  };

  const displayDate = gameDate
    ? formatDateDisplay(gameDate)
    : formatDateDisplay(new Date());

  // Generate complete HTML
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>${courseName || gameName} Scorecard</title>
        <style>
          @page {
            size: A4 landscape;
            margin: 5mm;
          }

          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            padding: 5px;
            background: white;
            color: #000;
          }

          .header {
            text-align: center;
            margin-bottom: 8px;
            padding: 6px;
            border: 2px solid #000;
            background-color: #f5f5f5;
          }

          .course-title {
            font-size: 18px;
            font-weight: bold;
            margin: 0;
            color: #000;
          }

          .subtitle {
            font-size: 11px;
            color: #666;
            margin-top: 2px;
          }

          .date-played {
            font-size: 10px;
            color: #444;
            margin-top: 3px;
            font-style: italic;
          }

          .nine-section {
            margin-bottom: 10px;
          }

          .totals-section {
            margin-top: 15px;
          }

          .section-title {
            font-size: 14px;
            font-weight: bold;
            margin: 5px 0 3px 0;
            padding: 4px 8px;
            background-color: #2a2a2a;
            color: #ffffff;
            border: 2px solid #000;
          }

          .scorecard-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 3px;
            border: 2px solid #000;
          }

          .scorecard-table th,
          .scorecard-table td {
            border: 1px solid #000;
            padding: 4px 2px;
            text-align: center;
            font-size: 10px;
          }

          .hole-header-row th {
            background-color: #2a2a2a;
            color: #ffffff;
            font-weight: bold;
            font-size: 10px;
          }

          .label-cell {
            background-color: #e0e0e0;
            font-weight: bold;
            text-align: left;
            padding-left: 6px;
            min-width: 60px;
            font-size: 9px;
          }

          .hole-cell {
            min-width: 28px;
            font-weight: bold;
            font-size: 11px;
          }

          .total-header-cell {
            background-color: #2a2a2a;
            color: #ffffff;
            font-weight: bold;
            min-width: 35px;
          }

          .stroke-index-row {
            background-color: #f5f5f5;
          }

          .index-cell {
            color: #666;
            font-size: 8px;
          }

          .par-row {
            background-color: #e8e8e8;
          }

          .par-cell {
            font-weight: bold;
            color: #333;
            font-size: 10px;
          }

          .player-row {
            background-color: #ffffff;
          }

          .player-name-cell {
            text-align: left;
            padding-left: 6px;
            font-weight: bold;
            background-color: #f9f9f9;
            font-size: 10px;
          }

          .score-cell {
            font-weight: bold;
            color: #000;
            font-size: 11px;
          }

          .excellent-score {
            color: #ffffff;
          }

          .good-score {
            color: #000;
          }

          .over-par-score {
            color: #c62828;
          }

          .total-cell {
            background-color: #e0e0e0;
            font-weight: bold;
            font-size: 10px;
          }

          .grand-total-cell {
            background-color: #d0d0d0;
            font-weight: bold;
            font-size: 11px;
          }

          @media print {
            body {
              padding: 3px;
            }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1 class="course-title">${courseName || gameName}</h1>
          <p class="subtitle">Golf Scorecard</p>
          <p class="date-played">${displayDate}</p>
        </div>
        ${generateScorecardTables()}
      </body>
    </html>
  `;

  // Check if running on Capacitor native platform
  let isNative = false;
  try {
    const { Capacitor } = await import("@capacitor/core");
    isNative = Capacitor.isNativePlatform();
  } catch {
    // @capacitor/core not available, assume web
  }

  if (isNative) {
    // Native: use Capacitor Share plugin
    try {
      const { Share } = await import("@capacitor/share");
      // Create a Blob URL for the HTML content
      const blob = new Blob([html], { type: "text/html" });
      const url = URL.createObjectURL(blob);

      await Share.share({
        title: `${courseName || gameName} Scorecard`,
        text: `${courseName || gameName} - Golf Scorecard`,
        url: url,
        dialogTitle: "Save Scorecard",
      });

      // Clean up the blob URL
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error sharing scorecard:", error);
      throw error;
    }
  } else {
    // Web: open in new window for print/save
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
    }
  }
};
